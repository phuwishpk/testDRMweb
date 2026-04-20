// Copy this file to backend/db.config.js and fill in your real values.
// Priority order used by the app: environment variables > db.config.js > defaults.

module.exports = {
  DB_HOST: '127.0.0.1',
  DB_PORT: 3306,
  DB_USER: 'your_db_user',
  DB_PASSWORD: 'your_db_password',
  DB_NAME: 'your_db_name',

  // Optional app settings
  PORT: 5051,
  SESSION_SECRET: 'replace_with_min_16_chars_secret',
  COMMENT_IP_SECRET: 'replace_with_min_16_chars_secret',
  TRUST_PROXY: '0'
};
