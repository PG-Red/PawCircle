const express = require('express');
const router = express.Router();
const { getCaptcha, sendVerificationCode, sendLoginCode, register, login } = require('../controllers/authController');

router.get('/captcha', getCaptcha);
router.post('/send-code', sendVerificationCode);
router.post('/send-login-code', sendLoginCode);
router.post('/register', register);
router.post('/login', login);

module.exports = router;

