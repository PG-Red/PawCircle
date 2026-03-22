# PawCircle 项目快速开始指南

## 📋 项目概述

PawCircle 是一个完整的宠物社交平台，包含前后端分离的架构。

- **前端**: Vue 3 + TypeScript + Element Plus
- **后端**: 需要实现（参考 BACKEND_REQUIREMENTS.md）
- **数据库**: MySQL 8.0+

---

## 🚀 快速开始

### 前端部分

#### 1. 安装依赖
```bash
cd frontend
npm install
```

#### 2. 配置环境变量
复制 `.env.example` 为 `.env`：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置后端 API 地址：
```env
VITE_API_URL=http://localhost:8080/api
GEMINI_API_KEY=your_gemini_api_key
```

#### 3. 启动开发服务器
```bash
npm run dev
```

访问 `http://localhost:3000`

#### 4. 构建生产版本
```bash
npm run build
```

---

## 📁 项目结构说明

### 前端目录结构
```
frontend/
├── src/
│   ├── views/              # 页面组件
│   │   ├── Auth.vue       # 登录/注册
│   │   ├── Home.vue       # 首页（朋友圈）
│   │   ├── Profiles.vue   # 宠物档案
│   │   ├── Feeding.vue    # 喂养记录
│   │   ├── Trading.vue    # 宠物交易
│   │   └── AIAssistant.vue # AI助手
│   ├── services/
│   │   └── api.ts         # API 接口管理
│   ├── router/
│   │   └── index.ts       # 路由配置
│   ├── App.vue            # 根组件
│   └── main.ts            # 入口文件
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🔧 后端部分

### 需要实现的内容

后端需要实现以下功能模块：

1. **认证模块**
   - 用户注册/登录
   - 邮箱验证码
   - JWT Token 管理

2. **宠物管理**
   - 宠物档案 CRUD
   - 宠物信息查询

3. **社交功能**
   - 动态发布/删除
   - 点赞/评论
   - 动态列表分页

4. **喂养记录**
   - 记录添加/查询
   - 日期统计

5. **交易功能**
   - 交易列表
   - 交易发布/编辑/删除
   - 分类和搜索

6. **AI 助手**
   - 对话接口
   - 对话历史

### 数据库设计

详见 `BACKEND_REQUIREMENTS.md` 中的数据库设计部分。

### API 接口规范

详见 `BACKEND_REQUIREMENTS.md` 中的 API 接口规范部分。

---

## 🎨 前端功能详解

### 1. 认证系统 (Auth.vue)

**功能**:
- 用户注册（需要邮箱验证码）
- 用户登录
- 自动重定向

**使用的 API**:
```typescript
// 发送验证码
await authApi.sendCode(email);

// 注册
await authApi.register(username, email, code, password);

// 登录
await authApi.login(email, password);
```

**Token 存储**:
- 登录成功后，Token 存储在 localStorage
- 每个请求自动添加 Authorization 头

---

### 2. 首页 (Home.vue)

**功能**:
- 显示宠物朋友圈动态
- 点赞、评论、分享
- 推荐内容展示

**使用的 API**:
```typescript
// 获取动态列表
const moments = await momentApi.getMoments(page, pageSize);

// 点赞
await likeApi.likeMoment(momentId);

// 取消点赞
await likeApi.unlikeMoment(momentId);

// 发布评论
await commentApi.createComment(momentId, content);
```

---

### 3. 宠物档案 (Profiles.vue)

**功能**:
- 显示用户的所有宠物
- 添加/编辑/删除宠物

**使用的 API**:
```typescript
// 获取宠物列表
const pets = await petApi.getPets();

// 添加宠物
await petApi.addPet(petData);

// 编辑宠物
await petApi.updatePet(petId, petData);

// 删除宠物
await petApi.deletePet(petId);
```

---

### 4. 喂养记录 (Feeding.vue)

**功能**:
- 日历视图显示喂养记录
- 添加喂养记录
- 打卡功能

**使用的 API**:
```typescript
// 获取喂养记录
const records = await feedingApi.getFeedingRecords(petId, page, pageSize);

// 添加喂养记录
await feedingApi.addFeedingRecord(petId, recordData);

// 获取今日统计
const todayFeeding = await feedingApi.getTodayFeeding();
```

---

### 5. 宠物交易 (Trading.vue)

**功能**:
- 浏览交易列表
- 分类筛选和搜索
- 查看交易详情

**使用的 API**:
```typescript
// 获取交易列表
const listings = await listingApi.getListings(page, pageSize, category, search);

// 获取交易详情
const listing = await listingApi.getListing(listingId);

// 发布交易
await listingApi.createListing(listingData);

// 编辑交易
await listingApi.updateListing(listingId, listingData);

// 删除交易
await listingApi.deleteListing(listingId);
```

---

### 6. AI 助手 (AIAssistant.vue)

**功能**:
- 与 AI 进行对话
- 显示对话历史
- 建议标签快速提问

**使用的 API**:
```typescript
// 发送消息
const response = await aiApi.sendMessage(message, conversationId);

// 获取对话历史
const conversation = await aiApi.getConversation(conversationId);
```

---

## 🔌 API 集成指南

### 添加新的 API 接口

在 `src/services/api.ts` 中添加：

```typescript
export const newApi = {
  // 获取数据
  getData() {
    return request<DataType>('GET', '/endpoint');
  },

  // 创建数据
  createData(data: any) {
    return request<DataType>('POST', '/endpoint', data);
  },

  // 更新数据
  updateData(id: number, data: any) {
    return request<DataType>('PUT', `/endpoint/${id}`, data);
  },

  // 删除数据
  deleteData(id: number) {
    return request<null>('DELETE', `/endpoint/${id}`);
  },
};
```

### 在组件中使用

```typescript
import { newApi } from '@/services/api';

// 在 setup 中使用
const data = ref([]);

onMounted(async () => {
  try {
    const response = await newApi.getData();
    data.value = response.data;
  } catch (error) {
    console.error('Error:', error);
  }
});
```

---

## 🎯 开发流程

### 1. 后端开发
- 实现数据库表
- 实现 API 接口
- 测试接口

### 2. 前端开发
- 更新 API 服务
- 实现页面组件
- 集成 API 调用

### 3. 测试
- 单元测试
- 集成测试
- 端到端测试

### 4. 部署
- 构建前端
- 部署到服务器
- 配置 CORS

---

## 🐛 常见问题

### Q: 前端无法连接到后端？
A: 检查 `.env` 中的 `VITE_API_URL` 是否正确，确保后端服务已启动。

### Q: Token 过期怎么办？
A: API 服务会自动检测 401 错误，重定向到登录页面。

### Q: 如何修改主题颜色？
A: 修改 `App.vue` 中的 CSS 变量。

### Q: 如何添加新的页面？
A: 
1. 在 `src/views/` 中创建新的 `.vue` 文件
2. 在 `src/router/index.ts` 中添加路由
3. 在 `App.vue` 中添加导航链接

---

## 📚 相关文档

- [后端需求文档](./BACKEND_REQUIREMENTS.md) - 详细的后端实现要求
- [前端文档](./FRONTEND_DOCUMENTATION.md) - 前端项目详细说明

---

## 🚢 部署指南

### 前端部署

#### 1. 构建
```bash
npm run build
```

#### 2. 上传到服务器
```bash
# 将 dist 文件夹上传到服务器
scp -r dist/ user@server:/var/www/pawcircle/
```

#### 3. 配置 Web 服务器

**Nginx 配置**:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/pawcircle/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 代理 API 请求到后端
    location /api/ {
        proxy_pass http://backend-server:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📞 支持

如有问题，请参考相关文档或联系开发团队。

---

**最后更新**: 2024年  
**版本**: 1.0

