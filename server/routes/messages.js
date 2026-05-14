const router = require('express').Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/auth');
const mongoose = require('mongoose');

// GET /api/messages/conversations — list of unique convos
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const convos = await Message.aggregate([
      { $match: { $or: [{ from: userId }, { to: userId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $lt: ['$from', '$to'] }, { a: '$from', b: '$to' }, { a: '$to', b: '$from' }]
          },
          lastMessage: { $first: '$$ROOT' },
          unread: { $sum: { $cond: [{ $and: [{ $eq: ['$to', userId] }, { $eq: ['$read', false] }] }, 1, 0] } }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.from',
          foreignField: '_id',
          as: 'fromUser',
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.to',
          foreignField: '_id',
          as: 'toUser',
        }
      },
      {
        $addFields: {
          'lastMessage.from': { $arrayElemAt: ['$fromUser', 0] },
          'lastMessage.to': { $arrayElemAt: ['$toUser', 0] },
        }
      },
      {
        $project: {
          fromUser: 0,
          toUser: 0,
          'lastMessage.from.password': 0,
          'lastMessage.from.otp': 0,
          'lastMessage.from.otpExpiry': 0,
          'lastMessage.to.password': 0,
          'lastMessage.to.otp': 0,
          'lastMessage.to.otpExpiry': 0,
        }
      }
    ]);

    res.json(convos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/messages/:userId — messages with specific user
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { from: req.user.id, to: req.params.userId },
        { from: req.params.userId, to: req.user.id },
      ]
    })
      .populate('from', 'firstName lastName')
      .populate('to', 'firstName lastName')
      .sort({ createdAt: 1 });

    await Message.updateMany(
      { from: req.params.userId, to: req.user.id, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages — send message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { to, text, jobId } = req.body;
    if (!to || !text) return res.status(400).json({ message: 'Recipient and text required' });

    const msg = await Message.create({
      from: req.user.id,
      to,
      text,
      job: jobId || undefined,
    });

    const populated = await msg.populate([
      { path: 'from', select: 'firstName lastName' },
      { path: 'to', select: 'firstName lastName' },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
