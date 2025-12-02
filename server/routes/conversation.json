const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

// 🔹 GET ALL CONVERSATIONS OF USER
router.get("/", auth, async (req, res) => {
  const conv = await Conversation.find({
    members: req.user._id
  })
    .sort({ updatedAt: -1 })
    .populate("members", "name email avatar");

  res.json(conv);
});

// 🔹 GET MESSAGES IN ONE CONVERSATION
router.get("/:id/messages", auth, async (req, res) => {
  const messages = await Message.find({
    conversation: req.params.id
  }).populate("sender", "name avatar");

  res.json(messages);
});

// 🔹 CREATE OR GET PRIVATE CHAT
router.post("/private", auth, async (req, res) => {
  const { otherUserId } = req.body;

  let conv = await Conversation.findOne({
    isGroup: false,
    members: { $all: [req.user._id, otherUserId] }
  });

  if (!conv) {
    conv = await Conversation.create({
      members: [req.user._id, otherUserId],
      isGroup: false
    });
  }

  res.json(conv);
});

// 🔹 CREATE GROUP CHAT
router.post("/group", auth, async (req, res) => {
  const { name, members } = req.body;

  const conv = await Conversation.create({
    name,
    members: [req.user._id, ...members],
    isGroup: true,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`
  });

  res.json(conv);
});

// 🔹 SEARCH FRIENDS / USERS
router.get("/search/:keyword", auth, async (req, res) => {
  const key = req.params.keyword;

  const users = await User.find({
    name: { $regex: key, $options: "i" }
  }).select("name avatar email");

  res.json(users);
});

module.exports = router;
