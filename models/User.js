// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  currentModule: { type: String, default: 'intro' },
  score: { type: Number, default: 0 },
  badges: [String],
  currentQuizModule: { type: String, default: null },
  lastInteraction: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
