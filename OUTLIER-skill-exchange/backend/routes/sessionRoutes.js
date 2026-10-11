const express = require('express');
const router = express.Router();
const {
  bookSession, acceptSession, rescheduleSession, getUserSessions, cancelSession, checkIn, completeSession
} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/book', protect, bookSession);
router.post('/', protect, bookSession); // alias used by the frontend (createSession)
router.get('/my-sessions', protect, getUserSessions);
router.put('/:id/accept', protect, acceptSession);
router.put('/:id/reschedule', protect, rescheduleSession);
router.put('/:id/cancel', protect, cancelSession);
router.put('/:id/checkin', protect, checkIn);
router.put('/:id/complete', protect, completeSession);

module.exports = router;
