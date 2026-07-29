const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const DRAFT_DIR = path.join(DATA_DIR, 'draft');
const PUB_DIR = path.join(DATA_DIR, 'published');

const ADMIN_USER = 'admin';
const ADMIN_PASS_HASH = bcrypt.hashSync('atharv2025', 10);
const AUTH_SECRET = process.env.AUTH_SECRET || 'atharv-personal-site-secret-2026';

app.set('trust proxy', 1);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function readJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch { return null; }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  if (filePath.startsWith(DATA_DIR)) gitAutoSave();
}

function gitAutoSave() {
  const cwd = __dirname;
  const gitCmd = `git add data/ && (git diff --cached --quiet || git commit -m "auto-save" && git push)`;
  exec(gitCmd, { cwd, timeout: 30000 }, (err, stdout, stderr) => {
    if (err && !err.message.includes('Could not read from remote')) {
      console.error('git auto-save issue:', stderr || err.message);
    } else if (!err) {
      console.log('git auto-save ok');
    }
  });
  exec(`cp ${path.join(DATA_DIR, 'draft', 'achievements.json')} ${path.join(DATA_DIR, 'draft', 'achievements.backup.json')}`, { cwd }, () => {});
}

function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  return data + '.' + sig;
}

function verifyToken(token) {
  try {
    const [data, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}

function ensureDirs() {
  [DRAFT_DIR, PUB_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
  const draftSite = path.join(DRAFT_DIR, 'site.json');
  const draftAch = path.join(DRAFT_DIR, 'achievements.json');
  if (!fs.existsSync(draftSite)) {
    writeJSON(draftSite, {
      site: { name: "Your Name", title: "Your Title", tagline: "Your tagline", description: "Description", email: "email@example.com", footer: "© 2026 Your Name", theme: "light" },
      social: { linkedin: "", facebook: "", twitter: "", github: "", instagram: "" },
      home: { hero_text: "Your hero text", hero_sub: "Your sub text", hero_phrases: ["Your first phrase", "Your second phrase", "Your third phrase"], featured: [] },
      about: { intro: "Your intro", highlights: [], bio: "Your bio" },
      now: [
        { icon: "fa-robot", title: "Robotics", description: "Building and competing with my robotics team." },
        { icon: "fa-globe", title: "MUN", description: "Exploring international policy and AI governance." },
        { icon: "fa-brain", title: "Learning", description: "Developing my skills in AI, Python, and engineering." },
        { icon: "fa-rocket", title: "Next", description: "Exploring the intersection of AI, robotics, and public policy." }
      ],
      activities: [],
      faq: [
        { question: "Who are you?", answer: "Tell visitors about yourself." },
        { question: "What do you do?", answer: "Describe your work or studies." },
        { question: "How can I reach you?", answer: "Use the contact form below!" }
      ],
      contact: { formspree_id: "", note: "Create a free form at formspree.io and paste your form ID here." }
    });
  }
  if (!fs.existsSync(draftAch)) writeJSON(draftAch, []);
}

function getToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  const match = (req.headers.cookie || '').match(/admin_token=([^;]+)/);
  return match ? match[1] : null;
}

function authRequired(req, res, next) {
  const token = getToken(req);
  if (!token || !verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

ensureDirs();

app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && bcrypt.compareSync(password, ADMIN_PASS_HASH)) {
    const token = signToken({ admin: true, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
    res.setHeader('Set-Cookie', `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);
    return res.json({ success: true, token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
  const token = getToken(req);
  res.json({ admin: !!(token && verifyToken(token)) });
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
  const b64 = req.file.buffer.toString('base64');
  const mime = req.file.mimetype;
  res.json({ url: `data:${mime};base64,${b64}`, filename: req.file.filename });
});

app.get('/api/backup', authRequired, (req, res) => {
  const site = readJSON(path.join(DRAFT_DIR, 'site.json')) || {};
  const achievements = readJSON(path.join(DRAFT_DIR, 'achievements.json')) || [];
  res.json({ backup: { site, achievements, exportedAt: new Date().toISOString() } });
});

app.post('/api/restore', authRequired, (req, res) => {
  try {
    const { site, achievements } = req.body;
    if (site) writeJSON(path.join(DRAFT_DIR, 'site.json'), site);
    if (achievements) writeJSON(path.join(DRAFT_DIR, 'achievements.json'), achievements);
    res.json({ success: true, message: 'Backup restored. Click Publish to make live.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
