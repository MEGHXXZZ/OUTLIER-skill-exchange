const express = require('express');
const router = express.Router();
const {
  getUserProfile, updateUserProfile, addSkill, deleteSkill, verifySkill, getDashboard, getPassport, setFcmToken
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.get('/dashboard', protect, getDashboard);
router.get('/passport', protect, getPassport);
router.put('/fcm-token', protect, setFcmToken);
router.post('/skill', protect, addSkill);
router.delete('/skill/:id', protect, deleteSkill);
router.put('/skill/:id/verify', protect, verifySkill);

module.exports = router;
