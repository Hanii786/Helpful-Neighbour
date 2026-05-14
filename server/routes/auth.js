const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const https = require('https');
const User = require('../models/User');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPSms = async (phone, otp) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE;
  if (!accountSid || !authToken || !fromPhone) throw new Error('Twilio credentials not configured');

  const body = `Your Helpful Neighbor code: ${otp}. Expires in 10 minutes.`;
  const params = new URLSearchParams({ To: phone, From: fromPhone, Body: body }).toString();

  await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.twilio.com',
      path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
      method: 'POST',
      auth: `${accountSid}:${authToken}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(params) },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const json = JSON.parse(data);
        if (json.error_code) reject(new Error(json.message));
        else resolve(json);
      });
    });
    req.on('error', reject);
    req.write(params);
    req.end();
  });
};

const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.verify();
  await transporter.sendMail({
    from: `"Helpful Neighbor" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Helpful Neighbor – Your OTP Code',
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:16px">
        <h2 style="color:#111;margin-bottom:8px">Helpful <span style="color:#4a8c6a">Neighbor</span></h2>
        <p style="color:#374151;margin-bottom:24px">Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;text-align:center;font-size:36px;font-weight:800;letter-spacing:10px;color:#166534">${otp}</div>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
      </div>`,
  });
};

// POST /api/auth/register — step 1: create user, send OTP
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword, zipCode, verifyMethod = 'email', lat, lng } = req.body;

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || !zipCode)
      return res.status(400).json({ message: 'All fields are required' });

    if (password !== confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ message: 'Email already registered' });

    const phoneExists = await User.findOne({ phone });
    if (phoneExists) return res.status(400).json({ message: 'Phone number already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      firstName, lastName, email, phone,
      password: hashed, zipCode,
      otp, otpExpiry, isVerified: false,
      verifyMethod,
      ...(lat && { lat }), ...(lng && { lng }),
    });

    try {
      if (verifyMethod === 'phone') {
        await sendOTPSms(phone, otp);
      } else {
        await sendOTPEmail(email, otp);
      }
    } catch (sendErr) {
      await User.findByIdAndDelete(user._id);
      console.error('OTP send failed:', sendErr.message);
      const via = verifyMethod === 'phone' ? 'SMS. Check your Twilio credentials' : 'email. Check your email credentials';
      return res.status(500).json({ message: `Could not send verification code via ${via}.` });
    }

    res.status(201).json({
      message: `OTP sent to your ${verifyMethod === 'phone' ? 'phone' : 'email'}. Please verify.`,
      userId: user._id,
      verifyMethod,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Already verified' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (user.otpExpiry < new Date()) return res.status(400).json({ message: 'OTP expired' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId, switchTo } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Already verified' });
    if (switchTo && ['email', 'phone'].includes(switchTo)) user.verifyMethod = switchTo;

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      if (user.verifyMethod === 'phone') {
        await sendOTPSms(user.phone, otp);
      } else {
        await sendOTPEmail(user.email, otp);
      }
    } catch (sendErr) {
      console.error('OTP resend failed:', sendErr.message);
      return res.status(500).json({ message: 'Could not resend verification code. Please try again.' });
    }

    res.json({ message: 'OTP resent', verifyMethod: user.verifyMethod });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first', userId: user._id });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

const authMiddleware = require('../middleware/auth');

// PUT /api/auth/profile — update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phone, zipCode, profilePic } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (phone && phone !== user.phone) {
      const exists = await User.findOne({ phone, _id: { $ne: user._id } });
      if (exists) return res.status(400).json({ message: 'Phone number already in use' });
    }

    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (phone) user.phone = phone.trim();
    if (zipCode) user.zipCode = zipCode.trim();
    if (profilePic !== undefined) user.profilePic = profilePic;

    await user.save();
    res.json({ user: formatUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

const formatUser = (u) => ({
  _id: u._id,
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.email,
  phone: u.phone,
  zipCode: u.zipCode,
  jobsPosted: u.jobsPosted,
  helped: u.helped,
  earned: u.earned,
  rating: u.rating,
  reviewCount: u.reviewCount,
  isVerified: u.isVerified,
  profilePic: u.profilePic || '',
});

module.exports = router;
