const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const DRAFT_DIR = path.join(DATA_DIR, 'draft');
const PUB_DIR = path.join(DATA_DIR, 'published');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');

const ADMIN_USER = 'admin';
const ADMIN_PASS_HASH = bcrypt.hashSync('atharv2025', 10);

app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'persona-website-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, maxAge: 24 * 60 * 60 * 1000 }
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

function readJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch { return null; }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function ensureDirs() {
  [DRAFT_DIR, PUB_DIR, UPLOAD_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
  const draftSite = path.join(DRAFT_DIR, 'site.json');
  const draftAch = path.join(DRAFT_DIR, 'achievements.json');
  if (!fs.existsSync(draftSite)) {
    writeJSON(draftSite, {
      site: { name: "Your Name", title: "Your Title", tagline: "Your tagline", description: "Description", email: "email@example.com", footer: "© 2026 Your Name", theme: "dark" },
      social: { linkedin: "", facebook: "", twitter: "", github: "", instagram: "" },
      home: { hero_text: "Your hero text", hero_sub: "Your sub text", featured: [] },
      about: { intro: "Your intro", highlights: [], bio: "Your bio" },
      activities: []
    });
  }
  if (!fs.existsSync(draftAch)) writeJSON(draftAch, []);
}

function authRequired(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

ensureDirs();

app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && bcrypt.compareSync(password, ADMIN_PASS_HASH)) {
    req.session.admin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
  res.json({ admin: !!(req.session && req.session.admin) });
});

app.get('/api/draft', authRequired, (req, res) => {
  const site = readJSON(path.join(DRAFT_DIR, 'site.json')) || {};
  const achievements = readJSON(path.join(DRAFT_DIR, 'achievements.json')) || [];
  res.json({ site, achievements });
});

app.put('/api/draft/site', authRequired, (req, res) => {
  writeJSON(path.join(DRAFT_DIR, 'site.json'), req.body);
  res.json({ success: true });
});

app.put('/api/draft/achievements', authRequired, (req, res) => {
  writeJSON(path.join(DRAFT_DIR, 'achievements.json'), req.body);
  res.json({ success: true });
});

app.post('/api/draft/achievements', authRequired, (req, res) => {
  const achievements = readJSON(path.join(DRAFT_DIR, 'achievements.json')) || [];
  const newAch = { id: 'ach_' + Date.now(), ...req.body };
  achievements.push(newAch);
  writeJSON(path.join(DRAFT_DIR, 'achievements.json'), achievements);
  res.json({ success: true, achievement: newAch });
});

app.delete('/api/draft/achievements/:id', authRequired, (req, res) => {
  let achievements = readJSON(path.join(DRAFT_DIR, 'achievements.json')) || [];
  achievements = achievements.filter(a => a.id !== req.params.id);
  writeJSON(path.join(DRAFT_DIR, 'achievements.json'), achievements);
  res.json({ success: true });
});

app.post('/api/upload', authRequired, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: '/uploads/' + req.file.filename, filename: req.file.filename });
});

app.post('/api/publish', authRequired, (req, res) => {
  try {
    const site = readJSON(path.join(DRAFT_DIR, 'site.json'));
    const achievements = readJSON(path.join(DRAFT_DIR, 'achievements.json')) || [];
    const publishedAchievements = achievements.filter(a => a.public);
    writeJSON(path.join(PUB_DIR, 'site.json'), site);
    writeJSON(path.join(PUB_DIR, 'achievements.json'), publishedAchievements);
    res.json({ success: true, message: 'Site published successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/published', (req, res) => {
  const site = readJSON(path.join(PUB_DIR, 'site.json'));
  const achievements = readJSON(path.join(PUB_DIR, 'achievements.json')) || [];
  if (!site) return res.status(404).json({ error: 'No published content' });
  res.json({ site, achievements });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.use((req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/admin')) return;
  const file = req.path === '/' ? 'index.html' : req.path.slice(1) + '.html';
  const filePath = path.join(__dirname, 'public', file);
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Website: http://localhost:${PORT}`);
  console.log(`Admin:   http://localhost:${PORT}/admin`);
});
