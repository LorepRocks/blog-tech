const express = require("express");
const router = express.Router();
const User = require("../../modules/User");
const bycrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const gravatar = require("gravatar");

//Input validators
const validateLoginInput = require("../../validation/login");

/**
 * Create User
 * Register an user inside system, but this route will only management for Admin
 */

router.post("/register", (req, res) => {
  const errors = {};
  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      errors.email = "Email already exists!";
      return res.status(400).json(errors);
    } else {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar: gravatar.url(req.body.email, { s: "200", r: "pg", d: "mm" }),
        password: req.body.password
      });
      bycrypt.genSalt(10, (err, salt) => {
        bycrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.err(err));
        });
      });
    }
  });
});

/**
 * Login
 * Returns a Token for user session, and this token will be necesary for get and post information
 */

router.post("/login", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  //Check validation
  if (!isValid) {
    console.log("errors", errors);
    return res.status(400).json(errors);
  }
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email }).then(user => {
    if (!user) {
      errors.email = "User not found!";
      return res.status(400).json(errors);
    }
    bycrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        const payload = { id: user.id, name: user.name, avatar: user.avatar };
        jwt.sign(
          payload,
          keys.secretKey,
          { expiresIn: process.env.TOKEN_EXPIRED },
          (err, token) => {
            res.send({
              success: true,
              token: "Bearer" + token
            });
          }
        );
      } else {
        errors.passport = "Password Incorrect!";
        return res.status(400).json(errors);
      }
    });
  });
});

module.exports = router;
