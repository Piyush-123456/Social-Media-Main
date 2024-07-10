const express = require("express");
const router = express.Router();
const postCollection = require("../models/post");
const imagekit = require("../utils/imagekit");
const { createpostpage, createpost, likepost } = require("../controllers/postcontroller");


router.get("/create", createpostpage);

router.post("/create", createpost)

router.get("/likes/:pid", likepost)


module.exports = router;
