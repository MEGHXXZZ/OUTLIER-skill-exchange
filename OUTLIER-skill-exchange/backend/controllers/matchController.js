const User = require('../models/User');
const Skill = require('../models/Skill');
const Session = require('../models/Session');
const { hasOverlap, coversDate } = require('../utils/availability');

const lower = (arr) => arr.map(s => s.skillName.toLowerCase());

// GET /api/match
// Optional filters (Feature 3 & 9): ?skill=React&proficiency=Advanced&location=Hassan
//   &gender=female&faceless=true&verifiedOnly=true&teacherId=<id>&minReliability=80
// Scoring: +40 mutual skills (+20 if one-way), +30 availability overlap, +20 same location, +10 reliability >= 80
const getMatches = async (req, res) => {
  try {
    const { skill, proficiency, location, gender, faceless, verifiedOnly, teacherId, minReliability } = req.query;

    const me = await User.findById(req.user._id);
    const mySkills = await Skill.find({ user_id: me._id });
    const iLearn = lower(mySkills.filter(s => s.type === 'learn'));
    const iTeach = lower(mySkills.filter(s => s.type === 'teach'));

    // If a skill filter is given, search for that skill instead of only my wishlist
    const wanted = skill ? [skill.toLowerCase()] : iLearn;

    const userQuery = { _id: { $ne: me._id } };
    if (teacherId) userQuery._id = teacherId;
    if (gender && gender !== 'any') userQuery.gender = gender;
    else if (me.preferredGenderFilter !== 'any') userQuery.gender = me.preferredGenderFilter;
    if (location) userQuery.location = new RegExp(location, 'i');
    if (faceless === 'true') userQuery.facelessSessionAllowed = true;
    if (verifiedOnly === 'true') userQuery.isVerified = true;
    if (minReliability) userQuery.reliabilityScore = { $gte: Number(minReliability) };

    const others = await User.find(userQuery).select('-password');
    const allSkills = await Skill.find({ user_id: { $in: others.map(u => u._id) } });

    const matches = [];
    for (const user of others) {
      const theirs = allSkills.filter(s => s.user_id.toString() === user._id.toString());
      let teaches = theirs.filter(s => s.type === 'teach');
      if (proficiency) teaches = teaches.filter(s => s.proficiency === proficiency);
      const theirLearn = lower(theirs.filter(s => s.type === 'learn'));

      const theyTeachWhatIWant = lower(teaches).some(s => wanted.includes(s));
      if (!theyTeachWhatIWant) continue;
      const theyWantWhatITeach = theirLearn.some(s => iTeach.includes(s));

      let score = theyWantWhatITeach ? 40 : 20;
      const availabilityOverlap = hasOverlap(me.availability, user.availability);
      if (availabilityOverlap) score += 30;
      if (me.location && user.location && me.location.toLowerCase() === user.location.toLowerCase()) score += 20;
      if (user.reliabilityScore >= 80) score += 10;

      matches.push({
        user: {
          _id: user._id, name: user.name, location: user.location, gender: user.gender,
          reliabilityScore: user.reliabilityScore, isVerified: user.isVerified,
          facelessSessionAllowed: user.facelessSessionAllowed, availability: user.availability
        },
        skillsOffered: theirs.filter(s => s.type === 'teach'),
        skillsWanted: theirs.filter(s => s.type === 'learn'),
        mutual: theyWantWhatITeach,
        availabilityOverlap,
        matchScore: score,
        matchPercentage: `${Math.min(score, 100)}%`
      });
    }

    matches.sort((a, b) => b.matchScore - a.matchScore);
    if (matches.length > 0) {
      matches[0].bestMatch = true;
    }

    // Edge case: no suitable match -> tell the frontend so it can offer a wishlist / "notify me"
    res.json({
      totalMatches: matches.length,
      noMatch: matches.length === 0,
      message: matches.length === 0
        ? 'No suitable match right now. Your learning request is saved and teachers are notified when someone joins.'
        : undefined,
      matches: matches.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Shared by cancel flow and the rescue endpoint
const findRescueCandidates = async (session) => {
  const { skillName, scheduledTime, teacher_id, learner_id } = session;
  const teachers = await Skill.find({
    skillName: new RegExp(`^${skillName}$`, 'i'),
    type: 'teach',
    user_id: { $nin: [teacher_id, learner_id] }
  }).populate('user_id', '-password');

  return teachers
    .filter(s => s.user_id && coversDate(s.user_id.availability, scheduledTime))
    .sort((a, b) => b.user_id.reliabilityScore - a.user_id.reliabilityScore)
    .map(s => ({ teacher: s.user_id, skill: s.skillName, proficiency: s.proficiency, isVerified: s.isVerified }));
};

// POST /api/match/rescue   { cancelledSessionId }
const getRescueMatch = async (req, res) => {
  try {
    const session = await Session.findById(req.body.cancelledSessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    const rescueMatches = await findRescueCandidates(session);
    if (rescueMatches.length === 0) {
      return res.status(404).json({ message: 'No rescue match found. Try rescheduling.', rescueMatches: [] });
    }
    res.json({ message: `Found ${rescueMatches.length} rescue match(es)!`, rescueMatches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMatches, getRescueMatch, findRescueCandidates };
