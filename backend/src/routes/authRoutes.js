const express = require('express');
const router = express.Router();
const { sendVerificationCode, register, login } = require('../controllers/authController');

router.post('/send-code', sendVerificationCode);
router.post('/register', register);
router.post('/login', login);

module.exports = router;

