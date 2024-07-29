const express = require("express");
const router = express.Router();
const postCollection = require("../models/post");
const imagekit = require("../utils/imagekit");
const Comment = require("../models/commentSchema")
const { createpostpage, createpost, likepost } = require("../controllers/postcontroller");


router.get("/create", createpostpage);

router.post("/create", createpost)

router.get("/likes/:pid", likepost)

router.post('/:postId/comments', async (req, res) => {
    try {
        const post = await postCollection.findById(req.params.postId);
        if (!post) {
            return res.status(404).send('Post not found');
        }

        const comment = new Comment({
            userId: req.user._id,
            content: req.body.text,
            postId: req.params.postId
        });

        await comment.save();

        post.comments.push(comment._id);
        await post.save();

        res.redirect(`/user/profile`);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


router.get('/user/comments', async (req, res) => {
    try {
        const post = await postCollection.findById(req.params.postId)
            .populate({
                path: 'comments',
                populate: {
                    path: 'userId',
                    select: 'fullname'
                }
            })
            .exec();

        console.log(post);

        if (!post) {
            return res.status(404).send('Post not found');
        }

        res.render('comments', { post });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


router.get("/delete/:pid", async (req, res, next) => {

    try {
        const postId = req.params.pid;
        const post = await postCollection.findById(postId);
        if (!post) {
            return res.status(404).send('Post not found');
        }
        if (post.image.fileId) {
            await imagekit.deleteFile(post.image.fileId);
        }
        await postCollection.findByIdAndDelete(postId);
        res.redirect("/user/settings")
    }
    catch (err) {
        console.log(err.message);
    }

})

module.exports = router;
