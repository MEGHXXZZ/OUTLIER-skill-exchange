const express = require('express');
const router = express.Router();
const { getMatches, getRescueMatch } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMatches);
router.post('/rescue', protect, getRescueMatch);

module.exports = router;
