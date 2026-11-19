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
      { name: 'photo', label: 'Картинка (если не загружать — будет фирменная иллюстрация)', type: 'image' },
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

// Английская версия: к каждому текстовому полю добавляем поле «… (EN)».
// Если оно пустое, на /en показывается русский текст.
for (const cfg of Object.values(entities)) {
  const out = [];
  cfg.fields.forEach((f) => {
    out.push(f);
    if (f.type === 'text' || f.type === 'textarea') {
      out.push({ name: `${f.name}_en`, label: `${f.label} — English`, type: f.type, en: true });
    }
  });
  cfg.fields = out;
}

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
    ['stat3_value', '5/5'], ['stat3_label', 'грантов в 2023 году'],
    ['stat1_value_en', '9 years'], ['stat1_label_en', 'living and studying in China'], ['stat2_label_en', 'students admitted with my help'], ['stat3_label_en', 'scholarship offers in 2023'],
  ] },
  { group: 'Цифры в блоке «Результаты»', items: [
    ['res1_value', '100+'], ['res1_label', 'поступивших студентов'],
    ['res2_value', '90%'], ['res2_label', 'на гранты (полные и частичные)'],
    ['res3_value', '5/5'], ['res3_label', 'офферов на грант'],
    ['res1_label_en', 'admitted students'], ['res2_label_en', 'on scholarships (full and partial)'], ['res3_label_en', 'scholarship offers'],
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
  stat1_value_en: 'Цифра 1 — English', stat1_label_en: 'Подпись 1 — English', stat2_label_en: 'Подпись 2 — English', stat3_label_en: 'Подпись 3 — English',
  res1_label_en: 'Подпись 1 — English', res2_label_en: 'Подпись 2 — English', res3_label_en: 'Подпись 3 — English',
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
  { title: 'Полное сопровождение', subtitle: 'языковой год на грант, бакалавриат и магистратура', description: 'От стратегии и подготовки документов до зачисления.',
    features: 'Всё из пакета «Сопровождение»\nПодбор программ на грант\nОптимизация документов под требования\nПодготовка к интервью и консультации\nСопровождение до получения приглашения\nПомощь в бронировании общежития',
    price: '5 990 юаней', photo: '', sort: 1, published: 1 },
  { title: 'Сопровождение', subtitle: 'платный языковой год', description: 'Подбор университетов, подготовка и подача документов, сопровождение до зачисления.',
    features: 'Подбор от 5 университетов (стратегия 2+3)\nПодготовка всех документов (ML, CV, рекомендации)\nПодача заявок и отслеживание статуса\nПодготовка к интервью\nПоддержка до зачисления',
    price: '3 990 юаней', photo: '', sort: 2, published: 1 },
  { title: 'Индивидуальная консультация', subtitle: 'разбор вашего кейса', description: 'Стратегия поступления и ответы на все ваши вопросы за одну встречу.',
    features: 'Анализ вашего кейса и целей\nРазбор до 5 университетов\nОценка шансов поступления\nПлан подготовки и список документов\nОтветы на все вопросы (1,5–2 часа)\nПосле встречи — запись консультации и шаблоны документов',
    price: '990 юаней', photo: '', sort: 3, published: 1 },
]);

seed('results', [
  { name: "Лаура", program: "Магистратура, обучение на английском", university: "Zhejiang University · оффер также от Shanghai Jiao Tong University", text: "Юрист из Казахстана, 26 лет, китайский — с нуля. Выстроили стратегию на два топовых вуза, усилили портфолио и подготовились к интервью. Итог — полный грант CSC в Чжэцзянском университете.", badge: "Полный грант CSC", photo: "", sort: 1, published: 1 },
  { name: "Мерей", program: "Бакалавриат, International Economics and Trade", university: "Beijing Institute of Technology (проекты 211 и 985)", text: "Из Казахстана, 17 лет, IELTS 7.0. Подобрали вузы по специальности и подались в первые дни приёма. Зачислена с университетской стипендией: обучение за первый год и общежитие бесплатно.", badge: "Стипендия BIT", photo: "", sort: 2, published: 1 },
  { name: "Анна", program: "Магистратура, смена специальности", university: "", text: "Сложный кейс: бакалавриат по одной специальности, магистратура — по другой. После нескольких отказов включили запасной план и получили полный грант со стипендией, плюс оффер в топовый вуз на платной основе.", badge: "Полный грант + стипендия", photo: "", sort: 3, published: 1 },
  { name: "Кристина", program: "Магистратура, международные отношения и бизнес", university: "", text: "Из России, 21 год, IELTS 6.5. Помогли подобрать англоязычные программы и подать документы. Два оффера: скидка 50% на обучение и полностью бесплатное обучение по стипендии университета.", badge: "Бесплатное обучение", photo: "", sort: 4, published: 1 },
  { name: "Ксения", program: "Бакалавриат", university: "Ocean University of China, Циндао", text: "Из России, 17 лет. Главной проблемой было опекунство для несовершеннолетней — его оформили, без этого поступление было бы невозможно. Подобрали вуз под требования и получили admission notice.", badge: "Зачислена", photo: "", sort: 5, published: 1 },
  { name: "Сардор", program: "Языковой год", university: "SWUFE, SDUFE и ZJUT", text: "Из Казахстана, 18 лет. Подготовили документы и мотивационные письма — зачислен сразу в три университета на программу языкового года.", badge: "3 оффера из 3", photo: "", sort: 6, published: 1 },
]);

seed('reviews', [
  { name: "Лаура", location: "Казахстан", program: "Магистратура · полный грант CSC", text: "Когда мы начинали, мой китайский был на уровне «абсолютный ноль», а уровень тревоги зашкаливал. Решила взять полное сопровождение — и это было лучшее вложение в моё будущее. Камила проделала титаническую работу: от поиска программ на запутанных китайских сайтах и проверки документов до подготовки к собеседованиям. На каждом этапе было чёткое ощущение, что всё под контролем.", photo: "", sort: 1, published: 1 },
  { name: "Мария", location: "Россия", program: "Языковой год", text: "Самой было бы сложно, и далеко не всё понятно. Камила помогла мне со всем и продолжает помогать, отвечая на вопросы в процессе зачисления. Быстро отвечала, помогала с подачей заявок, документами, собеседованиями и прислушивалась к моим предпочтениям при выборе вуза. Ни разу не пожалела!", photo: "", sort: 2, published: 1 },
  { name: "Лиза", location: "Россия", program: "Sichuan University", text: "Вариантов было много — больше десяти компаний и частных кураторов, но выбор пал на Камилу. Она предложила разобрать мою ситуацию и шансы ещё до оплаты — это и зацепило. Дальше подбор вузов, помощь с документами, связь на каждом этапе — и поступление в вуз мечты. За три месяца мы сделали всё.", photo: "", sort: 3, published: 1 },
  { name: "Ангелина", location: "Россия", program: "Языковой год · грант без HSK", text: "У меня почти опустились руки, когда изменили правила по грантам, и я готовилась отложить поступление на год. Но вот я сижу с несколькими приглашениями, и в каждом есть грант. Спасибо за поддержку не только в подаче заявок, но и перед интервью. Я ощущала комфорт на каждом этапе.", photo: "", sort: 4, published: 1 },
  { name: "Анель", location: "Казахстан", program: "Магистратура · бесплатное обучение", text: "Я очень придирчива к выбору наставников: для меня важны личный опыт, полная вовлечённость и индивидуальный подход. Камила — тот редкий профессионал, в ком всё это сочетается. Она выкладывалась на 100% по каждому запросу и быстро реагировала на кризисные ситуации. Рекомендую как прозрачного, знающего и чуткого специалиста.", photo: "", sort: 5, published: 1 },
  { name: "Еркежан", location: "Казахстан", program: "Магистратура · полный грант со стипендией", text: "У меня было много требований: большой город, программа по бизнесу на английском, хороший университет и грант. Вы не просто услышали меня, а действительно учли все пожелания и подобрали варианты, которые идеально подошли. Ни один вопрос не остался без ответа — это дало мне уверенность на каждом этапе.", photo: "", sort: 6, published: 1 },
  { name: "Дарья", location: "Россия", program: "Языковой год · вуз лиги C9", text: "Я решила поступать в Китай буквально за два дня, сроки были безумные. Камила всегда была на связи, связывалась с университетами и искала решения — даже поздней ночью. За это время нашли вариант ещё лучше — один из лучших вузов Китая. Когда пришло письмо о зачислении, счастью не было предела!", photo: "", sort: 7, published: 1 },
]);

seed('faq', [
  { question: "Можно ли поступить без знания китайского?", answer: "Да. Можно начать с языковых курсов с нуля или выбрать программу на английском, подтвердив его уровень. Для обучения на китайском обычно нужен HSK — требования зависят от университета и специальности.", sort: 1, published: 1 },
  { question: "Реально ли получить полный грант?", answer: "Да. Есть гранты, которые покрывают обучение, проживание и предусматривают ежемесячную стипендию. Шансы зависят от вашей подготовки, выбранной программы и конкурса. Я помогу оценить ваш профиль и подобрать подходящие варианты.", sort: 2, published: 1 },
  { question: "Когда нужно начинать подготовку к поступлению?", answer: "Лучше за 9–12 месяцев до начала учёбы: будет время выбрать программу, подготовить документы и сдать необходимые экзамены. Если времени меньше, можно рассмотреть варианты, по которым ещё открыт приём.", sort: 3, published: 1 },
  { question: "Как проходит работа со мной?", answer: "Сначала разбираем ваши цели, подготовку и бюджет. Затем подбираем университеты, готовим документы и подаём заявки. Я отслеживаю результаты, помогаю подготовиться к интервью и остаюсь на связи до зачисления.", sort: 4, published: 1 },
  { question: "Гарантируете ли вы поступление?", answer: "Я помогу выстроить стратегию поступления, подобрать подходящие университеты и подготовить сильную заявку. Финальное решение остаётся за университетом, а моя задача — внимательно пройти с вами каждый этап и повысить ваши шансы на зачисление. Все условия работы закрепляем в договоре.", sort: 5, published: 1 },
  { question: "Можно ли получить грант с невысокими оценками?", answer: "Да, такие возможности есть. Оценки — один из критериев: также учитываются уровень языка, мотивация и достижения. Мы разберём вашу ситуацию, подберём доступные варианты и определим, чем можно усилить заявку.", sort: 6, published: 1 },
  { question: "Нужны ли вступительные экзамены?", answer: "Зависит от программы. Для поступления на бакалавриат во многие университеты требуется CSCA — экзамен для иностранных абитуриентов. Также могут понадобиться языковой сертификат, интервью или дополнительные испытания. Требования проверяем до подачи.", sort: 7, published: 1 },
  { question: "Как выбрать университет и специальность?", answer: "Начинаем с ваших интересов, карьерных планов, уровня языка и бюджета. Я помогу сравнить программы, требования и условия грантов, чтобы выбрать университеты, которые подходят под ваши цели и подготовку.", sort: 8, published: 1 },
  { question: "Что делать, если ещё нет аттестата или диплома?", answer: "Если вы заканчиваете обучение в год поступления, многие университеты принимают справку с предполагаемой датой выпуска и текущую выписку оценок. Аттестат или диплом нужно предоставить позже — в срок, установленный университетом.", sort: 9, published: 1 },
  { question: "Можно ли оплачивать сопровождение частями?", answer: "Да, оплата делится на две части: 50% перед началом работы и оставшиеся 50% — в срок, указанный в договоре.", sort: 10, published: 1 },
]);

// Английские тексты для стартового наполнения (заполняются, только если поле пустое)
const enSeed = {
  services: [
    ['Полное сопровождение', { title_en: 'Full support', subtitle_en: 'scholarship: language year, bachelor’s and master’s', description_en: 'From strategy and documents all the way to enrollment.',
      features_en: 'Everything in the “Support” package\nChoosing scholarship programmes\nTailoring documents to requirements\nInterview prep and consultations\nSupport until you get the admission letter\nHelp booking a dormitory', price_en: '5,990 CNY' }],
    ['Сопровождение', { title_en: 'Support', subtitle_en: 'self-funded language year', description_en: 'Choosing universities, preparing and submitting documents, support until enrollment.',
      features_en: 'Up to 5 universities (2+3 strategy)\nAll documents prepared (ML, CV, recommendations)\nApplications and status tracking\nInterview prep\nSupport until enrollment', price_en: '3,990 CNY' }],
    ['Индивидуальная консультация', { title_en: 'One-to-one consultation', subtitle_en: 'your case reviewed', description_en: 'An admission strategy and answers to all your questions in one session.',
      features_en: 'Analysis of your case and goals\nReview of up to 5 universities\nAssessment of your chances\nPreparation plan and document checklist\nAnswers to all your questions (1.5–2 hours)\nAfterwards: the session recording and document templates', price_en: '990 CNY' }],
  ],
  results: [
    ["Лаура", {"name_en": "Laura", "program_en": "Master’s, English-taught", "university_en": "Zhejiang University · also an offer from Shanghai Jiao Tong University", "text_en": "A lawyer from Kazakhstan, 26, starting Chinese from zero. We built a strategy for two top universities, strengthened her portfolio and prepared for interviews. Result: a full CSC scholarship at Zhejiang University.", "badge_en": "Full CSC scholarship"}],
    ["Мерей", {"name_en": "Merey", "program_en": "Bachelor’s, International Economics and Trade", "university_en": "Beijing Institute of Technology (Project 211 & 985)", "text_en": "From Kazakhstan, 17, IELTS 7.0. We matched universities to her major and applied as soon as admission opened. Admitted with a university scholarship: free first-year tuition and dormitory.", "badge_en": "BIT scholarship"}],
    ["Анна", {"name_en": "Anna", "program_en": "Master’s, change of field", "university_en": "", "text_en": "A tough case: a bachelor’s in one field and a master’s in another. After several rejections we switched to plan B and won a full scholarship with a stipend, plus a self-funded offer from a top university.", "badge_en": "Full scholarship + stipend"}],
    ["Кристина", {"name_en": "Kristina", "program_en": "Master’s, international relations and business", "university_en": "", "text_en": "From Russia, 21, IELTS 6.5. We picked English-taught programmes and handled the applications. Two offers: a 50% tuition discount and fully free tuition on a university scholarship.", "badge_en": "Free tuition"}],
    ["Ксения", {"name_en": "Kseniia", "program_en": "Bachelor’s", "university_en": "Ocean University of China, Qingdao", "text_en": "From Russia, 17. The main hurdle was guardianship for a minor — we arranged it, without it admission was impossible. We chose a university that fit the requirements and got the admission notice.", "badge_en": "Admitted"}],
    ["Сардор", {"name_en": "Sardor", "program_en": "Language year", "university_en": "SWUFE, SDUFE and ZJUT", "text_en": "From Kazakhstan, 18. We prepared his documents and motivation letters — admitted to all three universities for the language-year programme.", "badge_en": "3 offers out of 3"}],
  ],
  reviews: [
    ["Лаура", {"name_en": "Laura", "location_en": "Kazakhstan", "program_en": "Master’s · full CSC scholarship", "text_en": "When we started, my Chinese was at absolute zero and my anxiety was off the charts. I chose full support — and it was the best investment in my future. Kamila did a huge amount of work: from finding programmes on confusing Chinese websites and checking documents to interview prep. At every stage I felt everything was under control."}],
    ["Мария", {"name_en": "Maria", "location_en": "Russia", "program_en": "Language year", "text_en": "On my own it would have been hard and confusing. Kamila helped me with everything and still answers my questions during enrollment. She replied quickly, helped with applications, documents and interviews, and listened to my preferences when choosing a university. I never regretted it!"}],
    ["Лиза", {"name_en": "Liza", "location_en": "Russia", "program_en": "Sichuan University", "text_en": "There were many options — more than ten companies and private consultants — but I chose Kamila. She offered to review my situation and chances before any payment, and that won me over. Then came choosing universities, help with documents, support at every step — and admission to my dream university. We did it all in three months."}],
    ["Ангелина", {"name_en": "Angelina", "location_en": "Russia", "program_en": "Language year · scholarship without HSK", "text_en": "I almost gave up when the scholarship rules changed and was ready to postpone for a year. Yet here I am with several invitations, each with a scholarship. Thank you for the support not only with applications but also before the interview. I felt at ease at every stage."}],
    ["Анель", {"name_en": "Anel", "location_en": "Kazakhstan", "program_en": "Master’s · free tuition", "text_en": "I’m very picky about mentors: I value personal experience, full involvement and an individual approach. Kamila is that rare professional who combines all three. She gave 100% to every request and reacted quickly in tough situations. I recommend her as a transparent, knowledgeable and caring specialist."}],
    ["Еркежан", {"name_en": "Erkezhan", "location_en": "Kazakhstan", "program_en": "Master’s · full scholarship with stipend", "text_en": "I had many requirements: a big city, an English-taught business programme, a good university and a scholarship. You didn’t just listen — you took every wish into account and found options that fit perfectly. Not a single question went unanswered, which gave me confidence at every stage."}],
    ["Дарья", {"name_en": "Daria", "location_en": "Russia", "program_en": "Language year · C9 League university", "text_en": "I decided to apply to China literally two days before the deadlines. Kamila was always in touch, contacted universities and found solutions — even late at night. Along the way we found an even better option, one of China’s top universities. When the admission letter came, I was over the moon!"}],
  ],
  faq: [
    ["Можно ли поступить без знания китайского?", { question_en: "Can I apply without knowing Chinese?", answer_en: "Yes. You can start with Chinese language courses from scratch or choose an English-taught programme by proving your English level. Chinese-taught programmes usually require HSK — requirements depend on the university and major." }],
    ["Реально ли получить полный грант?", { question_en: "Is a full scholarship realistic?", answer_en: "Yes. There are scholarships that cover tuition and accommodation and include a monthly stipend. Your chances depend on your background, the programme and the competition. I’ll help you assess your profile and find suitable options." }],
    ["Когда нужно начинать подготовку к поступлению?", { question_en: "When should I start preparing?", answer_en: "Ideally 9–12 months before your studies begin: that leaves time to choose a programme, prepare documents and take the required exams. If you have less time, we can look at programmes that are still accepting applications." }],
    ["Как проходит работа со мной?", { question_en: "How does working with me go?", answer_en: "First we look at your goals, background and budget. Then we choose universities, prepare documents and submit applications. I track the results, help you prepare for interviews and stay in touch until enrollment." }],
    ["Гарантируете ли вы поступление?", { question_en: "Do you guarantee admission?", answer_en: "I’ll help you build an admission strategy, choose the right universities and prepare a strong application. The final decision belongs to the university; my job is to go through every step with you carefully and raise your chances of admission. All terms of our work are set out in a contract." }],
    ["Можно ли получить грант с невысокими оценками?", { question_en: "Can I get a scholarship with average grades?", answer_en: "Yes, there are such opportunities. Grades are only one criterion: language level, motivation and achievements also count. We’ll go through your situation, find available options and work out how to strengthen your application." }],
    ["Нужны ли вступительные экзамены?", { question_en: "Are there entrance exams?", answer_en: "It depends on the programme. Many universities require the CSCA exam for international applicants to bachelor’s programmes. You may also need a language certificate, an interview or additional tests. We check the requirements before applying." }],
    ["Как выбрать университет и специальность?", { question_en: "How do I choose a university and major?", answer_en: "We start with your interests, career plans, language level and budget. I’ll help you compare programmes, requirements and scholarship terms to choose universities that fit your goals and background." }],
    ["Что делать, если ещё нет аттестата или диплома?", { question_en: "What if I don’t have my diploma yet?", answer_en: "If you graduate in the year you apply, many universities accept a certificate with your expected graduation date and a current transcript. The diploma itself is submitted later, by the deadline set by the university." }],
    ["Можно ли оплачивать сопровождение частями?", { question_en: "Can I pay for support in instalments?", answer_en: "Yes, payment is split into two parts: 50% before we start and the remaining 50% by the date set in the contract." }],
  ],
};
const keyField = { services: 'title', results: 'name', reviews: 'name', faq: 'question' };
for (const [table, rows] of Object.entries(enSeed)) {
  rows.forEach(([ru, en]) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${keyField[table]} = ?`).get(ru);
    if (!row) return;
    const set = Object.keys(en).filter((k) => !row[k]);
    if (set.length) db.prepare(`UPDATE ${table} SET ${set.map((k) => `${k} = @${k}`).join(', ')} WHERE id = @id`).run({ ...en, id: row.id });
  });
}

module.exports = { db, entities, settingsSchema, settingLabels, getSettings, listPublished, UPLOAD_DIR, DATA_DIR };
