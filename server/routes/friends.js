const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/authMiddleware'); // JWT auth
// global _io available for notifications

// Send friend request
// POST /api/friends/request { toUserId }
router.post('/request', auth, async (req, res) => {
  try {
    const from = req.user;
    const { toUserId } = req.body;
    if (!toUserId) return res.status(400).json({ error: 'toUserId required' });
    if (String(toUserId) === String(from._id)) return res.status(400).json({ error: 'Cannot friend yourself' });

    const to = await User.findById(toUserId);
    if (!to) return res.status(404).json({ error: 'User not found' });

    // check already friends
    if (to.friends && to.friends.find(f => String(f) === String(from._id))) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // check already requested
    if (to.friendRequests.find(fr => String(fr.from) === String(from._id))) {
      return res.status(400).json({ error: 'Request already sent' });
    }

    // push incoming request to 'to'
    to.friendRequests.push({ from: from._id });
    // add to outgoing list for sender
    from.friendRequestsSent = from.friendRequestsSent || [];
    if (!from.friendRequestsSent.find(id => String(id) === String(to._id))) {
      from.friendRequestsSent.push(to._id);
    }

    await to.save();
    await from.save();

    // notify user via socket if online
    try {
      global._io?.to(`user_${to._id}`).emit('friend_request_received', { from: { _id: from._id, name: from.name, avatar: from.avatar } });
    } catch (e) { /* ignore */ }

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Cancel outgoing request
// POST /api/friends/cancel { toUserId }
router.post('/cancel', auth, async (req, res) => {
  try {
    const me = req.user;
    const { toUserId } = req.body;
    if (!toUserId) return res.status(400).json({ error: 'toUserId required' });

    const to = await User.findById(toUserId);
    if (!to) return res.status(404).json({ error: 'User not found' });

    to.friendRequests = to.friendRequests.filter(fr => String(fr.from) !== String(me._id));
    me.friendRequestsSent = (me.friendRequestsSent || []).filter(id => String(id) !== String(to._id));

    await to.save();
    await me.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Accept friend request
// POST /api/friends/accept { fromUserId }
router.post('/accept', auth, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const { fromUserId } = req.body;
    if (!fromUserId) return res.status(400).json({ error: 'fromUserId required' });

    const other = await User.findById(fromUserId);
    if (!other) return res.status(404).json({ error: 'User not found' });

    // remove request
    me.friendRequests = me.friendRequests.filter(fr => String(fr.from) !== String(other._id));
    // remove outgoing on other side
    other.friendRequestsSent = (other.friendRequestsSent || []).filter(id => String(id) !== String(me._id));

    // add friends both sides if not already
    if (!me.friends.find(f => String(f) === String(other._id))) me.friends.push(other._id);
    if (!other.friends.find(f => String(f) === String(me._id))) other.friends.push(me._id);

    await me.save();
    await other.save();

    // notify accepted
    global._io?.to(`user_${other._id}`).emit('friend_request_accepted', { by: { _id: me._id, name: me.name, avatar: me.avatar } });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Reject friend request
// POST /api/friends/reject { fromUserId }
router.post('/reject', auth, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const { fromUserId } = req.body;
    if (!fromUserId) return res.status(400).json({ error: 'fromUserId required' });

    const other = await User.findById(fromUserId);
    if (!other) return res.status(404).json({ error: 'User not found' });

    me.friendRequests = me.friendRequests.filter(fr => String(fr.from) !== String(other._id));
    other.friendRequestsSent = (other.friendRequestsSent || []).filter(id => String(id) !== String(me._id));

    await me.save();
    await other.save();

    global._io?.to(`user_${other._id}`).emit('friend_request_rejected', { by: { _id: me._id, name: me.name } });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Remove friend
// DELETE /api/friends/remove { userId }
router.delete('/remove', auth, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const other = await User.findById(userId);
    if (!other) return res.status(404).json({ error: 'User not found' });

    me.friends = me.friends.filter(f => String(f) !== String(other._id));
    other.friends = other.friends.filter(f => String(f) !== String(me._id));

    await me.save();
    await other.save();

    global._io?.to(`user_${other._id}`).emit('friend_removed', { by: { _id: me._id, name: me.name } });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get incoming requests
// GET /api/friends/requests
router.get('/requests', auth, async (req, res) => {
  const me = await User.findById(req.user._id).populate('friendRequests.from', 'name avatar email');
  return res.json({ requests: me.friendRequests });
});

// Get friends list
// GET /api/friends/list
router.get('/list', auth, async (req, res) => {
  const me = await User.findById(req.user._id).populate('friends', 'name avatar email');
  return res.json({ friends: me.friends });
});

module.exports = router;
