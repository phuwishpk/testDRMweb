const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function loadEnv() {
  const candidates = [path.join(__dirname, '.env'), path.join(__dirname, '..', '.env')];
  for (const envPath of candidates) {
    try {
      if (!fs.existsSync(envPath)) continue;
      const result = dotenv.config({ path: envPath });
      if (!result.error) return envPath;
    } catch {
      // ignore and continue
    }
  }
  return null;
}

loadEnv();

console.log('Attempting to connect with:');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Password:', process.env.DB_PASSWORD ? '***' : '(empty)');
console.log('Database:', process.env.DB_NAME);

const required = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  console.error('❌ Missing environment variables:', missing.join(', '));
  console.error('Fix: create backend/.env (or .env at project root), or set these in your hosting environment variables.');
  process.exit(2);
}

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
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
