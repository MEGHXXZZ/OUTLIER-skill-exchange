const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  type: { type: String, enum: ['teacher_alert', 'rescue_match', 'session', 'system'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
