# PawCircle 前端项目文档

## 项目概述

PawCircle 是一个宠物社交平台的前端应用，基于 Vue 3 + TypeScript + Element Plus 构建。用户可以分享宠物动态、管理宠物档案、记录喂养信息、进行宠物交易，并获得 AI 宠物助手的建议。

---

## 项目结构

```
frontend/
├── src/
│   ├── views/                    # 页面组件
│   │   ├── Auth.vue             # 登录/注册页面
│   │   ├── Home.vue             # 首页（PawTrace - 朋友圈）
│   │   ├── Profiles.vue         # 宠物档案页面
│   │   ├── Feeding.vue          # 喂养记录页面
│   │   ├── Trading.vue          # 宠物交易页面
│   │   └── AIAssistant.vue      # AI助手页面
│   ├── services/                 # API 服务层
│   │   └── api.ts               # 统一的 API 接口管理
│   ├── router/
│   │   └── index.ts             # 路由配置
│   ├── App.vue                  # 根组件
│   ├── main.ts                  # 应用入口
│   └── env.d.ts                 # 环境变量类型定义
├── package.json                 # 项目依赖
├── vite.config.ts               # Vite 配置
├── tsconfig.json                # TypeScript 配置
└── README.md                    # 项目说明
```

---

## 页面功能说明

### 1. 认证页面 (Auth.vue)
**路由**: `/auth`

**功能**:
- 用户登录
- 用户注册
- 邮箱验证码发送
- 表单验证

**关键接口**:
- `POST /auth/send-code` - 发送验证码
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录

**状态管理**:
- `isLogin` - 切换登录/注册模式
- `countdown` - 验证码倒计时
- `loginForm` - 登录表单数据
- `registerForm` - 注册表单数据

---

### 2. 首页 (Home.vue)
**路由**: `/`

**功能**:
- 显示宠物朋友圈动态列表
- 点赞、评论、分享动态
- 右侧推荐内容展示
- 每日宠物语录

**关键接口**:
- `GET /moments` - 获取动态列表
- `POST /moments/{momentId}/like` - 点赞
- `DELETE /moments/{momentId}/like` - 取消点赞
- `POST /moments/{momentId}/comments` - 发布评论

**组件特性**:
- 响应式布局（桌面端和移动端）
- 动态卡片展示
- 交互按钮（点赞、评论、分享）

---

### 3. 宠物档案页面 (Profiles.vue)
**路由**: `/profiles`

**功能**:
- 显示用户的所有宠物
- 添加新宠物
- 编辑宠物信息
- 查看宠物详情
- 删除宠物

**关键接口**:
- `GET /pets` - 获取宠物列表
- `POST /pets` - 添加宠物
- `PUT /pets/{petId}` - 编辑宠物
- `DELETE /pets/{petId}` - 删除宠物

**组件特性**:
- 宠物卡片网格布局
- 性别徽章显示
- 悬停效果

---

### 4. 喂养记录页面 (Feeding.vue)
**路由**: `/feeding`

**功能**:
- 日历视图显示喂养记录
- 查看最近的喂养记录
- 添加新的喂养记录
- 打卡功能

**关键接口**:
- `GET /pets/{petId}/feeding-records` - 获取喂养记录
- `POST /pets/{petId}/feeding-records` - 添加喂养记录
- `GET /feeding-records/today` - 获取今日统计

**组件特性**:
- Element Plus 日历组件
- 记录列表展示
- 打卡按钮

---

### 5. 宠物交易页面 (Trading.vue)
**路由**: `/trading`

**功能**:
- 浏览宠物交易列表
- 按分类筛选（狗、猫、其他）
- 搜索宠物
- 查看交易详情
- 联系卖家

**关键接口**:
- `GET /listings` - 获取交易列表
- `GET /listings/{listingId}` - 获取交易详情
- `POST /listings` - 发布交易
- `PUT /listings/{listingId}` - 编辑交易
- `DELETE /listings/{listingId}` - 删除交易

**组件特性**:
- 分类筛选
- 搜索功能
- 详情展开/收起
- 价格标签

---

### 6. AI 助手页面 (AIAssistant.vue)
**路由**: `/ai-assistant`

**功能**:
- 与 AI 进行对话
- 显示对话历史
- 建议标签快速提问
- 实时消息流

**关键接口**:
- `POST /ai/chat` - 发送消息
- `GET /ai/conversations/{conversationId}` - 获取对话历史

**组件特性**:
- 聊天气泡样式
- Markdown 渲染
- 打字动画
- 建议标签

---

## 导航结构

### 桌面端导航
- 顶部固定导航栏
- Logo 和品牌名称
- 主菜单项：PawTrace、宠物档案、喂养记录、宠物交易、AI助手
- 用户头像下拉菜单

### 移动端导航
- 底部固定标签栏
- 5 个主要功能的快速访问
- 图标 + 文字标签

---

## 核心功能模块

### 认证模块
- 邮箱验证码验证
- JWT Token 管理
- 自动登录重定向
- 登出功能

### 动态模块
- 发布动态
- 浏览动态流
- 点赞/取消点赞
- 评论功能
- 删除动态

### 宠物管理模块
- 宠物档案 CRUD
- 宠物信息展示
- 宠物分类

### 喂养记录模块
- 记录添加
- 日历视图
- 统计展示
- 打卡功能

### 交易模块
- 交易列表浏览
- 分类和搜索
- 交易发布
- 交易管理

### AI 助手模块
- 实时对话
- 对话历史
- Markdown 支持
- 建议标签

---

## 技术栈

### 核心框架
- **Vue 3** - 前端框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具

### UI 组件库
- **Element Plus** - UI 组件库
- **Element Plus Icons** - 图标库

### 工具库
- **Vue Router** - 路由管理
- **Pinia** - 状态管理（可选）
- **Marked** - Markdown 解析
- **DOMPurify** - HTML 清理
- **Google GenAI** - AI 集成

### 样式
- **Tailwind CSS** - 工具类样式
- **CSS Variables** - 主题变量

---

## 环境变量配置

创建 `.env` 文件：

```env
VITE_API_URL=http://localhost:8080/api
GEMINI_API_KEY=your_gemini_api_key
```

---

## 开发指南

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

访问 `http://localhost:3000`

### 构建生产版本
```bash
npm run build
```

### 类型检查
```bash
npm run lint
```

---

## API 集成指南

### 使用 API 服务

所有 API 调用都通过 `src/services/api.ts` 进行：

```typescript
import { petApi, momentApi, authApi } from '@/services/api';

// 获取宠物列表
const pets = await petApi.getPets();

// 获取动态列表
const moments = await momentApi.getMoments(1, 10);

// 用户登录
const result = await authApi.login(email, password);
```

### 错误处理

API 服务会自动处理 401 错误（未授权），重定向到登录页面。

### Token 管理

Token 自动从 localStorage 读取并添加到请求头：

```
Authorization: Bearer {token}
```

---

## 样式系统

### CSS 变量

在 `App.vue` 中定义的主题变量：

```css
--primary-yellow: #FFD700
--dark-charcoal: #2C2C2C
--text-secondary: #666666
--bg-color: #F8F9FA
--card-bg: #FFFFFF
--pastel-green: #A8D5BA
--pastel-blue: #A8D5E2
--pastel-purple: #D4A5D4
--pastel-orange: #FFB88C
--border-radius-sm: 8px
--border-radius-md: 12px
--border-radius-lg: 16px
--border-radius-pill: 24px
```

### 响应式断点

- **xs**: < 576px (手机)
- **sm**: 576px - 768px (平板)
- **md**: 768px - 992px (小屏桌面)
- **lg**: > 992px (大屏桌面)

---

## 性能优化

### 路由懒加载
所有页面组件都使用动态导入：

```typescript
component: () => import('../views/Auth.vue')
```

### 图片优化
- 使用 `picsum.photos` 作为占位图
- 支持 `referrerPolicy="no-referrer"`

### 分页加载
- 列表接口支持分页
- 默认每页 10-20 条记录

---

## 浏览器兼容性

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

---

## 常见问题

### Q: 如何修改 API 地址？
A: 修改 `.env` 文件中的 `VITE_API_URL`

### Q: 如何添加新的 API 接口？
A: 在 `src/services/api.ts` 中添加新的方法

### Q: 如何修改主题颜色？
A: 修改 `App.vue` 中的 CSS 变量

### Q: 如何处理 API 错误？
A: 在组件中使用 try-catch 捕获错误

---

## 部署指南

### 构建
```bash
npm run build
```

### 部署到服务器
```bash
# 将 dist 文件夹上传到服务器
# 配置 Web 服务器（Nginx/Apache）指向 dist 文件夹
```

### Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/pawcircle/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 贡献指南

1. 创建功能分支
2. 提交更改
3. 创建 Pull Request
4. 代码审查
5. 合并到主分支

---

## 许可证

MIT

---

**文档版本**: 1.0  
**最后更新**: 2024年  
**维护者**: 前端团队

