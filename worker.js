// Cloudflare Worker — Portfolio backend
// Routes: /api/* → handled here | everything else → static assets

const ADMIN_USERNAME = 'fahad756';
// SHA-256 of "pakistan123"
const PASSWORD_HASH = '38a4b906f5cb7a8b0bbfbb3c146bd802b49506aaae7c02d206d9185c54a5daa0';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const DEFAULT = {
  settings: {
    name: 'Fahad Waseem',
    title: 'Backend Developer',
    bio: 'Building backend systems that move data with speed, clarity, and control. Open to full-time backend roles.',
    location: 'Paris, France',
    email: 'fahadwaseem756@gmail.com',
    github: 'https://github.com/FahadWaseem75',
    linkedin: 'https://linkedin.com/in/fahad-waseem',
    available: true,
  },
  projects: [
    {
      id: '1',
      title: 'Polyscribe',
      description: 'Chat-style audio and video transcription platform. Upload a file or record from your browser, transcribe with Groq Whisper, then interact with translations and summaries via Gemini.',
      longDescription: 'Polyscribe is a Python-first web application that brings a chat-style interface to audio and video transcription. Upload a file or record directly from your browser microphone, and Polyscribe uses Groq\'s Whisper speech-to-text API to transcribe it instantly. From there, you can ask for translations or summaries via Gemini. Built with FastAPI, it handles large video files automatically using ffmpeg, manages per-session chat ownership, and gates admin access. Deployed on Render with Docker.\n\nKey features: browser microphone recording, drag-and-drop file upload, real-time transcription, multi-language translation, Gemini-powered Q&A, and per-session chat isolation.',
      tags: ['Python', 'FastAPI', 'Groq API', 'Gemini', 'Docker', 'JavaScript', 'ffmpeg'],
      github: 'https://github.com/fahad756/polyscribe',
      live: 'https://polyscribe.onrender.com',
      image: '',
      featured: true,
    },
    {
      id: '2',
      title: 'HubSpot + ServiceM8 Integration',
      description: 'Flask webhook backend automating HubSpot deal handoffs into ServiceM8 jobs, with CRM association handling, duplicate prevention via stored IDs, and bidirectional status sync.',
      longDescription: 'A production Flask backend that connects HubSpot CRM with ServiceM8 field service management. When a deal stage changes in HubSpot, a webhook fires and the integration creates a corresponding job in ServiceM8 — complete with client details, job type mapping, and custom field synchronization.\n\nDuplicate prevention via stored IDs ensures no double-booking. Status changes in ServiceM8 flow back to update HubSpot deal stages, keeping both systems in sync. Built for a real client as part of work at Workabot.ai.',
      tags: ['Python', 'Flask', 'HubSpot API', 'ServiceM8 API', 'Webhooks', 'REST APIs'],
      github: 'https://github.com/fahad756/FSE-SeriveM8-Integration',
      live: '',
      image: '',
      featured: true,
    },
    {
      id: '3',
      title: 'Student Attendance AI System',
      description: 'Real-time face recognition attendance system using OpenCV and HOG algorithm, with MySQL storage and a PHP web dashboard for records and reporting.',
      longDescription: 'Final-year university project combining computer vision and web development. A Python backend uses OpenCV and the face_recognition library (HOG algorithm) to detect and recognize student faces in real-time from a webcam feed.\n\nWhen a known face is matched against stored encodings, attendance is automatically marked with a timestamp in both CSV and MySQL. Supports simultaneous multi-student recognition. A PHP/HTML dashboard provides staff with attendance records, monthly reports, and student management tools.',
      tags: ['Python', 'OpenCV', 'face_recognition', 'MySQL', 'PHP', 'HOG Algorithm'],
      github: 'https://github.com/fahad756/StudentAttendance-DeepEntityNaming',
      live: '',
      image: '',
      featured: true,
    },
    {
      id: '4',
      title: 'LandingAI Email → HubSpot Sync',
      description: 'Automated pipeline that reads inbound emails, follows JavaScript redirect chains with Playwright, scrapes contact data from landing pages, and syncs it into HubSpot CRM.',
      longDescription: 'A Python automation that runs as a cron-style service to monitor a Gmail inbox for LandingAI form submission emails. It extracts embedded URLs, follows JavaScript-based redirects using Playwright headless browser, scrapes the final landing page for contact info (name, email, preferences), and creates or updates HubSpot contact records.\n\nHandles edge cases like multi-hop redirect chains and missing fields gracefully. All operations are logged with timestamps for auditing.',
      tags: ['Python', 'Gmail IMAP', 'HubSpot API', 'Playwright', 'BeautifulSoup', 'Automation'],
      github: 'https://github.com/fahad756/LandingAI-Form-Email-Integration',
      live: '',
      image: '',
      featured: false,
    },
    {
      id: '5',
      title: 'DevSearch — Developer Platform',
      description: 'Django web app where developers can showcase projects, discover collaborators, and connect through an inbox messaging system.',
      longDescription: 'DevSearch is a Django-powered platform where developers can create detailed profiles, list their projects with tags and links, and discover other developers. Features include user authentication, profile management, a tagging system for project discovery, and an inbox for collaboration requests.\n\nBuilt with Django ORM with clean relationships across users, projects, messages, and skills. Includes a search system to filter developers by tech stack and location.',
      tags: ['Python', 'Django', 'REST APIs', 'HTML/CSS', 'JavaScript', 'PostgreSQL'],
      github: 'https://github.com/fahad756/DevSearch',
      live: '',
      image: '',
      featured: false,
    },
    {
      id: '6',
      title: 'Sales Analytics Dashboard',
      description: 'Business intelligence reports for sales performance, market analysis vs targets, and P&L statements built with Power Query, Power Pivot, and DAX.',
      longDescription: 'An Excel/Power BI analytics project delivering three core business intelligence reports: a Customer Performance report comparing net sales against 2019 benchmarks, a Market Performance vs Target report measuring actual vs target sales by country with percentage variance, and a Profit & Loss statement organized by fiscal year, quarters, and markets.\n\nBuilt using an ETL approach with Power Query for data transformation, Power Pivot for modeling, and DAX calculated measures for KPIs.',
      tags: ['Power BI', 'Power Query', 'DAX', 'Excel', 'ETL', 'Data Analytics'],
      github: 'https://github.com/fahad756/Data-Analysis-Sales-Analytics',
      live: '',
      image: '',
      featured: false,
    },
  ],
  experience: [
    {
      id: '1',
      role: 'Software Developer',
      company: 'Workabot.ai',
      location: 'Dubai, UAE · Remote',
      period: 'Nov 2023 – Present',
      current: true,
      description: 'Developed Python backend applications and Flask serverless services for data integrations and automation workflows. Built AWS Lambda and n8n pipelines, delivered HubSpot CRM integrations with field mapping and bidirectional sync. Maintained enterprise pipelines extending to Power Automate and Samsara data workflows.',
      tags: ['Python', 'Flask', 'AWS Lambda', 'HubSpot', 'SQL', 'n8n', 'Power Automate'],
    },
    {
      id: '2',
      role: 'Junior Software Developer',
      company: 'Learners.ai',
      location: 'Ontario, Canada · Remote',
      period: 'Feb 2023 – Nov 2023',
      current: false,
      description: 'Developed Python automation scripts and backend tools for internal teams. Integrated third-party systems with focus on authentication and data consistency. Supported AWS-based automation, debugging, and deployment.',
      tags: ['Python', 'AWS', 'REST APIs', 'Automation'],
    },
    {
      id: '3',
      role: 'Python Intern',
      company: 'PNY Trainings',
      location: 'Lahore, Pakistan',
      period: 'Jun 2019 – Sep 2019',
      current: false,
      description: 'Built and debugged Python web applications using Django and Flask. Created REST API endpoints, worked on database models, relationships, and application data flow.',
      tags: ['Python', 'Django', 'Flask', 'REST APIs'],
    },
  ],
  photos: [],
};

const DEFAULT_RESUME = {
  filename: 'CV - Fahad Waseem.pdf',
  contentType: 'application/pdf',
  source: 'static',
  updatedAt: null,
  size: null,
  deleted: false,
};

const RESUME_MAX_BYTES = 8 * 1024 * 1024;

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const res = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const err = (msg, status = 400) => res({ error: msg }, status);

async function authed(request, env) {
  const header = request.headers.get('Authorization') ?? '';
  if (!header.startsWith('Bearer ')) return false;
  const token = header.slice(7);
  if (!env.PORTFOLIO_DATA) return false;
  const exp = await env.PORTFOLIO_DATA.get(`session:${token}`);
  return exp !== null && Date.now() < Number(exp);
}

async function kv(env, key, fallback) {
  if (!env.PORTFOLIO_DATA) return fallback;
  const v = await env.PORTFOLIO_DATA.get(key);
  return v ? JSON.parse(v) : fallback;
}

async function kvSet(env, key, value) {
  await env.PORTFOLIO_DATA.put(key, JSON.stringify(value));
}

function safeFilename(name) {
  const cleaned = String(name || DEFAULT_RESUME.filename)
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
  const filename = cleaned || DEFAULT_RESUME.filename;
  return /\.pdf$/i.test(filename) ? filename : `${filename}.pdf`;
}

function contentDisposition(filename) {
  const safe = safeFilename(filename).replace(/["\\]/g, '');
  return `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

function dataUrlToBytes(data) {
  const [header, b64] = String(data || '').split(',');
  if (!header || !b64) return null;
  const mime = (header.match(/data:([^;]+)/) ?? [])[1] ?? 'application/pdf';
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return { bytes, mime };
}

async function resumeMeta(env) {
  const saved = await kv(env, 'portfolio:resume:meta', null);
  return { ...DEFAULT_RESUME, ...(saved || {}) };
}

function resumeClientMeta(meta) {
  const deleted = Boolean(meta.deleted);
  return {
    filename: deleted ? '' : safeFilename(meta.filename),
    contentType: meta.contentType || 'application/pdf',
    source: deleted ? 'none' : meta.source || 'static',
    updatedAt: meta.updatedAt || null,
    size: meta.size || null,
    available: !deleted,
  };
}

async function serveResume(env, url) {
  const meta = await resumeMeta(env);
  if (meta.deleted) return err('Resume not available', 404);

  const filename = safeFilename(meta.filename);
  const headers = {
    'Content-Type': meta.contentType || 'application/pdf',
    'Content-Disposition': contentDisposition(filename),
    'Cache-Control': 'no-store',
  };

  const stored = env.PORTFOLIO_DATA ? await env.PORTFOLIO_DATA.get('portfolio:resume:data') : null;
  if (stored) {
    const parsed = dataUrlToBytes(stored);
    if (!parsed) return err('Resume data is invalid', 500);
    headers['Content-Type'] = parsed.mime;
    return new Response(parsed.bytes, { headers });
  }

  const assetResponse = await env.ASSETS.fetch(new Request(new URL('/CV%20-%20Fahad%20Waseem.pdf', url.origin)));
  if (!assetResponse.ok) return err('Resume not available', 404);
  const assetHeaders = new Headers(assetResponse.headers);
  Object.entries(headers).forEach(([key, value]) => assetHeaders.set(key, value));
  return new Response(assetResponse.body, { status: assetResponse.status, headers: assetHeaders });
}

async function handleAPI(req, env, url) {
  const { pathname: p } = url;
  const m = req.method;

  if (m === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  // ── Public ──────────────────────────────────────────────────────────────
  if (m === 'GET' && p === '/api/data') {
    const [projects, experience, settings, photos] = await Promise.all([
      kv(env, 'portfolio:projects', DEFAULT.projects),
      kv(env, 'portfolio:experience', DEFAULT.experience),
      kv(env, 'portfolio:settings', DEFAULT.settings),
      kv(env, 'portfolio:photos', DEFAULT.photos),
    ]);
    return res({ projects, experience, settings, photos });
  }

  if (m === 'GET' && p === '/api/photos') {
    return res(await kv(env, 'portfolio:photos', DEFAULT.photos));
  }

  if (m === 'GET' && p === '/api/resume/meta') {
    return res(resumeClientMeta(await resumeMeta(env)));
  }

  if (m === 'GET' && p === '/api/resume') {
    return serveResume(env, url);
  }

  if (m === 'GET' && p.startsWith('/api/images/')) {
    const id = p.slice(12);
    if (!env.PORTFOLIO_DATA) return err('Not found', 404);
    const data = await env.PORTFOLIO_DATA.get(`img:${id}`);
    if (!data) return err('Not found', 404);
    if (data.startsWith('http')) return Response.redirect(data, 302);
    const [header, b64] = data.split(',');
    const mime = (header.match(/data:([^;]+)/) ?? [])[1] ?? 'image/jpeg';
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new Response(bytes, { headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=604800' } });
  }

  // ── Auth ────────────────────────────────────────────────────────────────
  if (m === 'POST' && p === '/api/auth/login') {
    const { username, password } = await req.json().catch(() => ({}));
    if (!username || !password) return err('Missing credentials');
    if (username !== ADMIN_USERNAME) return err('Invalid credentials', 401);
    if ((await sha256(password)) !== PASSWORD_HASH) return err('Invalid credentials', 401);
    const token = crypto.randomUUID().replace(/-/g, '');
    const expiry = Date.now() + 86400000;
    if (env.PORTFOLIO_DATA) {
      await env.PORTFOLIO_DATA.put(`session:${token}`, String(expiry), { expirationTtl: 86400 });
    }
    return res({ token, expiry });
  }

  if (m === 'POST' && p === '/api/auth/logout') {
    const h = req.headers.get('Authorization') ?? '';
    if (h.startsWith('Bearer ') && env.PORTFOLIO_DATA) {
      await env.PORTFOLIO_DATA.delete(`session:${h.slice(7)}`);
    }
    return res({ ok: true });
  }

  // ── Protected ────────────────────────────────────────────────────────────
  if (!(await authed(req, env))) return err('Unauthorized', 401);

  // Projects
  if (p === '/api/projects') {
    if (m === 'GET') return res(await kv(env, 'portfolio:projects', DEFAULT.projects));
    if (m === 'POST') {
      const body = await req.json();
      const list = await kv(env, 'portfolio:projects', DEFAULT.projects);
      const item = { ...body, id: Date.now().toString() };
      list.push(item);
      await kvSet(env, 'portfolio:projects', list);
      return res(item, 201);
    }
  }

  if (p.startsWith('/api/projects/')) {
    const id = p.slice(14);
    const list = await kv(env, 'portfolio:projects', DEFAULT.projects);
    const idx = list.findIndex(x => x.id === id);
    if (m === 'PUT') {
      if (idx === -1) return err('Not found', 404);
      list[idx] = { ...list[idx], ...await req.json(), id };
      await kvSet(env, 'portfolio:projects', list);
      return res(list[idx]);
    }
    if (m === 'DELETE') {
      if (idx === -1) return err('Not found', 404);
      list.splice(idx, 1);
      await kvSet(env, 'portfolio:projects', list);
      return res({ ok: true });
    }
  }

  // Experience
  if (p === '/api/experience') {
    if (m === 'GET') return res(await kv(env, 'portfolio:experience', DEFAULT.experience));
    if (m === 'POST') {
      const body = await req.json();
      const list = await kv(env, 'portfolio:experience', DEFAULT.experience);
      const item = { ...body, id: Date.now().toString() };
      list.push(item);
      await kvSet(env, 'portfolio:experience', list);
      return res(item, 201);
    }
  }

  if (p === '/api/experience/order' && m === 'PUT') {
    const { ids } = await req.json().catch(() => ({}));
    if (!Array.isArray(ids) || !ids.length) return err('Invalid order');

    const list = await kv(env, 'portfolio:experience', DEFAULT.experience);
    const existingIds = new Set(list.map(x => x.id));
    const incomingIds = new Set(ids);
    if (incomingIds.size !== ids.length || incomingIds.size !== existingIds.size) return err('Invalid order');
    if (ids.some(id => !existingIds.has(id))) return err('Invalid order');

    const byId = new Map(list.map(item => [item.id, item]));
    const ordered = ids.map(id => byId.get(id));
    await kvSet(env, 'portfolio:experience', ordered);
    return res(ordered);
  }

  if (p.startsWith('/api/experience/')) {
    const id = p.slice(16);
    const list = await kv(env, 'portfolio:experience', DEFAULT.experience);
    const idx = list.findIndex(x => x.id === id);
    if (m === 'PUT') {
      if (idx === -1) return err('Not found', 404);
      list[idx] = { ...list[idx], ...await req.json(), id };
      await kvSet(env, 'portfolio:experience', list);
      return res(list[idx]);
    }
    if (m === 'DELETE') {
      if (idx === -1) return err('Not found', 404);
      list.splice(idx, 1);
      await kvSet(env, 'portfolio:experience', list);
      return res({ ok: true });
    }
  }

  // Settings
  if (p === '/api/settings' && m === 'PUT') {
    const body = await req.json();
    await kvSet(env, 'portfolio:settings', body);
    return res(body);
  }

  // Resume
  if (p === '/api/resume' && m === 'PUT') {
    const body = await req.json().catch(() => ({}));
    const current = await resumeMeta(env);
    const filename = safeFilename(body.filename || current.filename);
    const next = {
      ...current,
      filename,
      contentType: 'application/pdf',
      updatedAt: new Date().toISOString(),
      deleted: false,
    };

    if (body.data) {
      if (!String(body.data).startsWith('data:application/pdf')) return err('Resume must be a PDF', 415);
      const parsed = dataUrlToBytes(body.data);
      if (!parsed) return err('Invalid resume data');
      if (parsed.bytes.byteLength > RESUME_MAX_BYTES) return err('Resume must be under 8 MB', 413);
      await env.PORTFOLIO_DATA.put('portfolio:resume:data', body.data);
      next.source = 'uploaded';
      next.size = parsed.bytes.byteLength;
    } else if (current.deleted) {
      return err('Upload a resume before renaming');
    }

    await kvSet(env, 'portfolio:resume:meta', next);
    return res(resumeClientMeta(next));
  }

  if (p === '/api/resume' && m === 'DELETE') {
    await env.PORTFOLIO_DATA.delete('portfolio:resume:data');
    const next = {
      ...DEFAULT_RESUME,
      filename: '',
      source: 'none',
      updatedAt: new Date().toISOString(),
      size: null,
      deleted: true,
    };
    await kvSet(env, 'portfolio:resume:meta', next);
    return res(resumeClientMeta(next));
  }

  // Photos
  if (p === '/api/photos' && m === 'POST') {
    const body = await req.json();
    const { imageData, caption, alt } = body;
    if (!imageData) return err('No image data');
    const imgId = Date.now().toString();
    let photoUrl;
    if (imageData.startsWith('http') || imageData.startsWith('/api/images/')) {
      photoUrl = imageData;
    } else {
      await env.PORTFOLIO_DATA.put(`img:${imgId}`, imageData);
      photoUrl = `/api/images/${imgId}`;
    }
    const photo = { id: imgId, url: photoUrl, caption: caption || '', alt: alt || caption || '' };
    const list = await kv(env, 'portfolio:photos', DEFAULT.photos);
    list.push(photo);
    await kvSet(env, 'portfolio:photos', list);
    return res(photo, 201);
  }

  if (p.startsWith('/api/photos/') && m === 'DELETE') {
    const id = p.slice(12);
    const list = await kv(env, 'portfolio:photos', DEFAULT.photos);
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) return err('Not found', 404);
    list.splice(idx, 1);
    await kvSet(env, 'portfolio:photos', list);
    await env.PORTFOLIO_DATA.delete(`img:${id}`);
    return res({ ok: true });
  }

  // Images
  if (p === '/api/images' && m === 'POST') {
    const { data } = await req.json();
    if (!data) return err('No image data');
    const id = Date.now().toString();
    await env.PORTFOLIO_DATA.put(`img:${id}`, data);
    return res({ id, url: `/api/images/${id}` }, 201);
  }

  if (p.startsWith('/api/images/') && m === 'DELETE') {
    await env.PORTFOLIO_DATA.delete(`img:${p.slice(12)}`);
    return res({ ok: true });
  }

  return err('Not found', 404);
}

// ── Clean URL routing ────────────────────────────────────────────────────────
const PAGE_ROUTES = {
  '/work':        '/work.html',
  '/projects':    '/projects.html',
  '/photography': '/photography.html',
  '/about':       '/about.html',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (p.startsWith('/api/')) return handleAPI(request, env, url);

    // /project/[id] → project.html
    if (/^\/project\/[^/]+$/.test(p)) {
      return env.ASSETS.fetch(new Request(new URL('/project.html', url.origin)));
    }

    // Clean URL routes
    if (PAGE_ROUTES[p]) {
      return env.ASSETS.fetch(new Request(new URL(PAGE_ROUTES[p], url.origin)));
    }

    return env.ASSETS.fetch(request);
  },
};
