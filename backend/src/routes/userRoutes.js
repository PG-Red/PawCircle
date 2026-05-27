const express = require('express');
const router = express.Router();
const {
  getCurrentUser,
  updateUser,
  getPublicUserProfile,
  changePassword,
  changePasswordByEmail,
  searchUsers,
} = require('../controllers/userController');
const { sendChangePasswordCode } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.get('/search', authMiddleware, searchUsers);
router.get('/public/:userId', authMiddleware, getPublicUserProfile);


router.use(authMiddleware);

router.get('/me', getCurrentUser);
router.put('/me', updateUser);
router.post('/change-password', changePassword);
router.post('/send-change-password-code', sendChangePasswordCode);
router.post('/change-password-by-email', changePasswordByEmail);

module.exports = router;
