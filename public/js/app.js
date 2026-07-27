const socialIcons = {
  linkedin: 'fa-linkedin-in', facebook: 'fa-facebook-f',
  twitter: 'fa-x-twitter', github: 'fa-github', instagram: 'fa-instagram'
};

const categoryColors = {
  'MUN': '#3b82f6', 'Robotics': '#10b981', 'School': '#8b5cf6',
  'STEM': '#10b981', 'Scouts': '#f59e0b', 'Leadership': '#f97316',
  'Community': '#ec4899', 'Sports': '#8b5cf6', 'Business': '#06b6d4',
  'default': '#6b7280'
};

let data = null;
let currentFilter = 'all';
let currentPage = 'home';

function getDraft() { return data.site || {}; }
function getSettings() { return getDraft().site || {}; }
function getSocial() { return getDraft().social || {}; }

async function init() {
  try {
    const res = await fetch('/api/published');
    if (!res.ok) throw new Error('No published content');
    data = await res.json();
  } catch {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Inter,sans-serif;background:#0a0a0b;color:#f5f5f7;flex-direction:column;gap:12px;">
        <h2 style="font-size:20px;font-weight:600;">Site not published yet</h2>
        <p style="color:#a1a1a6;font-size:14px;">Go to <a href="/admin" style="color:#3b82f6;">Admin</a> to publish.</p>
      </div>`;
    return;
  }

  renderNav();
  document.body.setAttribute('data-theme', (getSettings().theme || 'dark'));
  renderPage('home');
  renderFooter();
}

function renderNav() {
  const s = getSettings();
  const social = Object.entries(getSocial()).filter(([_, url]) => url && url.trim());

  const navSocialHtml = social.map(([p, url]) =>
    `<a href="${url}" target="_blank" rel="noopener noreferrer"><i class="fab ${socialIcons[p]}"></i></a>`
  ).join('');

  document.getElementById('nav').innerHTML = `
    <div class="nav-inner">
      <a href="#" class="nav-brand" onclick="navigate('home');return false;">${s.name || ''}</a>
      <button class="menu-toggle" onclick="document.getElementById('nav-links').classList.toggle('open')">
        <i class="fas fa-bars"></i>
      </button>
      <ul class="nav-links" id="nav-links">
        <li><a href="#" data-page="home" onclick="navigate('home');return false;">Home</a></li>
        <li><a href="#" data-page="about" onclick="navigate('about');return false;">About</a></li>
        <li><a href="#" data-page="activities" onclick="navigate('activities');return false;">Activities</a></li>
        <li><a href="#" data-page="achievements" onclick="navigate('achievements');return false;">Achievements</a></li>
      </ul>
      <div class="nav-right">
        <div class="nav-social">${navSocialHtml}</div>
        <a href="/admin" class="edit-btn"><i class="fas fa-pen"></i> Edit</a>
      </div>
    </div>`;
}

function renderPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');

  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  switch (page) {
    case 'home': renderHome(); break;
    case 'about': renderAbout(); break;
    case 'activities': renderActivities(); break;
    case 'achievements': renderAchievements(); break;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigate(page) {
  document.getElementById('nav-links').classList.remove('open');
  renderPage(page);
}

function renderHome() {
  const d = getDraft();
  const h = d.home || {};
  const activities = (d.activities || []).filter(a => a.enabled);
  const featured = (h.featured || []).filter(id => activities.find(a => a.id === id));

  document.getElementById('page-home').innerHTML = `
    <h1 class="hero-text">${h.hero_text || ''}</h1>
    <p class="hero-sub">${h.hero_sub || ''}</p>
    ${featured.length ? `
      <div class="featured-grid">
        ${featured.map(id => {
          const act = activities.find(a => a.id === id);
          if (!act) return '';
          return `
            <div class="featured-card" onclick="navigate('activities')">
              <div class="card-icon" style="background:${act.color}22;color:${act.color};">
                <i class="fas ${act.icon}"></i>
              </div>
              <h3>${act.title}</h3>
              <p>${act.description}</p>
            </div>`;
        }).join('')}
      </div>` : ''}
    ${(data.achievements || []).length ? `
      <div class="ach-grid">
        ${data.achievements.slice(0, 3).map(renderAchievementEntry).join('')}
      </div>` : ''}`;
}

function renderAbout() {
  const a = getDraft().about || {};
  document.getElementById('page-about').innerHTML = `
    <h2 style="font-size:28px;font-weight:700;letter-spacing:-0.5px;margin-bottom:24px;">About</h2>
    <p class="about-intro">${a.intro || ''}</p>
    ${a.highlights && a.highlights.length ? `
      <ul class="highlights-list">
        ${a.highlights.map(h => `<li>${h}</li>`).join('')}
      </ul>` : ''}
    ${a.bio ? `<div class="about-bio">${a.bio}</div>` : ''}`;
}

function renderActivities() {
  const activities = (getDraft().activities || []).filter(a => a.enabled);
  if (!activities.length) {
    document.getElementById('page-activities').innerHTML =
      '<p style="color:var(--muted);padding:40px 0;">No activities published yet.</p>';
    return;
  }

  document.getElementById('page-activities').innerHTML = `
    <h2 style="font-size:28px;font-weight:700;letter-spacing:-0.5px;margin-bottom:24px;">Activities</h2>
    <div class="activity-tabs">
      ${activities.map((a, i) => `
        <button class="activity-tab${i === 0 ? ' active' : ''}" data-activity="${a.id}" onclick="switchActivity('${a.id}')">
          <i class="fas ${a.icon}"></i> ${a.title}
        </button>`).join('')}
    </div>
    ${activities.map((a, i) => `
      <div class="activity-content${i === 0 ? ' active' : ''}" id="activity-${a.id}">
        <div class="activity-card">
          <h3>${a.title}</h3>
          <p>${a.description}</p>
          ${a.achievements && a.achievements.length ? `
            <ul class="ach-list">
              ${a.achievements.map(x => `<li>${x}</li>`).join('')}
            </ul>` : ''}
          ${renderMedia(a)}
        </div>
      </div>`).join('')}`;
}

function switchActivity(id) {
  document.querySelectorAll('.activity-tab').forEach(t => t.classList.toggle('active', t.dataset.activity === id));
  document.querySelectorAll('.activity-content').forEach(c => c.classList.toggle('active', c.id === 'activity-' + id));
}

function renderMedia(act) {
  let html = '';
  const images = act.images || [];
  const videos = act.videos || [];
  if (!images.length && !videos.length) return '';

  html += '<div class="media-grid">';
  images.forEach(img => {
    html += `<div class="media-item">
      <img src="${img.src}" alt="${img.alt || ''}" loading="lazy">
      ${img.caption ? `<div class="media-caption">${img.caption}</div>` : ''}
    </div>`;
  });
  videos.forEach(vid => {
    html += `<div class="media-item">
      <iframe src="${vid.src}" title="${vid.title || ''}" allowfullscreen loading="lazy"></iframe>
      ${vid.title ? `<div class="media-caption">${vid.title}</div>` : ''}
    </div>`;
  });
  html += '</div>';
  return html;
}

function renderAchievements() {
  const achievements = data.achievements || [];
  const categories = [...new Set(achievements.map(a => a.category))];

  document.getElementById('page-achievements').innerHTML = `
    <h2 style="font-size:28px;font-weight:700;letter-spacing:-0.5px;margin-bottom:24px;">Achievements</h2>
    ${categories.length ? `
      <div class="ach-filters">
        <button class="filter-btn active" onclick="filterAchievements('all')">All</button>
        ${categories.map(c => `<button class="filter-btn" onclick="filterAchievements('${c}')">${c}</button>`).join('')}
      </div>` : ''}
    <div class="ach-grid" id="ach-grid">
      ${achievements.length ? achievements.map(renderAchievementEntry).join('') :
        '<p style="color:var(--muted);padding:40px 0;">No achievements published yet.</p>'}
    </div>`;
}

function filterAchievements(cat) {
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', (cat === 'all' && b.textContent === 'All') || b.textContent === cat);
  });
  const achievements = (data.achievements || []).filter(a => cat === 'all' || a.category === cat);
  document.getElementById('ach-grid').innerHTML = achievements.length
    ? achievements.map(renderAchievementEntry).join('')
    : '<p style="color:var(--muted);padding:40px 0;">No achievements in this category.</p>';
}

function renderAchievementEntry(ach) {
  const color = categoryColors[ach.category] || categoryColors.default;
  const dateStr = ach.date ? new Date(ach.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return `
    <div class="ach-entry">
      <div class="ach-header">
        <div>
          <div class="ach-title">${ach.achievement}</div>
          <span class="ach-category" style="background:${color}22;color:${color};">${ach.category}</span>
        </div>
        ${dateStr ? `<span class="ach-date">${dateStr}</span>` : ''}
      </div>
      <p class="ach-desc">${ach.description || ''}</p>
      <div class="ach-details">
        ${ach.role ? `<div><div class="ach-detail-label">Role</div><div class="ach-detail-value">${ach.role}</div></div>` : ''}
        ${ach.result ? `<div><div class="ach-detail-label">Result</div><div class="ach-detail-value">${ach.result}</div></div>` : ''}
      </div>
      ${ach.skills && ach.skills.length ? `
        <div class="ach-skills">
          ${ach.skills.map(s => `<span class="ach-skill">${s}</span>`).join('')}
        </div>` : ''}
      ${ach.evidence && ach.evidence.url ? `
        <div class="ach-evidence">
          <a href="${ach.evidence.url}" target="_blank" rel="noopener noreferrer">
            <i class="fas fa-external-link-alt"></i> ${ach.evidence.description || 'View Evidence'}
          </a>
        </div>` : ''}
    </div>`;
}

function renderFooter() {
  const s = getSettings();
  const social = Object.entries(getSocial()).filter(([_, url]) => url && url.trim());

  document.getElementById('footer').innerHTML = `
    <div class="footer-inner">
      <span class="footer-text">${s.footer || ''}</span>
      <div class="footer-social">
        ${social.map(([p, url]) =>
          `<a href="${url}" target="_blank" rel="noopener noreferrer"><i class="fab ${socialIcons[p]}"></i></a>`
        ).join('')}
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', init);
