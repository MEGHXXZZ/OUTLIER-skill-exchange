const express = require('express');
const router = express.Router();
const { createCircle, joinCircle, leaveCircle, getCircles } = require('../controllers/circleController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCircles);
router.post('/create', protect, createCircle);
router.post('/:id/join', protect, joinCircle);
router.post('/:id/leave', protect, leaveCircle);

module.exports = router;
