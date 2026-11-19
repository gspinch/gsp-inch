// Тексты интерфейса на двух языках. Ключи с суффиксом _html выводятся как HTML.
const dict = {
  ru: {
    html_lang: 'ru', og_locale: 'ru_RU',
    meta_title: 'Поступление в университеты Китая с персональным сопровождением — GSP·INCH',
    meta_desc: 'Помогаю выбрать программу, подготовить документы и поступить в китайский университет на грант или на платной основе. 9 лет в Китае, 100+ поступивших студентов.',
    og_title: 'Поступление в Китай с персональным сопровождением',
    og_desc: 'От выбора университета и подготовки документов до получения приглашения и зачисления.',
    ld_name: 'GSP·INCH — поступление в Китай', ld_desc: 'Консультации и сопровождение поступления в университеты Китая',
    logo_sub: 'дневник поступления', home_aria: 'GSP·INCH — на главную', menu_aria: 'Основное меню', menu_open: 'Открыть меню',
    nav_about: 'Обо мне', nav_services: 'Услуги', nav_steps: 'Этапы', nav_results: 'Результаты', nav_reviews: 'Отзывы', nav_faq: 'FAQ', nav_contacts: 'Контакты',
    nav_cta: 'Консультация', lang_switch: 'Язык сайта',

    hero_eyebrow: 'Дневник поступления · запись №2027',
    hero_t1: 'Поступление', hero_t2: 'в&nbsp;Китай',
    hero_hand_mark: 'с личным ментором,', hero_hand_rest: 'который сам прошёл этот путь',
    hero_lead: 'От выбора университета и подготовки документов до получения приглашения и зачисления — на грант или на платной основе.',
    hero_cta: 'Записаться на консультацию', hero_more: 'Листать дневник ↓',
    collage_aria: 'Коллаж: Китай, фото Камилы, посадочный талон',
    hero_img_alt: 'Беседка у озера и чайник — Китай', me_alt: 'Камила у озера в Китае', me_caption: 'это я — 9-й год в Китае',
    ticket_top: '登机牌 · посадочный талон', ticket_bottom: 'пассажир: вы · рейс 2027', ticket_seat: 'место',
    marquee: '留学中国 ✶ гранты CSC ✶ HSK ✶ стратегия 2+3 ✶ языковой год ✶ бакалавриат ✶ магистратура ✶ 加油 ✶ мотивационное письмо ✶ интервью ✶ зачисление ✶',

    about_h: 'Обо мне', about_alt: 'Камила — ментор по поступлению в Китай',
    about_hi: 'Привет, я Камила!', about_role: 'ментор по поступлению в Китай',
    about_story_html: 'С 2017 года живу и учусь в Китае. Прошла путь от языковых курсов до <mark class="hl hl--lime">магистратуры на полном гранте</mark>. Теперь помогаю вам сделать учёбу в Китае частью своей истории — выбрать подходящий университет, разобраться в поступлении и уверенно пройти каждый этап с моей поддержкой.',
    why_title: 'почему со мной?',
    why: ['Честная и прозрачная работа', 'Индивидуальная стратегия', 'Опыт учёбы в Китае изнутри', 'Поддержка на всех этапах', 'Фокус на результат, а не на количество'],

    services_h: 'Услуги', pick: 'Выбрать',
    nudge_title: 'Не знаете, с чего начать?', nudge_text: 'запишитесь на консультацию — разберём ваш кейс и составим пошаговый план', nudge_btn: 'Записаться',

    steps_h: 'Этапы работы',
    steps: [
      ['分析', 'Анализ кейса и целей', 'Разбираем образование, уровень языка, бюджет и цели. Честно оцениваем шансы.'],
      ['选校', 'Подбор университетов', 'Стратегия 2+3: два вуза мечты и три надёжных варианта под ваш профиль.'],
      ['文件', 'Подготовка документов', 'Мотивационное письмо, CV и рекомендации — под требования каждого вуза.'],
      ['申请', 'Подача заявок', 'Подаём заявки, следим за статусами и готовим к интервью.'],
      ['录取', 'Зачисление', 'Получаем приглашение — и остаёмся на связи после зачисления.'],
    ],

    results_h: 'Результаты студентов', results_tabs_aria: 'Студенты', case_no: 'досье №', report_head: 'отчёт · 报告 · 2026',

    reviews_h: 'Отзывы', reviews_more: 'Больше отзывов в Instagram', book_label: 'дневник отзывов', book_hint: 'истории студентов, которые уже учатся в Китае. тяните за закладки →',
    entry_no: 'запись №', prev_review: 'Предыдущий отзыв', next_review: 'Следующий отзыв', reviews_tabs_aria: 'Отзывы',

    faq_h: 'Частые вопросы', faq_img_alt: 'Ворота кампуса и цветущая магнолия', panda_caption: 'сосед по кампусу (почти)',
    fortune_hint: 'нажми на печенье — там предсказание', fortune_aria: 'Разломить печенье с предсказанием',
    fortunes: [['你能行', '«У тебя получится»'], ['梦想成真', '«Мечта сбудется — уже в этом году»'], ['加油', '«Вперёд! Грант ближе, чем кажется»'],
      ['一路顺风', '«Попутного ветра — и в дороге, и в учёбе»'], ['心想事成', '«Всё задуманное сбудется»'], ['前途无量', '«Впереди огромные возможности»'],
      ['好运来', '«Удача уже в пути»'], ['学无止境', '«Учиться никогда не поздно»']],

    letter_to: 'кому: Камиле · куда: Китай · тема: поступление',
    contact_h: 'Запишитесь на консультацию', contact_sub: 'разберём ваш кейс, оценим шансы и составим пошаговый план',
    contact_tg: 'или напишите в Telegram',
    f_name: 'Ваше имя', f_name_ph: 'Как к вам обращаться',
    f_contact: 'Как с вами связаться', f_contact_ph: 'Telegram, WhatsApp или телефон',
    f_package: 'Что вас интересует', f_package_none: 'Пока не знаю — нужна консультация',
    f_msg: 'Пара слов о себе', f_optional: '— необязательно', f_msg_ph: 'Уровень образования, желаемая программа…',
    f_agree_html: 'Нажимая кнопку «Отправить письмо», вы соглашаетесь на обработку персональных данных согласно <a href="/privacy" target="_blank">политике конфиденциальности</a>.',
    f_submit: 'Отправить письмо', f_sent_ok: 'Спасибо! Заявка отправлена — я свяжусь с вами в ближайшее время.',
    js_invalid: 'Укажите имя и контакт для связи — без них я не смогу ответить.',
    js_ok: 'Письмо отправлено! Я свяжусь с вами в ближайшее время.',
    js_fail: 'Не удалось отправить. Напишите, пожалуйста, в Telegram.',
    sent_stamp: 'отправлено',

    cheer: '«цзяю!» — так в Китае желают удачи', footer_menu: 'Меню в подвале', privacy: 'Политика конфиденциальности',
    st_cookie: 'ты поступишь', st_grant1: 'НА ГРАНТ', st_grant2: 'В КИТАЙ!',
  },
  en: {
    html_lang: 'en', og_locale: 'en_US',
    meta_title: 'Get into a Chinese university with a personal mentor — GSP·INCH',
    meta_desc: 'I help you choose a programme, prepare documents and get into a Chinese university on a scholarship or self-funded. 9 years in China, 100+ admitted students.',
    og_title: 'Study in China with a personal mentor',
    og_desc: 'From choosing a university and preparing documents to your admission letter and enrollment.',
    ld_name: 'GSP·INCH — study in China', ld_desc: 'Consulting and admission support for Chinese universities',
    logo_sub: 'admission diary', home_aria: 'GSP·INCH — home', menu_aria: 'Main menu', menu_open: 'Open menu',
    nav_about: 'About', nav_services: 'Services', nav_steps: 'Process', nav_results: 'Results', nav_reviews: 'Reviews', nav_faq: 'FAQ', nav_contacts: 'Contact',
    nav_cta: 'Book a call', lang_switch: 'Site language',

    hero_eyebrow: 'Admission diary · entry no. 2027',
    hero_t1: 'Study', hero_t2: 'in&nbsp;China',
    hero_hand_mark: 'with a personal mentor', hero_hand_rest: 'who has walked this path herself',
    hero_lead: 'From choosing a university and preparing documents to your admission letter and enrollment — on a scholarship or self-funded.',
    hero_cta: 'Book a consultation', hero_more: 'Flip through the diary ↓',
    collage_aria: 'Collage: China, Kamila’s photo, a boarding pass',
    hero_img_alt: 'A lakeside pavilion and a teapot — China', me_alt: 'Kamila by a lake in China', me_caption: 'that’s me — my 9th year in China',
    ticket_top: '登机牌 · boarding pass', ticket_bottom: 'passenger: you · flight 2027', ticket_seat: 'seat',
    marquee: '留学中国 ✶ CSC scholarships ✶ HSK ✶ 2+3 strategy ✶ language year ✶ bachelor’s ✶ master’s ✶ 加油 ✶ motivation letter ✶ interview ✶ enrollment ✶',

    about_h: 'About me', about_alt: 'Kamila — study-in-China mentor',
    about_hi: 'Hi, I’m Kamila!', about_role: 'your study-in-China mentor',
    about_story_html: 'I have been living and studying in China since 2017. I went from language courses to a <mark class="hl hl--lime">master’s degree on a full scholarship</mark>. Now I help you make studying in China part of your own story — choose the right university, understand the admission process and confidently go through every step with my support.',
    why_title: 'why work with me?',
    why: ['Honest, transparent work', 'A strategy built for you', 'First-hand experience of studying in China', 'Support at every step', 'Focus on results, not volume'],

    services_h: 'Services', pick: 'Choose',
    nudge_title: 'Not sure where to start?', nudge_text: 'book a consultation — we’ll go through your case and build a step-by-step plan', nudge_btn: 'Book now',

    steps_h: 'How it works',
    steps: [
      ['分析', 'Your case and goals', 'We look at your education, language level, budget and goals, and give you an honest view of your chances.'],
      ['选校', 'Choosing universities', 'The 2+3 strategy: two dream universities and three safe options that fit your profile.'],
      ['文件', 'Preparing documents', 'Motivation letter, CV and recommendations — tailored to each university’s requirements.'],
      ['申请', 'Applications', 'We submit applications, track their status and prepare you for interviews.'],
      ['录取', 'Enrollment', 'You get your admission letter — and I stay in touch after you enroll.'],
    ],

    results_h: 'Student results', results_tabs_aria: 'Students', case_no: 'file no.', report_head: 'report · 报告 · 2026',

    reviews_h: 'Reviews', reviews_more: 'More reviews on Instagram', book_label: 'review diary', book_hint: 'stories from students who already study in China. pull the bookmarks →',
    entry_no: 'entry no.', prev_review: 'Previous review', next_review: 'Next review', reviews_tabs_aria: 'Reviews',

    faq_h: 'FAQ', faq_img_alt: 'Campus gate and a blooming magnolia', panda_caption: 'campus neighbour (almost)',
    fortune_hint: 'tap the cookie — there’s a fortune inside', fortune_aria: 'Crack open the fortune cookie',
    fortunes: [['你能行', '“You can do it”'], ['梦想成真', '“Your dream comes true — this year”'], ['加油', '“Keep going! The scholarship is closer than it seems”'],
      ['一路顺风', '“Fair winds — on the road and in your studies”'], ['心想事成', '“Everything you wish for will come true”'], ['前途无量', '“Great opportunities lie ahead”'],
      ['好运来', '“Good luck is on its way”'], ['学无止境', '“It’s never too late to learn”']],

    letter_to: 'to: Kamila · where: China · subject: admission',
    contact_h: 'Book a consultation', contact_sub: 'we’ll go through your case, assess your chances and build a step-by-step plan',
    contact_tg: 'or message me on Telegram',
    f_name: 'Your name', f_name_ph: 'What should I call you?',
    f_contact: 'How can I reach you?', f_contact_ph: 'Telegram, WhatsApp or phone',
    f_package: 'What are you interested in?', f_package_none: 'Not sure yet — I need a consultation',
    f_msg: 'A few words about you', f_optional: '— optional', f_msg_ph: 'Education level, programme you want…',
    f_agree_html: 'By clicking “Send the letter”, you agree to the processing of your personal data under the <a href="/privacy" target="_blank">privacy policy</a>.',
    f_submit: 'Send the letter', f_sent_ok: 'Thank you! Your request has been sent — I’ll get back to you soon.',
    js_invalid: 'Please add your name and a way to contact you — otherwise I can’t reply.',
    js_ok: 'Letter sent! I’ll get back to you soon.',
    js_fail: 'Couldn’t send it. Please message me on Telegram.',
    sent_stamp: 'sent',

    cheer: '“jiāyóu!” — how people in China wish you luck', footer_menu: 'Footer menu', privacy: 'Privacy policy',
    st_cookie: 'you’ll get in', st_grant1: 'HELLO,', st_grant2: 'CHINA!',
  },
};

module.exports = function i18n(lang) {
  const d = dict[lang] || dict.ru;
  const t = (k) => (k in d ? d[k] : dict.ru[k]);
  // поле записи из БД на нужном языке: title → title_en, с откатом на русский
  const L = (row, f) => (lang === 'en' && row[`${f}_en`] ? row[`${f}_en`] : row[f]) || '';
  const S = (s, k) => (lang === 'en' && s[`${k}_en`] ? s[`${k}_en`] : s[k]) || '';
  return { lang, t, L, S, base: lang === 'en' ? '/en' : '/' };
};
