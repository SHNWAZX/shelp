const mongoose = require('mongoose');

const userWarningSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, default: '' },
  firstName: { type: String, default: '' },
  warns: { type: Number, default: 0 },
  warnReasons: [{ reason: String, date: { type: Date, default: Date.now } }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userWarningSchema.index({ chatId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('UserWarning', userWarningSchema);
