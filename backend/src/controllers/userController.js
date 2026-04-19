const pool = require('../config/database');
const { successResponse, errorResponse, hashPassword, comparePassword } = require('../utils/helpers');

const buildFriendStatus = async (connection, viewerId, targetUserId) => {
  if (!viewerId) return 'none';
  if (Number(viewerId) === Number(targetUserId)) return 'self';

  const [friends] = await connection.query(
    'SELECT id FROM friends WHERE user_id = ? AND friend_id = ? LIMIT 1',
    [viewerId, targetUserId]
  );
  if (friends.length > 0) return 'friends';

  const [sentPending] = await connection.query(
    "SELECT id FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = 'pending' LIMIT 1",
    [viewerId, targetUserId]
  );
  if (sentPending.length > 0) return 'pending_sent';

  const [receivedPending] = await connection.query(
    "SELECT id FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = 'pending' LIMIT 1",
    [targetUserId, viewerId]
  );
  if (receivedPending.length > 0) return 'pending_received';

  return 'none';
};

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.query(
        'SELECT id, username, email, avatar, bio, show_pets_public, show_pet_details_public, allow_friend_request, chat_permission, created_at FROM users WHERE id = ?',
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
    console.error('getCurrentUser error:', error.message, error.code, error.sqlMessage);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 更新用户信息
const updateUser = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      username,
      avatar,
      bio,
      show_pets_public,
      show_pet_details_public,
      allow_friend_request,
      chat_permission
    } = req.body;
    const connection = await pool.getConnection();

    try {
      const [existingRows] = await connection.query(
        'SELECT username, avatar, bio, show_pets_public, show_pet_details_public, allow_friend_request, chat_permission FROM users WHERE id = ?',
        [userId]
      );

      if (existingRows.length === 0) {
        return res.status(404).json(errorResponse(404, '用户不存在'));
      }

      const existing = existingRows[0];
      const nextUsername = username ?? existing.username;
      const nextAvatar = avatar ?? existing.avatar;
      const nextBio = bio ?? existing.bio;
      const nextShowPetsPublic = show_pets_public === undefined
        ? existing.show_pets_public
        : (show_pets_public ? 1 : 0);
      const nextShowPetDetailsPublic = show_pet_details_public === undefined
        ? existing.show_pet_details_public
        : (show_pet_details_public ? 1 : 0);
      const nextAllowFriendRequest = allow_friend_request === undefined
        ? existing.allow_friend_request
        : (allow_friend_request ? 1 : 0);
      const validChatPermissions = ['all', 'friends_only', 'none'];
      const nextChatPermission = (chat_permission && validChatPermissions.includes(chat_permission))
        ? chat_permission
        : existing.chat_permission;

      await connection.query(
        `UPDATE users
         SET username = ?,
             avatar = ?,
             bio = ?,
             show_pets_public = ?,
             show_pet_details_public = ?,
             allow_friend_request = ?,
             chat_permission = ?
         WHERE id = ?`,
        [
          nextUsername,
          nextAvatar,
          nextBio,
          nextShowPetsPublic,
          nextShowPetDetailsPublic,
          nextAllowFriendRequest,
          nextChatPermission,
          userId
        ]
      );

      const [users] = await connection.query(
        'SELECT id, username, email, avatar, bio, show_pets_public, show_pet_details_public, allow_friend_request, chat_permission, created_at FROM users WHERE id = ?',
        [userId]
      );

      res.json(successResponse(users[0], '用户信息更新成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('updateUser error:', error.message, error.code);
    res.status(500).json(errorResponse(500, '服务器错误: ' + error.message));
  }
};

// 获取指定用户公开资料
const getPublicUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.userId || null;
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.query(
        'SELECT id, username, avatar, bio, show_pets_public, show_pet_details_public, created_at FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json(errorResponse(404, '用户不存在'));
      }

      const user = users[0];
      let pets = [];

      if (user.show_pets_public) {
        if (user.show_pet_details_public) {
          const [petRows] = await connection.query(
            'SELECT id, name, breed, gender, birthday, image, description, created_at FROM pets WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
          );
          pets = petRows;
        } else {
          const [petRows] = await connection.query(
            'SELECT id, name, image FROM pets WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
          );
          pets = petRows;
        }
      }

      const friendStatus = await buildFriendStatus(connection, viewerId, user.id);

      res.json(successResponse({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        created_at: user.created_at,
        show_pets_public: !!user.show_pets_public,
        show_pet_details_public: !!user.show_pet_details_public,
        friend_status: friendStatus,
        pets,
      }));
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
  getPublicUserProfile,
  changePassword
};
