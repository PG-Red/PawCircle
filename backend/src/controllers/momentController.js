const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// 获取动态列表
const getMoments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const userId = req.userId;
    const offset = (page - 1) * pageSize;

    const connection = await pool.getConnection();

    try {
      const [moments] = await connection.query(
        `SELECT m.id, m.user_id, m.pet_id, m.content, m.image, m.likes_count, m.comments_count, m.created_at,
                u.username, u.avatar, p.name as pet_name,
                CASE WHEN l.id IS NOT NULL THEN true ELSE false END as is_liked
         FROM moments m
         JOIN users u ON m.user_id = u.id
         LEFT JOIN pets p ON m.pet_id = p.id
         LEFT JOIN likes l ON m.id = l.moment_id AND l.user_id = ?
         ORDER BY m.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, pageSize, offset]
      );

      const [countResult] = await connection.query('SELECT COUNT(*) as total FROM moments');
      const total = countResult[0].total;

      const formattedMoments = moments.map(m => ({
        id: m.id,
        user: {
          id: m.user_id,
          username: m.username,
          avatar: m.avatar
        },
        pet: m.pet_id ? {
          id: m.pet_id,
          name: m.pet_name
        } : null,
        content: m.content,
        image: m.image,
        likes_count: m.likes_count,
        comments_count: m.comments_count,
        is_liked: m.is_liked,
        created_at: m.created_at
      }));

      res.json(successResponse({
        total,
        page,
        pageSize,
        items: formattedMoments
      }));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 发布动态
const createMoment = async (req, res) => {
  try {
    const { pet_id, content, image } = req.body;
    const userId = req.userId;

    if (!content) {
      return res.status(400).json(errorResponse(400, '缺少必要参数'));
    }

    const connection = await pool.getConnection();

    try {
      const [result] = await connection.query(
        'INSERT INTO moments (user_id, pet_id, content, image) VALUES (?, ?, ?, ?)',
        [userId, pet_id || null, content, image]
      );

      const momentId = result.insertId;

      const [moments] = await connection.query(
        `SELECT m.id, m.user_id, m.pet_id, m.content, m.image, m.likes_count, m.comments_count, m.created_at,
                u.username, u.avatar, p.name as pet_name
         FROM moments m
         JOIN users u ON m.user_id = u.id
         LEFT JOIN pets p ON m.pet_id = p.id
         WHERE m.id = ?`,
        [momentId]
      );

      const m = moments[0];
      res.json(successResponse({
        id: m.id,
        user: {
          id: m.user_id,
          username: m.username,
          avatar: m.avatar
        },
        pet: m.pet_id ? {
          id: m.pet_id,
          name: m.pet_name
        } : null,
        content: m.content,
        image: m.image,
        likes_count: m.likes_count,
        comments_count: m.comments_count,
        is_liked: false,
        created_at: m.created_at
      }, '动态发布成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 删除动态
const deleteMoment = async (req, res) => {
  try {
    const { momentId } = req.params;
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      const [moments] = await connection.query(
        'SELECT id FROM moments WHERE id = ? AND user_id = ?',
        [momentId, userId]
      );

      if (moments.length === 0) {
        return res.status(404).json(errorResponse(404, '动态不存在'));
      }

      await connection.query('DELETE FROM moments WHERE id = ?', [momentId]);

      res.json(successResponse(null, '动态删除成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 点赞动态
const likeMoment = async (req, res) => {
  try {
    const { momentId } = req.params;
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      // 检查是否已点赞
      const [existingLike] = await connection.query(
        'SELECT id FROM likes WHERE user_id = ? AND moment_id = ?',
        [userId, momentId]
      );

      if (existingLike.length > 0) {
        return res.status(400).json(errorResponse(400, '已经点赞过了'));
      }

      await connection.query(
        'INSERT INTO likes (user_id, moment_id) VALUES (?, ?)',
        [userId, momentId]
      );

      await connection.query(
        'UPDATE moments SET likes_count = likes_count + 1 WHERE id = ?',
        [momentId]
      );

      const [moments] = await connection.query(
        'SELECT likes_count FROM moments WHERE id = ?',
        [momentId]
      );

      res.json(successResponse({
        likes_count: moments[0].likes_count
      }, '点赞成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 取消点赞
const unlikeMoment = async (req, res) => {
  try {
    const { momentId } = req.params;
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      const [existingLike] = await connection.query(
        'SELECT id FROM likes WHERE user_id = ? AND moment_id = ?',
        [userId, momentId]
      );

      if (existingLike.length === 0) {
        return res.status(400).json(errorResponse(400, '未点赞'));
      }

      await connection.query(
        'DELETE FROM likes WHERE user_id = ? AND moment_id = ?',
        [userId, momentId]
      );

      await connection.query(
        'UPDATE moments SET likes_count = likes_count - 1 WHERE id = ?',
        [momentId]
      );

      const [moments] = await connection.query(
        'SELECT likes_count FROM moments WHERE id = ?',
        [momentId]
      );

      res.json(successResponse({
        likes_count: moments[0].likes_count
      }, '取消点赞成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

module.exports = {
  getMoments,
  createMoment,
  deleteMoment,
  likeMoment,
  unlikeMoment
};

