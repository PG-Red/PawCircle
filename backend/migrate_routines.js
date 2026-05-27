const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Creating pet_routines table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pet_routines (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        pet_id BIGINT NOT NULL,
        task_type VARCHAR(50) NOT NULL COMMENT '任务类型: feeding, outing, hygiene, medical, other',
        title VARCHAR(100) NOT NULL,
        task_time TIME NOT NULL COMMENT '执行时间',
        frequency_type VARCHAR(20) DEFAULT 'daily' COMMENT 'daily, weekly',
        frequency_value VARCHAR(50) DEFAULT '1,2,3,4,5,6,7' COMMENT '具体星期几',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Creating pet_routine_records table...');
    await connection.query(`
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
    `);

    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

migrate();