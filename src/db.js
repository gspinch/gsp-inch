const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'site.db'));
db.pragma('journal_mode = WAL');

/**
 * Описание редактируемых сущностей. По нему строятся таблицы БД
 * и формы в админке — чтобы добавить поле, достаточно дописать его сюда.
 */
const entities = {
  results: {
    title: 'Результаты студентов',
    single: 'результат',
    listCols: ['name', 'program'],
    fields: [
      { name: 'name', label: 'Имя студента', type: 'text', required: true },
      { name: 'program', label: 'Программа / специальность', type: 'text', hint: 'Напр.: Бакалавриат, 土木工程 (Civil Engineering)' },
      { name: 'university', label: 'Университет', type: 'text' },
      { name: 'text', label: 'Описание результата', type: 'textarea' },
      { name: 'badge', label: 'Плашка на фото', type: 'text', hint: 'Напр.: Полный грант' },
      { name: 'photo', label: 'Фото', type: 'image' },
      { name: 'sort', label: 'Порядок (меньше — выше)', type: 'number' },
      { name: 'published', label: 'Показывать на сайте', type: 'checkbox' },
    ],
  },
  reviews: {
    title: 'Отзывы',
    single: 'отзыв',
    listCols: ['name', 'location'],
    fields: [
      { name: 'name', label: 'Имя', type: 'text', required: true },
      { name: 'location', label: 'Страна / город', type: 'text', hint: 'Напр.: Казахстан' },
      { name: 'program', label: 'Программа', type: 'text', hint: 'Напр.: Языковой год → Бакалавриат' },
      { name: 'text', label: 'Текст отзыва', type: 'textarea', required: true },
      { name: 'photo', label: 'Фото (аватар)', type: 'image' },
      { name: 'sort', label: 'Порядок (меньше — выше)', type: 'number' },
      { name: 'published', label: 'Показывать на сайте', type: 'checkbox' },
    ],
  },
  services: {
    title: 'Услуги и цены',
    single: 'услугу',
    listCols: ['title', 'price'],
    fields: [
      { name: 'title', label: 'Название', type: 'text', required: true },
      { name: 'subtitle', label: 'Подзаголовок', type: 'text', hint: 'Напр.: грант / степень' },
      { name: 'description', label: 'Краткое описание', type: 'textarea' },
      { name: 'features', label: 'Что входит (каждый пункт с новой строки)', type: 'textarea' },
      { name: 'price', label: 'Цена', type: 'text', hint: 'Напр.: 5 990 юаней' },
      { name: 'photo', label: 'Картинка', type: 'image' },
      { name: 'sort', label: 'Порядок (меньше — выше)', type: 'number' },
      { name: 'published', label: 'Показывать на сайте', type: 'checkbox' },
    ],
  },
  faq: {
    title: 'Частые вопросы',
    single: 'вопрос',
    listCols: ['question'],
    fields: [
      { name: 'question', label: 'Вопрос', type: 'text', required: true },
      { name: 'answer', label: 'Ответ', type: 'textarea', required: true },
      { name: 'sort', label: 'Порядок (меньше — выше)', type: 'number' },
      { name: 'published', label: 'Показывать на сайте', type: 'checkbox' },
    ],
  },
};

for (const [table, cfg] of Object.entries(entities)) {
  const cols = cfg.fields.map((f) => {
    if (f.type === 'number') return `${f.name} INTEGER DEFAULT 0`;
    if (f.type === 'checkbox') return `${f.name} INTEGER DEFAULT 1`;
    return `${f.name} TEXT DEFAULT ''`;
  });
  db.exec(`CREATE TABLE IF NOT EXISTS ${table} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ${cols.join(',\n    ')},
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  // миграция: добавляем новые поля, если таблица уже существовала
  const existing = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  cfg.fields.forEach((f, i) => {
    if (!existing.includes(f.name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${cols[i]}`);
  });
}

db.exec(`
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, contact TEXT, package TEXT, message TEXT,
  utm TEXT, status TEXT DEFAULT 'new',
  created_at TEXT DEFAULT (datetime('now'))
);
`);

/** Настройки сайта: тексты-цифры, контакты, коды метрик. */
const settingsSchema = [
  { group: 'Цифры в шапке', items: [
    ['stat1_value', '9 лет'], ['stat1_label', 'жизни и обучения в Китае'],
    ['stat2_value', '100+'], ['stat2_label', 'студентов поступили с моей помощью'],
    ['stat3_value', '5/5'], ['stat3_label', 'грантов в 2023 году (мой личный результат)'],
  ] },
  { group: 'Цифры в блоке «Результаты»', items: [
    ['res1_value', '100+'], ['res1_label', 'поступивших студентов'],
    ['res2_value', '90%'], ['res2_label', 'на гранты (полные и частичные)'],
    ['res3_value', '5/5'], ['res3_label', 'офферов на грант (мой личный результат)'],
  ] },
  { group: 'Контакты', items: [
    ['telegram', 'https://t.me/'], ['whatsapp', ''], ['instagram', ''], ['youtube', ''], ['tiktok', ''], ['email', ''],
  ] },
  { group: 'Метрики и поисковики', items: [
    ['metrika_id', ''], ['ga_id', ''], ['yandex_verification', ''], ['google_verification', ''],
  ] },
  { group: 'Уведомления о заявках в Telegram', items: [
    ['tg_bot_token', ''], ['tg_chat_id', ''],
  ] },
];
const settingLabels = {
  stat1_value: 'Цифра 1', stat1_label: 'Подпись 1', stat2_value: 'Цифра 2', stat2_label: 'Подпись 2',
  stat3_value: 'Цифра 3', stat3_label: 'Подпись 3',
  res1_value: 'Цифра 1', res1_label: 'Подпись 1', res2_value: 'Цифра 2', res2_label: 'Подпись 2',
  res3_value: 'Цифра 3', res3_label: 'Подпись 3',
  telegram: 'Telegram (ссылка)', whatsapp: 'WhatsApp (ссылка wa.me/…)', instagram: 'Instagram (ссылка)',
  youtube: 'YouTube (ссылка)', tiktok: 'TikTok (ссылка)', email: 'E-mail',
  metrika_id: 'Яндекс.Метрика — номер счётчика (только цифры)',
  ga_id: 'Google Analytics 4 — Measurement ID (G-XXXXXXX)',
  yandex_verification: 'Яндекс.Вебмастер — код из meta-тега (content="…")',
  google_verification: 'Google Search Console — код из meta-тега (content="…")',
  tg_bot_token: 'Токен бота (от @BotFather)', tg_chat_id: 'Chat ID, куда слать заявки',
};

const insSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
settingsSchema.forEach((g) => g.items.forEach(([k, v]) => insSetting.run(k, v)));

function getSettings() {
  const s = {};
  db.prepare('SELECT key, value FROM settings').all().forEach((r) => { s[r.key] = r.value; });
  return s;
}

function listPublished(table) {
  return db.prepare(`SELECT * FROM ${table} WHERE published = 1 ORDER BY sort ASC, id ASC`).all();
}

// ---------- стартовое наполнение (только для пустой базы) ----------
function seed(table, rows) {
  if (db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n > 0) return;
  const keys = Object.keys(rows[0]);
  const st = db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`);
  rows.forEach((r) => st.run(...keys.map((k) => r[k])));
}

seed('services', [
  { title: 'Полное сопровождение', subtitle: 'грант / степень', description: 'От стратегии и подготовки документов до зачисления.',
    features: 'Всё из пакета «Сопровождение»\nПодбор программ на грант\nОптимизация документов под требования\nПодготовка к интервью и консультации\nСопровождение до получения приглашения',
    price: '5 990 юаней', photo: '/img/service-1.jpg', sort: 1, published: 1 },
  { title: 'Сопровождение', subtitle: 'платный языковой год', description: 'Подбор университетов, подготовка и подача документов, сопровождение до зачисления.',
    features: 'Подбор от 5 университетов (стратегия 2+3)\nПодготовка всех документов (ML, CV, рекомендации)\nПодача заявок и отслеживание статуса\nПодготовка к интервью\nПоддержка до зачисления',
    price: '3 990 юаней', photo: '/img/service-2.jpg', sort: 2, published: 1 },
  { title: 'Индивидуальная консультация', subtitle: '', description: 'Разбор вашего кейса, стратегия поступления и ответы на все вопросы.',
    features: 'Анализ вашего кейса и целей\nРазбор до 5 университетов\nОценка шансов поступления\nПлан подготовки и список документов\nОтветы на все вопросы (1,5–2 часа)',
    price: '990 юаней', photo: '/img/service-3.jpg', sort: 3, published: 1 },
]);

seed('results', [
  { name: 'Егор', program: 'Бакалавриат, 土木工程 (Civil Engineering)', university: '', text: 'Поступил на полный грант на англоязычную программу.',
    badge: 'Полный грант', photo: '/img/result-1.jpg', sort: 1, published: 1 },
]);

seed('reviews', [
  { name: 'Алина', location: 'Казахстан', program: 'Языковой год → Бакалавриат', text: 'Благодаря Камиле поступила на языковой год в Чунцин. Очень ценю поддержку на всех этапах — от выбора университета до зачисления!', photo: '', sort: 1, published: 1 },
  { name: 'Тимур', location: 'Россия', program: 'Магистратура, инженерное направление', text: 'Профессиональный подход, всё чётко и по делу. Сам бы точно запутался в документах. Рекомендую!', photo: '', sort: 2, published: 1 },
]);

seed('faq', [
  { question: 'Нужен ли IELTS / DET для поступления?', answer: 'Для англоязычных программ большинство университетов просят IELTS, TOEFL или Duolingo English Test. Для части программ достаточно справки о том, что обучение велось на английском. Подберём вариант под ваш случай.', sort: 1, published: 1 },
  { question: 'Когда начинается подача документов?', answer: 'Основной приём на программы с сентября открывается с ноября по март, на гранты CSC — обычно с декабря по март. Начинать подготовку лучше за 6–9 месяцев.', sort: 2, published: 1 },
  { question: 'Что входит в полное сопровождение?', answer: 'Стратегия и подбор университетов, подготовка всех документов (мотивационное письмо, CV, рекомендации), подача заявок, подготовка к интервью и поддержка до получения приглашения и зачисления.', sort: 3, published: 1 },
  { question: 'Можно ли поступить без HSK?', answer: 'Да — на англоязычные программы и на языковой год HSK не требуется. Для китайскоязычных программ бакалавриата обычно нужен HSK 4–5.', sort: 4, published: 1 },
  { question: 'Работаете ли вы с родителями?', answer: 'Да, многие консультации проходят вместе с родителями: объясняю процесс, сроки, стоимость жизни и обучения.', sort: 5, published: 1 },
]);

module.exports = { db, entities, settingsSchema, settingLabels, getSettings, listPublished, UPLOAD_DIR, DATA_DIR };
