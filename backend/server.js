const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load env vars from backend/.env (preferred) or project-root .env (hosting-friendly)
const envCandidates = [path.join(__dirname, '.env'), path.join(__dirname, '..', '.env')];
for (const envPath of envCandidates) {
  dotenv.config({ path: envPath });
}

const configCandidates = [path.join(__dirname, 'db.config.js'), path.join(__dirname, '..', 'db.config.js')];
let loadedConfigPath = null;
let codeConfig = {};
for (const configPath of configCandidates) {
  if (!fs.existsSync(configPath)) continue;
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const cfg = require(configPath);
    if (cfg && typeof cfg === 'object') {
      codeConfig = cfg;
      loadedConfigPath = configPath;
      break;
    }
  } catch (err) {
    console.error('⚠️ Failed to load code config:', configPath, err && err.message ? err.message : err);
  }
}

function readSetting(name, fallback = '') {
  if (typeof process.env[name] === 'string' && process.env[name] !== '') {
    return process.env[name];
  }

  if (Object.prototype.hasOwnProperty.call(codeConfig, name)) {
    const val = codeConfig[name];
    if (val !== undefined && val !== null && val !== '') return val;
  }

  return fallback;
}

function readSettingAllowEmpty(name, fallback = '') {
  if (typeof process.env[name] === 'string') {
    return process.env[name];
  }

  if (Object.prototype.hasOwnProperty.call(codeConfig, name)) {
    const val = codeConfig[name];
    if (val !== undefined && val !== null) return val;
  }

  return fallback;
}

const app = express();
const PORT = Number(readSetting('PORT', 5000)) || 5000;

const DB_HOST = String(readSetting('DB_HOST', ''));
const DB_PORT = Number(readSetting('DB_PORT', 3306)) || 3306;
const DB_USER = String(readSetting('DB_USER', ''));
const DB_PASSWORD = String(readSettingAllowEmpty('DB_PASSWORD', ''));
const DB_NAME = String(readSetting('DB_NAME', ''));

if (loadedConfigPath) {
  console.log('Loaded code config from:', loadedConfigPath);
}

const missingDbVars = [
  !DB_HOST ? 'DB_HOST' : null,
  !DB_USER ? 'DB_USER' : null,
  !DB_NAME ? 'DB_NAME' : null
].filter(Boolean);
if (missingDbVars.length) {
  console.error(
    `⚠️ Missing DB settings: ${missingDbVars.join(', ')}. Use backend/.env, project-root .env, Plesk environment variables, or backend/db.config.js.`
  );
}

const configuredSessionSecret = String(readSettingAllowEmpty('SESSION_SECRET', ''));
const SESSION_SECRET =
  configuredSessionSecret.length >= 16
    ? configuredSessionSecret
    : crypto.randomBytes(32).toString('hex');

if (configuredSessionSecret.length < 16) {
  console.warn('⚠️ SESSION_SECRET is not set. Using a random value (sessions reset on restart).');
}

const configuredCommentIpSecret = String(readSettingAllowEmpty('COMMENT_IP_SECRET', ''));
const COMMENT_IP_SECRET =
  configuredCommentIpSecret.length >= 16
    ? configuredCommentIpSecret
    : SESSION_SECRET;

if (String(readSetting('TRUST_PROXY', '0')) === '1') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

app.use(
  session({
    name: 'dre.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: 'auto',
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

// Static files (โครงเดียวกับบน IIS/Plesk): /index.html + /frontend/* + /images/*
app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));
app.use('/images', express.static(path.join(__dirname, '../images')));

// Uploads (public read)
const siteRoot = path.resolve(__dirname, '..');
const uploadDirCandidates = [];

const configuredUploadDir = String(readSetting('UPLOAD_DIR', ''));
if (configuredUploadDir.trim()) {
  uploadDirCandidates.push(path.resolve(configuredUploadDir.trim()));
}

if (fs.existsSync(path.join(siteRoot, 'App_Data'))) {
  uploadDirCandidates.push(path.join(siteRoot, 'App_Data', 'uploads'));
}

uploadDirCandidates.push(path.join(__dirname, 'uploads'));

let uploadDir = null;
for (const candidate of uploadDirCandidates) {
  try {
    fs.mkdirSync(candidate, { recursive: true });
    uploadDir = candidate;
    break;
  } catch (err) {
    console.error(
      '⚠️ Cannot create upload dir:',
      candidate,
      err && err.message ? err.message : err
    );
  }
}

if (uploadDir) {
  app.use('/uploads', express.static(uploadDir));
} else {
  console.error('⚠️ Uploads disabled (no writable upload directory found).');
}

// MySQL Pool
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function normalizeCategory(input) {
  if (typeof input !== 'string') return null;
  const v = input.trim().toLowerCase();
  if (v === 'thai_forum' || v === 'news' || v === 'event') return v;
  return null;
}

function isValidHttpUrl(value) {
  if (typeof value !== 'string') return false;
  if (value.length > 2048) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function generateSlug() {
  const t = Date.now().toString(36);
  const r = crypto.randomBytes(4).toString('hex');
  return `p-${t}-${r}`;
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin && req.session.admin.username === 'admin') {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

function enforceSameOriginForAdmin(req, res, next) {
  // ลดความเสี่ยง CSRF สำหรับ admin routes แบบ session cookie
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();

  const origin = req.get('origin');
  if (!origin) return next();

  const host = req.get('host');
  const allowed = new Set([`http://${host}`, `https://${host}`]);

  if (allowed.has(origin)) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

function validateAndNormalizeBlocks(blocks) {
  if (!Array.isArray(blocks)) return { ok: false, message: 'content.blocks must be an array' };
  if (blocks.length > 200) return { ok: false, message: 'Too many blocks' };

  const out = [];

  for (const b of blocks) {
    if (!b || typeof b !== 'object') continue;
    const type = String(b.type || '').trim().toLowerCase();

    if (type === 'text') {
      const text = typeof b.text === 'string' ? b.text : '';
      const trimmed = text.trim();
      if (!trimmed) continue;
      if (trimmed.length > 10000) return { ok: false, message: 'Text block too long' };
      out.push({ type: 'text', text: trimmed });
      continue;
    }

    if (type === 'link') {
      const url = typeof b.url === 'string' ? b.url.trim() : '';
      const labelRaw = typeof b.label === 'string' ? b.label.trim() : '';
      if (!isValidHttpUrl(url)) return { ok: false, message: 'Invalid link URL' };
      const label = labelRaw && labelRaw.length <= 200 ? labelRaw : url;
      out.push({ type: 'link', url, label });
      continue;
    }

    if (type === 'image') {
      const src = typeof b.src === 'string' ? b.src.trim() : '';
      if (!src || src.length > 500) return { ok: false, message: 'Invalid image src' };
      if (!src.startsWith('/uploads/')) return { ok: false, message: 'Only uploaded images are allowed' };

      const alignRaw = typeof b.align === 'string' ? b.align.trim().toLowerCase() : 'center';
      const align = alignRaw === 'left' || alignRaw === 'right' || alignRaw === 'center' ? alignRaw : 'center';

      const widthPercentNum = Number(b.widthPercent);
      const widthPercent = Number.isFinite(widthPercentNum) ? Math.round(widthPercentNum) : 100;
      if (widthPercent < 10 || widthPercent > 100) return { ok: false, message: 'Invalid image widthPercent' };

      const captionRaw = typeof b.caption === 'string' ? b.caption.trim() : '';
      const caption = captionRaw.length <= 500 ? captionRaw : captionRaw.slice(0, 500);

      out.push({ type: 'image', src, align, widthPercent, caption });
      continue;
    }
  }

  if (out.length === 0) return { ok: false, message: 'Content is empty' };
  return { ok: true, blocks: out };
}

async function ensureAdminSeed() {
  try {
    const [rows] = await pool.execute('SELECT id FROM admins WHERE username = ? LIMIT 1', ['admin']);
    if (rows.length > 0) return;

    const hash = await bcrypt.hash('admin', 12);
    await pool.execute('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', hash]);
    console.log('✅ Seeded admin user: admin/admin (for testing only)');
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      console.error('⚠️ Missing tables. Please import backend/database.sql into your MySQL database.');
      return;
    }
    console.error('⚠️ ensureAdminSeed failed:', err && err.message ? err.message : err);
  }
}

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false
});

// --- Routes ---

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// --- Admin Auth ---
app.get('/api/admin/me', (req, res) => {
  if (req.session && req.session.admin && req.session.admin.username === 'admin') {
    return res.json({ authenticated: true, username: 'admin', role: 'admin' });
  }
  return res.json({ authenticated: false });
});

app.post('/api/admin/login', enforceSameOriginForAdmin, loginLimiter, async (req, res) => {
  try {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!username || !password) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const [rows] = await pool.execute(
      'SELECT id, username, password_hash FROM admins WHERE username = ? LIMIT 1',
      [username]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.admin = { id: rows[0].id, username: rows[0].username };
    return res.json({ ok: true, username: rows[0].username, role: 'admin' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/logout', enforceSameOriginForAdmin, (req, res) => {
  if (!req.session) return res.json({ ok: true });

  req.session.destroy(() => {
    res.clearCookie('dre.sid');
    res.json({ ok: true });
  });
});

// --- Media (admin-only) ---
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safeExt = ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp' ? ext : '';
      const name = crypto.randomBytes(16).toString('hex');
      cb(null, `${name}${safeExt}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has(file.mimetype)) {
      return cb(new Error('INVALID_FILE_TYPE'));
    }
    return cb(null, true);
  }
});

app.get('/api/admin/media', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, file_path AS url, original_name, mime_type, size_bytes, created_at FROM media ORDER BY id DESC LIMIT 200'
    );
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/media', enforceSameOriginForAdmin, requireAdmin, (req, res) => {
  if (!uploadDir) {
    return res.status(503).json({ error: 'Uploads are temporarily unavailable' });
  }

  imageUpload.single('image')(req, res, async (err) => {
    if (err) {
      if (err.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ error: 'Only jpg/png/webp are allowed' });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large (max 5MB)' });
      }
      return res.status(400).json({ error: 'Upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const url = `/uploads/${req.file.filename}`;
      const originalName = String(req.file.originalname || '').slice(0, 255);
      const mimeType = String(req.file.mimetype || '').slice(0, 100);
      const sizeBytes = Number(req.file.size) || 0;

      const [result] = await pool.execute(
        'INSERT INTO media (file_path, original_name, mime_type, size_bytes) VALUES (?, ?, ?, ?)',
        [url, originalName, mimeType, sizeBytes]
      );

      return res.status(201).json({
        ok: true,
        id: result.insertId,
        url,
        original_name: originalName,
        mime_type: mimeType,
        size_bytes: sizeBytes
      });
    } catch {
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

// --- Posts (public) ---
app.get('/api/posts', async (req, res) => {
  try {
    const category = normalizeCategory(req.query.category);
    if (!category) return res.status(400).json({ error: 'Invalid category' });

    const [rows] = await pool.execute(
      'SELECT id, category, title, slug, summary, published_at FROM posts WHERE category = ? AND published_at IS NOT NULL ORDER BY published_at DESC LIMIT 200',
      [category]
    );

    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/posts/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim();
    if (!slug || slug.length > 160) return res.status(400).json({ error: 'Invalid slug' });

    const [rows] = await pool.execute(
      'SELECT id, category, title, slug, summary, content_json, published_at FROM posts WHERE slug = ? AND published_at IS NOT NULL LIMIT 1',
      [slug]
    );

    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    let content = { blocks: [] };
    try {
      content = typeof rows[0].content_json === 'string' ? JSON.parse(rows[0].content_json) : rows[0].content_json;
    } catch {
      content = { blocks: [] };
    }

    return res.json({
      id: rows[0].id,
      category: rows[0].category,
      title: rows[0].title,
      slug: rows[0].slug,
      summary: rows[0].summary,
      content,
      published_at: rows[0].published_at
    });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Posts (admin-only) ---
app.post('/api/admin/posts', enforceSameOriginForAdmin, requireAdmin, async (req, res) => {
  try {
    const category = normalizeCategory(req.body?.category);
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const summary = typeof req.body?.summary === 'string' ? req.body.summary.trim() : '';

    const blocks = req.body?.content?.blocks;

    if (!category) return res.status(400).json({ error: 'Invalid category' });
    if (!title || title.length > 255) return res.status(400).json({ error: 'Invalid title' });
    if (summary.length > 1000) return res.status(400).json({ error: 'Summary too long' });

    const v = validateAndNormalizeBlocks(blocks);
    if (!v.ok) return res.status(400).json({ error: v.message });

    const slug = generateSlug();
    const contentJson = JSON.stringify({ blocks: v.blocks });

    const [result] = await pool.execute(
      'INSERT INTO posts (category, title, slug, summary, content_json, published_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [category, title, slug, summary || null, contentJson]
    );

    return res.status(201).json({ ok: true, id: result.insertId, slug });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/posts/:id', enforceSameOriginForAdmin, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const summary = typeof req.body?.summary === 'string' ? req.body.summary.trim() : '';
    const blocks = req.body?.content?.blocks;

    if (!title || title.length > 255) return res.status(400).json({ error: 'Invalid title' });
    if (summary.length > 1000) return res.status(400).json({ error: 'Summary too long' });

    const v = validateAndNormalizeBlocks(blocks);
    if (!v.ok) return res.status(400).json({ error: v.message });

    const contentJson = JSON.stringify({ blocks: v.blocks });

    await pool.execute(
      'UPDATE posts SET title = ?, summary = ?, content_json = ?, updated_at = NOW() WHERE id = ?',
      [title, summary || null, contentJson, id]
    );

    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/posts/:id', enforceSameOriginForAdmin, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

    await pool.execute('DELETE FROM posts WHERE id = ?', [id]);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Comments (public) ---
app.get('/api/posts/:slug/comments', async (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim();
    if (!slug || slug.length > 160) return res.status(400).json({ error: 'Invalid slug' });

    const [postRows] = await pool.execute('SELECT id FROM posts WHERE slug = ? AND published_at IS NOT NULL LIMIT 1', [slug]);
    if (!postRows.length) return res.status(404).json({ error: 'Not found' });

    const postId = postRows[0].id;
    const [rows] = await pool.execute(
      'SELECT id, author_name, message, created_at FROM comments WHERE post_id = ? ORDER BY created_at ASC LIMIT 500',
      [postId]
    );

    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/posts/:slug/comments', commentLimiter, async (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim();
    if (!slug || slug.length > 160) return res.status(400).json({ error: 'Invalid slug' });

    const [postRows] = await pool.execute('SELECT id FROM posts WHERE slug = ? AND published_at IS NOT NULL LIMIT 1', [slug]);
    if (!postRows.length) return res.status(404).json({ error: 'Not found' });

    const postId = postRows[0].id;

    const authorNameRaw = typeof req.body?.authorName === 'string' ? req.body.authorName.trim() : '';
    const messageRaw = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

    const authorName = (authorNameRaw || 'Guest').slice(0, 80);
    const message = messageRaw.slice(0, 2000);

    if (!message) return res.status(400).json({ error: 'Message is required' });

    const ip = String(req.ip || '');
    const ipHash = ip ? crypto.createHmac('sha256', COMMENT_IP_SECRET).update(ip).digest('hex') : null;

    const [result] = await pool.execute(
      'INSERT INTO comments (post_id, author_name, message, ip_hash) VALUES (?, ?, ?, ?)',
      [postId, authorName, message, ipHash]
    );

    return res.status(201).json({ ok: true, id: result.insertId });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Existing Items API (kept) ---
app.get('/api/items', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM items ORDER BY id DESC LIMIT 200');
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

    const [rows] = await pool.execute('SELECT * FROM items WHERE id = ? LIMIT 1', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Item not found' });

    return res.json(rows[0]);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const [result] = await pool.execute('INSERT INTO items (name, description) VALUES (?, ?)', [name, description || null]);

    return res.status(201).json({ id: result.insertId, name, description, message: 'Item created successfully' });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';

    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
    if (!name) return res.status(400).json({ error: 'Name is required' });

    await pool.execute('UPDATE items SET name = ?, description = ? WHERE id = ?', [name, description || null, id]);
    return res.json({ message: 'Item updated successfully' });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

    await pool.execute('DELETE FROM items WHERE id = ?', [id]);
    return res.json({ message: 'Item deleted successfully' });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Startup
(async () => {
  const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use.`);
      console.error(
        "Tip (Plesk/IIS): don't run `npm start` from the 'Run script' panel. Use the Node.js app 'Restart App' button instead."
      );
      process.exit(1);
    }

    console.error('❌ Server failed to start:', err && err.message ? err.message : err);
    process.exit(1);
  });

  try {
    await pool.query('SELECT 1');
    console.log('Connected to MySQL database');
    await ensureAdminSeed();
  } catch (err) {
    console.error('Database connection failed:', err && err.message ? err.message : err);
  }
})();
