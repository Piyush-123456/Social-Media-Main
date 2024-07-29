var express = require('express');
var router = express.Router();
const imagekit = require("../utils/imagekit");
var passport = require("passport");
const LocalStrategy = require("passport-local");
const UserCollection = require("../models/user");
const PostCollection = require("../models/post");
const { sendMail } = require("../utils/nodemailer");
const postCollection = require('../models/post');

passport.use(new LocalStrategy(UserCollection.authenticate()));

const getFormattedDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('User Route');
});

router.post("/register", async (req, res, next) => {
  try {
    const { fullname, contact, username, password, date } = req.body;
    console.log(req.files);
    await UserCollection.register({ fullname, contact, username, date }, password);
    res.redirect("/");
  } catch (err) {
    console.log(err.message);
  }
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/user/profile",
  failureRedirect: "/"
}), (req, res, next) => { });

router.get("/profile", async (req, res, next) => {
  const posts = await PostCollection.find().populate("user");
  const userdate = getFormattedDate();
  const users = await UserCollection.find();
  res.render("profile", { user: req.user, posts, userdate, users });
});

router.get("/logout", (req, res, next) => {
  req.logout(() => {
    res.redirect("/");
  });
});

router.get("/settings", async (req, res, next) => {
  try {
    const user = await UserCollection.findById(req.user._id).populate("posts").exec();
    res.render("settings", { user: user });

  }
  catch (err) {
    console.log(err.message);
  }
});

router.get("/update-details/:id", (req, res, next) => {
  res.render("updateprofile", { user: req.user });
})

router.post("/avatar/:id", async (req, res, next) => {
  try {
    const { fileId, thumbnailUrl, url } = await imagekit.upload({
      file: req.files.avatar.data,
      fileName: req.files.avatar.name
    });
    if (req.user.avatar.fileId) {
      await imagekit.deleteFile(req.user.avatar.fileId);
    }
    req.user.avatar = { fileId, thumbnailUrl, url };
    await req.user.save();
    res.redirect("/user/settings");
  } catch (err) {
    console.log(err.message);
  }
});

router.post("/update-details/:id", async (req, res, next) => {
  try {
    await UserCollection.findByIdAndUpdate(req.params.id, req.body);
    res.redirect("/user/settings");
  } catch (err) {
    console.log(err.message);
  }
});

router.get("/verify-otp/:id", (req, res, next) => {
  res.render("verify", {
    id: req.params.id,
    user: req.user
  });
});

router.post("/verify-otp/:id", async (req, res, next) => {
  try {
    const user = await UserCollection.findById(req.params.id);
    if (!user) {
      return res.send("User doesn't exist!");
    }
    if (user.otp != req.body.otp) {
      user.otp = 0;
      return res.send("OTP doesn't match");
    }
    user.otp = 0;
    await user.setPassword(req.body.password);
    await user.save();
    res.redirect("/login");
  } catch (err) {
    console.log(err.message);
  }
});

router.get("/friends", async (req, res) => {
  try {
    // const users = await UserCollection.find({ _id: { $ne: req.user._id } }).exec();
    const allUsers = await UserCollection.find({ _id: { $ne: req.user._id } }).exec();

    // Filter out users who are already in the friends array
    const users = allUsers.filter(user => !req.user.friends.includes(user._id.toString()));
    const user = await UserCollection.findById(req.user._id).populate('friends friendRequests').exec();
    res.render("friends", { users, user });
  } catch (err) {
    console.log(err.message);
  }
});

router.post('/friend-request/:recipientId', async (req, res) => {
  const { recipientId } = req.params;
  const requesterId = req.user._id;

  try {
    if (!requesterId || !recipientId) {
      return res.status(400).json({ message: 'Requester ID and recipient ID are required' });
    }

    const recipient = await UserCollection.findById(recipientId);
    const requester = await UserCollection.findById(requesterId);

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    if (!requester) {
      return res.status(404).json({ message: 'Requester not found' });
    }
    if (recipientId === requesterId) {
      return res.status(400).json({ message: 'Cannot send a friend request to yourself' });
    }

    if (!recipient.friendRequests.includes(requesterId)) {
      recipient.friendRequests.push(requesterId);
      await recipient.save();
    }

    res.status(200).json({ message: 'Friend request sent' });

  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

router.post('/friend-request/:requestId/accept', async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  try {
    const requester = await UserCollection.findById(requestId);

    if (!requester) {
      return res.status(404).json({ message: 'Requester not found' });
    }
    req.user.friends.push(requestId);
    req.user.friendRequests = req.user.friendRequests.filter(id => id.toString() !== requestId);
    await req.user.save();

    requester.friends.push(userId);
    await requester.save();

    res.status(200).json({ message: 'Friend request accepted' });

  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

router.post('/friend-request/:requestId/decline', async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  try {
    const requester = await UserCollection.findById(requestId);
    if (!requester) {
      return res.status(404).json({ message: 'Requester not found' });
    }
    req.user.friendRequests = req.user.friendRequests.filter(id => id.toString() !== requestId);
    await req.user.save();
    res.redirect("/user/friends");
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

router.get("/chat", async (req, res, next) => {
  try {
    const users = await UserCollection.find();
    res.render("chat", { user: req.user, users });
  } catch (err) {
    console.log(err.message);
  }
});

router.get("/userprofile/:uid", async (req, res, next) => {
  try {
    const specific_user = await UserCollection.findById(req.params.uid).populate("posts");
    res.render("userprofile", {
      user: req.user,
      specific_user
    });
  }
  catch (err) {
    console.log(err.message);
  }
})

router.post("/search", async (req, res, next) => {
  try {
    const searchTerm = req.body.search;

    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).send('Search query cannot be empty');
    }

    const searchQuery = { fullname: { $regex: new RegExp(searchTerm, 'i') } }; // Case-insensitive search
    const searchresult = await UserCollection.findOne(searchQuery).exec();

    res.render("search", { user: req.user, searchresult });
  }
  catch (err) {
    console.log(err.message);
  }
})

router.get("/comments/:pid", async (req, res, next) => {
  try {
    const singlepost = await postCollection.findById(req.params.pid)
      .populate({
        path: 'comments',
        populate: {
          path: 'userId',
          select: 'fullname avatar',

        }
      })
      .populate('user') // Populate the post's user
      .exec();
    console.log(singlepost);
    // const post = await PostCollection.findById(req.params.pid)
    //   .populate('comments').populate('user')
    //   .exec();

    res.render("comments", { user: req.user, singlepost });
  }
  catch (err) {
    console.log(err.message);
  }

})


router.post("/unfriend/:uid", async (req, res, next) => {
  try {
    const pointeduser = await UserCollection.findById(req.user._id);

    if (!pointeduser) {
      return res.status(404).send('User not found');
    }

    const index = pointeduser.friends.indexOf(req.params.uid);

    if (index !== -1) {
      pointeduser.friends.splice(index, 1);

      await pointeduser.save();
    }

    res.redirect("/user/friends");
  } catch (err) {
    console.log(err);
    next(err); // Pass the error to the Express error handler
  }
});
// router.get("/comments/:pid", async (req, res, next) => {
//   try {
//     try {
//       const post = await PostCollection.findById(req.params.pid)
//         .populate('comments').populate('user')
//         .exec();

//       console.log(post);

//       if (!post) {
//         return res.status(404).send('Post not found');
//       }

//       res.render('comments', { post, user: req.user });
//     } catch (err) {
//       console.error(err.message);
//       res.status(500).send('Server Error');
//     }
//   }
//   catch (err) {
//     console.log(err.message);
//   }

// })

module.exports = router;
