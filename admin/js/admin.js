let draft = null;
let achievements = [];
let nowItems = [];
let faqItems = [];
let selectedTheme = 'light';
let authToken = localStorage.getItem('admin_token') || '';

const categoryColors = {
  'Student Council': '#3b82f6', 'STEM': '#10b981', 'Scouts': '#f59e0b',
  'Sports': '#8b5cf6', 'Community': '#ec4899', 'Leadership': '#f97316',
  'Business': '#06b6d4', 'MUN': '#f97316', 'Writing': '#ec4899',
  'default': '#6b7280'
};

async function uploadPhoto(file) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', headers: authHeaders(), body: formData });
    if (res.ok) { const data = await res.json(); return data.url; }
    else { toast('Upload failed', 'error'); return null; }
  } catch { toast('Upload error', 'error'); return null; }
}

function photoUploadHtml(id, label) {
  return `<div class="photo-upload-area" onclick="document.getElementById('${id}').click()">
    <input type="file" id="${id}" accept="image/*" onchange="handlePhotoUpload(this, '${id.replace('-upload', '-grid')}')">
    <i class="fas fa-camera" style="font-size:16px;margin-bottom:4px;display:block;"></i>${label || 'Click to upload photo'}
  </div>`;
}

async function handlePhotoUpload(input, gridId) {
  if (!input.files.length) return;
  const url = await uploadPhoto(input.files[0]);
  if (!url) return;
  const grid = document.getElementById(gridId);
  if (grid) {
    const photos = JSON.parse(grid.dataset.photos || '[]');
    photos.push({ src: url, alt: '' });
    grid.dataset.photos = JSON.stringify(photos);
    renderPhotoGrid(gridId, photos);
  }
  input.value = '';
}

function renderPhotoGrid(gridId, photos) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = photos.map((p, i) => `
    <div class="photo-thumb">
      <img src="${p.src}" alt="${p.alt || ''}">
      <button class="photo-remove" onclick="removePhoto('${gridId}', ${i})"><i class="fas fa-times"></i></button>
    </div>`).join('');
}

function removePhoto(gridId, idx) {
  const grid = document.getElementById(gridId);
  const photos = JSON.parse(grid.dataset.photos || '[]');
  photos.splice(idx, 1);
  grid.dataset.photos = JSON.stringify(photos);
  renderPhotoGrid(gridId, photos);
}

async function uploadActivityPhoto(input) {
  if (!input.files.length) return;
  const url = await uploadPhoto(input.files[0]);
  if (!url) return;
  const grid = document.getElementById('act-photo-grid');
  const photos = JSON.parse(grid.dataset.photos || '[]');
  photos.push({ src: url, alt: '' });
  grid.dataset.photos = JSON.stringify(photos);
  renderPhotoGrid('act-photo-grid', photos);
  input.value = '';
}

async function uploadAchPhoto(input) {
  if (!input.files.length) return;
  const url = await uploadPhoto(input.files[0]);
  if (!url) return;
  const grid = document.getElementById('ach-photo-grid');
  const photos = JSON.parse(grid.dataset.photos || '[]');
  photos.push({ src: url, alt: '' });
  grid.dataset.photos = JSON.stringify(photos);
  renderPhotoGrid('ach-photo-grid', photos);
  input.value = '';
}

function authHeaders() {
  return authToken ? { 'Authorization': 'Bearer ' + authToken } : {};
}

async function checkAuth() {
    const res = await fetch('/api/auth/check', { credentials: 'include', headers: authHeaders() });
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
  const savedTheme = localStorage.getItem('site_theme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = document.getElementById('login-user').value;
  const pass = document.getElementById('login-pass').value;
    const res = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });
  if (res.ok) {
    const data = await res.json();
    if (data.token) {
      authToken = data.token;
      localStorage.setItem('admin_token', data.token);
    }
    showAdmin(); loadDraft();
  }
  else { document.getElementById('login-error').style.display = 'block'; }
});

function logout() {
  fetch('/api/logout', { method: 'POST', headers: authHeaders() });
  authToken = '';
  localStorage.removeItem('admin_token');
  showLogin();
}

async function loadDraft() {
  try {
    const res = await fetch('/api/draft', { headers: authHeaders() });
    const data = await res.json();
  draft = data.site || {};
  achievements = data.achievements || [];
  nowItems = draft.now || [];
  faqItems = draft.faq || [];
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

  selectedTheme = (draft.site || {}).theme || localStorage.getItem('site_theme') || 'light';
  document.body.setAttribute('data-theme', selectedTheme);
  document.querySelectorAll('.theme-pick').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === selectedTheme);
  });

  renderFeaturedCheckboxes();
  renderHighlights();
  renderHeroPhrases();
  renderNowList();
  renderActivityList();
  renderAchievements();
  renderFaqList();
  renderContactSettings();
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

function renderHeroPhrases() {
  const phrases = (draft.home || {}).hero_phrases || [];
  document.getElementById('hero-phrases-list').innerHTML = phrases.length ? phrases.map((p, i) => `
    <div style="display:flex;gap:8px;margin-bottom:8px;">
      <input type="text" class="form-input" value="${escapeHtml(p)}" onchange="updateHeroPhrase(${i}, this.value)" style="flex:1;">
      <button class="icon-btn danger" onclick="removeHeroPhrase(${i})"><i class="fas fa-trash"></i></button>
    </div>`).join('') : '<p style="color:var(--muted);font-size:13px;">No phrases yet. Add what you want to rotate in the hero.</p>';
}

function addHeroPhrase() {
  if (!draft.home) draft.home = {};
  if (!draft.home.hero_phrases) draft.home.hero_phrases = [];
  draft.home.hero_phrases.push('');
  renderHeroPhrases();
}

function updateHeroPhrase(i, val) { draft.home.hero_phrases[i] = val; }
function removeHeroPhrase(i) { draft.home.hero_phrases.splice(i, 1); renderHeroPhrases(); }

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

function renderNowList() {
  if (!nowItems.length) {
    document.getElementById('now-list').innerHTML =
      '<p style="color:var(--muted);font-size:13px;">No items yet. Add what you\'re working on.</p>';
    return;
  }
  document.getElementById('now-list').innerHTML = nowItems.map((item, i) => `
    <div class="activity-item">
      <div class="activity-info">
        <div class="activity-icon" style="background:var(--accent);22;color:var(--accent);"><i class="fas ${item.icon}"></i></div>
        <div>
          <div class="activity-name">${escapeHtml(item.title)}</div>
          <div class="activity-desc">${escapeHtml(item.description)}</div>
        </div>
      </div>
      <div class="activity-actions">
        <button class="icon-btn" onclick="editNowItem(${i})" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="icon-btn danger" onclick="deleteNowItem(${i})" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

function openNowModal() {
  document.getElementById('now-edit-idx').value = '';
  document.getElementById('now-field-title').value = '';
  document.getElementById('now-field-icon').value = 'fa-star';
  document.getElementById('now-field-desc').value = '';
  document.getElementById('now-modal-title').textContent = 'Add Now Item';
  openModal('now-modal');
}

function editNowItem(idx) {
  const item = nowItems[idx];
  if (!item) return;
  document.getElementById('now-edit-idx').value = idx;
  document.getElementById('now-field-title').value = item.title || '';
  document.getElementById('now-field-icon').value = item.icon || 'fa-star';
  document.getElementById('now-field-desc').value = item.description || '';
  document.getElementById('now-modal-title').textContent = 'Edit Now Item';
  openModal('now-modal');
}

function saveNowItem() {
  const idx = document.getElementById('now-edit-idx').value;
  const item = {
    icon: document.getElementById('now-field-icon').value || 'fa-star',
    title: document.getElementById('now-field-title').value,
    description: document.getElementById('now-field-desc').value
  };
  if (idx !== '') { nowItems[parseInt(idx)] = item; }
  else { nowItems.push(item); }
  draft.now = nowItems;
  closeModal('now-modal');
  renderNowList();
  saveNow();
}

function deleteNowItem(idx) {
  if (!confirm('Delete this item?')) return;
  nowItems.splice(idx, 1);
  draft.now = nowItems;
  renderNowList();
  saveNow();
}

async function saveNow() {
  draft.now = nowItems;
  await saveDraft();
}

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
  const grid = document.getElementById('act-photo-grid');
  grid.dataset.photos = '[]';
  renderPhotoGrid('act-photo-grid', []);
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
  const photos = act.images || [];
  const grid = document.getElementById('act-photo-grid');
  grid.dataset.photos = JSON.stringify(photos);
  renderPhotoGrid('act-photo-grid', photos);
  document.getElementById('act-modal-title').textContent = 'Edit Activity';
  openModal('activity-modal');
}

function saveActivity() {
  const editId = document.getElementById('act-edit-id').value;
  const actPhotos = JSON.parse(document.getElementById('act-photo-grid').dataset.photos || '[]');
  const data = {
    id: editId || 'act_' + Date.now(),
    title: document.getElementById('act-field-title').value,
    icon: document.getElementById('act-field-icon').value || 'fa-star',
    color: document.getElementById('act-field-color').value,
    enabled: document.getElementById('act-field-enabled').classList.contains('active'),
    description: document.getElementById('act-field-desc').value,
    achievements: document.getElementById('act-field-achs').value.split('\n').filter(x => x.trim()),
    images: actPhotos, videos: []
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
  const container = document.getElementById('ach-list');
  const empty = document.getElementById('ach-empty');
  const count = document.getElementById('ach-count');
  count.textContent = `${achievements.length} total, ${achievements.filter(a => a.public).length} published`;
  if (!achievements.length) { container.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  container.innerHTML = achievements.map((ach, i) => {
    const color = categoryColors[ach.category] || categoryColors.default;
    const dateStr = ach.date ? new Date(ach.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
    const hasPhoto = ach.photos && ach.photos.length;
    const side = i % 2 === 0 ? 'left' : 'right';
    const photoHtml = hasPhoto
      ? `<img src="${ach.photos[0].src}" alt="${escapeHtml(ach.achievement)}" style="width:100%;height:100%;object-fit:cover;display:block;">`
      : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-size:24px;"><i class="fas fa-image"></i></div>`;
    return `<div class="ach-admin-card" draggable="true" data-ach-id="${ach.id}" data-ach-index="${i}">
      <div class="ach-drag-handle" draggable="true"><i class="fas fa-grip-vertical"></i></div>
      <div class="ach-admin-row" style="flex-direction:${side === 'right' ? 'row-reverse' : 'row'}">
        <div class="ach-admin-media">${photoHtml}</div>
        <div class="ach-admin-text">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px;">
            <div>
              <div style="font-size:17px;font-weight:700;letter-spacing:-0.2px;">${escapeHtml(ach.achievement)}</div>
              <span class="ach-badge" style="background:${color}22;color:${color};display:inline-block;padding:2px 10px;font-size:12px;font-weight:500;margin-top:4px;">${escapeHtml(ach.category || '')}</span>
            </div>
            ${dateStr ? `<span style="font-size:13px;color:var(--text2);white-space:nowrap;">${dateStr}</span>` : ''}
          </div>
          <p style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:12px;">${escapeHtml(ach.description || '')}</p>
          <div style="display:flex;gap:12px;font-size:12px;color:var(--text2);margin-bottom:10px;flex-wrap:wrap;">
            ${ach.role ? `<div><span style="color:var(--muted);text-transform:uppercase;font-size:10px;letter-spacing:0.5px;">Role</span><br>${escapeHtml(ach.role)}</div>` : ''}
            ${ach.result ? `<div><span style="color:var(--muted);text-transform:uppercase;font-size:10px;letter-spacing:0.5px;">Result</span><br>${escapeHtml(ach.result)}</div>` : ''}
          </div>
          ${ach.skills && ach.skills.length ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;">${ach.skills.map(s => `<span style="font-size:11px;padding:2px 8px;background:var(--surface);border:1px solid var(--border);border-radius:4px;color:var(--text2);">${escapeHtml(s)}</span>`).join('')}</div>` : ''}
          <div style="display:flex;gap:6px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
            <button class="btn btn-ghost btn-sm" onclick="editAchievement('${ach.id}')"><i class="fas fa-pen"></i> Edit</button>
            <button class="toggle ${ach.public ? 'active' : ''}" onclick="toggleAchPublic('${ach.id}')" style="margin:0;"></button>
            <button class="btn btn-ghost btn-sm danger" onclick="deleteAchievement('${ach.id}')"><i class="fas fa-trash"></i> Delete</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
  initDragReorder();
}

function initDragReorder() {
  const container = document.getElementById('ach-list');
  if (container.dataset.dragInit) return;
  container.dataset.dragInit = '1';
  let dragSrcIdx = null;
  let scrollInterval = null;

  container.addEventListener('dragstart', e => {
    const card = e.target.closest('.ach-admin-card');
    if (!card) return;
    dragSrcIdx = parseInt(card.dataset.achIndex);
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  container.addEventListener('dragover', e => {
    e.preventDefault();
    const card = e.target.closest('.ach-admin-card');
    if (!card || parseInt(card.dataset.achIndex) === dragSrcIdx) return;
    card.classList.add('drag-over');

    const threshold = 80;
    if (e.clientY < threshold) startScroll(-10);
    else if (e.clientY > window.innerHeight - threshold) startScroll(10);
    else stopScroll();
  });

  function startScroll(delta) {
    if (scrollInterval) return;
    scrollInterval = setInterval(() => { window.scrollBy(0, delta); }, 20);
  }
  function stopScroll() {
    if (scrollInterval) { clearInterval(scrollInterval); scrollInterval = null; }
  }

  container.addEventListener('dragleave', e => {
    const card = e.target.closest('.ach-admin-card');
    if (card) card.classList.remove('drag-over');
  });

  container.addEventListener('drop', e => {
    e.preventDefault(); stopScroll();
    const card = e.target.closest('.ach-admin-card');
    if (!card || dragSrcIdx === null) return;
    const dropIdx = parseInt(card.dataset.achIndex);
    if (dragSrcIdx === dropIdx) return;
    const item = achievements.splice(dragSrcIdx, 1)[0];
    achievements.splice(dropIdx, 0, item);
    dragSrcIdx = null;
    saveAchievementOrder();
    renderAchievements();
  });

  container.addEventListener('dragend', () => {
    stopScroll();
    container.querySelectorAll('.ach-admin-card').forEach(c => {
      c.classList.remove('dragging', 'drag-over');
    });
    dragSrcIdx = null;
  });
}

function saveAchievementOrder() {
  fetch('/api/draft/achievements', {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(achievements)
  }).then(r => r.json()).then(d => {
    if (d.success) toast('Order saved');
    else toast('Failed to save order', 'error');
  }).catch(() => toast('Failed to save order', 'error'));
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
  const grid = document.getElementById('ach-photo-grid');
  grid.dataset.photos = '[]';
  renderPhotoGrid('ach-photo-grid', []);
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
  const photos = ach.photos || [];
  const grid = document.getElementById('ach-photo-grid');
  grid.dataset.photos = JSON.stringify(photos);
  renderPhotoGrid('ach-photo-grid', photos);
  document.getElementById('ach-modal-title').textContent = 'Edit Achievement';
  openModal('ach-modal');
}

function saveAchievement() {
  const editId = document.getElementById('ach-edit-id').value;
  const achPhotos = JSON.parse(document.getElementById('ach-photo-grid').dataset.photos || '[]');
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
    photos: achPhotos,
    public: document.getElementById('ach-field-public').classList.contains('active')
  };
  if (editId) { const idx = achievements.findIndex(a => a.id === editId); if (idx >= 0) achievements[idx] = data; }
  else achievements.push(data);
  closeModal('ach-modal'); renderAchievements(); renderStats();
  saveAchievementOrder();
}

function toggleAchPublic(id) {
  const ach = achievements.find(a => a.id === id);
  if (ach) { ach.public = !ach.public; renderAchievements(); renderStats(); }
}

function deleteAchievement(id) {
  if (!confirm('Delete this achievement?')) return;
  achievements = achievements.filter(a => a.id !== id);
  saveAchievementOrder();
  renderAchievements(); renderStats();
}

async function saveSiteSettings() {
  draft.site = {
    name: document.getElementById('field-name').value,
    title: document.getElementById('field-title').value,
    tagline: document.getElementById('field-tagline').value,
    description: document.getElementById('field-desc').value,
    email: document.getElementById('field-email').value,
    footer: document.getElementById('field-footer').value,
    theme: selectedTheme
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
      method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(draft)
    });
    await fetch('/api/draft/achievements', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(achievements)
    });
    toast('Saved to draft');
  } catch (err) { toast('Error saving', 'error'); }
}

async function publishSite() {
  try {
    await saveDraft();
    const res = await fetch('/api/publish', { method: 'POST', headers: authHeaders() });
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

async function selectTheme(theme) {
  selectedTheme = theme;
  document.querySelectorAll('.theme-pick').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
  localStorage.setItem('site_theme', theme);
  document.body.setAttribute('data-theme', theme);
  if (draft && draft.site) {
    draft.site.theme = theme;
    await saveDraft();
    toast('Theme saved — click Publish to apply');
  }
}

let editorPage = 'home';
let editorMedia = [];

function switchEditorPage(page, btn) {
  editorPage = page;
  document.querySelectorAll('#section-editor .filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderEditorCanvas();
}

function renderEditorCanvas() {
  const canvas = document.getElementById('editor-canvas');
  if (!canvas) return;
  const s = draft.site || {};
  const h = draft.home || {};
  const a = draft.about || {};
  const now = draft.now || [];
  const acts = draft.activities || [];
  const achs = achievements || [];
  const faq = draft.faq || [];

  switch (editorPage) {
    case 'home':
      canvas.innerHTML = `
        <div style="margin-bottom:32px;">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:8px;">Hero</div>
          <div contenteditable="true" data-field="home.hero_text" class="editor-editable" style="font-size:28px;font-weight:700;letter-spacing:-0.5px;margin-bottom:8px;outline:none;border-bottom:1px dashed transparent;padding:4px 0;" onfocus="this.style.borderColor='var(--accent)'" onblur="updateEditorField(this);this.style.borderColor='transparent'">${h.hero_text || ''}</div>
          <div contenteditable="true" data-field="home.hero_sub" class="editor-editable" style="font-size:14px;color:var(--text2);line-height:1.7;outline:none;border-bottom:1px dashed transparent;padding:4px 0;" onfocus="this.style.borderColor='var(--accent)'" onblur="updateEditorField(this);this.style.borderColor='transparent'">${h.hero_sub || ''}</div>
          ${(h.hero_phrases || []).length ? `
          <div style="margin-top:16px;">
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:8px;">Typewriter Phrases</div>
            ${h.hero_phrases.map((p, i) => `<div contenteditable="true" data-field="home.hero_phrases.${i}" class="editor-editable" style="font-size:13px;color:var(--accent);padding:6px 0;border-bottom:1px solid var(--border);outline:none;" onfocus="this.style.borderColor='var(--accent)'" onblur="updateEditorField(this);this.style.borderColor='var(--border)'">${p}</div>`).join('')}
          </div>` : ''}
        </div>
        <div style="margin-bottom:24px;">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:12px;">Site Info</div>
          <div class="field-row" style="gap:12px;">
            <div>
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">Name</div>
              <div contenteditable="true" data-field="site.name" class="editor-editable" style="font-size:14px;font-weight:500;outline:none;border-bottom:1px dashed transparent;padding:2px 0;" onfocus="this.style.borderColor='var(--accent)'" onblur="updateEditorField(this);this.style.borderColor='transparent'">${s.name || ''}</div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">Tagline</div>
              <div contenteditable="true" data-field="site.tagline" class="editor-editable" style="font-size:14px;color:var(--text2);outline:none;border-bottom:1px dashed transparent;padding:2px 0;" onfocus="this.style.borderColor='var(--accent)'" onblur="updateEditorField(this);this.style.borderColor='transparent'">${s.tagline || ''}</div>
            </div>
          </div>
        </div>
        ${editorMedia.length ? renderEditorMedia() : ''}`;
      break;
    case 'about':
      canvas.innerHTML = `
        <div style="margin-bottom:24px;">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:8px;">Introduction</div>
          <div contenteditable="true" data-field="about.intro" class="editor-editable" style="font-size:15px;color:var(--text2);line-height:1.8;outline:none;border-bottom:1px dashed transparent;padding:4px 0;" onfocus="this.style.borderColor='var(--accent)'" onblur="updateEditorField(this);this.style.borderColor='transparent'">${a.intro || ''}</div>
        </div>
        ${a.highlights && a.highlights.length ? `
        <div style="margin-bottom:24px;">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:8px;">Highlights</div>
          ${a.highlights.map((h, i) => `<div contenteditable="true" data-field="about.highlights.${i}" class="editor-editable" style="font-size:14px;color:var(--text2);padding:8px 0;border-bottom:1px solid var(--border);outline:none;" onfocus="this.style.borderColor='var(--accent)'" onblur="updateEditorField(this);this.style.borderColor='var(--border)'">${h}</div>`).join('')}
        </div>` : ''}
        <div style="margin-bottom:24px;">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:8px;">Bio</div>
          <div contenteditable="true" data-field="about.bio" class="editor-editable" style="font-size:14px;color:var(--text2);line-height:1.8;outline:none;border-bottom:1px dashed transparent;padding:4px 0;" onfocus="this.style.borderColor='var(--accent)'" onblur="updateEditorField(this);this.style.borderColor='transparent'">${a.bio || ''}</div>
        </div>
        ${editorMedia.length ? renderEditorMedia() : ''}`;
      break;
    case 'activities':
      canvas.innerHTML = acts.length ? acts.map(act => `
        <div style="margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid var(--border);">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="width:24px;height:24px;border-radius:4px;background:${act.color}22;color:${act.color};display:flex;align-items:center;justify-content:center;font-size:11px;"><i class="fas ${act.icon}"></i></div>
            <div contenteditable="true" data-field="activity.${act.id}.title" class="editor-editable" style="font-size:16px;font-weight:600;outline:none;" onfocus="this.style.borderColor='var(--accent)'" onblur="updateEditorField(this)">${act.title}</div>
          </div>
          <div contenteditable="true" data-field="activity.${act.id}.description" class="editor-editable" style="font-size:14px;color:var(--text2);line-height:1.7;outline:none;border-bottom:1px dashed transparent;padding:4px 0;" onfocus="this.style.borderColor='var(--accent)'" onblur="updateEditorField(this);this.style.borderColor='transparent'">${act.description || ''}</div>
          ${act.images && act.images.length ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;margin-top:12px;">
            ${act.images.map(img => `<img src="${img.src}" style="width:100%;height:80px;object-fit:cover;border-radius:4px;border:1px solid var(--border);">`).join('')}
          </div>` : ''}
        </div>`).join('') : '<p style="color:var(--muted);">No activities yet.</p>';
      break;
    case 'now':
      canvas.innerHTML = now.length ? `
        <div style="margin-bottom:8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--muted);">Now</div>
        ${now.map((item, i) => `
        <div style="display:flex;align-items:baseline;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
          <div style="color:var(--accent);font-size:13px;flex-shrink:0;"><i class="fas ${item.icon}"></i></div>
          <div contenteditable="true" data-field="now.${i}.title" class="editor-editable" style="font-size:14px;font-weight:500;outline:none;min-width:60px;" onfocus="this.style.borderColor='var(--accent)'" onblur="updateEditorField(this)">${item.title}</div>
          <span style="color:var(--muted);">—</span>
          <div contenteditable="true" data-field="now.${i}.description" class="editor-editable" style="font-size:14px;color:var(--text2);outline:none;flex:1;" onfocus="this.style.borderColor='var(--accent)'" onblur="updateEditorField(this)">${item.description}</div>
        </div>`).join('')}` : '<p style="color:var(--muted);">No items in Now section.</p>';
      break;
    case 'achievements':
      canvas.innerHTML = achs.length ? achs.map((ach, i) => {
        const side = i % 2 === 0 ? 'left' : 'right';
        const hasPhoto = ach.photos && ach.photos.length;
        const photoHtml = hasPhoto
          ? `<img src="${ach.photos[0].src}" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:8px;">`
          : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-size:24px;"><i class="fas fa-image"></i></div>`;
        return `<div style="padding:20px 0;border-bottom:1px solid var(--border);">
          <div style="display:flex;gap:24px;align-items:center;flex-direction:${side === 'right' ? 'row-reverse' : 'row'}">
            <div style="width:200px;min-height:150px;flex-shrink:0;background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;aspect-ratio:4/3;">${photoHtml}</div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;">
                <div contenteditable="true" data-field="achievement.${ach.id}.achievement" class="editor-editable" style="font-size:15px;font-weight:700;outline:none;" onfocus="this.style.borderColor='var(--accent)'" onblur="updateEditorField(this)">${ach.achievement}</div>
                <span style="font-size:12px;color:var(--accent);white-space:nowrap;">${ach.category || ''}</span>
              </div>
              <div contenteditable="true" data-field="achievement.${ach.id}.description" class="editor-editable" style="font-size:13px;color:var(--text2);margin-top:6px;line-height:1.6;outline:none;" onfocus="this.style.borderColor='var(--accent)'" onblur="updateEditorField(this)">${ach.description || ''}</div>
              <div style="display:flex;gap:12px;font-size:12px;color:var(--text2);margin-top:10px;">
                ${ach.role ? `<div><span style="color:var(--muted);text-transform:uppercase;font-size:10px;">Role</span><br>${ach.role}</div>` : ''}
                ${ach.result ? `<div><span style="color:var(--muted);text-transform:uppercase;font-size:10px;">Result</span><br>${ach.result}</div>` : ''}
              </div>
            </div>
          </div>
        </div>`;
      }).join('') : '<p style="color:var(--muted);">No achievements yet.</p>';
      break;
    case 'faq':
      canvas.innerHTML = faq.length ? faq.map((item, i) => `
        <div style="padding:12px 0;border-bottom:1px solid var(--border);">
          <div contenteditable="true" data-field="faq.${i}.question" class="editor-editable" style="font-size:15px;font-weight:600;outline:none;" onfocus="this.style.borderColor='var(--accent)'" onblur="updateEditorField(this)">${item.question}</div>
          <div contenteditable="true" data-field="faq.${i}.answer" class="editor-editable" style="font-size:13px;color:var(--text2);margin-top:4px;outline:none;" onfocus="this.style.borderColor='var(--accent)'" onblur="updateEditorField(this)">${item.answer}</div>
        </div>`).join('') : '<p style="color:var(--muted);">No FAQ items yet.</p>';
      break;
  }
}

function updateEditorField(el) {
  const field = el.dataset.field;
  const val = el.innerText.trim();
  if (!field) return;
  const parts = field.split('.');
  if (parts[0] === 'home') {
    if (!draft.home) draft.home = {};
    if (parts[1] === 'hero_phrases') { draft.home.hero_phrases[parseInt(parts[2])] = val; }
    else { draft.home[parts[1]] = val; }
  }
  else if (parts[0] === 'site') { if (!draft.site) draft.site = {}; draft.site[parts[1]] = val; }
  else if (parts[0] === 'about') {
    if (parts[1] === 'highlights') { draft.about.highlights[parseInt(parts[2])] = val; }
    else { if (!draft.about) draft.about = {}; draft.about[parts[1]] = val; }
  }
  else if (parts[0] === 'now') { draft.now[parseInt(parts[1])][parts[2]] = val; }
  else if (parts[0] === 'activity') {
    const act = (draft.activities || []).find(a => a.id === parts[1]);
    if (act) act[parts[2]] = val;
  }
  else if (parts[0] === 'achievement') {
    const ach = achievements.find(a => a.id === parts[1]);
    if (ach) ach[parts[2]] = val;
  }
  else if (parts[0] === 'faq') {
    if (faqItems[parseInt(parts[1])]) faqItems[parseInt(parts[1])][parts[2]] = val;
  }
  toast('Changed (draft)');
}

function renderEditorMedia() {
  return `<div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border);">
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:8px;">Added Media</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;">
      ${editorMedia.map((m, i) => {
        if (m.type === 'image') return `<div style="position:relative;"><img src="${m.url}" style="width:100%;height:80px;object-fit:cover;border-radius:4px;border:1px solid var(--border);"><button onclick="editorRemoveMedia(${i})" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.7);color:#fff;border:none;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;">x</button></div>`;
        if (m.type === 'video') return `<div style="position:relative;"><iframe src="${m.url}" style="width:100%;aspect-ratio:16/9;border:none;border-radius:4px;" allowfullscreen></iframe><button onclick="editorRemoveMedia(${i})" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.7);color:#fff;border:none;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;">x</button></div>`;
        return '';
      }).join('')}
    </div>
  </div>`;
}

function editorRemoveMedia(idx) { editorMedia.splice(idx, 1); renderEditorCanvas(); }

async function editorAddImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async () => {
    if (!input.files.length) return;
    const url = await uploadPhoto(input.files[0]);
    if (url) { editorMedia.push({ type: 'image', url }); renderEditorCanvas(); toast('Image added (draft)'); }
  };
  input.click();
}

function editorAddVideo() {
  const url = prompt('Paste YouTube URL:');
  if (!url) return;
  let embed = url;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
  if (match) embed = 'https://www.youtube.com/embed/' + match[1];
  editorMedia.push({ type: 'video', url: embed });
  renderEditorCanvas();
  toast('Video added (draft)');
}

function editorAddText() {
  if (!draft.home) draft.home = {};
  if (!draft.home.custom_blocks) draft.home.custom_blocks = [];
  draft.home.custom_blocks.push({ text: 'New text block — click to edit' });
  renderEditorCanvas();
  toast('Text block added (draft)');
}

async function editorSave() {
  await saveDraft();
  toast('Saved to draft — click Publish to make live');
}

function renderFaqList() {
  if (!faqItems.length) {
    document.getElementById('faq-list').innerHTML =
      '<div class="empty-state"><i class="fas fa-question-circle"></i><p>No FAQ items yet. Add your first question!</p></div>';
    return;
  }
  document.getElementById('faq-list').innerHTML = faqItems.map((item, i) => `
    <div class="activity-item">
      <div class="activity-info">
        <div class="activity-icon" style="background:var(--accent);22;color:var(--accent);"><i class="fas fa-question"></i></div>
        <div>
          <div class="activity-name">${escapeHtml(item.question)}</div>
          <div class="activity-desc">${escapeHtml(item.answer).substring(0, 80)}${item.answer.length > 80 ? '...' : ''}</div>
        </div>
      </div>
      <div class="activity-actions">
        <button class="icon-btn" onclick="editFaqItem(${i})" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="icon-btn danger" onclick="deleteFaqItem(${i})" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

function openFaqModal() {
  document.getElementById('faq-edit-idx').value = '';
  document.getElementById('faq-field-question').value = '';
  document.getElementById('faq-field-answer').value = '';
  document.getElementById('faq-modal-title').textContent = 'Add Question';
  openModal('faq-modal');
}

function editFaqItem(idx) {
  const item = faqItems[idx];
  if (!item) return;
  document.getElementById('faq-edit-idx').value = idx;
  document.getElementById('faq-field-question').value = item.question || '';
  document.getElementById('faq-field-answer').value = item.answer || '';
  document.getElementById('faq-modal-title').textContent = 'Edit Question';
  openModal('faq-modal');
}

function saveFaqItem() {
  const idx = document.getElementById('faq-edit-idx').value;
  const item = {
    question: document.getElementById('faq-field-question').value,
    answer: document.getElementById('faq-field-answer').value
  };
  if (idx !== '') { faqItems[parseInt(idx)] = item; }
  else { faqItems.push(item); }
  draft.faq = faqItems;
  closeModal('faq-modal');
  renderFaqList();
  saveFaq();
}

function deleteFaqItem(idx) {
  if (!confirm('Delete this FAQ item?')) return;
  faqItems.splice(idx, 1);
  draft.faq = faqItems;
  renderFaqList();
  saveFaq();
}

async function saveFaq() {
  draft.faq = faqItems;
  await saveDraft();
}

async function saveAchievements() {
  await saveDraft();
  toast('Achievements saved (draft)');
}

function renderContactSettings() {
  const contact = draft.contact || {};
  document.getElementById('field-formspree-id').value = contact.formspree_id || '';
  document.getElementById('field-contact-note').value = contact.note || '';
}

async function saveContact() {
  draft.contact = {
    formspree_id: document.getElementById('field-formspree-id').value,
    note: document.getElementById('field-contact-note').value
  };
  await saveDraft();
}

document.addEventListener('DOMContentLoaded', checkAuth);
