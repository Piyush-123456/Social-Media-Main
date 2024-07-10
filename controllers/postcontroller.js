const postCollection = require("../models/post");
const imagekit = require("../utils/imagekit");


exports.createpostpage = (req, res, next) => {
    res.render("createpost", { user: req.user });
}

exports.createpost = async (req, res, next) => {
    try {
        const newpost = await new postCollection(req.body);
        const { fileId, thumbnailUrl, url } = await imagekit.upload({
            file: req.files.image.data,
            fileName: req.files.image.name,
        })
        newpost.image = { fileId, thumbnailUrl, url };
        newpost.user = req.user._id;
        req.user.posts.push(newpost._id);
        await req.user.save();
        await newpost.save();
        res.redirect("/user/settings")
    }
    catch (err) {
        console.log(err.message);
    }
}

exports.likepost = async(req,res, next)=>{
    try {
        const post = await postCollection.findById(req.params.pid);
        if (post.likes.includes(req.user._id)) {
            const uidx = post.likes.indexOf(req.user._id);
            post.likes.splice(uidx, 1);
        }
        else {
            post.likes.push(req.user._id);
        }
        await post.save();
        res.redirect("/user/profile");
    }
    catch (err) {
        console.log(err.message);
    }
}