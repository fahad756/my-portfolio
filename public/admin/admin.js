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

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
          ? `<img id="img-preview-el" src="${currentUrl}" alt="preview" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<span class=\\"img-preview-placeholder\\" style=\\"color:#F87171\\">Image not found — re-upload or paste a new URL</span>'"/>`
          : `<span class="img-preview-placeholder">No image — select file or paste URL</span>`}
      </div>
      <div class="img-actions">
        <input type="url" class="field input img-url-input" id="img-url-input"
          placeholder="https://... (paste image URL)" value="${currentUrl}" style="flex:1;padding:.55rem .8rem;border-radius:8px;border:1px solid var(--border);background:rgba(255,255,255,.03);color:var(--text)"/>
        <label class="btn btn-primary btn-sm" style="cursor:pointer;gap:6px">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload from PC
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
    if (!src) {
      preview.innerHTML = `<span class="img-preview-placeholder">No image</span>`;
      return;
    }
    const img = new Image();
    img.alt = 'preview';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
    img.onerror = () => {
      preview.innerHTML = `<span class="img-preview-placeholder" style="color:#F87171">Image not found — check the URL</span>`;
    };
    img.src = src;
    preview.innerHTML = '';
    preview.appendChild(img);
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
    <div class="field"><label>Short Description <span class="field-hint">(shown on cards)</span></label><textarea id="pf-desc" rows="2" placeholder="1–2 sentence summary…">${p.description || ''}</textarea></div>
    <div class="field"><label>Full Description <span class="field-hint">(shown on project page — use newlines for paragraphs)</span></label><textarea id="pf-long" rows="5" placeholder="Detailed description of the project…">${p.longDescription || ''}</textarea></div>
    <div class="field"><label>Tags <span class="field-hint">(comma-separated)</span></label><input id="pf-tags" type="text" value="${(p.tags || []).join(', ')}" placeholder="Python, Flask, REST API"/></div>
    <div class="form-row">
      <div class="field"><label>GitHub URL</label><input id="pf-github" type="url" value="${p.github || ''}" placeholder="https://github.com/…"/></div>
      <div class="field"><label>Live URL</label><input id="pf-live" type="url" value="${p.live || ''}" placeholder="https://…"/></div>
    </div>
    <div class="field">
      <label class="toggle">
        <input type="checkbox" id="pf-featured" ${p.featured ? 'checked' : ''}/>
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
        <span>Show on homepage as featured project</span>
      </label>
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
    longDescription: document.getElementById('pf-long')?.value.trim() || '',
    featured: document.getElementById('pf-featured')?.checked || false,
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
    <div class="item-card" data-id="${escapeHtml(e.id)}" draggable="true">
      <button class="drag-handle" type="button" aria-label="Drag to reorder" title="Drag to reorder">⋮⋮</button>
      <div class="item-info">
        <div class="item-title">
          ${escapeHtml(e.role)} — ${escapeHtml(e.company)}
          ${e.current ? '<span class="item-current">Current</span>' : ''}
        </div>
        <div class="item-sub">${escapeHtml(e.period)} · ${escapeHtml(e.location)}</div>
        <div class="item-tags">${(e.tags || []).map(t => `<span class="item-tag">${escapeHtml(t)}</span>`).join('')}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-ghost btn-sm" onclick="editExperience('${escapeHtml(e.id)}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteExperience('${escapeHtml(e.id)}')">Delete</button>
      </div>
    </div>
  `).join('');
  wireExperienceSorting();
}

function getDragAfterCard(container, y) {
  return [...container.querySelectorAll('.item-card[draggable="true"]:not(.dragging)')]
    .reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

function wireExperienceSorting() {
  const el = document.getElementById('experience-list');
  if (!el) return;

  el.querySelectorAll('.item-card[draggable="true"]').forEach(card => {
    card.addEventListener('dragstart', event => {
      card.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', card.dataset.id);
    });

    card.addEventListener('dragend', async () => {
      card.classList.remove('dragging');
      await saveExperienceOrderFromDom();
    });
  });

  if (!el._experienceDragoverWired) {
    el.addEventListener('dragover', event => {
      event.preventDefault();
      const dragging = el.querySelector('.item-card.dragging');
      if (!dragging) return;
      const after = getDragAfterCard(el, event.clientY);
      if (!after) el.appendChild(dragging);
      else el.insertBefore(dragging, after);
    });
    el._experienceDragoverWired = true;
  }
}

async function saveExperienceOrderFromDom() {
  const el = document.getElementById('experience-list');
  if (!el) return;
  const ids = [...el.querySelectorAll('.item-card[data-id]')].map(card => card.dataset.id);
  const currentIds = experienceData.map(item => item.id);
  if (ids.length !== currentIds.length || ids.every((id, index) => id === currentIds[index])) return;

  const byId = new Map(experienceData.map(item => [item.id, item]));
  experienceData = ids.map(id => byId.get(id)).filter(Boolean);

  try {
    showToast('Saving experience order…');
    const r = await apiFetch('/api/experience/order', {
      method: 'PUT',
      body: JSON.stringify({ ids }),
    });
    if (!r.ok) throw new Error();
    experienceData = await r.json();
    showToast('Experience order saved');
  } catch {
    showToast('Failed to save order', true);
    await loadExperience();
  }
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

// ── PHOTOGRAPHY ───────────────────────────────────────────────────────────────
let photosData = [];

async function loadPhotos() {
  try {
    const r = await apiFetch('/api/photos');
    photosData = await r.json();
    renderPhotosList(photosData);
  } catch {}
}

function renderPhotosList(list) {
  const el = document.getElementById('photos-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = '<div class="empty-state">No photos yet. Add your first photo.</div>';
    return;
  }
  el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-top:4px">${list.map(p => `
    <div style="position:relative;border-radius:8px;overflow:hidden;background:var(--item-bg);border:1px solid var(--border)">
      <img src="${p.url}" alt="${p.alt || ''}" style="width:100%;height:130px;object-fit:cover;display:block"/>
      ${p.caption ? `<div style="padding:8px 10px;font-size:12px;color:var(--text-sec)">${p.caption}</div>` : ''}
      <div style="position:absolute;top:6px;right:6px">
        <button class="btn btn-danger btn-sm" onclick="deletePhoto('${p.id}')" style="padding:4px 8px;font-size:11px">✕</button>
      </div>
    </div>`).join('')}</div>`;
}

function photoFormHtml() {
  return `
    ${makeImageField('')}
    <div class="field"><label>Caption <span class="field-hint">(optional)</span></label><input id="photo-caption" type="text" placeholder="e.g. Sunset in Paris"/></div>
    <div class="field"><label>Alt Text <span class="field-hint">(accessibility, defaults to caption)</span></label><input id="photo-alt" type="text" placeholder="Describe the image…"/></div>
    <div class="form-actions">
      <button class="btn btn-ghost btn-sm" type="button" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary btn-sm" type="button" id="save-photo-btn">Add Photo</button>
    </div>`;
}

function openAddPhoto() {
  openModal('Add Photo', photoFormHtml());
  wireImageField();
  document.getElementById('save-photo-btn').onclick = savePhoto;
}

async function savePhoto() {
  const imageVal = document.getElementById('img-url-input')?.value.trim();
  if (!imageVal) { showToast('Please select or upload an image', true); return; }
  const caption = document.getElementById('photo-caption')?.value.trim() || '';
  const alt = document.getElementById('photo-alt')?.value.trim() || caption;

  try {
    // If it's already been uploaded via wireImageField it will be an /api/images/ URL
    // If it's a base64 string (pasted), upload it first
    let imageData = imageVal;
    if (imageVal.startsWith('http') || imageVal.startsWith('/api/')) {
      // Already a URL — store as external reference
      imageData = imageVal;
    }
    const r = await apiFetch('/api/photos', {
      method: 'POST',
      body: JSON.stringify({ imageData, caption, alt }),
    });
    if (!r.ok) throw new Error();
    showToast('Photo added!');
    closeModal();
    await loadPhotos();
  } catch { showToast('Failed to add photo', true); }
}

async function deletePhoto(id) {
  if (!confirm('Delete this photo?')) return;
  try {
    await apiFetch(`/api/photos/${id}`, { method: 'DELETE' });
    showToast('Photo deleted');
    await loadPhotos();
  } catch { showToast('Delete failed', true); }
}

// ── Load all data ─────────────────────────────────────────────────────────────
// ── RESUME ───────────────────────────────────────────────────────────────
let resumeData = null;

async function loadResume() {
  try {
    const r = await apiFetch('/api/resume/meta');
    resumeData = await r.json();
    renderResumePanel(resumeData);
  } catch {}
}

function renderResumePanel(meta = {}) {
  const el = document.getElementById('resume-panel');
  if (!el) return;

  if (!meta.available) {
    el.innerHTML = `
      <div class="resume-empty">
        <h3>No resume available</h3>
        <p>Upload a PDF to enable the Download CV buttons on the public site.</p>
        <label class="btn btn-primary">
          Upload PDF
          <input class="resume-file-input" id="resume-file-input" type="file" accept="application/pdf,.pdf"/>
        </label>
      </div>`;
    wireResumeControls();
    return;
  }

  const source = meta.source === 'uploaded' ? 'Uploaded resume' : 'Static fallback resume';
  const size = meta.size ? ` · ${formatBytes(meta.size)}` : '';
  const updated = meta.updatedAt ? ` · Updated ${new Date(meta.updatedAt).toLocaleDateString()}` : '';

  el.innerHTML = `
    <div class="resume-current">
      <div class="resume-icon">PDF</div>
      <div>
        <div class="resume-title">${escapeHtml(meta.filename || 'Resume.pdf')}</div>
        <div class="resume-meta">${source}${size}${updated}</div>
      </div>
    </div>
    <form id="resume-rename-form" class="resume-form">
      <div class="field">
        <label for="resume-filename">Download filename</label>
        <input id="resume-filename" type="text" value="${escapeHtml(meta.filename || '')}" placeholder="Fahad Waseem Resume.pdf"/>
      </div>
      <div class="resume-actions">
        <button class="btn btn-primary" type="submit">Rename</button>
        <a class="btn btn-ghost" href="/api/resume" download>Download current</a>
        <label class="btn btn-ghost">
          Reupload PDF
          <input class="resume-file-input" id="resume-file-input" type="file" accept="application/pdf,.pdf"/>
        </label>
        <button class="btn btn-danger" id="delete-resume-btn" type="button">Delete resume</button>
      </div>
    </form>`;
  wireResumeControls();
}

function wireResumeControls() {
  document.getElementById('resume-file-input')?.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadResumeFile(file);
  });

  document.getElementById('resume-rename-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    await renameResume();
  });

  document.getElementById('delete-resume-btn')?.addEventListener('click', deleteResume);
}

async function uploadResumeFile(file) {
  if (file.type && file.type !== 'application/pdf') {
    showToast('Resume must be a PDF', true);
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    showToast('Resume must be under 8 MB', true);
    return;
  }

  try {
    showToast('Uploading resume…');
    const data = await toBase64(file);
    const filename = document.getElementById('resume-filename')?.value.trim() || file.name || 'Resume.pdf';
    const r = await apiFetch('/api/resume', {
      method: 'PUT',
      body: JSON.stringify({ filename, data }),
    });
    if (!r.ok) throw new Error();
    resumeData = await r.json();
    renderResumePanel(resumeData);
    showToast('Resume uploaded');
  } catch {
    showToast('Resume upload failed', true);
  }
}

async function renameResume() {
  const filename = document.getElementById('resume-filename')?.value.trim();
  if (!filename) {
    showToast('Filename is required', true);
    return;
  }

  try {
    const r = await apiFetch('/api/resume', {
      method: 'PUT',
      body: JSON.stringify({ filename }),
    });
    if (!r.ok) throw new Error();
    resumeData = await r.json();
    renderResumePanel(resumeData);
    showToast('Resume renamed');
  } catch {
    showToast('Rename failed', true);
  }
}

async function deleteResume() {
  if (!confirm('Delete the public resume download?')) return;
  try {
    const r = await apiFetch('/api/resume', { method: 'DELETE' });
    if (!r.ok) throw new Error();
    resumeData = await r.json();
    renderResumePanel(resumeData);
    showToast('Resume deleted');
  } catch {
    showToast('Delete failed', true);
  }
}

async function loadAll() {
  await Promise.all([loadProjects(), loadExperience(), loadSettings(), loadPhotos(), loadResume()]);
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
  document.getElementById('add-photo-btn')?.addEventListener('click', openAddPhoto);

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
