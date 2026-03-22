const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// 获取宠物喂养记录
const getFeedingRecords = async (req, res) => {
  try {
    const { petId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const userId = req.userId;
    const offset = (page - 1) * pageSize;

    const connection = await pool.getConnection();

    try {
      // 检查宠物是否属于当前用户
      const [pets] = await connection.query(
        'SELECT id FROM pets WHERE id = ? AND user_id = ?',
        [petId, userId]
      );

      if (pets.length === 0) {
        return res.status(404).json(errorResponse(404, '宠物不存在'));
      }

      const [records] = await connection.query(
        `SELECT id, pet_id, type, food_name, amount, notes, created_at
         FROM feeding_records
         WHERE pet_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [petId, pageSize, offset]
      );

      const [countResult] = await connection.query(
        'SELECT COUNT(*) as total FROM feeding_records WHERE pet_id = ?',
        [petId]
      );
      const total = countResult[0].total;

      res.json(successResponse({
        total,
        page,
        pageSize,
        items: records
      }));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 添加喂养记录
const addFeedingRecord = async (req, res) => {
  try {
    const { petId } = req.params;
    const { type, food_name, amount, notes } = req.body;
    const userId = req.userId;

    if (!type || !amount) {
      return res.status(400).json(errorResponse(400, '缺少必要参数'));
    }

    const connection = await pool.getConnection();

    try {
      // 检查宠物是否属于当前用户
      const [pets] = await connection.query(
        'SELECT id FROM pets WHERE id = ? AND user_id = ?',
        [petId, userId]
      );

      if (pets.length === 0) {
        return res.status(404).json(errorResponse(404, '宠物不存在'));
      }

      const [result] = await connection.query(
        'INSERT INTO feeding_records (pet_id, user_id, type, food_name, amount, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [petId, userId, type, food_name, amount, notes]
      );

      res.json(successResponse({
        id: result.insertId,
        pet_id: petId,
        type,
        food_name,
        amount,
        notes,
        created_at: new Date()
      }, '记录添加成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 获取今日喂养统计
const getTodayFeedingRecords = async (req, res) => {
  try {
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      const [records] = await connection.query(
        `SELECT fr.id, fr.pet_id, p.name as pet_name, fr.type, fr.food_name, fr.amount, fr.created_at
         FROM feeding_records fr
         JOIN pets p ON fr.pet_id = p.id
         WHERE fr.user_id = ? AND DATE(fr.created_at) = CURDATE()
         ORDER BY fr.created_at DESC`,
        [userId]
      );

      // 按宠物分组
      const groupedRecords = {};
      records.forEach(record => {
        if (!groupedRecords[record.pet_id]) {
          groupedRecords[record.pet_id] = {
            pet_id: record.pet_id,
            pet_name: record.pet_name,
            records: []
          };
        }
        groupedRecords[record.pet_id].records.push({
          id: record.id,
          type: record.type,
          food_name: record.food_name,
          amount: record.amount,
          created_at: record.created_at
        });
      });

      res.json(successResponse(Object.values(groupedRecords)));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

module.exports = {
  getFeedingRecords,
  addFeedingRecord,
  getTodayFeedingRecords
};

