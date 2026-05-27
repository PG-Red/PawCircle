const { verifyToken, errorResponse } = require('../utils/helpers');
const pool = require('../config/database');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json(errorResponse(401, '未授权'));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json(errorResponse(401, 'Token过期或无效'));
  }

  req.userId = decoded.userId;

  // 异步更新最后活跃时间，不阻塞请求
  pool.query(
    'UPDATE users SET last_active_at = NOW() WHERE id = ?',
    [decoded.userId]
  ).catch(() => {});

  next();
};

module.exports = authMiddleware;

