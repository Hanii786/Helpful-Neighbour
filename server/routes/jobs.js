const router = require('express').Router();
const Job = require('../models/Job');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/jobs — public: returns all; guests get first 3
router.get('/', async (req, res) => {
  try {
    const { category, search, zip } = req.query;
    const filter = { status: 'active' };
    if (category && category !== 'All') filter.category = category;
    if (zip) filter.zipCode = zip;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const jobs = await Job.find(filter)
      .populate('poster', 'firstName lastName zipCode rating reviewCount')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/jobs — create job (auth required)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, category, description, payRate, payUnit } = req.body;
    if (!title || !category || !description)
      return res.status(400).json({ message: 'Title, category and description required' });

    const user = await User.findById(req.user.id);
    const job = await Job.create({
      title, category, description,
      payRate: payRate || 0,
      payUnit: payUnit || 'hour',
      zipCode: user.zipCode,
      poster: req.user.id,
    });

    await User.findByIdAndUpdate(req.user.id, { $inc: { jobsPosted: 1 } });

    const populated = await job.populate('poster', 'firstName lastName zipCode rating reviewCount');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/jobs/:id/resolve — mark resolved
router.put('/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.poster.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    job.status = 'resolved';
    await job.save();
    res.json({ message: 'Job resolved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.poster.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });
    await job.deleteOne();
    await User.findByIdAndUpdate(req.user.id, { $inc: { jobsPosted: -1 } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/jobs/my — my listings
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ poster: req.user.id })
      .populate('poster', 'firstName lastName zipCode rating reviewCount')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
