const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, enum: ['Services', 'Borrow', 'Garage Sales'], required: true },
  description: { type: String, required: true, trim: true },
  payRate: { type: Number, default: 0 },
  payUnit: { type: String, enum: ['hour', 'day', 'fixed', 'free'], default: 'hour' },
  zipCode: { type: String, required: true },
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
  poster: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  helpers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
