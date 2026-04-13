const mysql = require('mysql2');
require('dotenv').config();

console.log('Attempting to connect with:');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Password:', process.env.DB_PASSWORD ? '***' : '(empty)');
console.log('Database:', process.env.DB_NAME);

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || undefined,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to MySQL successfully!');
    connection.end();
  }
});
