const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillName: { type: String, required: true, trim: true },
  type: { type: String, enum: ['teach', 'learn'], required: true },
  proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Skill', skillSchema);
