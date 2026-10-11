const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  learner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillName: { type: String, required: true },
  sessionType: { type: String, enum: ['1-on-1', 'community'], default: '1-on-1' },
  scheduledTime: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'cancelled', 'completed'], default: 'pending' },
  facelessSession: { type: Boolean, default: false },
  teacherCheckedIn: { type: Boolean, default: false },
  learnerCheckedIn: { type: Boolean, default: false },
  cancellationReason: { type: String },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isRescueMatch: { type: Boolean, default: false },
  circleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle' }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
