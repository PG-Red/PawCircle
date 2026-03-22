require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const petRoutes = require('./routes/petRoutes');
const momentRoutes = require('./routes/momentRoutes');
const feedingRoutes = require('./routes/feedingRoutes');
const listingRoutes = require('./routes/listingRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 路由挂载
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/moments', momentRoutes);
app.use('/api/feeding-records', feedingRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/ai', aiRoutes);

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
  console.error(err.stack);
  res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
});

app.listen(PORT, () => {
  console.log(`PawCircle 后端服务已启动，端口: ${PORT}`);
  console.log(`API 地址: http://localhost:${PORT}/api`);
});

module.exports = app;

