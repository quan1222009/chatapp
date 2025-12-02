const mongoose = require("mongoose");

const AttachmentSchema = new mongoose.Schema({
  url: String,
  filename: String,
  mimetype: String,
  size: Number,
  storage: String,
  createdAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: String,
  attachments: [AttachmentSchema],
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Message", MessageSchema);
