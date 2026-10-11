const Session = require('../models/Session');
const User = require('../models/User');
const notify = require('../utils/notify');
const { findRescueCandidates } = require('./matchController');
const { nextSlots } = require('../utils/availability');

const clamp = (n) => Math.max(0, Math.min(100, n));
const adjustScore = async (userId, delta) => {
  const u = await User.findById(userId);
  if (!u) return;
  u.reliabilityScore = clamp(u.reliabilityScore + delta);
  await u.save();
};
const isParticipant = (s, userId) =>
  s.teacher_id.toString() === userId.toString() || s.learner_id.toString() === userId.toString();

// POST /api/sessions/book  { teacher_id, skillName, scheduledTime, sessionType, facelessSession }
const bookSession = async (req, res) => {
  try {
    const { teacher_id, skillName, scheduledTime, sessionType, facelessSession, isRescueMatch } = req.body;
    if (!teacher_id || !skillName || !scheduledTime) {
      return res.status(400).json({ message: 'teacher_id, skillName and scheduledTime are required' });
    }
    if (teacher_id === req.user._id.toString()) return res.status(400).json({ message: 'You cannot book yourself' });
    const time = new Date(scheduledTime);
    if (isNaN(time) || time < new Date()) return res.status(400).json({ message: 'scheduledTime must be a valid future date' });

    const teacher = await User.findById(teacher_id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    if (facelessSession && !teacher.facelessSessionAllowed) {
      return res.status(400).json({ message: 'This teacher does not allow faceless sessions' });
    }

    const clash = await Session.findOne({
      status: { $in: ['pending', 'accepted'] }, scheduledTime: time,
      $or: [{ teacher_id }, { learner_id: req.user._id }]
    });
    if (clash) return res.status(409).json({ message: 'One of you already has a session at that time' });

    const session = await Session.create({
      teacher_id, learner_id: req.user._id, skillName, scheduledTime: time,
      sessionType: sessionType || '1-on-1', facelessSession: !!facelessSession, status: 'pending',
      isRescueMatch: !!isRescueMatch
    });
    await notify(teacher_id, `${req.user.name} requested a ${skillName} session.`, 'session');
    res.status(201).json({ message: 'Session requested!', session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/sessions/:id/accept  (teacher only)
const acceptSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.teacher_id.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only the teacher can accept' });
    if (session.status !== 'pending') return res.status(400).json({ message: `Session is already ${session.status}` });
    session.status = 'accepted';
    await session.save();
    await notify(session.learner_id, `Your ${session.skillName} session was accepted.`, 'session');
    res.json({ message: 'Session accepted', session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/sessions/:id/reschedule  { scheduledTime }
const rescheduleSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (!isParticipant(session, req.user._id)) return res.status(403).json({ message: 'Not authorized' });
    const time = new Date(req.body.scheduledTime || req.body.slot); // frontend sends { slot }
    if (isNaN(time) || time < new Date()) return res.status(400).json({ message: 'scheduledTime (ISO date) must be a valid future date' });
    if (['completed'].includes(session.status)) return res.status(400).json({ message: 'Completed sessions cannot be rescheduled' });

    session.scheduledTime = time;
    session.status = 'pending';
    session.cancellationReason = undefined;
    await session.save();
    const other = session.teacher_id.toString() === req.user._id.toString() ? session.learner_id : session.teacher_id;
    await notify(other, `${req.user.name} rescheduled your ${session.skillName} session.`, 'session');
    res.json({ message: 'Session rescheduled', session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/sessions/my-sessions
const getUserSessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [{ teacher_id: req.user._id }, { learner_id: req.user._id }]
    }).populate('teacher_id learner_id', 'name email location').sort({ scheduledTime: 1 });
    res.json({
      ongoing: sessions.filter(s => ['pending', 'accepted'].includes(s.status)),
      completed: sessions.filter(s => s.status === 'completed'),
      cancelled: sessions.filter(s => s.status === 'cancelled')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/sessions/:id/cancel  { cancellationReason }  (reason required - Feature 6)
// Penalty: -5 reliability, or -10 if cancelled less than 15 min before start.
// Response includes rescue candidates so the UI can show the Rescue Match popup straight away.
const cancelSession = async (req, res) => {
  try {
    // frontend sends { reason }, API docs say { cancellationReason }; accept both
    const cancellationReason = req.body.cancellationReason || req.body.reason;
    if (!cancellationReason || !cancellationReason.trim()) {
      return res.status(400).json({ message: 'A valid cancellation reason is required' });
    }
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (!isParticipant(session, req.user._id)) return res.status(403).json({ message: 'Not authorized' });
    if (['cancelled', 'completed'].includes(session.status)) {
      return res.status(400).json({ message: `Session is already ${session.status}` });
    }

    const minutesLeft = (new Date(session.scheduledTime) - new Date()) / 60000;
    const lateCancel = minutesLeft < 15;
    const shortNotice = minutesLeft < 30;

    session.status = 'cancelled';
    session.cancellationReason = cancellationReason;
    session.cancelledBy = req.user._id;
    await session.save();
    await adjustScore(req.user._id, lateCancel ? -10 : -5);

    const otherId = session.teacher_id.toString() === req.user._id.toString() ? session.learner_id : session.teacher_id;
    await notify(otherId, `${req.user.name} cancelled the ${session.skillName} session (${cancellationReason}).`, 'session');

    // Rescue match: replacement teachers for the same skill and time slot (always computed, so the UI
    // can offer it to whoever cancelled). The learner is notified only if the teacher was the canceller.
    const rescueMatches = await findRescueCandidates(session);
    if (rescueMatches.length && session.teacher_id.toString() === req.user._id.toString()) {
      await notify(session.learner_id,
        `We found ${rescueMatches.length} replacement teacher(s) for ${session.skillName} at the same time.`, 'rescue_match');
    }

    // Fallback when nobody is free: the original teacher's next open slots
    const teacher = await User.findById(session.teacher_id);
    const alternativeSlots = nextSlots(teacher ? teacher.availability : [], 3, session.scheduledTime);

    res.json({
      message: 'Session cancelled. Reliability score updated.',
      session,
      shortNotice,
      lateCancel,
      triggerRescue: true,
      rescueMatches,
      alternativeSlots
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/sessions/:id/checkin  -> attendance (Feature 4). Allowed from 15 min before start.
const checkIn = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (!isParticipant(session, req.user._id)) return res.status(403).json({ message: 'Not authorized' });
    if (session.status !== 'accepted') return res.status(400).json({ message: 'Only accepted sessions can be checked in to' });

    const isTeacher = session.teacher_id.toString() === req.user._id.toString();
    if (isTeacher) session.teacherCheckedIn = true; else session.learnerCheckedIn = true;
    await session.save();
    res.json({
      message: 'Checked in',
      teacherCheckedIn: session.teacherCheckedIn,
      learnerCheckedIn: session.learnerCheckedIn
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/sessions/:id/complete
const completeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (!isParticipant(session, req.user._id)) return res.status(403).json({ message: 'Not authorized' });
    if (session.status === 'completed') return res.status(400).json({ message: 'Already completed' });
    if (session.status === 'cancelled') return res.status(400).json({ message: 'Cancelled sessions cannot be completed' });

    session.status = 'completed';
    await session.save();
    await adjustScore(session.teacher_id, 2);
    await adjustScore(session.learner_id, 2);
    res.json({ message: 'Session completed! Reliability scores boosted.', session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  bookSession, acceptSession, rescheduleSession, getUserSessions, cancelSession, checkIn, completeSession
};
