const mongoose = require('mongoose');

const circleSchema = new mongoose.Schema({
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillName: { type: String, required: true },
  maxCapacity: { type: Number, default: 5 },
  description: { type: String },
  scheduledTime: { type: Date },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Circle', circleSchema);
