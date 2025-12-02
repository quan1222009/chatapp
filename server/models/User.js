const mongoose = require('mongoose');

const FriendRequestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, sparse: true },
  password: String,
  avatar: String,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // incoming friend requests
  friendRequests: [FriendRequestSchema],
  // optionally track outgoing
  friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
