---
name: user-settings-social
overview: 在设置页面新增「私聊设置」和「好友设置」两个区块，延续现有公开设置的设计风格，并前后端完整联通。
todos:
  - id: db-fields
    content: 提供 users 表 ALTER TABLE 语句，新增 allow_friend_request 和 chat_permission 两个字段
    status: completed
  - id: backend-user-ctrl
    content: 修改 userController.js，在 getCurrentUser 和 updateUser 中加入两个新字段的读写
    status: completed
    dependencies:
      - db-fields
  - id: backend-friend-ctrl
    content: 修改 friendController.js，在 sendFriendRequest 和 sendMessageToFriend 中增加权限校验逻辑
    status: completed
    dependencies:
      - db-fields
  - id: frontend-settings
    content: 修改 UserSettings.vue，新增私聊设置（三选一卡片）和好友设置（开关）两个区块
    status: completed
    dependencies:
      - backend-user-ctrl
---

## 用户需求

在 `UserSettings.vue` 的"设置"页面中，按照与现有"公开设置"完全一致的卡片设计风格，新增两个设置区块，并实现前后端完整联通（包括数据库字段新增和行为控制）。

## 新增功能区块

### 私聊设置（CHAT SETTINGS）

- 标题卡片：介绍私聊权限的说明
- 「谁可以给我发私聊」：三选一，选项为 **所有人 / 仅好友 / 关闭**
- 以三个 `privacy-option` 卡片形式呈现，当前选中项高亮（active 状态），点击切换

### 好友设置（FRIEND SETTINGS）

- 标题卡片：介绍好友申请权限的说明
- 「允许好友申请」：开关，关闭后任何人无法向我发送好友申请

## 行为控制要求（前后端联通）

- `chat_permission` 字段实际控制 `sendMessageToFriend` 接口的发送权限
- `allow_friend_request` 字段实际控制 `sendFriendRequest` 接口是否能发出申请
- users 表新增两个字段并设置合理默认值

## 技术栈

沿用现有项目栈：Vue 3 + TypeScript（前端）、Node.js + Express + MySQL（后端），不引入新依赖。

## 数据库字段新增

在 `users` 表新增两列：

- `allow_friend_request` TINYINT(1) NOT NULL DEFAULT 1
- `chat_permission` VARCHAR(16) NOT NULL DEFAULT 'all'

无需修改 .sql 文件，直接在控制器中体现（用户执行 ALTER TABLE 语句手动变更）。

## 后端改动思路

### userController.js

- `getCurrentUser`：SELECT 语句加入两个新字段
- `updateUser`：req.body 解构加入两个新字段，保存逻辑与现有字段保持一致
- UPDATE/SELECT 语句同步补充

### friendController.js

- `sendFriendRequest`：查询 receiver 的 `allow_friend_request`，值为 0 时返回 403 + 提示"对方已关闭好友申请"
- `sendMessageToFriend`：查询 receiver 的 `chat_permission`，
- `'none'`：直接拒绝
- `'friends_only'`：校验双方是否为好友（现有逻辑已有好友判断，在此基础上拦截非好友）
- `'all'`：沿用现有临时会话逻辑不变

## 前端改动思路

### UserSettings.vue

在现有"公开设置" `el-form-item` 下方新增两个 `el-form-item`，各自包含一个 `privacy-panel`：

1. **私聊设置**：三个 `privacy-option` 按钮（`all` / `friends_only` / `none`），点击时设置 `form.chat_permission`，通过 `:class="{ active: form.chat_permission === 'xxx' }"` 控制高亮，`privacy-badge` 改用图示序号
2. **好友设置**：一个 `privacy-option` + `el-switch` 绑定 `form.allow_friend_request`

`form` reactive 新增两个字段，`onMounted` 和 `saveProfile` 同步处理。

## 目录结构

```
frontend/src/views/user/components/
└── UserSettings.vue        # [MODIFY] 新增私聊设置和好友设置两个区块，扩展 form 字段

backend/src/controllers/
├── userController.js       # [MODIFY] getCurrentUser / updateUser 新增两字段的 SELECT/UPDATE
└── friendController.js     # [MODIFY] sendFriendRequest + sendMessageToFriend 增加权限校验
```

## 实现注意事项

- 前端三选一选项不使用 `el-switch`，而是沿用 `privacy-option` 按钮的 `active` 样式，与现有风格完全一致，无需引入新组件
- 后端校验逻辑插入在现有判断（已是好友、已有申请等）之前，避免无意义的查询
- `sendMessageToFriend` 中 `chat_permission = 'friends_only'` 的校验利用现有 `friendRows` 查询结果，不重复查库
- 数据库 ALTER 语句提供给用户手动执行，不修改 .sql 文件