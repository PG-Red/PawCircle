const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');
const { v4: uuidv4 } = require('uuid');

// 发送消息到 AI 助手
const chatWithAI = async (req, res) => {
  try {
    const { message, conversation_id } = req.body;
    const userId = req.userId;

    if (!message) {
      return res.status(400).json(errorResponse(400, '缺少必要参数'));
    }

    const connection = await pool.getConnection();

    try {
      let convId = conversation_id;

      // 如果没有提供对话ID，创建新对话
      if (!convId) {
        convId = uuidv4();
        await connection.query(
          'INSERT INTO ai_conversations (id, user_id) VALUES (?, ?)',
          [convId, userId]
        );
      }

      // 保存用户消息
      await connection.query(
        'INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [convId, 'user', message]
      );

      // 这里应该调用真实的 AI API（如 Google Gemini）
      // 现在仅作演示，返回模拟响应
      const aiResponse = `感谢您的提问！关于"${message}"，我建议您查阅相关宠物护理指南。`;

      // 保存 AI 响应
      await connection.query(
        'INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [convId, 'ai', aiResponse]
      );

      res.json(successResponse({
        conversation_id: convId,
        response: aiResponse,
        timestamp: new Date()
      }));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

// 获取对话历史
const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      // 验证对话是否属于当前用户
      const [conversations] = await connection.query(
        'SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?',
        [conversationId, userId]
      );

      if (conversations.length === 0) {
        return res.status(404).json(errorResponse(404, '对话不存在'));
      }

      const [messages] = await connection.query(
        'SELECT role, content, created_at FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC',
        [conversationId]
      );

      const formattedMessages = messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.created_at
      }));

      res.json(successResponse({
        id: conversationId,
        messages: formattedMessages
      }));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse(500, '服务器错误'));
  }
};

module.exports = {
  chatWithAI,
  getConversation
};

