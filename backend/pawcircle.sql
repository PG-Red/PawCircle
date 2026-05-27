-- PawCircle 数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS pawcircle;
USE pawcircle;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_code CHAR(8) UNIQUE DEFAULT NULL COMMENT '8位用户编号',
  username VARCHAR(50) UNIQUE NOT NULL,

  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar MEDIUMTEXT,
  bio TEXT,
  show_pets_public TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否公开展示拥有的宠物',
  show_pet_details_public TINYINT(1) NOT NULL DEFAULT 1 COMMENT '公开宠物时是否展示宠物详情',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 宠物档案表
CREATE TABLE IF NOT EXISTS pets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  breed VARCHAR(100) NOT NULL,
  gender ENUM('弟弟','妹妹') NOT NULL,
  birthday DATE NOT NULL,
  image MEDIUMTEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 动态表
CREATE TABLE IF NOT EXISTS moments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  pet_id BIGINT,
  content TEXT NOT NULL,
  image MEDIUMTEXT,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  is_deleted_by_owner TINYINT(1) DEFAULT 0 COMMENT '发布者软删除标记：1=发布者已隐藏，对其他用户仍可见',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 点赞表
CREATE TABLE IF NOT EXISTS likes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  moment_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (user_id, moment_id),
  INDEX idx_moment_id (moment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 评论表
CREATE TABLE IF NOT EXISTS comments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  moment_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
  INDEX idx_moment_id (moment_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 好友申请表
CREATE TABLE IF NOT EXISTS friend_requests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sender_id BIGINT NOT NULL,
  receiver_id BIGINT NOT NULL,
  message VARCHAR(255),
  status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_receiver_status (receiver_id, status),
  INDEX idx_sender_status (sender_id, status),
  UNIQUE KEY uq_pending_sender_receiver (sender_id, receiver_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 好友关系表
CREATE TABLE IF NOT EXISTS friends (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  friend_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_friend (user_id, friend_id),
  INDEX idx_friend_id (friend_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 私聊消息表
CREATE TABLE IF NOT EXISTS private_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sender_id BIGINT NOT NULL,
  receiver_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  image MEDIUMTEXT,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sender_receiver_time (sender_id, receiver_id, created_at),
  INDEX idx_receiver_sender_time (receiver_id, sender_id, created_at),
  INDEX idx_receiver_read (receiver_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 宠物交易表
CREATE TABLE IF NOT EXISTS pet_listings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  seller_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  category ENUM('dog','cat','other') NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image MEDIUMTEXT,
  location VARCHAR(100) NOT NULL,
  status ENUM('active','sold','closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_seller_id (seller_id),
  INDEX idx_category (category),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 邮箱验证码表
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. AI 对话表
CREATE TABLE IF NOT EXISTS ai_conversations (
  id VARCHAR(36) PRIMARY KEY,
  user_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. AI 消息表
CREATE TABLE IF NOT EXISTS ai_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  conversation_id VARCHAR(36) NOT NULL,
  role ENUM('user','ai') NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE,
  INDEX idx_conversation_id (conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. 宠物打卡活动表 (代替原有的 feeding_records)
CREATE TABLE IF NOT EXISTS pet_routines (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  pet_id BIGINT NOT NULL,
  task_type VARCHAR(50) NOT NULL COMMENT '任务类型: feeding, outing, hygiene, medical, other',
  title VARCHAR(100) NOT NULL,
  task_time TIME NOT NULL COMMENT '执行时间',
  frequency_type VARCHAR(20) DEFAULT 'daily' COMMENT 'daily, weekly, once',
  frequency_value VARCHAR(50) DEFAULT '1,2,3,4,5,6,7' COMMENT '具体星期几 或 具体日期',
  start_date DATE DEFAULT NULL COMMENT '活动的起始日期',
  end_date DATE DEFAULT NULL COMMENT '活动的结束日期，NULL表示不结束',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. 宠物打卡记录表
CREATE TABLE IF NOT EXISTS pet_routine_records (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  routine_id BIGINT NOT NULL,
  pet_id BIGINT NOT NULL,
  record_date DATE NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (routine_id) REFERENCES pet_routines(id) ON DELETE CASCADE,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  UNIQUE KEY unique_record (routine_id, record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

