const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT 相关函数
const getJwtSecret = () => process.env.JWT_SECRET || 'please-set-jwt-secret';

const generateToken = (userId) => {
  return jwt.sign({ userId }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
};

// 密码相关函数
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// 生成验证码
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 响应格式化
const successResponse = (data = null, message = 'success') => {
  return {
    code: 200,
    message,
    data
  };
};

const errorResponse = (code = 400, message = 'error') => {
  return {
    code,
    message,
    data: null
  };
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateVerificationCode,
  successResponse,
  errorResponse
};

