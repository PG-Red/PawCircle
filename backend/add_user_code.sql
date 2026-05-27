-- 迁移脚本：为 users 表补齐并修复 8 位用户编号

-- 执行前请先 USE pawcircle;

USE pawcircle;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS user_code CHAR(8) DEFAULT NULL COMMENT '8位用户编号' AFTER id;

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


ALTER TABLE users
  ADD UNIQUE KEY uq_user_code (user_code);

