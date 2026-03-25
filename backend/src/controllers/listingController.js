const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// 获取交易列表
const getListings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 12;
    const category = req.query.category || 'all';
    const search = req.query.search || '';
    const offset = (page - 1) * pageSize;

    const connection = await pool.getConnection();

    try {
      let query = `SELECT pl.id, pl.seller_id, pl.title, pl.category, pl.description, pl.price, pl.image, pl.location, pl.status, pl.created_at,
                          u.username, u.avatar
                   FROM pet_listings pl
                   JOIN users u ON pl.seller_id = u.id
                   WHERE pl.status = 'active'`;
      const params = [];

      if (category !== 'all') {
        query += ' AND pl.category = ?';
        params.push(category);
      }

      if (search) {
        query += ' AND (pl.title LIKE ? OR pl.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ' ORDER BY pl.created_at DESC LIMIT ? OFFSET ?';
      params.push(pageSize, offset);

      const [listings] = await connection.query(query, params);

      // 获取总数
      let countQuery = 'SELECT COUNT(*) as total FROM pet_listings WHERE status = "active"';
      const countParams = [];

      if (category !== 'all') {
        countQuery += ' AND category = ?';
        countParams.push(category);
      }

      if (search) {
        countQuery += ' AND (title LIKE ? OR description LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`);
      }

      const [countResult] = await connection.query(countQuery, countParams);
      const total = countResult[0].total;

      const formattedListings = listings.map(l => ({
        id: l.id,
        seller: {
          id: l.seller_id,
          username: l.username,
          avatar: l.avatar
        },
        title: l.title,
        category: l.category,
        description: l.description,
        price: l.price,
        image: l.image,
        location: l.location,
        status: l.status,
        created_at: l.created_at
      }));

      res.json(successResponse({
        total,
        page,
        pageSize,
        items: formattedListings
      }));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 获取交易详情
const getListingById = async (req, res) => {
  try {
    const { listingId } = req.params;
    const connection = await pool.getConnection();

    try {
      const [listings] = await connection.query(
        `SELECT pl.id, pl.seller_id, pl.title, pl.category, pl.description, pl.price, pl.image, pl.location, pl.status, pl.created_at,
                u.id as user_id, u.username, u.avatar, u.email
         FROM pet_listings pl
         JOIN users u ON pl.seller_id = u.id
         WHERE pl.id = ?`,
        [listingId]
      );

      if (listings.length === 0) {
        return res.status(404).json(errorResponse(404, '交易不存在'));
      }

      const l = listings[0];
      res.json(successResponse({
        id: l.id,
        seller: {
          id: l.user_id,
          username: l.username,
          avatar: l.avatar,
          email: l.email
        },
        title: l.title,
        category: l.category,
        description: l.description,
        price: l.price,
        image: l.image,
        location: l.location,
        status: l.status,
        created_at: l.created_at
      }));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 发布交易
const createListing = async (req, res) => {
  try {
    const { title, category, description, price, image, location } = req.body;
    const userId = req.userId;

    if (!title || !category || !description || !price || !location) {
      return res.status(400).json(errorResponse(400, '缺少必要参数'));
    }

    const connection = await pool.getConnection();

    try {
      const [result] = await connection.query(
        'INSERT INTO pet_listings (seller_id, title, category, description, price, image, location) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, title, category, description, price, image, location]
      );

      const [listings] = await connection.query(
        `SELECT pl.id, pl.seller_id, pl.title, pl.category, pl.description, pl.price, pl.image, pl.location, pl.status, pl.created_at,
                u.username, u.avatar
         FROM pet_listings pl
         JOIN users u ON pl.seller_id = u.id
         WHERE pl.id = ?`,
        [result.insertId]
      );

      const l = listings[0];
      res.json(successResponse({
        id: l.id,
        seller: {
          id: l.seller_id,
          username: l.username,
          avatar: l.avatar
        },
        title: l.title,
        category: l.category,
        description: l.description,
        price: l.price,
        image: l.image,
        location: l.location,
        status: l.status,
        created_at: l.created_at
      }, '交易发布成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 编辑交易
const updateListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { title, category, description, price, image, location } = req.body;
    const userId = req.userId;

    const connection = await pool.getConnection();

    try {
      const [listings] = await connection.query(
        'SELECT id FROM pet_listings WHERE id = ? AND seller_id = ?',
        [listingId, userId]
      );

      if (listings.length === 0) {
        return res.status(404).json(errorResponse(404, '交易不存在'));
      }

      await connection.query(
        'UPDATE pet_listings SET title = ?, category = ?, description = ?, price = ?, image = ?, location = ? WHERE id = ?',
        [title, category, description, price, image, location, listingId]
      );

      res.json(successResponse({
        id: listingId,
        title,
        category,
        description,
        price,
        image,
        location
      }, '交易更新成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 删除交易
const deleteListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      const [listings] = await connection.query(
        'SELECT id FROM pet_listings WHERE id = ? AND seller_id = ?',
        [listingId, userId]
      );

      if (listings.length === 0) {
        return res.status(404).json(errorResponse(404, '交易不存在'));
      }

      await connection.query('DELETE FROM pet_listings WHERE id = ?', [listingId]);

      res.json(successResponse(null, '交易删除成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 标记交易为已售出
const markSold = async (req, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      const [listings] = await connection.query(
        'SELECT id FROM pet_listings WHERE id = ? AND seller_id = ?',
        [listingId, userId]
      );

      if (listings.length === 0) {
        return res.status(404).json(errorResponse(404, '交易不存在'));
      }

      await connection.query(
        'UPDATE pet_listings SET status = "sold" WHERE id = ?',
        [listingId]
      );

      res.json(successResponse({ status: 'sold' }, '状态更新成功'));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

module.exports = {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  markSold
};

