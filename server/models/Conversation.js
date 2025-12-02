const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isGroup: { type: Boolean, default: false },
  name: String,
  avatar: String,
  lastMessageAt: Date
}, { timestamps: true });

module.exports = mongoose.model("Conversation", ConversationSchema);
