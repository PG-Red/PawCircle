const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/.env' });

async function checkDb() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'pawcircle',
  });

  try {
    const [columns] = await connection.query('SHOW COLUMNS FROM pet_routines');
    console.log('pet_routines columns:');
    console.log(columns.map(c => c.Field).join(', '));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

checkDb();
