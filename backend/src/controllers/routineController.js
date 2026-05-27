const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// 获取宠物的打卡活动
const getRoutines = async (req, res) => {
  try {
    const { petId } = req.params;
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      // 检查宠物是否属于该用户
      const [pets] = await connection.query(
        'SELECT id FROM pets WHERE id = ? AND user_id = ?',
        [petId, userId]
      );
      if (pets.length === 0) {
        return res.status(404).json(errorResponse(404, '宠物不存在'));
      }

      const { month } = req.query;
      let queryStr = 'SELECT id, pet_id, task_type, title, DATE_FORMAT(task_time, "%H:%i") as task_time, frequency_type, frequency_value, DATE_FORMAT(start_date, "%Y-%m-%d") as start_date, DATE_FORMAT(end_date, "%Y-%m-%d") as end_date, created_at FROM pet_routines WHERE pet_id = ?';
      let queryParams = [petId];

      if (month) {
        // 如果是单次任务，必须在这个月；如果是其他规律任务（包括 daily 和 interval），都返回交给前端按具体日期判断
        queryStr += ' AND (frequency_type != "once" OR frequency_value LIKE ?)';
        queryParams.push(month + '%');
      }

      queryStr += ' ORDER BY task_time ASC';

      const [routines] = await connection.query(queryStr, queryParams);

      res.json(successResponse(routines));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 添加宠物规律
const addRoutine = async (req, res) => {
  try {
    const { petId } = req.params;
    const { task_type, title, task_time, frequency_type, frequency_value, start_date, end_date } = req.body;
    const userId = req.userId;

    if (!task_type || !title || !task_time) {
      return res.status(400).json(errorResponse(400, '缺少必要参数'));
    }

    const connection = await pool.getConnection();

    try {
      const [pets] = await connection.query(
        'SELECT id FROM pets WHERE id = ? AND user_id = ?',
        [petId, userId]
      );
      if (pets.length === 0) {
        return res.status(404).json(errorResponse(404, '宠物不存在'));
      }

      const [result] = await connection.query(
        'INSERT INTO pet_routines (pet_id, task_type, title, task_time, frequency_type, frequency_value, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [petId, task_type, title, task_time, frequency_type || 'daily', frequency_value || '1,2,3,4,5,6,7', start_date || null, end_date || null]
      );

      res.json(successResponse({
        id: result.insertId,
        pet_id: petId,
        task_type,
        title,
        task_time,
        frequency_type: frequency_type || 'daily',
        frequency_value: frequency_value || '1,2,3,4,5,6,7',
        start_date: start_date || null,
        end_date: end_date || null,
        created_at: new Date()
      }, '规律添加成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('addRoutine error:', error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 修改宠物规律
const updateRoutine = async (req, res) => {
  try {
    const { petId, routineId } = req.params;
    const userId = req.userId;
    const { task_type, title, task_time, frequency_type, frequency_value, start_date, end_date } = req.body;
    
    if (!task_type || !title || !task_time) {
      console.log('updateRoutine missing fields:', { task_type, title, task_time });
      return res.status(400).json(errorResponse(400, '缺少必填字段'));
    }

    const connection = await pool.getConnection();

    try {
      const [pets] = await connection.query(
        'SELECT id FROM pets WHERE id = ? AND user_id = ?',
        [petId, userId]
      );
      if (pets.length === 0) {
        return res.status(404).json(errorResponse(404, '宠物不存在'));
      }

      await connection.query(
        'UPDATE pet_routines SET task_type = ?, title = ?, task_time = ?, frequency_type = ?, frequency_value = ?, start_date = ?, end_date = ? WHERE id = ? AND pet_id = ?',
        [task_type, title, task_time, frequency_type || 'daily', frequency_value || '1,2,3,4,5,6,7', start_date || null, end_date || null, routineId, petId]
      );

      res.json(successResponse(null, '规律修改成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('updateRoutine error:', error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 删除宠物规律
const deleteRoutine = async (req, res) => {
  try {
    const { petId, routineId } = req.params;
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

      await connection.query('DELETE FROM pet_routines WHERE id = ? AND pet_id = ?', [routineId, petId]);
      res.json(successResponse(null, '规律删除成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 获取特定时间段的打卡记录
const getRoutineRecords = async (req, res) => {
  try {
    const { petId } = req.params;
    const { startDate, endDate } = req.query; // YYYY-MM-DD
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

      let query = 'SELECT id, routine_id, pet_id, DATE_FORMAT(record_date, "%Y-%m-%d") as record_date, completed_at FROM pet_routine_records WHERE pet_id = ?';
      let params = [petId];

      if (startDate && endDate) {
        query += ' AND record_date BETWEEN ? AND ?';
        params.push(startDate, endDate);
      } else if (startDate) {
        query += ' AND record_date = ?';
        params.push(startDate);
      }

      const [records] = await connection.query(query, params);
      res.json(successResponse(records));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 切换打卡状态
const toggleRoutineRecord = async (req, res) => {
  try {
    const { petId, routineId } = req.params;
    const { record_date, completed } = req.body; // record_date: YYYY-MM-DD, completed: boolean
    const userId = req.userId;

    if (!record_date) {
      return res.status(400).json(errorResponse(400, '缺少必要参数 record_date'));
    }

    const connection = await pool.getConnection();

    try {
      const [pets] = await connection.query(
        'SELECT id FROM pets WHERE id = ? AND user_id = ?',
        [petId, userId]
      );
      if (pets.length === 0) {
        return res.status(404).json(errorResponse(404, '宠物不存在'));
      }

      if (completed) {
        // 打卡
        await connection.query(
          'INSERT IGNORE INTO pet_routine_records (routine_id, pet_id, record_date) VALUES (?, ?, ?)',
          [routineId, petId, record_date]
        );
      } else {
        // 取消打卡
        await connection.query(
          'DELETE FROM pet_routine_records WHERE routine_id = ? AND pet_id = ? AND record_date = ?',
          [routineId, petId, record_date]
        );
      }

      res.json(successResponse(null, completed ? '打卡成功' : '已取消打卡'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

module.exports = {
  getRoutines,
  addRoutine,
  updateRoutine,
  deleteRoutine,
  getRoutineRecords,
  toggleRoutineRecord
};