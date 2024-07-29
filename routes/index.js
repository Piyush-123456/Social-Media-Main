var express = require('express');
const userCollection = require('../models/user');
const postCollection = require("../models/post")
var router = express.Router();
const { sendMail } = require("../utils/nodemailer")

var app =express();

/* GET home page. */
router.get('/', async function (req, res, next) {
  const post = await postCollection.find();
  res.render('index', { user: req.user, post });
});
// router.get("/login", (req, res, next) => {
//   res.render("login", { user: req.user });
// })
router.get("/register", (req, res, next) => {
  res.render("register", { user: req.user });
})

router.get("/sendMail", (req, res, next) => {
  res.render("forget", { user: req.user })
})

router.post("/sendMail", async (req, res, next) => {
  try {
    const user = await userCollection.findOne({ username: req.body.username });
    sendMail(req, res, user);
  }
  catch (err) {
    console.log(err.message);
  }
})
module.exports = router;
