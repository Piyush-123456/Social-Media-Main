var express = require('express');
var router = express.Router();
const imagekit = require("../utils/imagekit")
var passport = require("passport")
const LocalStartegy = require("passport-local");
const UserCollection = require("../models/user");
const postCollection = require("../models/post")
const { sendMail } = require("../utils/nodemailer");
const userCollection = require('../models/user');
const FriendRequest = require('../models/FriendRequest');

passport.use(new LocalStartegy(UserCollection.authenticate()));

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('User Route');
});

router.post("/register", async (req, res, next) => {
  try {
    const { fullname, contact, username, password } = req.body;
    console.log(req.files);
    await UserCollection.register({ fullname, contact, username }, password);
    res.redirect("/");
  }
  catch (err) {
    console.log(err.message);
  }
})

router.post("/login", passport.authenticate("local", {
  successRedirect: "/user/profile",
  failureRedirect: "/"
}), (req, res, next) => {

})

router.get("/profile", async (req, res, next) => {
  const post = await postCollection.find().populate("user");
  res.render("profile", { user: req.user, post })
})



router.get("/logout", (req, res, next) => {
  req.logout(() => {
    res.redirect("/");
  });
})


router.get("/settings", (req, res, next) => {
  res.render("settings", { user: req.user });
})


router.post("/avatar/:id", async (req, res, next) => {
  try {
    const { fileId, thumbnailUrl, url } = await imagekit.upload({
      file: req.files.avatar.data,
      fileName: req.files.avatar.name
    })
    if (req.user.avatar.fileId) {
      await imagekit.deleteFile(req.user.avatar.fileId);
    }
    req.user.avatar = { fileId, thumbnailUrl, url };
    await req.user.save();
    res.redirect("/user/settings");
  }
  catch (err) {
    console.log(err.message);
  }
})

router.post("/update-details/:id", async (req, res, next) => {
  try {
    await UserCollection.findByIdAndUpdate(req.params.id, req.body);
    res.redirect("/user/settings")
  }
  catch (err) {
    console.log(err.message);
  }
})



router.get("/verify-otp/:id", (req, res, next) => {
  res.render("verify", {
    id: req.params.id,
    user: req.user
  })
})


router.post("/verify-otp/:id", async (req, res, next) => {
  try {
    const user = await userCollection.findById(req.params.id);
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
  }
  catch (err) {
    console.log(err.message);
  }
})

router.get("/friends", async (req, res) => {
  try {
    const users = await UserCollection.find();
    res.render("friends", { users, user: req.user });
  }
  catch (err) {
    console.log(err.message);
  }
})

router.post('/friend-request/:recipientId', async (req, res) => {
  const { recipientId } = req.params;
  const requesterId = req.body.requesterId;

  try {
    const recipient = await UserCollection.findById(req.params.recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const friendRequest = new FriendRequest({
      requester: requesterId,
      recipient: recipientId
    });

    await friendRequest.save();
    recipient.friendRequests.push(friendRequest);
    await recipient.save();
    res.redirect('/user/profile');
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Accept Friend Request
router.post('/friend-request/:requestId/accept', async (req, res) => {
  const { requestId } = req.params;

  try {
    const friendRequest = await FriendRequest.findById(requestId).populate('requester recipient');
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    friendRequest.status = 'accepted';
    await friendRequest.save();

    const { requester, recipient } = friendRequest;

    requester.friends.push(recipient);
    recipient.friends.push(requester);

    await requester.save();
    await recipient.save();

    res.redirect('/user/profile');
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Decline Friend Request
router.post('/friend-request/:requestId/decline', async (req, res) => {
  const { requestId } = req.params;

  try {
    const friendRequest = await FriendRequest.findById(requestId).populate('requester recipient');
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    friendRequest.status = 'declined';
    await friendRequest.save();

    res.redirect('/user/profile');
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});


router.get("/chat", async (req, res, next) => {
  try{
    const users = await userCollection.find();
    res.render("chat", { user: req.user, users });
  }
  catch(err){
    console.log(err.message);
  }
})

module.exports = router;
