const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

// create message
router.post("/", async (req, res) => {
  const { conversationId, text, attachments } = req.body;

  const msg = await Message.create({
    conversation: conversationId,
    sender: req.user?.id || "000000000000",
    text,
    attachments
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessageAt: new Date()
  });

  _io.to(`conv_${conversationId}`).emit("new_message", msg);

  res.json(msg);
});

module.exports = router;
