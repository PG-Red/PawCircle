const pool = require('../config/database');
const { hashPassword, comparePassword, generateToken, generateVerificationCode, successResponse, errorResponse } = require('../utils/helpers');
const nodemailer = require('nodemailer');

// 邮箱验证码存储（实际应用中应使用 Redis）
const verificationCodes = new Map();

// 发送验证码
const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json(errorResponse(400, '邮箱格式不正确'));
    }

    // 检查是否频繁请求
    const lastSent = verificationCodes.get(`${email}_time`);
    if (lastSent && Date.now() - lastSent < 60000) {
      return res.status(429).json(errorResponse(429, '请求过于频繁，请稍后再试'));
    }

    const code = generateVerificationCode();
    const expiresAt = Date.now() + (parseInt(process.env.VERIFICATION_CODE_EXPIRE) || 600000);

    // 保存验证码
    verificationCodes.set(email, code);
    verificationCodes.set(`${email}_time`, Date.now());
    verificationCodes.set(`${email}_expires`, expiresAt);

    // 发送邮件
    const transporter = nodemailer.createTransport({
      host: 'smtp.163.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER || 'qq1742383050@163.com',
        pass: process.env.MAIL_PASS || 'ZLi4PcEC8aL6kgDe'
      }
    });

    await transporter.sendMail({
      from: `"PawCircle" <${process.env.MAIL_USER || 'qq1742383050@163.com'}>`,
      to: email,
      subject: 'PawCircle 注册验证码',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border-radius: 12px; background: #fffef7; border: 1px solid #f0e9c0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px;">🐾</span>
            <h2 style="margin: 8px 0 0; color: #1a1a1a; font-size: 22px;">PawCircle</h2>
          </div>
          <p style="color: #555; font-size: 15px; margin-bottom: 8px;">你好！</p>
          <p style="color: #555; font-size: 15px;">你的注册验证码为：</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #1a1a1a; background: #ffd700; padding: 12px 24px; border-radius: 8px;">${code}</span>
          </div>
          <p style="color: #888; font-size: 13px;">验证码 10 分钟内有效，请勿泄露给他人。</p>
        </div>
      `
    });

    console.log(`验证码已发送到 ${email}: ${code}`);
    res.json(successResponse(null, '验证码已发送'));
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 用户注册
const register = async (req, res) => {
  try {
    const { username, email, code, password } = req.body;

    if (!username || !email || !code || !password) {
      return res.status(400).json(errorResponse(400, '缺少必要参数'));
    }

    // 验证验证码
    const storedCode = verificationCodes.get(email);
    const expiresAt = verificationCodes.get(`${email}_expires`);

    if (!storedCode || storedCode !== code) {
      return res.status(400).json(errorResponse(400, '验证码错误'));
    }

    if (Date.now() > expiresAt) {
      return res.status(400).json(errorResponse(400, '验证码已过期'));
    }

    const connection = await pool.getConnection();

    try {
      // 检查用户是否已存在
      const [existingUser] = await connection.query(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [email, username]
      );

      if (existingUser.length > 0) {
        return res.status(409).json(errorResponse(409, '用户已存在'));
      }

      // 加密密码
      const hashedPassword = await hashPassword(password);

      // 创建用户
      const [result] = await connection.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );

      const userId = result.insertId;
      const token = generateToken(userId);

      // 清除验证码
      verificationCodes.delete(email);
      verificationCodes.delete(`${email}_time`);
      verificationCodes.delete(`${email}_expires`);

      res.json(successResponse({
        id: userId,
        username,
        email,
        token
      }, '注册成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(errorResponse(400, '缺少必要参数'));
    }

    const connection = await pool.getConnection();

    try {
      const [users] = await connection.query(
        'SELECT id, username, email, password, avatar FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json(errorResponse(401, '邮箱或密码错误'));
      }

      const user = users[0];
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json(errorResponse(401, '邮箱或密码错误'));
      }

      const token = generateToken(user.id);

      res.json(successResponse({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        token
      }, '登录成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

module.exports = {
  sendVerificationCode,
  register,
  login
};

