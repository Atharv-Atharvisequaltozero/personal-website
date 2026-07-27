let draft = null;
let achievements = [];

const categoryColors = {
  Student Council: '#3b82f6', STEM: '#10b981', Scouts: '#f59e0b',
  Sports: '#8b5cf6', Community: '#ec4899', Leadership: '#f97316',
  Business: '#06b6d4', default: '#6b7280'
};

async function checkAuth() {
  const res = await fetch('/api/auth/check');
  const data = await res.json();
  if (data.admin) { showAdmin(); loadDraft(); }
  else { showLogin(); }
}

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-panel').style.display = 'none';
}

function showAdmin() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'flex';
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = document.getElementById('login-user').value;
  const pass = document.getElementById('login-pass').value;
  const res = await fetch('/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password: pass })
  });
  if (res.ok) { showAdmin(); loadDraft(); }
  else { document.getElementById('login-error').style.display = 'block'; }
});

function logout() {
  fetch('/api/logout', { method: 'POST' });
  showLogin();
}

async function loadDraft() {
  try {
    const res = await fetch('/api/draft');
    const data = await res.json();
    draft = data.site || {};
    achievements = data.achievements || [];
    populateAll();
  } catch (err) { console.error('Load error:', err); }
}

function populateAll() {
  if (!draft) return;
  const s = draft.site || {};
  const soc = draft.social || {};
  const h = draft.home || {};
  const a = draft.about || {};

  document.getElementById('field-name').value = s.name || '';
  document.getElementById('field-title').value = s.title || '';
  document.getElementById('field-tagline').value = s.tagline || '';
  document.getElementById('field-desc').value = s.description || '';
  document.getElementById('field-email').value = s.email || '';
  document.getElementById('field-footer').value = s.footer || '';

  document.getElementById('field-linkedin').value = soc.linkedin || '';
  document.getElementById('field-github').value = soc.github || '';
  document.getElementById('field-facebook').value = soc.facebook || '';
  document.getElementById('field-twitter').value = soc.twitter || '';
  document.getElementById('field-instagram').value = soc.instagram || '';

  document.getElementById('field-hero-text').value = h.hero_text || '';
  document.getElementById('field-hero-sub').value = h.hero_sub || '';

  document.getElementById('field-about-intro').value = a.intro || '';
  document.getElementById('field-about-bio').value = a.bio || '';

  renderFeaturedCheckboxes();
  renderHighlights();
  renderActivityList();
  renderAchievements();
  renderStats();
}

function renderStats() {
  const activities = draft.activities || [];
  const enabled = activities.filter(a => a.enabled).length;
  const pubAch = achievements.filter(a => a.public).length;
  const totalAch = achievements.length;
  const socials = Object.values(draft.social || {}).filter(v => v && v.trim()).length;

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card"><div class="stat-label">Activities</div><div class="stat-value accent">${enabled} / ${activities.length}</div></div>
    <div class="stat-card"><div class="stat-label">Achievements</div><div class="stat-value success">${pubAch} published</div></div>
    <div class="stat-card"><div class="stat-label">Total Achievements</div><div class="stat-value">${totalAch}</div></div>
    <div class="stat-card"><div class="stat-label">Social Links</div><div class="stat-value">${socials}</div></div>`;
}

function renderFeaturedCheckboxes() {
  const activities = (draft.activities || []).filter(a => a.enabled);
  const featured = (draft.home || {}).featured || [];
  document.getElementById('featured-checkboxes').innerHTML = activities.length
    ? activities.map(a => `
      <label style="display:flex;align-items:center;gap:10px;padding:10px;cursor:pointer;border-radius:8px;transition:background 0.2s;" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background='transparent'">
        <input type="checkbox" value="${a.id}" ${featured.includes(a.id) ? 'checked' : ''}
          style="width:18px;height:18px;accent-color:var(--accent);">
        <i class="fas ${a.icon}" style="color:${a.color};width:20px;text-align:center;"></i>
        <span style="font-size:14px;font-weight:500;">${a.title}</span>
      </label>`).join('')
    : '<p style="color:var(--muted);font-size:14px;">No activities created yet.</p>';
}

function renderHighlights() {
  const highlights = (draft.about || {}).highlights || [];
  document.getElementById('highlights-list').innerHTML = highlights.map((h, i) => `
    <div style="display:flex;gap:8px;margin-bottom:8px;">
      <input type="text" class="form-input" value="${escapeHtml(h)}" onchange="updateHighlight(${i}, this.value)" style="flex:1;">
      <button class="icon-btn danger" onclick="removeHighlight(${i})"><i class="fas fa-trash"></i></button>
    </div>`).join('');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function addHighlight() {
  if (!draft.about) draft.about = {};
  if (!draft.about.highlights) draft.about.highlights = [];
  draft.about.highlights.push('');
  renderHighlights();
}

function updateHighlight(i, val) { draft.about.highlights[i] = val; }
function removeHighlight(i) { draft.about.highlights.splice(i, 1); renderHighlights(); }

function renderActivityList() {
  const activities = draft.activities || [];
  if (!activities.length) {
    document.getElementById('activity-list').innerHTML =
      '<div class="empty-state"><i class="fas fa-folder-open"></i><p>No activities yet. Create your first one!</p></div>';
    return;
  }
  document.getElementById('activity-list').innerHTML = activities.map(a => `
    <div class="activity-item">
      <div class="activity-info">
        <div class="activity-icon" style="background:${a.color}22;color:${a.color};"><i class="fas ${a.icon}"></i></div>
        <div>
          <div class="activity-name">${a.title}</div>
          <div class="activity-desc">${(a.description || '').substring(0, 60)}${(a.description || '').length > 60 ? '...' : ''}</div>
        </div>
      </div>
      <div class="activity-actions">
        <button class="toggle ${a.enabled ? 'active' : ''}" onclick="toggleActivity('${a.id}')" title="Toggle"></button>
        <button class="icon-btn" onclick="editActivity('${a.id}')" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="icon-btn danger" onclick="deleteActivity('${a.id}')" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

function openActivityModal() {
  document.getElementById('act-edit-id').value = '';
  document.getElementById('act-field-title').value = '';
  document.getElementById('act-field-icon').value = 'fa-star';
  document.getElementById('act-field-color').value = '#3b82f6';
  document.getElementById('act-field-enabled').classList.add('active');
  document.getElementById('act-field-desc').value = '';
  document.getElementById('act-field-achs').value = '';
  document.getElementById('act-modal-title').textContent = 'New Activity';
  openModal('activity-modal');
}

function editActivity(id) {
  const act = (draft.activities || []).find(a => a.id === id);
  if (!act) return;
  document.getElementById('act-edit-id').value = id;
  document.getElementById('act-field-title').value = act.title || '';
  document.getElementById('act-field-icon').value = act.icon || 'fa-star';
  document.getElementById('act-field-color').value = act.color || '#3b82f6';
  const toggle = document.getElementById('act-field-enabled');
  act.enabled ? toggle.classList.add('active') : toggle.classList.remove('active');
  document.getElementById('act-field-desc').value = act.description || '';
  document.getElementById('act-field-achs').value = (act.achievements || []).join('\n');
  document.getElementById('act-modal-title').textContent = 'Edit Activity';
  openModal('activity-modal');
}

function saveActivity() {
  const editId = document.getElementById('act-edit-id').value;
  const data = {
    id: editId || 'act_' + Date.now(),
    title: document.getElementById('act-field-title').value,
    icon: document.getElementById('act-field-icon').value || 'fa-star',
    color: document.getElementById('act-field-color').value,
    enabled: document.getElementById('act-field-enabled').classList.contains('active'),
    description: document.getElementById('act-field-desc').value,
    achievements: document.getElementById('act-field-achs').value.split('\n').filter(x => x.trim()),
    images: [], videos: []
  };
  if (!draft.activities) draft.activities = [];
  if (editId) {
    const idx = draft.activities.findIndex(a => a.id === editId);
    if (idx >= 0) { data.images = draft.activities[idx].images || []; data.videos = draft.activities[idx].videos || []; draft.activities[idx] = data; }
  } else { draft.activities.push(data); }
  closeModal('activity-modal');
  renderActivityList(); renderFeaturedCheckboxes(); renderStats();
  toast('Activity saved (draft)');
}

function toggleActivity(id) {
  const act = (draft.activities || []).find(a => a.id === id);
  if (act) { act.enabled = !act.enabled; renderActivityList(); renderFeaturedCheckboxes(); renderStats(); }
}

function deleteActivity(id) {
  if (!confirm('Delete this activity?')) return;
  draft.activities = (draft.activities || []).filter(a => a.id !== id);
  renderActivityList(); renderFeaturedCheckboxes(); renderStats();
  toast('Activity deleted (draft)');
}

function renderAchievements() {
  const tbody = document.getElementById('ach-tbody');
  const empty = document.getElementById('ach-empty');
  const count = document.getElementById('ach-count');
  count.textContent = `${achievements.length} total, ${achievements.filter(a => a.public).length} published`;
  if (!achievements.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  tbody.innerHTML = achievements.map(ach => {
    const color = categoryColors[ach.category] || categoryColors.default;
    const dateStr = ach.date ? new Date(ach.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—';
    return `<tr>
      <td><strong>${escapeHtml(ach.achievement)}</strong></td>
      <td><span class="ach-badge" style="background:${color}22;color:${color};">${escapeHtml(ach.category || '—')}</span></td>
      <td style="color:var(--text2);">${dateStr}</td>
      <td><button class="toggle ${ach.public ? 'active' : ''}" onclick="toggleAchPublic('${ach.id}')"></button></td>
      <td><div style="display:flex;gap:6px;">
        <button class="icon-btn" onclick="editAchievement('${ach.id}')" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="icon-btn danger" onclick="deleteAchievement('${ach.id}')" title="Delete"><i class="fas fa-trash"></i></button>
      </div></td>
    </tr>`;
  }).join('');
}

function openAchModal() {
  document.getElementById('ach-edit-id').value = '';
  document.getElementById('ach-field-title').value = '';
  document.getElementById('ach-field-date').value = '';
  document.getElementById('ach-field-category').value = '';
  document.getElementById('ach-field-desc').value = '';
  document.getElementById('ach-field-role').value = '';
  document.getElementById('ach-field-result').value = '';
  document.getElementById('ach-field-skills').value = '';
  document.getElementById('ach-field-evidence-url').value = '';
  document.getElementById('ach-field-evidence-desc').value = '';
  document.getElementById('ach-field-public').classList.add('active');
  document.getElementById('ach-modal-title').textContent = 'New Achievement';
  openModal('ach-modal');
}

function editAchievement(id) {
  const ach = achievements.find(a => a.id === id);
  if (!ach) return;
  document.getElementById('ach-edit-id').value = id;
  document.getElementById('ach-field-title').value = ach.achievement || '';
  document.getElementById('ach-field-date').value = ach.date || '';
  document.getElementById('ach-field-category').value = ach.category || '';
  document.getElementById('ach-field-desc').value = ach.description || '';
  document.getElementById('ach-field-role').value = ach.role || '';
  document.getElementById('ach-field-result').value = ach.result || '';
  document.getElementById('ach-field-skills').value = (ach.skills || []).join('\n');
  document.getElementById('ach-field-evidence-url').value = (ach.evidence || {}).url || '';
  document.getElementById('ach-field-evidence-desc').value = (ach.evidence || {}).description || '';
  const toggle = document.getElementById('ach-field-public');
  ach.public !== false ? toggle.classList.add('active') : toggle.classList.remove('active');
  document.getElementById('ach-modal-title').textContent = 'Edit Achievement';
  openModal('ach-modal');
}

function saveAchievement() {
  const editId = document.getElementById('ach-edit-id').value;
  const data = {
    id: editId || 'ach_' + Date.now(),
    achievement: document.getElementById('ach-field-title').value,
    date: document.getElementById('ach-field-date').value,
    category: document.getElementById('ach-field-category').value,
    description: document.getElementById('ach-field-desc').value,
    role: document.getElementById('ach-field-role').value,
    result: document.getElementById('ach-field-result').value,
    skills: document.getElementById('ach-field-skills').value.split('\n').filter(x => x.trim()),
    evidence: { url: document.getElementById('ach-field-evidence-url').value, description: document.getElementById('ach-field-evidence-desc').value },
    public: document.getElementById('ach-field-public').classList.contains('active')
  };
  if (editId) { const idx = achievements.findIndex(a => a.id === editId); if (idx >= 0) achievements[idx] = data; }
  else achievements.push(data);
  closeModal('ach-modal'); renderAchievements(); renderStats();
  toast('Achievement saved (draft)');
}

function toggleAchPublic(id) {
  const ach = achievements.find(a => a.id === id);
  if (ach) { ach.public = !ach.public; renderAchievements(); renderStats(); }
}

function deleteAchievement(id) {
  if (!confirm('Delete this achievement?')) return;
  achievements = achievements.filter(a => a.id !== id);
  renderAchievements(); renderStats();
  toast('Achievement deleted (draft)');
}

async function saveSiteSettings() {
  draft.site = {
    name: document.getElementById('field-name').value,
    title: document.getElementById('field-title').value,
    tagline: document.getElementById('field-tagline').value,
    description: document.getElementById('field-desc').value,
    email: document.getElementById('field-email').value,
    footer: document.getElementById('field-footer').value
  };
  draft.social = {
    linkedin: document.getElementById('field-linkedin').value,
    github: document.getElementById('field-github').value,
    facebook: document.getElementById('field-facebook').value,
    twitter: document.getElementById('field-twitter').value,
    instagram: document.getElementById('field-instagram').value
  };
  await saveDraft();
}

async function saveHomePage() {
  draft.home = {
    hero_text: document.getElementById('field-hero-text').value,
    hero_sub: document.getElementById('field-hero-sub').value,
    featured: [...document.querySelectorAll('#featured-checkboxes input:checked')].map(cb => cb.value)
  };
  await saveDraft();
}

async function saveAboutPage() {
  draft.about = { ...draft.about, intro: document.getElementById('field-about-intro').value, bio: document.getElementById('field-about-bio').value };
  await saveDraft();
}

async function saveActivities() { await saveDraft(); }

async function saveDraft() {
  try {
    await fetch('/api/draft/site', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft)
    });
    await fetch('/api/draft/achievements', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(achievements)
    });
    toast('Saved to draft');
  } catch (err) { toast('Error saving', 'error'); }
}

async function publishSite() {
  try {
    await saveDraft();
    const res = await fetch('/api/publish', { method: 'POST' });
    if (res.ok) toast('Site published!', 'success');
    else toast('Publish failed', 'error');
  } catch (err) { toast('Publish error', 'error'); }
}

function showSection(name) {
  document.querySelectorAll('.editor-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  document.querySelector(`.sidebar-link[data-section="${name}"]`).classList.add('active');
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  const icon = t.querySelector('i');
  t.className = 'toast ' + type;
  icon.className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

document.addEventListener('DOMContentLoaded', checkAuth);
