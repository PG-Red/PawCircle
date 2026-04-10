const express = require('express');
const router = express.Router();
const {
  getCurrentUser,
  updateUser,
  getPublicUserProfile,
  changePassword
} = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

router.get('/public/:userId', authMiddleware, getPublicUserProfile);

router.use(authMiddleware);

router.get('/me', getCurrentUser);
router.put('/me', updateUser);
router.post('/change-password', changePassword);

module.exports = router;
