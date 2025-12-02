const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let exist = await User.findOne({ email });
  if (exist) return res.status(400).json({ error: "Email already exists" });

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hash,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${email}`
  });

  const token = generateToken(user);

  res.json({ user, token });
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Email not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "Wrong password" });

  const token = generateToken(user);

  res.json({ user, token });
});

// GOOGLE LOGIN — redirect to Google
router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// GOOGLE CALLBACK
router.get("/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.CLIENT_URL + "/login"
  }),
  async (req, res) => {
    const token = generateToken(req.user);

    res.redirect(
      `${process.env.CLIENT_URL}/oauth?token=${token}`
    );
  }
);

// GET CURRENT USER
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    res.json({ user });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
