# PawCircle 后端需求文档

## 项目概述

PawCircle 是一个宠物社交平台，用户可以分享宠物动态、管理宠物档案、记录喂养信息、进行宠物交易，并获得 AI 宠物助手的建议。

---

## 一、数据库设计

### 1. 用户表 (users)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 用户ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 邮箱 |
| password | VARCHAR(255) | NOT NULL | 密码（加密存储） |
| avatar | VARCHAR(500) | | 头像URL |
| bio | TEXT | | 个人简介 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 2. 宠物档案表 (pets)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 宠物ID |
| user_id | BIGINT | FOREIGN KEY, NOT NULL | 所有者ID |
| name | VARCHAR(100) | NOT NULL | 宠物名称 |
| breed | VARCHAR(100) | NOT NULL | 品种 |
| gender | ENUM('弟弟','妹妹') | NOT NULL | 性别 |
| birthday | DATE | NOT NULL | 出生日期 |
| image | VARCHAR(500) | | 宠物照片URL |
| description | TEXT | | 宠物描述 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 3. 动态表 (moments)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 动态ID |
| user_id | BIGINT | FOREIGN KEY, NOT NULL | 发布者ID |
| pet_id | BIGINT | FOREIGN KEY | 关联宠物ID |
| content | TEXT | NOT NULL | 动态内容 |
| image | VARCHAR(500) | | 动态图片URL |
| likes_count | INT | DEFAULT 0 | 点赞数 |
| comments_count | INT | DEFAULT 0 | 评论数 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 4. 点赞表 (likes)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 点赞ID |
| user_id | BIGINT | FOREIGN KEY, NOT NULL | 点赞用户ID |
| moment_id | BIGINT | FOREIGN KEY, NOT NULL | 动态ID |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| UNIQUE(user_id, moment_id) | | | 防止重复点赞 |

### 5. 评论表 (comments)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 评论ID |
| user_id | BIGINT | FOREIGN KEY, NOT NULL | 评论者ID |
| moment_id | BIGINT | FOREIGN KEY, NOT NULL | 动态ID |
| content | TEXT | NOT NULL | 评论内容 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 6. 喂养记录表 (feeding_records)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 记录ID |
| pet_id | BIGINT | FOREIGN KEY, NOT NULL | 宠物ID |
| user_id | BIGINT | FOREIGN KEY, NOT NULL | 用户ID |
| type | ENUM('Food','Water') | NOT NULL | 类型 |
| food_name | VARCHAR(100) | | 食物/饮水名称 |
| amount | VARCHAR(50) | NOT NULL | 数量（如100g、200ml） |
| notes | TEXT | | 备注 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 7. 宠物交易表 (pet_listings)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 列表ID |
| seller_id | BIGINT | FOREIGN KEY, NOT NULL | 卖家ID |
| title | VARCHAR(200) | NOT NULL | 标题 |
| category | ENUM('dog','cat','other') | NOT NULL | 分类 |
| description | TEXT | NOT NULL | 描述 |
| price | DECIMAL(10,2) | NOT NULL | 价格 |
| image | VARCHAR(500) | | 图片URL |
| location | VARCHAR(100) | NOT NULL | 位置 |
| status | ENUM('active','sold','closed') | DEFAULT 'active' | 状态 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 8. 邮箱验证码表 (email_verification_codes)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | ID |
| email | VARCHAR(100) | NOT NULL | 邮箱 |
| code | VARCHAR(6) | NOT NULL | 验证码 |
| expires_at | TIMESTAMP | NOT NULL | 过期时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

---

## 二、API 接口规范

### 基础信息

- **基础URL**: `http://localhost:8080/api`
- **请求格式**: JSON
- **响应格式**: JSON
- **认证方式**: JWT Token (Authorization: Bearer {token})

### 通用响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

**错误响应**:
```json
{
  "code": 400,
  "message": "error message",
  "data": null
}
```

---

## 三、认证相关接口

### 1. 发送邮箱验证码

**请求**:
- **方法**: POST
- **路径**: `/auth/send-code`
- **认证**: 否

**请求体**:
```json
{
  "email": "user@example.com"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "验证码已发送",
  "data": null
}
```

**错误码**:
- 400: 邮箱格式不正确
- 429: 请求过于频繁

---

### 2. 用户注册

**请求**:
- **方法**: POST
- **路径**: `/auth/register`
- **认证**: 否

**请求体**:
```json
{
  "username": "string",
  "email": "string",
  "code": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "id": 1,
    "username": "string",
    "email": "string",
    "token": "jwt_token"
  }
}
```

**错误码**:
- 400: 验证码错误或过期
- 409: 用户已存在

---

### 3. 用户登录

**请求**:
- **方法**: POST
- **路径**: `/auth/login`
- **认证**: 否

**请求体**:
```json
{
  "email": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "id": 1,
    "username": "string",
    "email": "string",
    "avatar": "string",
    "token": "jwt_token"
  }
}
```

**错误码**:
- 401: 邮箱或密码错误

---

## 四、宠物档案接口

### 1. 获取用户的所有宠物

**请求**:
- **方法**: GET
- **路径**: `/pets`
- **认证**: 是

**查询参数**: 无

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "Max",
      "breed": "萨摩耶",
      "gender": "弟弟",
      "birthday": "2022-05-12",
      "image": "url",
      "description": "string",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 2. 获取单个宠物详情

**请求**:
- **方法**: GET
- **路径**: `/pets/{petId}`
- **认证**: 是

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "Max",
    "breed": "萨摩耶",
    "gender": "弟弟",
    "birthday": "2022-05-12",
    "image": "url",
    "description": "string",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 3. 添加宠物

**请求**:
- **方法**: POST
- **路径**: `/pets`
- **认证**: 是

**请求体**:
```json
{
  "name": "string",
  "breed": "string",
  "gender": "弟弟|妹妹",
  "birthday": "YYYY-MM-DD",
  "image": "url",
  "description": "string"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "宠物添加成功",
  "data": {
    "id": 1,
    "name": "Max",
    "breed": "萨摩耶",
    "gender": "弟弟",
    "birthday": "2022-05-12",
    "image": "url",
    "description": "string"
  }
}
```

---

### 4. 编辑宠物信息

**请求**:
- **方法**: PUT
- **路径**: `/pets/{petId}`
- **认证**: 是

**请求体**:
```json
{
  "name": "string",
  "breed": "string",
  "gender": "弟弟|妹妹",
  "birthday": "YYYY-MM-DD",
  "image": "url",
  "description": "string"
}
```

**响应**: 同添加宠物

---

### 5. 删除宠物

**请求**:
- **方法**: DELETE
- **路径**: `/pets/{petId}`
- **认证**: 是

**响应**:
```json
{
  "code": 200,
  "message": "宠物删除成功",
  "data": null
}
```

---

## 五、动态相关接口

### 1. 获取动态列表（首页）

**请求**:
- **方法**: GET
- **路径**: `/moments`
- **认证**: 是

**查询参数**:
```
page: number (默认1)
pageSize: number (默认10)
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "items": [
      {
        "id": 1,
        "user": {
          "id": 1,
          "username": "string",
          "avatar": "url"
        },
        "pet": {
          "id": 1,
          "name": "Max"
        },
        "content": "string",
        "image": "url",
        "likes_count": 10,
        "comments_count": 5,
        "is_liked": false,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 2. 发布动态

**请求**:
- **方法**: POST
- **路径**: `/moments`
- **认证**: 是

**请求体**:
```json
{
  "pet_id": 1,
  "content": "string",
  "image": "url"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "动态发布成功",
  "data": {
    "id": 1,
    "user": {
      "id": 1,
      "username": "string",
      "avatar": "url"
    },
    "pet": {
      "id": 1,
      "name": "Max"
    },
    "content": "string",
    "image": "url",
    "likes_count": 0,
    "comments_count": 0,
    "is_liked": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 3. 删除动态

**请求**:
- **方法**: DELETE
- **路径**: `/moments/{momentId}`
- **认证**: 是

**响应**:
```json
{
  "code": 200,
  "message": "动态删除成功",
  "data": null
}
```

---

## 六、点赞相关接口

### 1. 点赞动态

**请求**:
- **方法**: POST
- **路径**: `/moments/{momentId}/like`
- **认证**: 是

**响应**:
```json
{
  "code": 200,
  "message": "点赞成功",
  "data": {
    "likes_count": 11
  }
}
```

---

### 2. 取消点赞

**请求**:
- **方法**: DELETE
- **路径**: `/moments/{momentId}/like`
- **认证**: 是

**响应**:
```json
{
  "code": 200,
  "message": "取消点赞成功",
  "data": {
    "likes_count": 10
  }
}
```

---

## 七、评论相关接口

### 1. 获取动态评论

**请求**:
- **方法**: GET
- **路径**: `/moments/{momentId}/comments`
- **认证**: 是

**查询参数**:
```
page: number (默认1)
pageSize: number (默认10)
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 5,
    "page": 1,
    "pageSize": 10,
    "items": [
      {
        "id": 1,
        "user": {
          "id": 1,
          "username": "string",
          "avatar": "url"
        },
        "content": "string",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 2. 发布评论

**请求**:
- **方法**: POST
- **路径**: `/moments/{momentId}/comments`
- **认证**: 是

**请求体**:
```json
{
  "content": "string"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "评论成功",
  "data": {
    "id": 1,
    "user": {
      "id": 1,
      "username": "string",
      "avatar": "url"
    },
    "content": "string",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 3. 删除评论

**请求**:
- **方法**: DELETE
- **路径**: `/moments/{momentId}/comments/{commentId}`
- **认证**: 是

**响应**:
```json
{
  "code": 200,
  "message": "评论删除成功",
  "data": null
}
```

---

## 八、喂养记录接口

### 1. 获取宠物喂养记录

**请求**:
- **方法**: GET
- **路径**: `/pets/{petId}/feeding-records`
- **认证**: 是

**查询参数**:
```
page: number (默认1)
pageSize: number (默认20)
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "items": [
      {
        "id": 1,
        "pet_id": 1,
        "type": "Food",
        "food_name": "皇家幼犬粮",
        "amount": "100g",
        "notes": "string",
        "created_at": "2024-01-01T08:30:00Z"
      }
    ]
  }
}
```

---

### 2. 添加喂养记录

**请求**:
- **方法**: POST
- **路径**: `/pets/{petId}/feeding-records`
- **认证**: 是

**请求体**:
```json
{
  "type": "Food|Water",
  "food_name": "string",
  "amount": "string",
  "notes": "string"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "记录添加成功",
  "data": {
    "id": 1,
    "pet_id": 1,
    "type": "Food",
    "food_name": "皇家幼犬粮",
    "amount": "100g",
    "notes": "string",
    "created_at": "2024-01-01T08:30:00Z"
  }
}
```

---

### 3. 获取今日喂养统计

**请求**:
- **方法**: GET
- **路径**: `/feeding-records/today`
- **认证**: 是

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "pet_id": 1,
      "pet_name": "Max",
      "records": [
        {
          "id": 1,
          "type": "Food",
          "food_name": "皇家幼犬粮",
          "amount": "100g",
          "created_at": "2024-01-01T08:30:00Z"
        }
      ]
    }
  ]
}
```

---

## 九、宠物交易接口

### 1. 获取交易列表

**请求**:
- **方法**: GET
- **路径**: `/listings`
- **认证**: 是

**查询参数**:
```
page: number (默认1)
pageSize: number (默认12)
category: string (all|dog|cat|other, 默认all)
search: string (搜索关键词)
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 100,
    "page": 1,
    "pageSize": 12,
    "items": [
      {
        "id": 1,
        "seller": {
          "id": 1,
          "username": "string",
          "avatar": "url"
        },
        "title": "string",
        "category": "dog",
        "description": "string",
        "price": 800.00,
        "image": "url",
        "location": "string",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 2. 获取交易详情

**请求**:
- **方法**: GET
- **路径**: `/listings/{listingId}`
- **认证**: 是

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "seller": {
      "id": 1,
      "username": "string",
      "avatar": "url",
      "email": "string"
    },
    "title": "string",
    "category": "dog",
    "description": "string",
    "price": 800.00,
    "image": "url",
    "location": "string",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 3. 发布交易

**请求**:
- **方法**: POST
- **路径**: `/listings`
- **认证**: 是

**请求体**:
```json
{
  "title": "string",
  "category": "dog|cat|other",
  "description": "string",
  "price": 800.00,
  "image": "url",
  "location": "string"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "交易发布成功",
  "data": {
    "id": 1,
    "seller": {
      "id": 1,
      "username": "string",
      "avatar": "url"
    },
    "title": "string",
    "category": "dog",
    "description": "string",
    "price": 800.00,
    "image": "url",
    "location": "string",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 4. 编辑交易

**请求**:
- **方法**: PUT
- **路径**: `/listings/{listingId}`
- **认证**: 是

**请求体**: 同发布交易

**响应**: 同发布交易

---

### 5. 删除交易

**请求**:
- **方法**: DELETE
- **路径**: `/listings/{listingId}`
- **认证**: 是

**响应**:
```json
{
  "code": 200,
  "message": "交易删除成功",
  "data": null
}
```

---

### 6. 标记交易为已售出

**请求**:
- **方法**: PATCH
- **路径**: `/listings/{listingId}/mark-sold`
- **认证**: 是

**响应**:
```json
{
  "code": 200,
  "message": "状态更新成功",
  "data": {
    "status": "sold"
  }
}
```

---

## 十、AI 助手接口

### 1. 发送消息到 AI 助手

**请求**:
- **方法**: POST
- **路径**: `/ai/chat`
- **认证**: 是

**请求体**:
```json
{
  "message": "string",
  "conversation_id": "string (可选)"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "conversation_id": "string",
    "response": "string",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

---

### 2. 获取对话历史

**请求**:
- **方法**: GET
- **路径**: `/ai/conversations/{conversationId}`
- **认证**: 是

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "string",
    "messages": [
      {
        "role": "user|ai",
        "content": "string",
        "timestamp": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

## 十一、用户信息接口

### 1. 获取当前用户信息

**请求**:
- **方法**: GET
- **路径**: `/users/me`
- **认证**: 是

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "string",
    "email": "string",
    "avatar": "url",
    "bio": "string",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 2. 更新用户信息

**请求**:
- **方法**: PUT
- **路径**: `/users/me`
- **认证**: 是

**请求体**:
```json
{
  "username": "string",
  "avatar": "url",
  "bio": "string"
}
```

**响应**: 同获取当前用户信息

---

### 3. 修改密码

**请求**:
- **方法**: POST
- **路径**: `/users/change-password`
- **认证**: 是

**请求体**:
```json
{
  "old_password": "string",
  "new_password": "string"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "密码修改成功",
  "data": null
}
```

---

## 十二、错误码规范

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token过期 |
| 403 | 禁止访问/无权限 |
| 404 | 资源不存在 |
| 409 | 冲突（如用户已存在） |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 十三、技术要求

### 后端框架建议
- **语言**: Java / Python / Node.js
- **框架**: Spring Boot / Django / Express
- **数据库**: MySQL 8.0+
- **缓存**: Redis（可选，用于验证码、会话等）

### 安全要求
- 所有密码必须加密存储（bcrypt/argon2）
- JWT Token 有效期建议 24 小时
- 邮箱验证码有效期 10 分钟
- 实现速率限制防止暴力攻击
- 所有敏感操作需要权限验证

### 性能要求
- 列表接口响应时间 < 500ms
- 单个资源查询 < 100ms
- 支持并发用户数 > 1000

---

## 十四、部署建议

- 使用 Docker 容器化部署
- 配置 CORS 允许前端跨域请求
- 使用 HTTPS 加密传输
- 配置日志系统便于问题排查
- 定期备份数据库

---

**文档版本**: 1.0  
**最后更新**: 2024年  
**维护者**: 前端团队

