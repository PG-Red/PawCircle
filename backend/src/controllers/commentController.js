const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// 获取动态评论
const getComments = async (req, res) => {
  try {
    const { momentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    const connection = await pool.getConnection();

    try {
      const [comments] = await connection.query(
        `SELECT c.id, c.user_id, c.content, c.created_at, u.username, u.avatar
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.moment_id = ?
         ORDER BY c.created_at ASC
         LIMIT ? OFFSET ?`,
        [momentId, pageSize, offset]
      );

      const [countResult] = await connection.query(
        'SELECT COUNT(*) as total FROM comments WHERE moment_id = ?',
        [momentId]
      );
      const total = countResult[0].total;

      const formattedComments = comments.map(c => ({
        id: c.id,
        user: {
          id: c.user_id,
          username: c.username,
          avatar: c.avatar
        },
        content: c.content,
        created_at: c.created_at
      }));

      res.json(successResponse({
        total,
        page,
        pageSize,
        items: formattedComments
      }));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 发布评论
const createComment = async (req, res) => {
  try {
    const { momentId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!content) {
      return res.status(400).json(errorResponse(400, '缺少必要参数'));
    }

    const connection = await pool.getConnection();

    try {
      const [result] = await connection.query(
        'INSERT INTO comments (user_id, moment_id, content) VALUES (?, ?, ?)',
        [userId, momentId, content]
      );

      await connection.query(
        'UPDATE moments SET comments_count = comments_count + 1 WHERE id = ?',
        [momentId]
      );

      const [comments] = await connection.query(
        `SELECT c.id, c.user_id, c.content, c.created_at, u.username, u.avatar
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`,
        [result.insertId]
      );

      const c = comments[0];
      res.json(successResponse({
        id: c.id,
        user: {
          id: c.user_id,
          username: c.username,
          avatar: c.avatar
        },
        content: c.content,
        created_at: c.created_at
      }, '评论成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 删除评论
const deleteComment = async (req, res) => {
  try {
    const { momentId, commentId } = req.params;
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      const [comments] = await connection.query(
        'SELECT id FROM comments WHERE id = ? AND user_id = ?',
        [commentId, userId]
      );

      if (comments.length === 0) {
        return res.status(404).json(errorResponse(404, '评论不存在'));
      }

      await connection.query('DELETE FROM comments WHERE id = ?', [commentId]);

      await connection.query(
        'UPDATE moments SET comments_count = comments_count - 1 WHERE id = ?',
        [momentId]
      );

      res.json(successResponse(null, '评论删除成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

module.exports = {
  getComments,
  createComment,
  deleteComment
};

