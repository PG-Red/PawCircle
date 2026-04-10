-- 迁移脚本：为 users 表补充公开资料权限字段
-- 执行前请先 USE pawcircle;

USE pawcircle;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS show_pets_public TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否公开展示拥有的宠物' AFTER bio,
  ADD COLUMN IF NOT EXISTS show_pet_details_public TINYINT(1) NOT NULL DEFAULT 1 COMMENT '公开宠物时是否展示宠物详情' AFTER show_pets_public;

