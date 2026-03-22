const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// 获取用户的所有宠物
const getPets = async (req, res) => {
  try {
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      const [pets] = await connection.query(
        'SELECT id, name, breed, gender, birthday, image, description, created_at FROM pets WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      res.json(successResponse(pets));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 获取单个宠物详情
const getPetById = async (req, res) => {
  try {
    const { petId } = req.params;
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      const [pets] = await connection.query(
        'SELECT id, name, breed, gender, birthday, image, description, created_at FROM pets WHERE id = ? AND user_id = ?',
        [petId, userId]
      );

      if (pets.length === 0) {
        return res.status(404).json(errorResponse(404, '宠物不存在'));
      }

      res.json(successResponse(pets[0]));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 添加宠物
const addPet = async (req, res) => {
  try {
    const { name, breed, gender, birthday, image, description } = req.body;
    const userId = req.userId;

    if (!name || !breed || !gender || !birthday) {
      return res.status(400).json(errorResponse(400, '缺少必要参数'));
    }

    const connection = await pool.getConnection();

    try {
      const [result] = await connection.query(
        'INSERT INTO pets (user_id, name, breed, gender, birthday, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, name, breed, gender, birthday, image, description]
      );

      res.json(successResponse({
        id: result.insertId,
        name,
        breed,
        gender,
        birthday,
        image,
        description
      }, '宠物添加成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 编辑宠物信息
const updatePet = async (req, res) => {
  try {
    const { petId } = req.params;
    const { name, breed, gender, birthday, image, description } = req.body;
    const userId = req.userId;

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

      await connection.query(
        'UPDATE pets SET name = ?, breed = ?, gender = ?, birthday = ?, image = ?, description = ? WHERE id = ?',
        [name, breed, gender, birthday, image, description, petId]
      );

      res.json(successResponse({
        id: petId,
        name,
        breed,
        gender,
        birthday,
        image,
        description
      }, '宠物更新成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 删除宠物
const deletePet = async (req, res) => {
  try {
    const { petId } = req.params;
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      const [pets] = await connection.query(
        'SELECT id FROM pets WHERE id = ? AND user_id = ?',
        [petId, userId]
      );

      if (pets.length === 0) {
        return res.status(404).json(errorResponse(404, '宠物不存在'));
      }

      await connection.query('DELETE FROM pets WHERE id = ?', [petId]);

      res.json(successResponse(null, '宠物删除成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

module.exports = {
  getPets,
  getPetById,
  addPet,
  updatePet,
  deletePet
};

