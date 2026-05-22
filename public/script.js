/* Portfolio script — fetches API data, renders sections, handles UI */

const EMAIL = 'fahadwaseem756@gmail.com';
const INITIAL_VISIBLE_PROJECTS = 3;

// ── Data ────────────────────────────────────────────────────────────────────
function getEmbeddedData() {
  try {
    return JSON.parse(document.getElementById('initial-data')?.textContent ?? '{}');
  } catch { return {}; }
}

async function loadData() {
  try {
    const r = await fetch('/api/data');
    if (!r.ok) throw new Error('API error');
    return await r.json();
  } catch {
    return getEmbeddedData();
  }
}

// ── Render: Experience ──────────────────────────────────────────────────────
function renderExperience(list) {
  const el = document.getElementById('work-list');
  if (!el || !list?.length) return;
  el.innerHTML = list.map((e, i) => `
    <article class="exp-card reveal" style="transition-delay:${i * 80}ms">
      ${e.current ? '<span class="exp-current">Current</span>' : ''}
      <div class="exp-header">
        <h3 class="exp-role">${e.role}</h3>
        <span class="exp-period">${e.period}</span>
      </div>
      <p class="exp-company">${e.company}</p>
      <p class="exp-location">${e.location}</p>
      <p class="exp-desc">${e.description}</p>
      <div class="tags">${e.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
    </article>
  `).join('');
  observeReveal(el.querySelectorAll('.reveal'));
}

// ── Render: Projects ─────────────────────────────────────────────────────────
let allProjects = [];
let showingAll = false;

function buildProjectCard(p, index) {
  const imgHtml = p.image
    ? `<img src="${p.image.startsWith('/api/images/') ? p.image : p.image}" alt="${p.title}" loading="lazy"/>`
    : `<div class="project-placeholder"><span class="project-placeholder-icon">{${(index+1).toString().padStart(2,'0')}}</span></div>`;

  const ghLink = p.github ? `<a href="${p.github}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>` : '';
  const liveLink = p.live ? `<a href="${p.live}" target="_blank" rel="noopener noreferrer">Live ↗</a>` : '';

  return `
    <article class="project-card${index >= INITIAL_VISIBLE_PROJECTS ? ' hidden' : ''}" data-id="${p.id}">
      <div class="project-img-wrap">
        ${imgHtml}
        ${(ghLink || liveLink) ? `<div class="project-img-links">${ghLink}${liveLink}</div>` : ''}
      </div>
      <div class="project-body">
        <span class="project-num">${(index+1).toString().padStart(2,'0')}</span>
        <h3 class="project-title">${p.title}</h3>
        <p class="project-desc">${p.description}</p>
        <div class="project-tags">${p.tags.map(t => `<span>${t}</span>`).join('')}</div>
      </div>
    </article>
  `;
}

function renderProjects(list) {
  const grid = document.getElementById('projects-grid');
  const seeAllRow = document.getElementById('see-all-row');
  const seeAllBtn = document.getElementById('see-all-btn');
  if (!grid || !list?.length) return;

  allProjects = list;
  grid.innerHTML = list.map((p, i) => buildProjectCard(p, i)).join('');

  if (list.length > INITIAL_VISIBLE_PROJECTS) {
    seeAllRow?.removeAttribute('hidden');
    const hidden = list.length - INITIAL_VISIBLE_PROJECTS;
    if (seeAllBtn) seeAllBtn.textContent = `See all ${hidden} more project${hidden !== 1 ? 's' : ''} ↓`;
  }

  observeReveal(grid.querySelectorAll('.project-card:not(.hidden)'));
}

function toggleSeeAll() {
  const cards = document.querySelectorAll('#projects-grid .project-card.hidden');
  const btn = document.getElementById('see-all-btn');
  if (!cards.length) return;
  showingAll = true;
  cards.forEach((c, i) => {
    c.classList.remove('hidden');
    c.style.transitionDelay = `${i * 60}ms`;
    // trigger paint before adding visible
    requestAnimationFrame(() => c.classList.add('reveal', 'visible'));
  });
  if (btn) {
    btn.textContent = '↑ Show less';
    btn.onclick = collapseSeeAll;
  }
}

function collapseSeeAll() {
  const grid = document.getElementById('projects-grid');
  const btn = document.getElementById('see-all-btn');
  if (!grid) return;
  showingAll = false;
  const cards = [...grid.querySelectorAll('.project-card')];
  cards.forEach((c, i) => {
    if (i >= INITIAL_VISIBLE_PROJECTS) c.classList.add('hidden');
  });
  const hidden = allProjects.length - INITIAL_VISIBLE_PROJECTS;
  if (btn) {
    btn.textContent = `See all ${hidden} more project${hidden !== 1 ? 's' : ''} ↓`;
    btn.onclick = toggleSeeAll;
  }
  document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
}

// ── Scroll animations ───────────────────────────────────────────────────────
function observeReveal(items) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(el => io.observe(el));
}

// ── Scroll progress bar ──────────────────────────────────────────────────────
function updateScrollBar() {
  const bar = document.getElementById('scroll-bar');
  if (!bar) return;
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.width = max > 0 ? `${(scrollY / max) * 100}%` : '0%';
}

// ── Nav active section highlight ─────────────────────────────────────────────
function setupNavHighlight() {
  const sections = [...document.querySelectorAll('section[id]')];
  const links = [...document.querySelectorAll('.nav-links a')];
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => {
        l.classList.toggle('active', l.getAttribute('href') === `#${e.target.id}`);
      });
    });
  }, { rootMargin: '-40% 0px -55%', threshold: 0 });
  sections.forEach(s => io.observe(s));
}

// ── Nav scrolled state ───────────────────────────────────────────────────────
function setupNavScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const handler = () => nav.classList.toggle('scrolled', scrollY > 20);
  addEventListener('scroll', handler, { passive: true });
  handler();
}

// ── Mobile nav toggle ────────────────────────────────────────────────────────
function setupMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('nav');
  const links = document.getElementById('nav-links');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links?.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ── Copy email ───────────────────────────────────────────────────────────────
function showToast(msg) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(EMAIL);
    showToast('Email copied!');
  } catch {
    window.location.href = `mailto:${EMAIL}`;
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  // Nav
  setupMobileNav();
  setupNavScroll();
  setupNavHighlight();

  // Scroll bar
  addEventListener('scroll', updateScrollBar, { passive: true });

  // Reveal: static elements
  observeReveal(document.querySelectorAll('.reveal'));

  // Copy email button
  document.getElementById('copy-email-btn')?.addEventListener('click', copyEmail);

  // See-all button
  document.getElementById('see-all-btn')?.addEventListener('click', toggleSeeAll);

  // Load & render dynamic data
  const data = await loadData();
  if (data.experience) renderExperience(data.experience);
  if (data.projects)   renderProjects(data.projects);
}

document.addEventListener('DOMContentLoaded', init);
