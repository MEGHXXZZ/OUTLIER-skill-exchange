const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  location: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  preferredGenderFilter: { type: String, enum: ['any', 'male', 'female'], default: 'any' },
  facelessSessionAllowed: { type: Boolean, default: false },
  reliabilityScore: { type: Number, default: 100, min: 0, max: 100 },
  isVerified: { type: Boolean, default: false },
  fcmToken: { type: String, select: false },
  availability: [{
    day: { type: String },       // "Monday"
    startTime: { type: String }, // "10:00"
    endTime: { type: String }    // "12:00"
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
