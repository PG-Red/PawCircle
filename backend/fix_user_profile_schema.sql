-- 修复 users 表资料相关字段
-- 作用：补齐用户资料接口依赖字段，解决前端用户页 ID 长时间显示“生成中...”的问题
-- 使用方式：连接数据库后执行本脚本

USE pawcircle;

SET @db_name = DATABASE();

-- 1) 补齐 user_code 字段
SET @sql = IF (
  EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'user_code'
  ),
  'SELECT ''users.user_code 已存在'' AS message',
  'ALTER TABLE users ADD COLUMN user_code CHAR(8) DEFAULT NULL COMMENT ''8位用户编号'' AFTER id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) 补齐宠物公开设置字段
SET @sql = IF (
  EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'show_pets_public'
  ),
  'SELECT ''users.show_pets_public 已存在'' AS message',
  'ALTER TABLE users ADD COLUMN show_pets_public TINYINT(1) NOT NULL DEFAULT 1 COMMENT ''是否公开展示拥有的宠物'' AFTER bio'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF (
  EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'show_pet_details_public'
  ),
  'SELECT ''users.show_pet_details_public 已存在'' AS message',
  'ALTER TABLE users ADD COLUMN show_pet_details_public TINYINT(1) NOT NULL DEFAULT 1 COMMENT ''公开宠物时是否展示宠物详情'' AFTER show_pets_public'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) 补齐社交设置字段
SET @sql = IF (
  EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'allow_friend_request'
  ),
  'SELECT ''users.allow_friend_request 已存在'' AS message',
  'ALTER TABLE users ADD COLUMN allow_friend_request TINYINT(1) NOT NULL DEFAULT 1 COMMENT ''是否允许好友申请'' AFTER show_pet_details_public'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF (
  EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'chat_permission'
  ),
  'SELECT ''users.chat_permission 已存在'' AS message',
  'ALTER TABLE users ADD COLUMN chat_permission ENUM(''all'',''friends_only'',''none'') NOT NULL DEFAULT ''all'' COMMENT ''私聊权限'' AFTER allow_friend_request'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) 为历史用户修复 user_code
-- 说明：空 user_code 和旧的按 id 左补零编号，都会重置为随机 8 位编号；新注册用户仍走后端随机唯一编号逻辑

DROP PROCEDURE IF EXISTS fill_missing_user_codes;
DELIMITER $$
CREATE PROCEDURE fill_missing_user_codes()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_user_id BIGINT;
  DECLARE v_user_code CHAR(8);
  DECLARE v_exists INT DEFAULT 0;
  DECLARE cur CURSOR FOR
    SELECT id
    FROM users
    WHERE user_code IS NULL
       OR TRIM(user_code) = ''
       OR user_code = LPAD(id, 8, '0');
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;


  OPEN cur;

  read_loop: LOOP
    FETCH cur INTO v_user_id;
    IF done THEN
      LEAVE read_loop;
    END IF;

    generate_loop: LOOP
      SET v_user_code = LPAD(FLOOR(10000000 + RAND() * 90000000), 8, '0');
      SELECT COUNT(*) INTO v_exists FROM users WHERE user_code = v_user_code;

      IF v_exists = 0 THEN
        UPDATE users
        SET user_code = v_user_code
        WHERE id = v_user_id;
        LEAVE generate_loop;
      END IF;
    END LOOP;
  END LOOP;

  CLOSE cur;
END$$
DELIMITER ;

CALL fill_missing_user_codes();
DROP PROCEDURE IF EXISTS fill_missing_user_codes;


-- 5) 为 user_code 增加唯一索引
SET @sql = IF (
  EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'users'
      AND INDEX_NAME = 'uq_user_code'
  ),
  'SELECT ''索引 uq_user_code 已存在'' AS message',
  'ALTER TABLE users ADD UNIQUE KEY uq_user_code (user_code)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6) 校验结果
SELECT id, user_code, username, show_pets_public, show_pet_details_public, allow_friend_request, chat_permission
FROM users
ORDER BY id ASC
LIMIT 20;
