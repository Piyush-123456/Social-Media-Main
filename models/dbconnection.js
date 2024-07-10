const mongoose = require("mongoose");

exports.DBconnect = async () => {
    try {
        const conn = await mongoose.connect('mongodb://localhost:27017/SocialMediaMain');
        console.log("DB Connected!");
    }
    catch (err) {
        console.log(err.message);
    }
}