(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  // ---------- маршрут: поезд едет по линии вместе со скроллом ----------
  const metro = document.querySelector('.metro');
  if (metro) {
    const stations = [...metro.querySelectorAll('.metro__stations li')];
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = metro.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * .85 - r.top) / (r.height + vh * .35)));
      metro.style.setProperty('--p', p.toFixed(3));
      stations.forEach((li, i) => li.classList.toggle('is-reached', p >= i / (stations.length - 1) - .02));
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
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
    setupTabs(dossier, '[role=tab]', '[role=tabpanel]', (from, to) => {
      from.hidden = true; to.hidden = false;
      to.classList.remove('is-entering'); void to.offsetWidth; to.classList.add('is-entering');
    });
  }

  const book = document.querySelector('[data-book]');
  if (book) {
    const content = book.querySelector('.book__content');
    const cur = book.querySelector('[data-cur]');
    let busy = false;
    const ctl = setupTabs(book, '.bookmark', '.entry', (from, to, i) => {
      cur.textContent = i + 1;
      if (reduced || busy) { from.hidden = true; to.hidden = false; return; }
      busy = true;
      content.classList.add('turn-out');
      setTimeout(() => {
        from.hidden = true; to.hidden = false;
        content.classList.remove('turn-out'); content.classList.add('turn-in');
        setTimeout(() => { content.classList.remove('turn-in'); busy = false; }, 430);
      }, 280);
    });
    if (!ctl || ctl.count < 2) book.classList.add('is-static');
    book.querySelectorAll('[data-dir]').forEach((b) => b.addEventListener('click', () => ctl && ctl.show(+b.dataset.dir)));
  }

  // ---------- услуги: лист «что входит» выезжает из папки ----------
  document.querySelectorAll('.file__toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const file = btn.closest('.file');
      const open = file.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open);
      if (open) goal('service_open', { service: file.querySelector('.file__title').textContent });
    });
  });
  document.querySelectorAll('[data-pick]').forEach((a) => {
    a.addEventListener('click', () => {
      const sel = document.querySelector('#lead-form select[name=package]');
      if (sel) [...sel.options].forEach((o) => { if (o.text === a.dataset.pick) sel.value = o.value; });
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
    if (!form.checkValidity()) { msg.textContent = 'Укажите имя и контакт для связи — без них я не смогу ответить.'; form.reportValidity(); return; }
    form.classList.add('is-loading'); msg.textContent = '';
    try {
      const r = await fetch(form.action, {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error);
      form.reset();
      msg.textContent = 'Письмо отправлено! Я свяжусь с вами в ближайшее время.';
      form.closest('.letter').classList.add('is-sent');
      goal('lead');
    } catch (err) {
      msg.textContent = err.message || 'Не удалось отправить. Напишите, пожалуйста, в Telegram.';
    } finally { form.classList.remove('is-loading'); }
  });
})();
