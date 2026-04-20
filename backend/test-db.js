const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envCandidates = [path.join(__dirname, '.env'), path.join(__dirname, '..', '.env')];
const configCandidates = [path.join(__dirname, 'db.config.js'), path.join(__dirname, '..', 'db.config.js')];

function loadEnv() {
  for (const envPath of envCandidates) {
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

function loadCodeConfig() {
  for (const configPath of configCandidates) {
    try {
      if (!fs.existsSync(configPath)) continue;
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const cfg = require(configPath);
      if (cfg && typeof cfg === 'object') return { configPath, cfg };
    } catch {
      // ignore and continue
    }
  }
  return { configPath: null, cfg: {} };
}

const loadedEnvPath = loadEnv();
const { configPath: loadedConfigPath, cfg: codeConfig } = loadCodeConfig();
if (loadedEnvPath) {
  console.log('Loaded environment from:', loadedEnvPath);
}
if (loadedConfigPath) {
  console.log('Loaded code config from:', loadedConfigPath);
}

const dbHost = process.env.DB_HOST || codeConfig.DB_HOST;
const dbUser = process.env.DB_USER || codeConfig.DB_USER;
const dbName = process.env.DB_NAME || codeConfig.DB_NAME;
const dbPort = Number(process.env.DB_PORT || codeConfig.DB_PORT || 3306);
const dbPassword =
  typeof process.env.DB_PASSWORD === 'string'
    ? process.env.DB_PASSWORD
    : codeConfig.DB_PASSWORD !== undefined
      ? String(codeConfig.DB_PASSWORD)
      : '';

console.log('Attempting to connect with:');
console.log('Host:', dbHost);
console.log('User:', dbUser);
console.log('Password:', dbPassword ? '***' : '(empty)');
console.log('Database:', dbName);

const missing = [
  !dbHost ? 'DB_HOST' : null,
  !dbUser ? 'DB_USER' : null,
  !dbName ? 'DB_NAME' : null
].filter(Boolean);

if (missing.length) {
  if (!loadedEnvPath && !loadedConfigPath) {
    console.warn('⚠️ No .env or db.config.js found.');
    console.warn('Checked paths:');
    for (const p of [...envCandidates, ...configCandidates]) {
      console.warn(' -', p);
    }
  }
  console.error('❌ Missing DB settings:', missing.join(', '));
  console.error('Fix: create backend/.env, project-root .env, backend/db.config.js, or set these in hosting environment variables.');
  process.exit(2);
}

const connection = mysql.createConnection({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword || undefined,
  database: dbName
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
