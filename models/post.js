const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    title: String,
    image: {
        fileId: String,
        thumbnailUrl: String,
        url: String
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    likes : [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
})

const postCollection = mongoose.model("Post", postSchema);
module.exports = postCollection;