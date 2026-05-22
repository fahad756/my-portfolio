/* Admin panel JS — auth, CRUD for projects / experience / settings */

const TOKEN_KEY = 'fw_admin_token';

// ── Auth helpers ─────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(path, { ...options, headers });
  if (r.status === 401) { clearToken(); showLogin(); throw new Error('Unauthorized'); }
  return r;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, isError = false) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? '#F87171' : '';
  el.removeAttribute('hidden');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.setAttribute('hidden', ''), 2500);
}

// ── View switching ────────────────────────────────────────────────────────────
function showLogin() {
  document.getElementById('login-view').removeAttribute('hidden');
  document.getElementById('dashboard-view').setAttribute('hidden', '');
}
function showDashboard() {
  document.getElementById('login-view').setAttribute('hidden', '');
  document.getElementById('dashboard-view').removeAttribute('hidden');
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');
  const username = form.username.value.trim();
  const password = form.password.value;

  errEl.setAttribute('hidden', '');
  btn.textContent = 'Signing in…';
  btn.disabled = true;

  try {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Invalid credentials');
    setToken(data.token);
    showDashboard();
    await loadAll();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.removeAttribute('hidden');
  } finally {
    btn.textContent = 'Sign in →';
    btn.disabled = false;
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────
async function handleLogout() {
  try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch {}
  clearToken();
  showLogin();
}

// ── Tab navigation ─────────────────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.setAttribute('hidden', ''));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${name}`)?.removeAttribute('hidden');
  document.querySelector(`.nav-item[data-tab="${name}"]`)?.classList.add('active');
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal(title, bodyHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-overlay').removeAttribute('hidden');
}
function closeModal() {
  document.getElementById('modal-overlay').setAttribute('hidden', '');
  document.getElementById('modal-body').innerHTML = '';
}

// ── Image upload helpers ───────────────────────────────────────────────────────
function toBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

async function uploadImage(file) {
  const data = await toBase64(file);
  const r = await apiFetch('/api/images', { method: 'POST', body: JSON.stringify({ data }) });
  if (!r.ok) throw new Error('Image upload failed');
  return (await r.json()).url;
}

function makeImageField(currentUrl = '') {
  return `
    <div class="img-upload-wrap">
      <label class="field-label" style="font-size:.82rem;font-weight:600;color:var(--text-sec);margin-bottom:.3rem;display:block">Project Image</label>
      <div class="img-preview" id="img-preview">
        ${currentUrl
          ? `<img id="img-preview-el" src="${currentUrl}" alt="preview"/>`
          : `<span class="img-preview-placeholder">No image — select file or paste URL</span>`}
      </div>
      <div class="img-actions">
        <input type="url" class="field input img-url-input" id="img-url-input"
          placeholder="https://... (paste image URL)" value="${currentUrl}" style="flex:1;padding:.55rem .8rem;border-radius:8px;border:1px solid var(--border);background:rgba(255,255,255,.03);color:var(--text)"/>
        <label class="btn btn-ghost btn-sm" style="cursor:pointer">
          Upload file
          <input type="file" id="img-file-input" accept="image/*" style="display:none"/>
        </label>
      </div>
    </div>
  `;
}

function wireImageField() {
  const urlInput = document.getElementById('img-url-input');
  const fileInput = document.getElementById('img-file-input');
  const preview = document.getElementById('img-preview');

  function setPreview(src) {
    preview.innerHTML = src
      ? `<img id="img-preview-el" src="${src}" alt="preview" style="width:100%;height:100%;object-fit:cover"/>`
      : `<span class="img-preview-placeholder">No image</span>`;
  }

  urlInput?.addEventListener('input', () => setPreview(urlInput.value.trim()));

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      showToast('Uploading image…');
      const url = await uploadImage(file);
      urlInput.value = url;
      setPreview(url);
      showToast('Image uploaded!');
    } catch {
      showToast('Upload failed', true);
    }
  });
}

// ── PROJECTS ──────────────────────────────────────────────────────────────────
let projectsData = [];

async function loadProjects() {
  try {
    const r = await apiFetch('/api/projects');
    projectsData = await r.json();
    renderProjectsList(projectsData);
  } catch {}
}

function renderProjectsList(list) {
  const el = document.getElementById('projects-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = '<div class="empty-state">No projects yet. Add your first project.</div>';
    return;
  }
  el.innerHTML = list.map(p => `
    <div class="item-card" data-id="${p.id}">
      <div class="item-img">
        ${p.image
          ? `<img src="${p.image}" alt="${p.title}"/>`
          : `<span class="item-img-placeholder">{}</span>`}
      </div>
      <div class="item-info">
        <div class="item-title">${p.title}</div>
        <div class="item-sub">${p.description.slice(0, 80)}…</div>
        <div class="item-tags">${p.tags.map(t => `<span class="item-tag">${t}</span>`).join('')}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-ghost btn-sm" onclick="editProject('${p.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProject('${p.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function projectFormHtml(p = {}) {
  return `
    <div class="field"><label>Title</label><input id="pf-title" type="text" value="${p.title || ''}" required placeholder="Project title"/></div>
    <div class="field"><label>Description</label><textarea id="pf-desc" rows="3" placeholder="Short description…">${p.description || ''}</textarea></div>
    <div class="field"><label>Tags <span class="field-hint">(comma-separated)</span></label><input id="pf-tags" type="text" value="${(p.tags || []).join(', ')}" placeholder="Python, Flask, REST API"/></div>
    <div class="form-row">
      <div class="field"><label>GitHub URL</label><input id="pf-github" type="url" value="${p.github || ''}" placeholder="https://github.com/…"/></div>
      <div class="field"><label>Live URL</label><input id="pf-live" type="url" value="${p.live || ''}" placeholder="https://…"/></div>
    </div>
    ${makeImageField(p.image || '')}
    <div class="form-actions">
      <button class="btn btn-ghost btn-sm" type="button" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary btn-sm" type="button" id="save-project-btn">Save Project</button>
    </div>
  `;
}

function openAddProject() {
  openModal('Add Project', projectFormHtml());
  wireImageField();
  document.getElementById('save-project-btn').onclick = () => saveProject(null);
}

function editProject(id) {
  const p = projectsData.find(x => x.id === id);
  if (!p) return;
  openModal('Edit Project', projectFormHtml(p));
  wireImageField();
  document.getElementById('save-project-btn').onclick = () => saveProject(id);
}

async function saveProject(id) {
  const title = document.getElementById('pf-title')?.value.trim();
  if (!title) { showToast('Title is required', true); return; }
  const body = {
    title,
    description: document.getElementById('pf-desc')?.value.trim() || '',
    tags: (document.getElementById('pf-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean),
    github: document.getElementById('pf-github')?.value.trim() || '',
    live: document.getElementById('pf-live')?.value.trim() || '',
    image: document.getElementById('img-url-input')?.value.trim() || '',
  };
  try {
    const r = await apiFetch(id ? `/api/projects/${id}` : '/api/projects', {
      method: id ? 'PUT' : 'POST', body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error();
    showToast(id ? 'Project updated!' : 'Project added!');
    closeModal();
    await loadProjects();
  } catch { showToast('Failed to save project', true); }
}

async function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  try {
    await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
    showToast('Project deleted');
    await loadProjects();
  } catch { showToast('Delete failed', true); }
}

// ── EXPERIENCE ────────────────────────────────────────────────────────────────
let experienceData = [];

async function loadExperience() {
  try {
    const r = await apiFetch('/api/experience');
    experienceData = await r.json();
    renderExperienceList(experienceData);
  } catch {}
}

function renderExperienceList(list) {
  const el = document.getElementById('experience-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = '<div class="empty-state">No experience entries yet.</div>';
    return;
  }
  el.innerHTML = list.map(e => `
    <div class="item-card" data-id="${e.id}">
      <div class="item-info">
        <div class="item-title">
          ${e.role} — ${e.company}
          ${e.current ? '<span class="item-current">Current</span>' : ''}
        </div>
        <div class="item-sub">${e.period} · ${e.location}</div>
        <div class="item-tags">${e.tags.map(t => `<span class="item-tag">${t}</span>`).join('')}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-ghost btn-sm" onclick="editExperience('${e.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteExperience('${e.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function expFormHtml(e = {}) {
  return `
    <div class="form-row">
      <div class="field"><label>Role / Title</label><input id="ef-role" type="text" value="${e.role || ''}" required placeholder="e.g. Software Developer"/></div>
      <div class="field"><label>Company</label><input id="ef-company" type="text" value="${e.company || ''}" required placeholder="e.g. Acme Corp"/></div>
    </div>
    <div class="form-row">
      <div class="field"><label>Location</label><input id="ef-location" type="text" value="${e.location || ''}" placeholder="e.g. Paris, France · Remote"/></div>
      <div class="field"><label>Period</label><input id="ef-period" type="text" value="${e.period || ''}" placeholder="e.g. Jan 2023 – Present"/></div>
    </div>
    <div class="field">
      <label class="toggle">
        <input type="checkbox" id="ef-current" ${e.current ? 'checked' : ''}/>
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
        <span>Mark as current position</span>
      </label>
    </div>
    <div class="field"><label>Description</label><textarea id="ef-desc" rows="4" placeholder="Key responsibilities and achievements…">${e.description || ''}</textarea></div>
    <div class="field"><label>Tags <span class="field-hint">(comma-separated)</span></label><input id="ef-tags" type="text" value="${(e.tags || []).join(', ')}" placeholder="Python, AWS, Flask"/></div>
    <div class="form-actions">
      <button class="btn btn-ghost btn-sm" type="button" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary btn-sm" type="button" id="save-exp-btn">Save Experience</button>
    </div>
  `;
}

function openAddExperience() {
  openModal('Add Experience', expFormHtml());
  document.getElementById('save-exp-btn').onclick = () => saveExperience(null);
}

function editExperience(id) {
  const e = experienceData.find(x => x.id === id);
  if (!e) return;
  openModal('Edit Experience', expFormHtml(e));
  document.getElementById('save-exp-btn').onclick = () => saveExperience(id);
}

async function saveExperience(id) {
  const role = document.getElementById('ef-role')?.value.trim();
  const company = document.getElementById('ef-company')?.value.trim();
  if (!role || !company) { showToast('Role and Company are required', true); return; }
  const body = {
    role,
    company,
    location: document.getElementById('ef-location')?.value.trim() || '',
    period: document.getElementById('ef-period')?.value.trim() || '',
    current: document.getElementById('ef-current')?.checked || false,
    description: document.getElementById('ef-desc')?.value.trim() || '',
    tags: (document.getElementById('ef-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean),
  };
  try {
    const r = await apiFetch(id ? `/api/experience/${id}` : '/api/experience', {
      method: id ? 'PUT' : 'POST', body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error();
    showToast(id ? 'Experience updated!' : 'Experience added!');
    closeModal();
    await loadExperience();
  } catch { showToast('Failed to save', true); }
}

async function deleteExperience(id) {
  if (!confirm('Delete this experience entry?')) return;
  try {
    await apiFetch(`/api/experience/${id}`, { method: 'DELETE' });
    showToast('Deleted');
    await loadExperience();
  } catch { showToast('Delete failed', true); }
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
async function loadSettings() {
  try {
    const r = await fetch('/api/data');
    const { settings } = await r.json();
    if (!settings) return;
    const f = document.getElementById('settings-form');
    if (!f) return;
    Object.entries(settings).forEach(([k, v]) => {
      const el = f.elements[k];
      if (!el) return;
      if (el.type === 'checkbox') el.checked = Boolean(v);
      else el.value = v || '';
    });
  } catch {}
}

async function handleSettingsSave(e) {
  e.preventDefault();
  const f = e.target;
  const data = {};
  [...f.elements].forEach(el => {
    if (!el.name) return;
    data[el.name] = el.type === 'checkbox' ? el.checked : el.value;
  });
  try {
    const r = await apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify(data) });
    if (!r.ok) throw new Error();
    showToast('Settings saved!');
  } catch { showToast('Failed to save settings', true); }
}

// ── Load all data ─────────────────────────────────────────────────────────────
async function loadAll() {
  await Promise.all([loadProjects(), loadExperience(), loadSettings()]);
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  // Password visibility toggle
  document.getElementById('show-password')?.addEventListener('click', () => {
    const pw = document.getElementById('password');
    if (!pw) return;
    pw.type = pw.type === 'password' ? 'text' : 'password';
  });

  // Login form
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

  // Tab nav
  document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Add buttons
  document.getElementById('add-project-btn')?.addEventListener('click', openAddProject);
  document.getElementById('add-exp-btn')?.addEventListener('click', openAddExperience);

  // Settings form
  document.getElementById('settings-form')?.addEventListener('submit', handleSettingsSave);

  // Modal close
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Check existing token
  const token = getToken();
  if (token) {
    try {
      const r = await apiFetch('/api/projects');
      if (r.ok) { showDashboard(); await loadAll(); return; }
    } catch {}
    clearToken();
  }
  showLogin();
}

document.addEventListener('DOMContentLoaded', init);
