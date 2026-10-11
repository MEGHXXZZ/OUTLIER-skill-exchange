const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('OUTLIER Backend is running!'));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
// frontend calls POST /api/verify {skillId, quizScore}; forwarded to the verify handler
const { protect } = require('./middleware/authMiddleware');
app.post('/api/verify', protect, (req, res, next) => {
  req.params.id = req.body.skillId || req.body.id;
  return require('./controllers/userController').verifySkill(req, res, next);
});
app.use('/api/match', require('./routes/matchRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/circles', require('./routes/circleRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// 404 + error handlers
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
