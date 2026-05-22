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
    subtitle: 'Python · APIs · Automation · Data Workflows',
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
      title: 'HubSpot + ServiceM8 Integration',
      description: 'Flask webhook backend automating HubSpot deal handoffs into ServiceM8 jobs, with CRM association handling, duplicate prevention via stored IDs, and bidirectional status sync.',
      tags: ['Python', 'Flask', 'HubSpot API', 'ServiceM8 API', 'Webhooks'],
      github: 'https://github.com/fahad756/FSE-SeriveM8-Integration',
      live: '',
      image: '',
      featured: true,
    },
    {
      id: '2',
      title: 'Student Attendance AI System',
      description: 'Final-year AI attendance system using webcam face recognition, OpenCV facial encodings, CSV/MySQL storage, and a PHP dashboard for student records and reports.',
      tags: ['Python', 'OpenCV', 'face_recognition', 'MySQL', 'PHP'],
      github: 'https://github.com/fahad756/StudentAttendance-DeepEntityNaming',
      live: '',
      image: '',
      featured: true,
    },
  ],
  experience: [
    {
      id: '1',
      role: 'Software Developer',
      company: 'Workabot.ai',
      location: 'Dubai, UAE · Remote',
      period: 'Nov 2023 – Apr 2026',
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
};

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const res = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

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

async function handleAPI(req, env, url) {
  const { pathname: p } = url;
  const m = req.method;

  if (m === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  // ── Public ──────────────────────────────────────────────────────────────
  if (m === 'GET' && p === '/api/data') {
    const [projects, experience, settings] = await Promise.all([
      kv(env, 'portfolio:projects', DEFAULT.projects),
      kv(env, 'portfolio:experience', DEFAULT.experience),
      kv(env, 'portfolio:settings', DEFAULT.settings),
    ]);
    return res({ projects, experience, settings });
  }

  if (m === 'GET' && p.startsWith('/api/images/')) {
    const id = p.slice(13);
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

  // Images
  if (p === '/api/images' && m === 'POST') {
    const { data } = await req.json();
    if (!data) return err('No image data');
    const id = Date.now().toString();
    await env.PORTFOLIO_DATA.put(`img:${id}`, data);
    return res({ id, url: `/api/images/${id}` }, 201);
  }

  if (p.startsWith('/api/images/') && m === 'DELETE') {
    await env.PORTFOLIO_DATA.delete(`img:${p.slice(13)}`);
    return res({ ok: true });
  }

  return err('Not found', 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleAPI(request, env, url);
    return env.ASSETS.fetch(request);
  },
};
