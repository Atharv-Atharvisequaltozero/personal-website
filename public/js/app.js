const socialIcons = {
  linkedin: 'fa-linkedin-in', facebook: 'fa-facebook-f',
  twitter: 'fa-x-twitter', github: 'fa-github', instagram: 'fa-instagram'
};

const categoryColors = {
  'MUN': '#f97316', 'Robotics': '#10b981', 'School': '#8b5cf6',
  'STEM': '#10b981', 'Scouts': '#f59e0b', 'Leadership': '#f97316',
  'Community': '#ec4899', 'Sports': '#8b5cf6', 'Business': '#06b6d4',
  'Writing': '#ec4899',
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
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Inter,sans-serif;background:#0c0e14;color:#e8eaf0;flex-direction:column;gap:12px;">
        <h2 style="font-size:20px;font-weight:600;">Site not published yet</h2>
        <p style="color:#a1a1a6;font-size:14px;">Go to <a href="/admin" style="color:#3b82f6;">Admin</a> to publish.</p>
      </div>`;
    return;
  }

  renderNav();
  const savedTheme = localStorage.getItem('site_theme');
  const theme = (getSettings().theme || savedTheme || 'light');
  document.body.setAttribute('data-theme', theme);
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
        <li><a href="#" data-page="contact" onclick="navigate('contact');return false;">Contact</a></li>
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
    case 'contact': renderContact(); break;
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
  const now = d.now || [];
  const phrases = h.hero_phrases || [];

  document.getElementById('page-home').innerHTML = `
    <h1 class="hero-text">${h.hero_text || ''}</h1>
    <p class="hero-sub">${h.hero_sub || ''}</p>
    ${phrases.length ? `
      <div class="typewriter-wrap">
        <span class="typewriter-prefix">Currently: </span>
        <span class="typewriter-text" id="typewriter"></span>
        <span class="typewriter-cursor">|</span>
      </div>` : ''}
    ${now.length ? `
      <div class="now-section">
        <div class="now-heading">Now</div>
        <div class="now-list">
          ${now.map(item => `
            <div class="now-item">
              <div class="now-icon"><i class="fas ${item.icon}"></i></div>
              <div><span class="now-title">${item.title}</span> — ${item.description}</div>
            </div>`).join('')}
        </div>
      </div>` : ''}
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
    ${renderFaqSection()}`;
  
  if (phrases.length) startTypewriter(phrases);
  initCarousels();
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
      ${achievements.length ? achievements.map((a, i) => renderAchievementEntry(a, i)).join('') :
        '<p style="color:var(--muted);padding:40px 0;">No achievements published yet.</p>'}
    </div>`;
  initCarousels();
}

function filterAchievements(cat) {
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', (cat === 'all' && b.textContent === 'All') || b.textContent === cat);
  });
  const achievements = (data.achievements || []).filter(a => cat === 'all' || a.category === cat);
  document.getElementById('ach-grid').innerHTML = achievements.length
    ? achievements.map((a, i) => renderAchievementEntry(a, i)).join('')
    : '<p style="color:var(--muted);padding:40px 0;">No achievements in this category.</p>';
  initCarousels();
}

function renderAchievementEntry(ach, idx) {
  const color = categoryColors[ach.category] || categoryColors.default;
  const dateStr = ach.date ? new Date(ach.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const photos = ach.photos || [];
  const hasMedia = photos.length;
  const side = (idx || 0) % 2 === 0 ? 'left' : 'right';

  const mediaHtml = !hasMedia
    ? `<div class="ach-placeholder"><i class="fas fa-image"></i></div>`
    : photos.length > 1
    ? `<div class="ach-carousel" data-images='${JSON.stringify(photos.map(p => p.src))}'>
        <div class="carousel-track">
          ${photos.map((p, i) => `<div class="carousel-slide${i === 0 ? ' active' : ''}"><img src="${p.src}" alt="${ach.achievement}" loading="lazy"></div>`).join('')}
        </div>
        <div class="carousel-dots">
          ${photos.map((_, i) => `<span class="carousel-dot${i === 0 ? ' active' : ''}"></span>`).join('')}
        </div>
      </div>`
    : `<img src="${photos[0].src}" alt="${ach.achievement}" loading="lazy">`;

  return `
    <div class="ach-entry">
      <div class="ach-row ${side === 'right' ? 'ach-reverse' : ''}">
        <div class="ach-media">${mediaHtml}</div>
        <div class="ach-text">
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
                <i class="fas fa-external-link-alt"></i> ${ach.evidence.description || 'View Details'}
              </a>
            </div>` : ''}
        </div>
      </div>
    </div>`;
}

function renderFaqSection() {
  const faq = getDraft().faq || [];
  if (!faq.length) return '';
  return `
    <div class="faq-section">
      <h2 class="faq-heading">FAQ</h2>
      <div class="faq-list">
        ${faq.map((item, i) => `
          <div class="faq-item" id="faq-${i}">
            <button class="faq-question" onclick="toggleFaq(${i})">
              <span>${item.question}</span>
              <span class="faq-arrow">+</span>
            </button>
            <div class="faq-answer">
              <p>${item.answer}</p>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function toggleFaq(i) {
  const el = document.getElementById('faq-' + i);
  el.classList.toggle('open');
}

function renderContact() {
  const d = getDraft();
  const contact = d.contact || {};
  const social = Object.entries(getSocial()).filter(([_, url]) => url && url.trim());
  const formspreeId = contact.formspree_id;

  document.getElementById('page-contact').innerHTML = `
    <h2 class="section-heading">Contact</h2>
    <div class="contact-links">
      ${social.map(([p, url]) => `
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="contact-link">
          <i class="fab ${socialIcons[p]}"></i> ${p.charAt(0).toUpperCase() + p.slice(1)}
        </a>`).join('')}
      ${(d.site || {}).email ? `
        <a href="mailto:${d.site.email}" class="contact-link">
          <i class="fas fa-envelope"></i> Email
        </a>` : ''}
    </div>
    ${formspreeId ? `
      <form class="contact-form" action="https://formspree.io/f/${formspreeId}" method="POST">
        <label for="contact-name">Name</label>
        <input type="text" id="contact-name" name="name" required placeholder="Your name">
        <label for="contact-email">Email</label>
        <input type="email" id="contact-email" name="email" required placeholder="your@email.com">
        <label for="contact-message">Message</label>
        <textarea id="contact-message" name="message" required placeholder="What's on your mind?" rows="5"></textarea>
        <button type="submit">Send</button>
        <p id="form-status" style="display:none;"></p>
      </form>` : `
      <p style="color:var(--muted);font-size:14px;text-align:center;padding:40px 0;">
        Contact form not configured yet. Add your Formspree ID in the admin panel.
      </p>`}
  `;
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

let typewriterInterval = null;
function startTypewriter(phrases) {
  if (!phrases.length) return;
  const el = document.getElementById('typewriter');
  if (!el) return;
  let phraseIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  let isPaused = false;

  function tick() {
    if (isPaused) return;
    const current = phrases[phraseIdx];
    if (!isDeleting) {
      el.textContent = current.substring(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) {
        isPaused = true;
        setTimeout(() => { isPaused = false; isDeleting = true; tick(); }, 2000);
        return;
      }
      setTimeout(tick, 60 + Math.random() * 40);
    } else {
      el.textContent = current.substring(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        isDeleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        setTimeout(tick, 400);
        return;
      }
      setTimeout(tick, 30);
    }
  }
  tick();
}

function initCarousels() {
  document.querySelectorAll('.ach-carousel').forEach(el => {
    if (el.dataset.carouselInit) return;
    el.dataset.carouselInit = '1';
    const images = JSON.parse(el.dataset.images || '[]');
    if (images.length < 2) return;
    const slides = el.querySelectorAll('.carousel-slide');
    const dots = el.querySelectorAll('.carousel-dot');
    let idx = 0;
    setInterval(() => {
      slides[idx].classList.remove('active');
      if (dots[idx]) dots[idx].classList.remove('active');
      idx = (idx + 1) % images.length;
      slides[idx].classList.add('active');
      if (dots[idx]) dots[idx].classList.add('active');
    }, 3000);
  });
}
