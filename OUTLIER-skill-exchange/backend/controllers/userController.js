const User = require('../models/User');
const Skill = require('../models/Skill');
const Session = require('../models/Session');
const notify = require('../utils/notify');

const PASS_MARK = 60; // quiz percentage needed to verify a skill (frontend quiz: 2 of 3 correct)

// GET /api/users/profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const skills = await Skill.find({ user_id: req.user._id });
    res.json({ user, skills });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { name, location, gender, preferredGenderFilter, facelessSessionAllowed, availability } = req.body;
    if (name) user.name = name;
    if (location) user.location = location;
    if (gender) user.gender = gender;
    if (preferredGenderFilter) user.preferredGenderFilter = preferredGenderFilter;
    if (facelessSessionAllowed !== undefined) user.facelessSessionAllowed = facelessSessionAllowed;
    if (availability) user.availability = availability;
    const updated = await user.save();
    const { password, ...safe } = updated.toObject();
    res.json(safe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/users/skill   { skillName, type: 'teach'|'learn', proficiency }
// When someone adds a 'learn' skill, every teacher of that skill gets a notification (Feature 5)
const addSkill = async (req, res) => {
  try {
    const { skillName, type, proficiency } = req.body;
    if (!skillName || !['teach', 'learn'].includes(type)) {
      return res.status(400).json({ message: 'skillName and type (teach|learn) are required' });
    }
    const exists = await Skill.findOne({
      user_id: req.user._id, type, skillName: new RegExp(`^${skillName.trim()}$`, 'i')
    });
    if (exists) return res.status(400).json({ message: 'You already added this skill' });

    const skill = await Skill.create({ user_id: req.user._id, skillName, type, proficiency, isVerified: false });

    let notifiedTeachers = 0;
    if (type === 'learn') {
      const teachers = await Skill.find({
        type: 'teach', user_id: { $ne: req.user._id },
        skillName: new RegExp(`^${skillName.trim()}$`, 'i')
      });
      for (const t of teachers) {
        await notify(t.user_id, `${req.user.name} wants to learn ${skillName}. Can you teach?`, 'teacher_alert');
      }
      notifiedTeachers = teachers.length;
    }
    res.status(201).json({ skill, notifiedTeachers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/users/skill/:id
const deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    if (skill.user_id.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    await skill.deleteOne();
    res.json({ message: 'Skill removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/skill/:id/verify   { quizScore } (score out of 100; >= 80 passes)
const verifySkill = async (req, res) => {
  try {
    const { quizScore } = req.body;
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    if (skill.user_id.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    if (typeof quizScore !== 'number') return res.status(400).json({ message: 'quizScore (number) is required' });

    if (quizScore >= PASS_MARK) {
      skill.isVerified = true;
      await skill.save();
      await User.findByIdAndUpdate(req.user._id, { isVerified: true });
      res.json({ message: 'Skill verified successfully!', skill });
    } else {
      res.status(400).json({ message: 'Quiz score too low. Skill not verified.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/dashboard  -> Learnt / Ongoing / Teaching sections (Feature 8)
const getDashboard = async (req, res) => {
  try {
    const id = req.user._id.toString();
    const sessions = await Session.find({ $or: [{ teacher_id: id }, { learner_id: id }] })
      .populate('teacher_id learner_id', 'name location').sort({ scheduledTime: -1 });
    const skills = await Skill.find({ user_id: id });

    const learnt = sessions.filter(s => s.status === 'completed' && s.learner_id._id.toString() === id);
    const taught = sessions.filter(s => s.status === 'completed' && s.teacher_id._id.toString() === id);
    const ongoing = sessions.filter(s => ['pending', 'accepted'].includes(s.status));
    res.json({
      learnt,
      ongoing,
      taught,
      teaching: skills.filter(s => s.type === 'teach'),
      wantToLearn: skills.filter(s => s.type === 'learn')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/passport  -> Skill Growth Passport (badges per skill)
const getPassport = async (req, res) => {
  try {
    const id = req.user._id.toString();
    const done = await Session.find({
      status: 'completed', $or: [{ teacher_id: id }, { learner_id: id }]
    });
    const bySkill = {};
    for (const s of done) {
      const key = s.skillName.toLowerCase();
      const role = s.learner_id.toString() === id ? 'learned' : 'taught';
      bySkill[key] = bySkill[key] || { skill: s.skillName, learned: 0, taught: 0 };
      bySkill[key][role]++;
    }
    const levelFor = (n) => (n >= 5 ? 'Advanced' : n >= 3 ? 'Intermediate' : n >= 1 ? 'Beginner' : null);
    const badges = [];
    const progress = Object.values(bySkill).map(e => {
      if (e.learned >= 1) badges.push(`${e.skill} - First Session`);
      if (e.learned >= 3) badges.push(`${e.skill} - Committed Learner`);
      if (e.learned >= 5) badges.push(`${e.skill} - Mastered`);
      if (e.taught >= 1) badges.push(`${e.skill} - Mentor`);
      return { ...e, level: levelFor(e.learned) };
    });
    res.json({
      totalCompleted: done.length,
      reliabilityScore: req.user.reliabilityScore,
      progress,
      badges
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/fcm-token  { fcmToken }  (frontend registers the browser/device token for push)
const setFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ message: 'fcmToken is required' });
    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ message: 'Push token saved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile, updateUserProfile, addSkill, deleteSkill, verifySkill, getDashboard, getPassport, setFcmToken
};
