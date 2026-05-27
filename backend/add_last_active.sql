-- 为 users 表添加最后活跃时间字段
ALTER TABLE users
  ADD COLUMN last_active_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;
