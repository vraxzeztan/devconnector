const express = require("express");
const { check } = require("express-validator");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

const validateSchema = require("../../middleware/validate-schema");

const User = require("../../models/User");

const router = express.Router();

// @route  POST api/users
// @desc   Register user
// @access Public
router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter password minimum with 6 characters"
    ).isLength({ min: 6 }),
  ],
  validateSchema,
  async (req, res) => {
    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({
          errors: [{ msg: "User already exists" }],
        });
      }

      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm",
      });

      user = new User({
        name,
        email,
        avatar,
        password,
      });

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) {
            throw err;
          }
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
