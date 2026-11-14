require('./env');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const cookieSession = require('cookie-session');
const multer = require('multer');
const sharp = require('sharp');
const { db, entities, settingsSchema, settingLabels, getSettings, listPublished, UPLOAD_DIR } = require('./db');

const PORT = process.env.PORT || 3000;
const SITE_URL = (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const isProd = process.env.NODE_ENV === 'production';

if (!ADMIN_PASSWORD) console.warn('⚠️  ADMIN_PASSWORD не задан — вход в админку отключён.');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  next();
});
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: isProd ? '7d' : 0 }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: isProd ? '30d' : 0 }));
app.use(express.urlencoded({ extended: false, limit: '200kb' }));
app.use(express.json({ limit: '50kb' }));
app.use(cookieSession({
  name: 'gsp_admin', secret: SESSION_SECRET, httpOnly: true, sameSite: 'strict',
  secure: isProd, maxAge: 14 * 24 * 3600 * 1000,
}));

app.locals.SITE_URL = SITE_URL;
app.locals.icon = require('./icons');
// Иероглифы из шаблонов — подгружаем шрифт-кисть только для них (экономия трафика)
app.locals.cnText = (() => {
  const dir = path.join(__dirname, '..', 'views');
  const all = fs.readdirSync(dir, { recursive: true }).filter((f) => f.endsWith('.ejs'))
    .map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('');
  return [...new Set(all.match(/[\u4e00-\u9fff！]/g) || [])].join('');
})();

// ---------------- Публичная часть ----------------
app.get('/', (req, res) => {
  const s = getSettings();
  res.render('index', {
    s,
    services: listPublished('services'),
    results: listPublished('results'),
    reviews: listPublished('reviews'),
    faq: listPublished('faq'),
    sent: req.query.sent === '1',
  });
});

app.get('/privacy', (req, res) => res.render('privacy', { s: getSettings() }));

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${SITE_URL}/privacy</loc><changefreq>yearly</changefreq><priority>0.2</priority></url>
</urlset>`);
});

// Заявки с сайта
const leadHits = new Map();
app.post('/api/lead', async (req, res) => {
  const wantsJson = (req.get('accept') || '').includes('application/json');
  const b = req.body || {};
  if (b.website) return wantsJson ? res.json({ ok: true }) : res.redirect('/?sent=1#contacts'); // honeypot
  const name = String(b.name || '').trim().slice(0, 100);
  const contact = String(b.contact || '').trim().slice(0, 150);
  if (!name || !contact) {
    return wantsJson ? res.status(400).json({ ok: false, error: 'Укажите имя и контакт' }) : res.redirect('/#contacts');
  }
  const ip = req.ip;
  const now = Date.now();
  const hits = (leadHits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (hits.length >= 5) return res.status(429).json({ ok: false, error: 'Слишком много заявок, попробуйте позже' });
  hits.push(now); leadHits.set(ip, hits);

  const lead = {
    name, contact,
    package: String(b.package || '').slice(0, 100),
    message: String(b.message || '').slice(0, 2000),
    utm: String(b.utm || '').slice(0, 500),
  };
  db.prepare('INSERT INTO leads (name, contact, package, message, utm) VALUES (@name, @contact, @package, @message, @utm)').run(lead);
  notifyTelegram(lead).catch((e) => console.error('Telegram:', e.message));
  return wantsJson ? res.json({ ok: true }) : res.redirect('/?sent=1#contacts');
});

async function notifyTelegram(lead) {
  const s = getSettings();
  const token = process.env.TG_BOT_TOKEN || s.tg_bot_token;
  const chat = process.env.TG_CHAT_ID || s.tg_chat_id;
  if (!token || !chat) return;
  const text = `🆕 Новая заявка с сайта\n\n👤 ${lead.name}\n📱 ${lead.contact}` +
    (lead.package ? `\n📦 ${lead.package}` : '') + (lead.message ? `\n💬 ${lead.message}` : '') +
    (lead.utm ? `\n🔗 ${lead.utm}` : '');
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text }),
  });
}

// ---------------- Админка ----------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(jpeg|png|webp|heic|heif|avif)$/.test(file.mimetype)),
});

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.redirect('/admin/login');
}

// простая защита от CSRF: каждый POST в админке несёт токен из сессии
function csrf(req, res, next) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(16).toString('hex');
  res.locals.csrf = req.session.csrf;
  if (req.method === 'POST' && req.body && req.body._csrf !== req.session.csrf) {
    return res.status(403).send('Сессия устарела, обновите страницу.');
  }
  next();
}

const loginFails = new Map();
app.get('/admin/login', (req, res) => res.render('admin/login', { error: null }));
app.post('/admin/login', (req, res) => {
  const ip = req.ip;
  const f = loginFails.get(ip) || { n: 0, t: 0 };
  if (f.n >= 5 && Date.now() - f.t < 15 * 60 * 1000) {
    return res.status(429).render('admin/login', { error: 'Слишком много попыток. Подождите 15 минут.' });
  }
  if (ADMIN_PASSWORD && safeEqual(req.body.password || '', ADMIN_PASSWORD)) {
    loginFails.delete(ip);
    req.session.admin = true;
    return res.redirect('/admin');
  }
  loginFails.set(ip, { n: f.n + 1, t: Date.now() });
  res.status(401).render('admin/login', { error: 'Неверный пароль' });
});

app.post('/admin/logout', (req, res) => { req.session = null; res.redirect('/admin/login'); });

const admin = express.Router();
admin.use(requireAuth);
admin.use((req, res, next) => {
  res.locals.entities = entities;
  res.locals.path = req.originalUrl;
  res.locals.newLeads = db.prepare("SELECT COUNT(*) n FROM leads WHERE status = 'new'").get().n;
  next();
});

admin.get('/', (req, res) => {
  const counts = {};
  Object.keys(entities).forEach((t) => { counts[t] = db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n; });
  const leads = db.prepare('SELECT * FROM leads ORDER BY id DESC LIMIT 5').all();
  res.render('admin/dashboard', { counts, leads });
});

// Заявки
admin.get('/leads', csrf, (req, res) => {
  res.render('admin/leads', { leads: db.prepare('SELECT * FROM leads ORDER BY id DESC').all() });
});
admin.post('/leads/:id', csrf, (req, res) => {
  if (req.body.action === 'delete') db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  else db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(req.body.status === 'done' ? 'done' : 'new', req.params.id);
  res.redirect('/admin/leads');
});
admin.get('/leads.csv', (req, res) => {
  const rows = db.prepare('SELECT * FROM leads ORDER BY id DESC').all();
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = ['id;дата;имя;контакт;пакет;сообщение;utm;статус']
    .concat(rows.map((r) => [r.id, r.created_at, r.name, r.contact, r.package, r.message, r.utm, r.status].map(esc).join(';')))
    .join('\n');
  res.set('Content-Disposition', 'attachment; filename="leads.csv"').type('text/csv').send('﻿' + csv);
});

// Настройки
admin.get('/settings', csrf, (req, res) => {
  res.render('admin/settings', { schema: settingsSchema, labels: settingLabels, s: getSettings(), saved: req.query.saved });
});
admin.post('/settings', csrf, (req, res) => {
  const up = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  settingsSchema.forEach((g) => g.items.forEach(([k]) => {
    if (k in req.body) up.run(k, String(req.body[k]).trim());
  }));
  res.redirect('/admin/settings?saved=1');
});

// Универсальный CRUD для results / reviews / services / faq
function getEntity(req, res, next) {
  const cfg = entities[req.params.entity];
  if (!cfg) return res.status(404).send('Не найдено');
  req.entity = { table: req.params.entity, ...cfg };
  res.locals.entity = req.entity;
  next();
}

async function saveImage(file) {
  const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.webp`;
  await sharp(file.buffer).rotate().resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 }).toFile(path.join(UPLOAD_DIR, name));
  return `/uploads/${name}`;
}

function removeUpload(url) {
  if (url && url.startsWith('/uploads/')) fs.rm(path.join(UPLOAD_DIR, path.basename(url)), () => {});
}

admin.get('/:entity', getEntity, csrf, (req, res) => {
  const rows = db.prepare(`SELECT * FROM ${req.entity.table} ORDER BY sort ASC, id ASC`).all();
  res.render('admin/list', { rows });
});

admin.get('/:entity/new', getEntity, csrf, (req, res) => res.render('admin/form', { row: { published: 1, sort: 0 }, error: null }));
admin.get('/:entity/:id', getEntity, csrf, (req, res) => {
  const row = db.prepare(`SELECT * FROM ${req.entity.table} WHERE id = ?`).get(req.params.id);
  if (!row) return res.redirect(`/admin/${req.entity.table}`);
  res.render('admin/form', { row, error: null });
});

// multer должен отработать до csrf, т.к. форма multipart
admin.post('/:entity/:id', getEntity, upload.any(), csrf, async (req, res) => {
  const { table, fields } = req.entity;
  const id = req.params.id;
  const existing = id === 'new' ? null : db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);

  if (req.body.action === 'delete' && existing) {
    fields.filter((f) => f.type === 'image').forEach((f) => removeUpload(existing[f.name]));
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    return res.redirect(`/admin/${table}`);
  }

  const data = {};
  for (const f of fields) {
    if (f.type === 'checkbox') data[f.name] = req.body[f.name] ? 1 : 0;
    else if (f.type === 'number') data[f.name] = parseInt(req.body[f.name], 10) || 0;
    else if (f.type === 'image') {
      const file = (req.files || []).find((x) => x.fieldname === f.name);
      if (file) {
        try { data[f.name] = await saveImage(file); } catch (e) {
          return res.render('admin/form', { row: { ...existing, ...req.body }, error: 'Не удалось обработать изображение' });
        }
        if (existing) removeUpload(existing[f.name]);
      } else if (req.body[`${f.name}__remove`]) {
        data[f.name] = '';
        if (existing) removeUpload(existing[f.name]);
      } else data[f.name] = existing ? existing[f.name] : '';
    } else data[f.name] = String(req.body[f.name] || '').trim();
  }
  const missing = fields.filter((f) => f.required && !data[f.name]);
  if (missing.length) {
    return res.render('admin/form', { row: { ...existing, ...data }, error: `Заполните: ${missing.map((f) => f.label).join(', ')}` });
  }

  const keys = Object.keys(data);
  if (existing) {
    db.prepare(`UPDATE ${table} SET ${keys.map((k) => `${k} = @${k}`).join(', ')} WHERE id = @id`).run({ ...data, id });
  } else {
    db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map((k) => '@' + k).join(',')})`).run(data);
  }
  res.redirect(`/admin/${table}`);
});

app.use('/admin', express.urlencoded({ extended: false }), admin);

app.use((req, res) => res.status(404).render('404', { s: getSettings() }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Ошибка сервера');
});

app.listen(PORT, () => console.log(`GSP·INCH запущен: http://localhost:${PORT}`));
