const { verifyToken, errorResponse } = require('../utils/helpers');

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
  next();
};

module.exports = authMiddleware;

