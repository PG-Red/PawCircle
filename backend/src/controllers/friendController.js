const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

const getPendingRequests = async (req, res) => {
  try {
    const userId = req.userId;
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT fr.id, fr.message, fr.created_at,
                u.id AS sender_id, u.username AS sender_username, u.avatar AS sender_avatar
         FROM friend_requests fr
         JOIN users u ON fr.sender_id = u.id
         WHERE fr.receiver_id = ? AND fr.status = 'pending'
         ORDER BY fr.created_at DESC`,
        [userId]
      );

      res.json(successResponse(rows.map(r => ({
        id: r.id,
        message: r.message,
        created_at: r.created_at,
        sender: {
          id: r.sender_id,
          username: r.sender_username,
          avatar: r.sender_avatar,
        },
      }))));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.userId;
    const { receiver_id, message } = req.body;

    if (!receiver_id) {
      return res.status(400).json(errorResponse(400, '缺少接收方用户ID'));
    }

    if (Number(senderId) === Number(receiver_id)) {
      return res.status(400).json(errorResponse(400, '不能添加自己为好友'));
    }

    const connection = await pool.getConnection();
    try {
      const [receiverRows] = await connection.query(
        'SELECT id, allow_friend_request FROM users WHERE id = ?',
        [receiver_id]
      );
      if (receiverRows.length === 0) {
        return res.status(404).json(errorResponse(404, '目标用户不存在'));
      }

      if (!receiverRows[0].allow_friend_request) {
        return res.status(403).json(errorResponse(403, '对方已关闭好友申请'));
      }

      const [friendRows] = await connection.query(
        'SELECT id FROM friends WHERE user_id = ? AND friend_id = ? LIMIT 1',
        [senderId, receiver_id]
      );
      if (friendRows.length > 0) {
        return res.status(400).json(errorResponse(400, '你们已经是好友'));
      }

      const [pendingRows] = await connection.query(
        `SELECT id FROM friend_requests
         WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
         LIMIT 1`,
        [senderId, receiver_id]
      );
      if (pendingRows.length > 0) {
        return res.status(400).json(errorResponse(400, '好友申请已发送，请等待对方处理'));
      }

      const [reversePending] = await connection.query(
        `SELECT id FROM friend_requests
         WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
         LIMIT 1`,
        [receiver_id, senderId]
      );
      if (reversePending.length > 0) {
        return res.status(400).json(errorResponse(400, '对方已经向你发起申请，请先在申请列表处理'));
      }

      const [result] = await connection.query(
        'INSERT INTO friend_requests (sender_id, receiver_id, message) VALUES (?, ?, ?)',
        [senderId, receiver_id, message || null]
      );

      res.json(successResponse({ id: result.insertId }, '好友申请已发送'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { requestId } = req.params;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [requestRows] = await connection.query(
        `SELECT id, sender_id, receiver_id, status
         FROM friend_requests
         WHERE id = ? FOR UPDATE`,
        [requestId]
      );

      if (requestRows.length === 0) {
        await connection.rollback();
        return res.status(404).json(errorResponse(404, '好友申请不存在'));
      }

      const request = requestRows[0];
      if (Number(request.receiver_id) !== Number(userId)) {
        await connection.rollback();
        return res.status(403).json(errorResponse(403, '无权处理该申请'));
      }

      if (request.status !== 'pending') {
        await connection.rollback();
        return res.status(400).json(errorResponse(400, '该申请已处理'));
      }

      await connection.query(
        "UPDATE friend_requests SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [requestId]
      );

      await connection.query(
        'INSERT IGNORE INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)',
        [request.sender_id, request.receiver_id, request.receiver_id, request.sender_id]
      );

      await connection.commit();
      res.json(successResponse(null, '已同意好友申请'));
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

const rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { requestId } = req.params;
    const connection = await pool.getConnection();

    try {
      const [requestRows] = await connection.query(
        `SELECT id, receiver_id, status
         FROM friend_requests
         WHERE id = ?`,
        [requestId]
      );

      if (requestRows.length === 0) {
        return res.status(404).json(errorResponse(404, '好友申请不存在'));
      }

      const request = requestRows[0];
      if (Number(request.receiver_id) !== Number(userId)) {
        return res.status(403).json(errorResponse(403, '无权处理该申请'));
      }

      if (request.status !== 'pending') {
        return res.status(400).json(errorResponse(400, '该申请已处理'));
      }

      await connection.query(
        "UPDATE friend_requests SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [requestId]
      );

      res.json(successResponse(null, '已拒绝好友申请'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

const getFriends = async (req, res) => {
  try {
    const userId = req.userId;
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT u.id, u.username, u.avatar, u.bio,
                u.last_active_at,
                f.created_at AS friend_since,
                m.content AS last_message,
                m.created_at AS last_message_time,
                (CASE WHEN f.user_id IS NOT NULL THEN 1 ELSE 0 END) AS is_friend,
                (
                  SELECT COUNT(*)
                  FROM private_messages pm_unread
                  WHERE pm_unread.sender_id = u.id
                    AND pm_unread.receiver_id = ?
                    AND pm_unread.is_read = 0
                ) AS unread_count
         FROM users u
         LEFT JOIN friends f ON f.user_id = ? AND f.friend_id = u.id
         LEFT JOIN private_messages m ON m.id = (
           SELECT pm_last.id
           FROM private_messages pm_last
           WHERE ((pm_last.sender_id = ? AND pm_last.receiver_id = u.id)
               OR (pm_last.sender_id = u.id AND pm_last.receiver_id = ?))
           ORDER BY pm_last.created_at DESC
           LIMIT 1
         )
         WHERE u.id != ? AND (
           f.user_id IS NOT NULL 
           OR 
           m.id IS NOT NULL
         )
         ORDER BY COALESCE(m.created_at, f.created_at) DESC`,
        [userId, userId, userId, userId, userId]
      );
      res.json(successResponse(rows));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.userId;
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT u.id AS friend_id, u.username, u.avatar,
                m.content AS last_message,
                m.created_at AS last_message_time
         FROM friends f
         JOIN users u ON f.friend_id = u.id
         LEFT JOIN private_messages m ON m.id = (
           SELECT pm.id
           FROM private_messages pm
           WHERE ((pm.sender_id = ? AND pm.receiver_id = u.id)
               OR (pm.sender_id = u.id AND pm.receiver_id = ?))
           ORDER BY pm.created_at DESC
           LIMIT 1
         )
         WHERE f.user_id = ?
         ORDER BY COALESCE(m.created_at, f.created_at) DESC`,
        [userId, userId, userId]
      );

      res.json(successResponse(rows.map(r => ({
        friend: {
          id: r.friend_id,
          username: r.username,
          avatar: r.avatar,
        },
        last_message: r.last_message,
        last_message_time: r.last_message_time,
      }))));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

const getMessagesWithFriend = async (req, res) => {
  try {
    const userId = req.userId;
    const { friendId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 30;
    const offset = (page - 1) * pageSize;

    const connection = await pool.getConnection();
    try {
      await connection.query(
        `UPDATE private_messages
         SET is_read = 1
         WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`,
        [friendId, userId]
      );

      const [countRows] = await connection.query(
        `SELECT COUNT(*) AS total
         FROM private_messages
         WHERE (sender_id = ? AND receiver_id = ?)
            OR (sender_id = ? AND receiver_id = ?)`,
        [userId, friendId, friendId, userId]
      );

      const [rows] = await connection.query(
        `SELECT id, sender_id, receiver_id, content, image, is_read, created_at
         FROM private_messages
         WHERE (sender_id = ? AND receiver_id = ?)
            OR (sender_id = ? AND receiver_id = ?)
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, friendId, friendId, userId, pageSize, offset]
      );

      res.json(successResponse({
        total: countRows[0].total,
        page,
        pageSize,
        items: rows.map(r => ({
          ...r,
          is_read: r.is_read === 1 || r.is_read === true || (Buffer.isBuffer(r.is_read) && r.is_read[0] === 1) ? 1 : 0
        })).reverse(),
      }));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { friendId } = req.params;
    const connection = await pool.getConnection();
    try {
      await connection.query(
        `UPDATE private_messages
         SET is_read = 1
         WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`,
        [friendId, userId]
      );

      res.json(successResponse(null, '已标记为已读'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

const sendMessageToFriend = async (req, res) => {
  try {
    const userId = req.userId;
    const { friendId } = req.params;
    const { content, image } = req.body;

    if ((!content || !content.trim()) && !image) {
      return res.status(400).json(errorResponse(400, '消息内容不能为空'));
    }

    const connection = await pool.getConnection();
    try {
      // 查询接收方的私聊权限设置
      const [receiverSettingRows] = await connection.query(
        'SELECT chat_permission FROM users WHERE id = ?',
        [friendId]
      );
      if (receiverSettingRows.length === 0) {
        return res.status(404).json(errorResponse(404, '目标用户不存在'));
      }
      const chatPermission = receiverSettingRows[0].chat_permission;

      if (chatPermission === 'none') {
        return res.status(403).json(errorResponse(403, '对方已经关闭私聊回复'));
      }

      const [friendRows] = await connection.query(
        'SELECT id FROM friends WHERE user_id = ? AND friend_id = ? LIMIT 1',
        [userId, friendId]
      );
      const isFriend = friendRows.length > 0;

      // 如果不是好友，无论 chatPermission 是什么，都需要查询历史消息看是否有互动
      let sentCount = 0;
      let repliedCount = 0;
      
      if (!isFriend) {
        const [messages] = await connection.query(
          `SELECT sender_id, receiver_id 
           FROM private_messages 
           WHERE (sender_id = ? AND receiver_id = ?) 
              OR (sender_id = ? AND receiver_id = ?)
           ORDER BY created_at ASC`,
          [userId, friendId, friendId, userId]
        );

        for (const msg of messages) {
          if (msg.sender_id === userId) {
            sentCount++;
          } else if (msg.sender_id === Number(friendId)) {
            repliedCount++;
          }
        }
      }

      // 如果接收方设置为“仅好友”，拦截不是好友的情况
      // 但是豁免：如果对方已经回复过或者主动发过消息（repliedCount > 0），认为是已存在的临时会话，不屏蔽
      if (chatPermission === 'friends_only' && !isFriend && repliedCount === 0) {
        return res.status(403).json(errorResponse(403, '对方仅允许好友发送私信'));
      }

      // 好友消息限制 500 字，临时会话限制 150 字（宠物档案等结构化消息除外）
      const maxLength = isFriend ? 500 : 150;
      if (content && !content.startsWith('[pet_card]') && content.trim().length > maxLength) {
        return res.status(400).json(errorResponse(400, `消息长度不能超过${maxLength}字`));
      }
      
      // 如果不是好友，进行临时会话限制校验
      if (!isFriend) {
        // 如果发过消息，但对方还没回复，就不能再发了
        if (sentCount >= 1 && repliedCount === 0) {
          return res.status(403).json(errorResponse(403, '对方还不是您的好友。您已发送过临时消息，请等待对方回复后再继续发送。'));
        }
      }

      const [result] = await connection.query(
        'INSERT INTO private_messages (sender_id, receiver_id, content, image) VALUES (?, ?, ?, ?)',
        [userId, friendId, content ? content.trim() : null, image || null]
      );

      const [rows] = await connection.query(
        'SELECT id, sender_id, receiver_id, content, image, is_read, created_at FROM private_messages WHERE id = ?',
        [result.insertId]
      );

      const msg = rows[0];
      msg.is_read = msg.is_read === 1 || msg.is_read === true || (Buffer.isBuffer(msg.is_read) && msg.is_read[0] === 1) ? 1 : 0;

      res.json(successResponse(msg, '发送成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[sendMessageToFriend ERROR]', error);
    res.status(500).json(errorResponse(500, error.message || '服务器错误'));
  }
};

const getUnreadSummary = async (req, res) => {
  try {
    const userId = req.userId;
    const connection = await pool.getConnection();
    try {
      const [pendingRows] = await connection.query(
        "SELECT COUNT(*) AS count FROM friend_requests WHERE receiver_id = ? AND status = 'pending'",
        [userId]
      );
      const [unreadRows] = await connection.query(
        "SELECT COUNT(*) AS count FROM private_messages WHERE receiver_id = ? AND is_read = 0",
        [userId]
      );
      res.json(successResponse({
        pending_count: Number(pendingRows[0].count || 0),
        unread_count: Number(unreadRows[0].count || 0)
      }));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('获取未读汇总失败:', error);
    res.status(500).json(errorResponse(500, '服务器内部错误'));
  }
};

module.exports = {
  getUnreadSummary,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getConversations,
  getMessagesWithFriend,
  markMessagesAsRead,
  sendMessageToFriend,
};

