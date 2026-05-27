const pool = require('../config/database');
const { successResponse, errorResponse, hashPassword, comparePassword } = require('../utils/helpers');
const { validateVerificationCode, clearVerificationCode, ensureUserCode } = require('./authController');

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
        'SELECT id, user_code, username, email, avatar, bio, show_pets_public, show_pet_details_public, allow_friend_request, chat_permission, created_at FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json(errorResponse(404, '用户不存在'));
      }

      const user = users[0];
      user.user_code = await ensureUserCode(connection, user);

      res.json(successResponse(user));
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
        : (show_pets_public === true || show_pets_public === 'true' || show_pets_public === 1 || show_pets_public === '1' ? 1 : 0);
      const nextShowPetDetailsPublic = show_pet_details_public === undefined
        ? existing.show_pet_details_public
        : (show_pet_details_public === true || show_pet_details_public === 'true' || show_pet_details_public === 1 || show_pet_details_public === '1' ? 1 : 0);
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
        'SELECT id, user_code, username, email, avatar, bio, show_pets_public, show_pet_details_public, allow_friend_request, chat_permission, created_at FROM users WHERE id = ?',
        [userId]
      );

      const user = users[0];
      user.user_code = await ensureUserCode(connection, user);

      res.json(successResponse(user, '用户信息更新成功'));
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
        'SELECT id, user_code, username, avatar, bio, show_pets_public, show_pet_details_public, chat_permission, created_at FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json(errorResponse(404, '用户不存在'));
      }

      const user = users[0];
      user.user_code = await ensureUserCode(connection, user);
      let pets = [];


      const isPetsPublic = user.show_pets_public === 1 || user.show_pets_public === true || user.show_pets_public === '1' || (Buffer.isBuffer(user.show_pets_public) && user.show_pets_public[0] === 1);
      const isPetDetailsPublic = user.show_pet_details_public === 1 || user.show_pet_details_public === true || user.show_pet_details_public === '1' || (Buffer.isBuffer(user.show_pet_details_public) && user.show_pet_details_public[0] === 1);

      if (isPetsPublic) {
        if (isPetDetailsPublic) {
          const [petRows] = await connection.query(
            'SELECT id, name, breed, gender, birthday, image, description, created_at FROM pets WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
          );
          pets = petRows;
        } else {
          const [petRows] = await connection.query(
            'SELECT id, name, gender, image FROM pets WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
          );
          pets = petRows;
        }
      }

      const friendStatus = await buildFriendStatus(connection, viewerId, user.id);

      res.json(successResponse({
        id: user.id,
        user_code: user.user_code,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        created_at: user.created_at,
        show_pets_public: isPetsPublic,
        show_pet_details_public: isPetDetailsPublic,
        chat_permission: user.chat_permission,
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

// 通过邮箱验证码修改密码
const changePasswordByEmail = async (req, res) => {
  try {
    const userId = req.userId;
    const { code, new_password } = req.body;

    if (!code || !new_password) {
      return res.status(400).json(errorResponse(400, '缺少必要参数'));
    }

    const connection = await pool.getConnection();
    try {
      const [users] = await connection.query('SELECT email FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json(errorResponse(404, '用户不存在'));
      }

      const email = users[0].email;
      const codeError = validateVerificationCode('changePassword', email, code);
      if (codeError) {
        return res.status(400).json(errorResponse(400, codeError));
      }

      const hashedPassword = await hashPassword(new_password);
      await connection.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
      clearVerificationCode('changePassword', email);

      res.json(successResponse(null, '密码修改成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 搜索用户
const searchUsers = async (req, res) => {
  try {
    const { keyword, type } = req.query;
    if (!keyword) {
      return res.status(400).json(errorResponse(400, '请输入搜索关键词'));
    }

    const connection = await pool.getConnection();
    try {
      let query = '';
      let params = [];

      if (type === 'id') {
        // 搜索用户编号 (user_code)
        query = 'SELECT id, user_code, username, avatar, bio FROM users WHERE user_code = ?';
        params = [keyword];
      } else {
        // 搜索用户名 (username)
        query = 'SELECT id, user_code, username, avatar, bio FROM users WHERE username LIKE ? LIMIT 20';
        params = [`%${keyword}%`];
      }

      const [rows] = await connection.query(query, params);
      
      const viewerId = req.userId;
      const results = await Promise.all(rows.map(async (user) => {
        const friendStatus = await buildFriendStatus(connection, viewerId, user.id);
        // 确保 user_code 存在（如果是老账号可能为空，自动生成一个）
        const userCode = await ensureUserCode(connection, user);
        return { ...user, user_code: userCode, friend_status: friendStatus };
      }));

      res.json(successResponse(results));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('searchUsers error:', error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

module.exports = {
  getCurrentUser,
  updateUser,
  getPublicUserProfile,
  changePassword,
  changePasswordByEmail,
  searchUsers,
};

