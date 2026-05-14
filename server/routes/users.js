const router = require('express').Router();
const User = require('../models/User');

// GET /api/users/:id — public profile (no auth required)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'firstName lastName zipCode rating reviewCount jobsPosted helped earned profilePic createdAt'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
