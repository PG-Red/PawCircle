const pool = require('../config/database');
const { successResponse, errorResponse, hashPassword, comparePassword } = require('../utils/helpers');

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.query(
        'SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json(errorResponse(404, '用户不存在'));
      }

      res.json(successResponse(users[0]));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 更新用户信息
const updateUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { username, avatar, bio } = req.body;
    const connection = await pool.getConnection();

    try {
      await connection.query(
        'UPDATE users SET username = ?, avatar = ?, bio = ? WHERE id = ?',
        [username, avatar, bio, userId]
      );

      const [users] = await connection.query(
        'SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?',
        [userId]
      );

      res.json(successResponse(users[0], '用户信息更新成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 修改密码
const changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json(errorResponse(400, '缺少必要参数'));
    }

    const connection = await pool.getConnection();

    try {
      const [users] = await connection.query(
        'SELECT password FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json(errorResponse(404, '用户不存在'));
      }

      const isPasswordValid = await comparePassword(old_password, users[0].password);
      if (!isPasswordValid) {
        return res.status(400).json(errorResponse(400, '原密码错误'));
      }

      const hashedPassword = await hashPassword(new_password);
      await connection.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
      );

      res.json(successResponse(null, '密码修改成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

module.exports = {
  getCurrentUser,
  updateUser,
  changePassword
};

