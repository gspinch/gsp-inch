(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- перфорация марок: зубцы ровно по краю при любом размере ----------
  function perforate(el) {
    const w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    const r = 6, step = 16;
    const nx = Math.max(1, Math.round(w / step)), ny = Math.max(1, Math.round(h / step));
    let c = '';
    for (let i = 0; i <= nx; i++) { const x = (i * w / nx).toFixed(1); c += `<circle cx='${x}' cy='0' r='${r}'/><circle cx='${x}' cy='${h}' r='${r}'/>`; }
    for (let j = 1; j < ny; j++) { const y = (j * h / ny).toFixed(1); c += `<circle cx='0' cy='${y}' r='${r}'/><circle cx='${w}' cy='${y}' r='${r}'/>`; }
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><mask id='m'><rect width='${w}' height='${h}' fill='white'/><g fill='black'>${c}</g></mask><rect width='${w}' height='${h}' mask='url(%23m)'/></svg>`;
    const url = `url("data:image/svg+xml,${svg.replace(/</g, '%3C').replace(/>/g, '%3E')}")`;
    el.style.webkitMaskImage = url; el.style.maskImage = url;
  }
  const stamps = document.querySelectorAll('.stamp, .pkg__in');
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver((entries) => entries.forEach((e) => perforate(e.target)));
    stamps.forEach((el) => ro.observe(el));
  } else stamps.forEach(perforate);

  // ---------- аналитика: цели ----------
  function goal(name, params) {
    try { if (window.ym && window.METRIKA_ID) window.ym(window.METRIKA_ID, 'reachGoal', name, params); } catch (e) {}
    try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) {}
  }
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-goal]');
    if (el) goal(el.dataset.goal);
  });

  // ---------- шапка и меню ----------
  const header = document.querySelector('.header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 10);
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  if (burger) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open);
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', false); }
    });
  }

  // ---------- печатная машинка ----------
  const typed = document.querySelector('[data-typed]');
  if (typed && !reduced) {
    const text = typed.textContent;
    typed.textContent = ''; typed.classList.add('is-typing');
    let i = 0;
    const tick = () => {
      typed.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, 38 + Math.random() * 60);
      else setTimeout(() => typed.classList.remove('is-typing'), 1600);
    };
    setTimeout(tick, 300);
  }

  // ---------- «выезжающие» блоки: прячем только то, что ниже первого экрана ----------
  const reveals = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.remove('is-pending'); io.unobserve(en.target); }
      });
    }, { threshold: .15, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight * .9) { el.classList.add('is-pending'); io.observe(el); }
    });
  }

  // ---------- подсветка текущего раздела в меню ----------
  const spyLinks = [...document.querySelectorAll('[data-spy]')];
  if (spyLinks.length && 'IntersectionObserver' in window) {
    const map = new Map(spyLinks.map((l) => [l.dataset.spy, l]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        spyLinks.forEach((l) => l.removeAttribute('aria-current'));
        const l = map.get(en.target.id); if (l) l.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((l, id) => { const sec = document.getElementById(id); if (sec) spy.observe(sec); });
    ['hero', 'contacts'].forEach((id) => { const sec = document.getElementById(id); if (sec) spy.observe(sec); });
  }

  // ---------- вкладки (досье результатов и книжка отзывов) ----------
  function setupTabs(root, tabSel, panelSel, onSwitch) {
    const tabs = [...root.querySelectorAll(tabSel)];
    const panels = [...root.querySelectorAll(panelSel)];
    if (!tabs.length) return null;
    let cur = 0;
    function show(i, focus) {
      i = (i + tabs.length) % tabs.length;
      if (i === cur) return;
      const prev = cur; cur = i;
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
      if (focus) tabs[i].focus();
      onSwitch(panels[prev], panels[i], i);
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => show(i));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); show(cur + 1, true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); show(cur - 1, true); }
      });
    });
    return { show: (d) => show(cur + d), get cur() { return cur; }, count: tabs.length };
  }

  const dossier = document.querySelector('[data-tabs]');
  if (dossier) {
    const dTabs = [...dossier.querySelectorAll('[role=tab]')];
    const dBody = dossier.querySelector('.dossier__body');
    // лист досье того же цвета, что и выбранный язычок
    const paint = (i) => dBody.style.setProperty('--tone', getComputedStyle(dTabs[i]).backgroundColor);
    if (dTabs.length) paint(0);
    setupTabs(dossier, '[role=tab]', '[role=tabpanel]', (from, to, i) => {
      paint(i);
      from.hidden = true; to.hidden = false;
      to.classList.remove('is-entering'); void to.offsetWidth; to.classList.add('is-entering');
    });
  }

  const book = document.querySelector('[data-book]');
  if (book) {
    const page = book.querySelector('.book__page--right');
    const cur = book.querySelector('[data-cur]') || { textContent: '' };
    const vertical = window.matchMedia('(max-width: 960px)');
    let busy = false;
    let last = 0;

    // Перелистывание: поверх правой страницы кладём её копию и переворачиваем вокруг корешка.
    // Вперёд — старая страница уходит влево, под ней уже новая.
    // Назад — новая страница прилетает слева и ложится сверху.
    function flip(from, to, i, forward) {
      const sheet = document.createElement('div');
      const v = false; // на телефоне тоже листаем вбок, как страницу блокнота
      sheet.className = 'flip-sheet' + (v ? ' flip-sheet--v' : '');
      Object.assign(sheet.style, { left: page.offsetLeft + 'px', top: page.offsetTop + 'px', width: page.offsetWidth + 'px', height: page.offsetHeight + 'px' });
      const front = page.cloneNode(true);
      front.classList.add('flip-sheet__front');
      front.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
      if (!forward) {
        const entries = front.querySelectorAll('.entry');
        entries.forEach((el, k) => { el.hidden = k !== i; });
        const fc = front.querySelector('[data-cur]'); if (fc) fc.textContent = i + 1;
      }
      const back = document.createElement('div');
      back.className = 'flip-sheet__back';
      [front, back].forEach((f) => { const sh = document.createElement('span'); sh.className = 'flip-sheet__shade'; f.appendChild(sh); });
      sheet.append(front, back);
      book.appendChild(sheet);

      if (forward) { from.hidden = true; to.hidden = false; cur.textContent = i + 1; }
      const axis = v ? 'rotateX' : 'rotateY';
      const turned = v ? 'rotateX(180deg)' : 'rotateY(-180deg)';
      const frames = forward ? [{ transform: `${axis}(0deg)` }, { transform: turned }] : [{ transform: turned }, { transform: `${axis}(0deg)` }];
      const opts = { duration: vertical.matches ? 650 : 820, easing: 'cubic-bezier(.45,.05,.25,1)', fill: 'forwards' };
      const anim = sheet.animate(frames, opts);
      const shade = (el, a, b) => el.querySelector('.flip-sheet__shade').animate([{ opacity: a }, { opacity: .35, offset: .5 }, { opacity: b }], opts);
      shade(front, forward ? 0 : .3, forward ? .3 : 0);
      shade(back, forward ? .3 : 0, forward ? 0 : .3);
      anim.onfinish = () => {
        if (!forward) { from.hidden = true; to.hidden = false; cur.textContent = i + 1; }
        sheet.remove(); busy = false;
      };
    }

    const ctl = setupTabs(book, '.bookmark', '.entry', (from, to, i) => {
      const forward = dirHint ? dirHint > 0 : i > last;
      last = i;
      if (reduced || busy) { from.hidden = true; to.hidden = false; cur.textContent = i + 1; return; }
      busy = true;
      flip(from, to, i, forward);
    });
    let dirHint = 0;
    if (!ctl || ctl.count < 2) book.classList.add('is-static');
    book.querySelectorAll('[data-dir]').forEach((b) => b.addEventListener('click', () => { dirHint = +b.dataset.dir; ctl && ctl.show(dirHint); dirHint = 0; }));
  }

  // ---------- печенье с предсказанием ----------
  const fortune = document.querySelector('[data-fortune]');
  if (fortune) {
    const list = JSON.parse(fortune.dataset.list || '[]');
    const cn = fortune.querySelector('.fortune__cn');
    const text = fortune.querySelector('.fortune__text');
    let last = -1;
    const pick = () => { let k; do { k = Math.floor(Math.random() * list.length); } while (list.length > 1 && k === last); last = k; return list[k]; };
    fortune.querySelector('.fortune__stage').addEventListener('click', () => {
      if (fortune.classList.contains('is-open')) {
        // закрываем печенье и разламываем новое
        fortune.classList.remove('is-open');
        setTimeout(open, 600);
      } else open();
    });
    function open() {
      const [c, tx] = pick();
      cn.textContent = c; text.textContent = tx;
      fortune.classList.add('is-shake');
      setTimeout(() => { fortune.classList.remove('is-shake'); fortune.classList.add('is-open'); }, reduced ? 0 : 340);
    }
  }

  // ---------- услуги: «Выбрать» подставляет пакет в форму ----------
  document.querySelectorAll('[data-pick]').forEach((a) => {
    a.addEventListener('click', () => {
      const sel = document.querySelector('#lead-form select[name=package]');
      const norm = (x) => x.replace(/\u00A0/g, ' ').trim();
      if (sel) [...sel.options].forEach((o) => { if (norm(o.text) === norm(a.dataset.pick)) sel.value = o.value; });
    });
  });

  // ---------- форма-письмо ----------
  const form = document.getElementById('lead-form');
  if (!form) return;
  const utm = new URLSearchParams(location.search);
  const utmStr = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
    .filter((k) => utm.get(k)).map((k) => `${k}=${utm.get(k)}`).join('&');
  try {
    if (utmStr) sessionStorage.setItem('utm', utmStr);
    form.utm.value = utmStr || sessionStorage.getItem('utm') || document.referrer || '';
  } catch (e) { form.utm.value = utmStr; }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = form.querySelector('.form__msg');
    if (!form.checkValidity()) { msg.textContent = form.dataset.msgInvalid; form.reportValidity(); return; }
    form.classList.add('is-loading'); msg.textContent = '';
    try {
      const r = await fetch(form.action, {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error);
      form.reset();
      msg.textContent = form.dataset.msgOk;
      form.closest('.letter').classList.add('is-sent');
      goal('lead');
    } catch (err) {
      msg.textContent = err.message || form.dataset.msgFail;
    } finally { form.classList.remove('is-loading'); }
  });
})();
