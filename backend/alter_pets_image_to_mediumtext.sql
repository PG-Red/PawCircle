-- 迁移脚本：将 pets.image 扩展为可存储 base64 图片
-- 用于修复“Data too long for column 'image'”错误

USE pawcircle;

ALTER TABLE pets
  MODIFY COLUMN image MEDIUMTEXT;

