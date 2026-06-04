/* Shared utilities — loaded on every page */

function initTheme() {
  const saved = localStorage.getItem('fw_theme');
  document.documentElement.setAttribute('data-theme', saved || 'dark');
}

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('fw_theme', next);
}

function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (!nav) return;

  initTheme();
  initResumeLinks();

  const navRight = nav.querySelector('.nav-right');
  if (navRight && !document.getElementById('theme-toggle')) {
    const btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.className = 'theme-toggle-pill';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.innerHTML = `
      <svg class="t-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
      </svg>
      <div class="theme-toggle-track"><div class="theme-toggle-thumb"></div></div>
      <svg class="t-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>`;
    btn.addEventListener('click', toggleTheme);
    navRight.insertBefore(btn, navRight.querySelector('.nav-avatar'));
  }

  initMaintenanceBanner();

  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 20);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links?.addEventListener('click', e => {
    if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  });
  document.addEventListener('click', e => {
    if (!nav.contains(e.target)) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  });
}

async function initMaintenanceBanner() {
  try {
    const r = await fetch('/api/data');
    if (!r.ok) return;
    const { settings } = await r.json();
    if (!settings?.maintenance) return;

    const banner = document.createElement('div');
    banner.id = 'maintenance-banner';
    banner.className = 'maintenance-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = `
      <svg class="maintenance-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <circle cx="12" cy="16" r=".5" fill="currentColor" stroke="none"/>
      </svg>
      <span>This portfolio is currently under maintenance — you might find some bugs or incomplete work.</span>`;

    document.body.insertBefore(banner, document.body.firstChild);

    const nav = document.getElementById('nav');
    if (nav) nav.style.top = banner.offsetHeight + 'px';
  } catch {}
}

function initScrollBar() {
  const bar = document.getElementById('scroll-bar');
  if (!bar) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = max > 0 ? `${(scrollY / max) * 100}%` : '0%';
  };
  addEventListener('scroll', update, { passive: true });
  update();
}

function setActiveNav() {
  const p = location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    const match = href === '/' ? p === '/' : p === href || p.startsWith(href + '/');
    a.classList.toggle('active', match);
  });
}

function observeReveal(items) {
  if (!items?.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  items.forEach(el => io.observe(el));
}

function showToast(msg) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

async function copyEmail(email) {
  try { await navigator.clipboard.writeText(email); showToast('Email copied!'); }
  catch { window.location.href = `mailto:${email}`; }
}

async function initResumeLinks() {
  const links = document.querySelectorAll('[data-resume-link]');
  if (!links.length) return;
  try {
    const r = await fetch('/api/resume/meta');
    if (!r.ok) throw new Error();
    const meta = await r.json();
    if (!meta.available) {
      links.forEach(link => { link.hidden = true; });
      return;
    }
    links.forEach(link => {
      link.href = '/api/resume';
      link.setAttribute('download', meta.filename || 'Resume.pdf');
    });
  } catch {
    links.forEach(link => { link.href = '/api/resume'; });
  }
}

function buildProjectCard(p, i) {
  return `
    <a class="project-card reveal" href="/project/${p.id}">
      <div class="project-img-wrap">
        <div class="project-placeholder">
          ${p.image ? `<img src="${p.image}" alt="" loading="lazy">` : ''}
        </div>
      </div>
      <div class="project-foot">
        <span class="project-foot-title">${p.title}</span>
        <span class="project-foot-arrow">→</span>
      </div>
    </a>`;
}

function openExpModal(e) {
  let overlay = document.getElementById('exp-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'exp-modal-overlay';
    overlay.className = 'exp-modal-overlay';
    overlay.innerHTML = `
      <div class="exp-modal" role="dialog" aria-modal="true">
        <button class="exp-modal-close" aria-label="Close">✕</button>
        <div id="exp-modal-body"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', ev => { if (ev.target === overlay) closeExpModal(); });
    overlay.querySelector('.exp-modal-close').addEventListener('click', closeExpModal);
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeExpModal(); });
  }
  const bullets = e.description
    .split('. ')
    .map(s => s.trim().replace(/\.$/, ''))
    .filter(s => s.length > 8);
  document.getElementById('exp-modal-body').innerHTML = `
    ${e.current ? '<span class="exp-current" style="display:inline-block;margin-bottom:14px">Current</span>' : ''}
    <p class="exp-company">${e.company}</p>
    <h2 style="font-size:1.25rem;font-weight:700;margin:4px 0 8px;line-height:1.2">${e.role}</h2>
    <p class="exp-modal-meta">${e.location} &nbsp;·&nbsp; ${e.period}</p>
    <ul class="exp-modal-bullets">
      ${bullets.map(b => `<li>${b}</li>`).join('')}
    </ul>
    <div class="tags" style="margin-top:20px">
      ${(e.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
    </div>`;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeExpModal() {
  document.getElementById('exp-modal-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

function openPhotoPreview(url, alt) {
  let lb = document.getElementById('shared-lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'shared-lightbox';
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = `<button class="lightbox-close" aria-label="Close">✕</button><img id="shared-lightbox-img" src="" alt=""/>`;
    document.body.appendChild(lb);
    lb.querySelector('.lightbox-close').addEventListener('click', closePhotoPreview);
    lb.addEventListener('click', e => { if (e.target === lb) closePhotoPreview(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && lb.classList.contains('open')) closePhotoPreview(); });
  }
  lb.querySelector('#shared-lightbox-img').src = url;
  lb.querySelector('#shared-lightbox-img').alt = alt || '';
  lb.classList.add('open');
}

function closePhotoPreview() {
  document.getElementById('shared-lightbox')?.classList.remove('open');
}
