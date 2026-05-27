const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const petRoutes = require('./routes/petRoutes');
const momentRoutes = require('./routes/momentRoutes');

const aiRoutes = require('./routes/aiRoutes');
const friendRoutes = require('./routes/friendRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

// 中间件
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((item) => item.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 路由挂载
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/moments', momentRoutes);

app.use('/api/ai', aiRoutes);
app.use('/api/social', friendRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'PawCircle API is running', data: null });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在', data: null });
});

// 全局错误处理
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ code: 413, message: '请求内容过大，图片请压缩后再发送', data: null });
  }
  console.error(err.stack);
  res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
});

app.listen(PORT, () => {
  console.log(`PawCircle 后端服务已启动，端口: ${PORT}`);
  console.log(`API 地址: http://localhost:${PORT}/api`);
});

module.exports = app;


