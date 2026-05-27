-- 只重置旧 user_code 为随机 8 位编号
-- 适用场景：user_code 为空，或 user_code = LPAD(id, 8, '0') 的历史用户

USE pawcircle;

DROP PROCEDURE IF EXISTS reset_legacy_user_codes;
DELIMITER $$
CREATE PROCEDURE reset_legacy_user_codes()
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
      SELECT COUNT(*) INTO v_exists
      FROM users
      WHERE user_code = v_user_code;

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

CALL reset_legacy_user_codes();
DROP PROCEDURE IF EXISTS reset_legacy_user_codes;

SELECT id, user_code, username
FROM users
ORDER BY id ASC;
