// Demo data: run with `npm run seed` (WARNING: wipes users, skills, sessions, circles, notifications)
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
dotenv.config();

const User = require('./models/User');
const Skill = require('./models/Skill');
const Session = require('./models/Session');
const Circle = require('./models/Circle');
const Notification = require('./models/Notification');

const slot = (day, startTime, endTime) => ({ day, startTime, endTime });

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User, Skill, Session, Circle, Notification].map(m => m.deleteMany({})));
  const password = await bcrypt.hash('password123', 10);

  const [meghavathi, kayashree, arjun, priya] = await User.create([
    { name: 'Meghavathi', email: 'meghavathi@test.com', password, location: 'Hassan', gender: 'female',
      facelessSessionAllowed: true, isVerified: true, availability: [slot('Saturday', '10:00', '12:00')] },
    { name: 'Kayashree', email: 'kayashree@test.com', password, location: 'Hassan', gender: 'female',
      facelessSessionAllowed: true, isVerified: true, availability: [slot('Saturday', '10:00', '13:00')] },
    { name: 'Arjun', email: 'arjun@test.com', password, location: 'Hassan', gender: 'male',
      isVerified: true, availability: [slot('Saturday', '10:00', '14:00')] },
    { name: 'Priya', email: 'priya@test.com', password, location: 'Mysuru', gender: 'female',
      availability: [slot('Sunday', '16:00', '18:00')] }
  ]);

  await Skill.create([
    { user_id: meghavathi._id, skillName: 'Graphic Design', type: 'teach', proficiency: 'Advanced', isVerified: true },
    { user_id: meghavathi._id, skillName: 'Web Development', type: 'learn', proficiency: 'Beginner' },
    { user_id: kayashree._id, skillName: 'Web Development', type: 'teach', proficiency: 'Advanced', isVerified: true },
    { user_id: kayashree._id, skillName: 'Graphic Design', type: 'learn', proficiency: 'Beginner' },
    { user_id: arjun._id, skillName: 'Web Development', type: 'teach', proficiency: 'Intermediate', isVerified: true },
    { user_id: arjun._id, skillName: 'Graphic Design', type: 'learn', proficiency: 'Beginner' },
    { user_id: priya._id, skillName: 'Python', type: 'teach', proficiency: 'Advanced' },
    { user_id: priya._id, skillName: 'Guitar', type: 'learn', proficiency: 'Beginner' }
  ]);

  console.log('Seeded. Login with any of these (password: password123):');
  console.log('  meghavathi@test.com  kayashree@test.com  arjun@test.com  priya@test.com');
  console.log('Demo: Meghavathi matches Kayashree (best) and Arjun (rescue match when Kayashree cancels).');
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
