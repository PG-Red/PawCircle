-- 迁移脚本：为 moments 表添加软删除字段
-- 执行时间：需在现有数据库上运行一次

USE pawcircle;

ALTER TABLE moments
  ADD COLUMN is_deleted_by_owner TINYINT(1) NOT NULL DEFAULT 0
  COMMENT '发布者软删除标记：1=发布者已隐藏，对其他用户仍可见'
  AFTER comments_count;

