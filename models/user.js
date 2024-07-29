const mongoose = require("mongoose");
const plm = require("passport-local-mongoose")
const userSchema = mongoose.Schema({
    username: String,
    password: String,
    fullname: String,
    contact: Number,
    avatar: {
        fileId: String,
        thumbnailUrl: String,
        url: String
    },
    date: {
        type: String
    },
    otp: {
        type: Number,
        default: 0
    },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    socketId: String
})

userSchema.plugin(plm);
const userCollection = mongoose.model("User", userSchema);
module.exports = userCollection;
