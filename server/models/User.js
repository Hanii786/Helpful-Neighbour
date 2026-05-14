const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  zipCode: { type: String, required: true, trim: true },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
  jobsPosted: { type: Number, default: 0 },
  helped: { type: Number, default: 0 },
  earned: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  profilePic: { type: String, default: '' },
  verifyMethod: { type: String, enum: ['email', 'phone'], default: 'email' },
  lat: { type: Number },
  lng: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
