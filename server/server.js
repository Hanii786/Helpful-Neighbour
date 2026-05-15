require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
