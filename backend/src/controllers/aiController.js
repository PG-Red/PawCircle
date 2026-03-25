const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// 懒加载，避免启动时因环境变量未加载而报错
function getAIClient() {
  const OpenAI = require('openai');
  return new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY || 'sk-05af025bf26d420e9d115f3442e8ca19',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  });
}

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
        convId = crypto.randomUUID();
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

      // 调用阿里云百炼 API
      let aiResponse;
      try {
        const openai = getAIClient();
        const completion = await openai.chat.completions.create({
          model: 'qwen-plus',
          messages: [
            {
              role: 'system',
              content: '你是一名专业的宠物专家，负责回答用户关于宠物护理、健康、行为训练等问题。你的回答应该专业、友好且易于理解。请使用中文回答。'
            },
            {
              role: 'user',
              content: message
            }
          ]
        });
        aiResponse = completion.choices[0]?.message?.content || '抱歉，我现在无法回答这个问题。';
      } catch (aiError) {
        console.error('百炼 API Error:', aiError);
        aiResponse = '抱歉，AI 助手暂时不可用，请稍后再试。';
      }

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
