const express = require('express');
const router = express.Router();
const { getTodayFeedingRecords } = require('../controllers/feedingController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// 今日喂养统计
router.get('/today', getTodayFeedingRecords);

module.exports = router;




