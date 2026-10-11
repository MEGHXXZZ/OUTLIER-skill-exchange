const Circle = require('../models/Circle');
const Session = require('../models/Session');
const notify = require('../utils/notify');

// POST /api/circles/create  { skillName, maxCapacity, description, scheduledTime }
const createCircle = async (req, res) => {
  try {
    const { skillName, maxCapacity, description, scheduledTime } = req.body;
    if (!skillName) return res.status(400).json({ message: 'skillName is required' });
    const circle = await Circle.create({
      teacher_id: req.user._id, skillName, maxCapacity: maxCapacity || 5,
      description, scheduledTime, members: [req.user._id]
    });
    res.status(201).json({ message: 'Circle created!', circle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/circles/:id/join
const joinCircle = async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: 'Circle not found' });
    if (circle.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You are already a member of this circle' });
    }
    if (circle.members.length >= circle.maxCapacity) return res.status(400).json({ message: 'Circle is full!' });

    circle.members.push(req.user._id);
    await circle.save();

    // Community session record so it appears in the learner's dashboard
    if (circle.scheduledTime) {
      await Session.create({
        teacher_id: circle.teacher_id, learner_id: req.user._id, skillName: circle.skillName,
        sessionType: 'community', scheduledTime: circle.scheduledTime, status: 'accepted', circleId: circle._id
      });
    }
    await notify(circle.teacher_id, `${req.user.name} joined your ${circle.skillName} circle.`, 'session');
    res.json({ message: 'Joined circle!', circle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/circles/:id/leave
const leaveCircle = async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: 'Circle not found' });
    if (circle.teacher_id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'The teacher cannot leave their own circle' });
    }
    circle.members = circle.members.filter(m => m.toString() !== req.user._id.toString());
    await circle.save();
    await Session.updateMany(
      { circleId: circle._id, learner_id: req.user._id, status: 'accepted' },
      { status: 'cancelled', cancellationReason: 'Left the circle', cancelledBy: req.user._id }
    );
    res.json({ message: 'Left circle', circle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/circles?skill=React
const getCircles = async (req, res) => {
  try {
    const q = req.query.skill ? { skillName: new RegExp(req.query.skill, 'i') } : {};
    const circles = await Circle.find(q).sort({ createdAt: -1 })
      .populate('teacher_id', 'name isVerified').populate('members', 'name');
    res.json(circles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCircle, joinCircle, leaveCircle, getCircles };
