const pool = require('../config/database');
const { hashPassword, comparePassword, generateToken, generateVerificationCode, successResponse, errorResponse } = require('../utils/helpers');
const nodemailer = require('nodemailer');
const svgCaptcha = require('svg-captcha');

// 邮箱验证码存储（实际应用中应使用 Redis）
const verificationStores = {
  register: new Map(),
  login: new Map(),
  changePassword: new Map(),
};

const captchaStore = new Map();
const CAPTCHA_EXPIRE = parseInt(process.env.CAPTCHA_EXPIRE || '300000', 10);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createUserCodeCandidate = () => String(Math.floor(10000000 + Math.random() * 90000000));

const generateUniqueUserCode = async (connection) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const userCode = createUserCodeCandidate();
    const [existingRows] = await connection.query(
      'SELECT id FROM users WHERE user_code = ? LIMIT 1',
      [userCode]
    );

    if (existingRows.length === 0) {
      return userCode;
    }
  }

  throw new Error('生成用户编号失败，请稍后重试');
};

const ensureUserCode = async (connection, user) => {
  if (!user || !user.id) {
    throw new Error('缺少用户信息，无法生成用户编号');
  }

  // 如果已经有 user_code，且不是旧的补零编号（如 00000008），则直接返回
  if (user.user_code && user.user_code !== String(user.id).padStart(8, '0')) {
    return String(user.user_code);
  }

  const userCode = await generateUniqueUserCode(connection);
  const [updateResult] = await connection.query(
    "UPDATE users SET user_code = ? WHERE id = ? AND (user_code IS NULL OR user_code = '' OR user_code = LPAD(id, 8, '0'))",
    [userCode, user.id]
  );

  if (updateResult.affectedRows > 0) {
    user.user_code = userCode;
    return userCode;
  }

  const [latestRows] = await connection.query(
    'SELECT user_code FROM users WHERE id = ? LIMIT 1',
    [user.id]
  );

  if (latestRows.length > 0 && latestRows[0].user_code) {
    user.user_code = String(latestRows[0].user_code);
    return user.user_code;
  }

  throw new Error('生成用户编号失败，请稍后重试');
};

const createMailTransporter = () => nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.163.com',
  port: Number(process.env.MAIL_PORT || 465),
  secure: String(process.env.MAIL_SECURE || 'true') === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const getStore = (scene) => verificationStores[scene];

const saveVerificationCode = (scene, email, code) => {
  const store = getStore(scene);
  const expiresAt = Date.now() + (parseInt(process.env.VERIFICATION_CODE_EXPIRE) || 600000);
  store.set(email, code);
  store.set(`${email}_time`, Date.now());
  store.set(`${email}_expires`, expiresAt);
};

const validateVerificationCode = (scene, email, code) => {
  const store = getStore(scene);
  const storedCode = store.get(email);
  const expiresAt = store.get(`${email}_expires`);

  if (!storedCode || storedCode !== code) {
    return '验证码错误';
  }

  if (Date.now() > expiresAt) {
    return '验证码已过期';
  }

  return null;
};

const clearVerificationCode = (scene, email) => {
  const store = getStore(scene);
  store.delete(email);
  store.delete(`${email}_time`);
  store.delete(`${email}_expires`);
};

const createCaptchaPayload = () => {
  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0oO1iIlL',
    noise: 3,
    color: true,
    background: '#fff7db',
    width: 132,
    height: 48,
    fontSize: 42,
  });

  const captchaId = `captcha_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  captchaStore.set(captchaId, {
    text: captcha.text.toLowerCase(),
    expiresAt: Date.now() + CAPTCHA_EXPIRE,
  });

  return {
    captchaId,
    captchaSvg: captcha.data,
    expiresIn: Math.floor(CAPTCHA_EXPIRE / 1000),
  };
};

const clearExpiredCaptchas = () => {
  const now = Date.now();
  for (const [captchaId, captchaValue] of captchaStore.entries()) {
    if (captchaValue.expiresAt <= now) {
      captchaStore.delete(captchaId);
    }
  }
};

const validateCaptcha = (captchaId, captchaCode) => {
  clearExpiredCaptchas();

  if (!captchaId || !captchaCode) {
    return '请先完成人机校验';
  }

  const captchaValue = captchaStore.get(captchaId);
  if (!captchaValue) {
    return '图形验证码已失效，请刷新后重试';
  }

  captchaStore.delete(captchaId);

  if (captchaValue.expiresAt <= Date.now()) {
    return '图形验证码已过期，请刷新后重试';
  }

  if (captchaValue.text !== String(captchaCode).trim().toLowerCase()) {
    return '图形验证码错误';
  }

  return null;
};

const getCaptcha = async (req, res) => {
  try {
    clearExpiredCaptchas();
    res.json(successResponse(createCaptchaPayload(), '获取图形验证码成功'));
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '获取图形验证码失败'));
  }
};

const sendEmailCode = async (scene, email, subject, introText, buttonText) => {
  const store = getStore(scene);
  const lastSent = store.get(`${email}_time`);
  if (lastSent && Date.now() - lastSent < 60000) {
    return { error: '请求过于频繁，请稍后再试' };
  }

  const code = generateVerificationCode();
  saveVerificationCode(scene, email, code);

  const transporter = createMailTransporter();
  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME || 'PawCircle'}" <${process.env.MAIL_USER}>`,
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border-radius: 12px; background: #fffef7; border: 1px solid #f0e9c0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 40px;">🐾</span>
          <h2 style="margin: 8px 0 0; color: #1a1a1a; font-size: 22px;">PawCircle</h2>
        </div>
        <p style="color: #555; font-size: 15px; margin-bottom: 8px;">你好！</p>
        <p style="color: #555; font-size: 15px;">${introText}</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #1a1a1a; background: #ffd700; padding: 12px 24px; border-radius: 8px;">${code}</span>
        </div>
        <p style="color: #888; font-size: 13px;">${buttonText}验证码 10 分钟内有效，请勿泄露给他人。</p>
      </div>
    `
  });

  return { code };
};

// 发送注册验证码
const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json(errorResponse(400, '邮箱格式不正确'));
    }

    const result = await sendEmailCode('register', email, 'PawCircle 注册验证码', '你的注册验证码为：', '注册');
    if (result.error) {
      return res.status(429).json(errorResponse(429, result.error));
    }

    console.log(`注册验证码已发送到 ${email}: ${result.code}`);
    res.json(successResponse(null, '验证码已发送'));
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 发送登录验证码
const sendLoginCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json(errorResponse(400, '邮箱格式不正确'));
    }

    const connection = await pool.getConnection();
    try {
      const [users] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
      if (users.length === 0) {
        return res.status(404).json(errorResponse(404, '该邮箱尚未注册'));
      }
    } finally {
      connection.release();
    }

    const result = await sendEmailCode('login', email, 'PawCircle 登录验证码', '你的登录验证码为：', '登录');
    if (result.error) {
      return res.status(429).json(errorResponse(429, result.error));
    }

    console.log(`登录验证码已发送到 ${email}: ${result.code}`);
    res.json(successResponse(null, '登录验证码已发送'));
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

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json(errorResponse(400, '邮箱格式不正确'));
    }

    const codeError = validateVerificationCode('register', email, code);
    if (codeError) {
      return res.status(400).json(errorResponse(400, codeError));
    }

    const connection = await pool.getConnection();

    try {
      const [existingUser] = await connection.query(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [email, username]
      );

      if (existingUser.length > 0) {
        return res.status(409).json(errorResponse(409, '用户已存在'));
      }

      const hashedPassword = await hashPassword(password);
      const userCode = await generateUniqueUserCode(connection);
      const [result] = await connection.query(
        'INSERT INTO users (username, email, password, user_code) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, userCode]
      );

      const userId = result.insertId;
      const token = generateToken(userId);

      clearVerificationCode('register', email);

      res.json(successResponse({
        id: userId,
        user_code: userCode,
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
    const { email, password, code, captchaId, captchaCode } = req.body;

    if (!email || (!password && !code)) {
      return res.status(400).json(errorResponse(400, '缺少必要参数'));
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json(errorResponse(400, '邮箱格式不正确'));
    }

    const captchaError = validateCaptcha(captchaId, captchaCode);
    if (captchaError) {
      return res.status(400).json(errorResponse(400, captchaError));
    }

    const connection = await pool.getConnection();

    try {
      const [users] = await connection.query(
        'SELECT id, user_code, username, email, password, avatar FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json(errorResponse(401, code ? '该邮箱尚未注册' : '邮箱或密码错误'));
      }

      const user = users[0];

      if (code) {
        const codeError = validateVerificationCode('login', email, code);
        if (codeError) {
          return res.status(401).json(errorResponse(401, codeError));
        }
        clearVerificationCode('login', email);
      } else {
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json(errorResponse(401, '邮箱或密码错误'));
        }
      }

      const userCode = await ensureUserCode(connection, user);
      const token = generateToken(user.id);

      res.json(successResponse({
        id: user.id,
        user_code: userCode,
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

// 发送修改密码验证码（需登录，发送到当前用户绑定邮箱）
const sendChangePasswordCode = async (req, res) => {
  try {
    const userId = req.userId;
    const connection = await pool.getConnection();
    let email;
    try {
      const [users] = await connection.query('SELECT email FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json(errorResponse(404, '用户不存在'));
      }
      email = users[0].email;
    } finally {
      connection.release();
    }

    const result = await sendEmailCode('changePassword', email, 'PawCircle 修改密码验证码', '你正在通过邮箱验证码修改密码，验证码为：', '修改密码');
    if (result.error) {
      return res.status(429).json(errorResponse(429, result.error));
    }

    console.log(`修改密码验证码已发送到 ${email}: ${result.code}`);
    res.json(successResponse(null, '验证码已发送'));
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

module.exports = {
  getCaptcha,
  sendVerificationCode,
  sendLoginCode,
  register,
  login,
  sendChangePasswordCode,
  validateVerificationCode,
  clearVerificationCode,
  ensureUserCode,
};
