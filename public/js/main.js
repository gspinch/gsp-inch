(() => {
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
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
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

  // ---------- появление при скролле ----------
  const io = 'IntersectionObserver' in window && new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('is-visible')));

  // ---------- карусели ----------
  document.querySelectorAll('[data-carousel]').forEach((c) => {
    const track = c.querySelector('.carousel__track');
    const dots = c.querySelector('.dots');
    const items = [...track.children];
    const pages = () => Math.max(1, Math.round(track.scrollWidth / track.clientWidth));
    const go = (i) => track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
    const current = () => Math.round(track.scrollLeft / track.clientWidth);

    function render() {
      const n = pages();
      c.classList.toggle('is-static', n <= 1 || items.length <= 1);
      dots.innerHTML = '';
      for (let i = 0; i < n; i++) {
        const b = document.createElement('button');
        b.type = 'button'; b.setAttribute('aria-label', `Слайд ${i + 1}`);
        b.addEventListener('click', () => go(i));
        dots.appendChild(b);
      }
      mark();
    }
    function mark() {
      const cur = current();
      [...dots.children].forEach((d, i) => d.setAttribute('aria-current', i === cur));
    }
    track.addEventListener('scroll', () => requestAnimationFrame(mark), { passive: true });
    c.querySelector('.carousel__arrow--prev')?.addEventListener('click', () => go(current() > 0 ? current() - 1 : pages() - 1));
    c.querySelector('.carousel__arrow--next')?.addEventListener('click', () => go(current() < pages() - 1 ? current() + 1 : 0));
    window.addEventListener('resize', render);
    render();
  });

  // ---------- модалка услуги ----------
  const modal = document.getElementById('service-modal');
  if (!modal) return;
  const services = JSON.parse(document.getElementById('services-data').textContent);
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const tick = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>';
  document.querySelectorAll('[data-open-service]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const s = services[+btn.dataset.openService];
      const fullName = s.title + (s.subtitle ? ` (${s.subtitle})` : '');
      modal.querySelector('.modal__body').innerHTML = `
        <h3>${esc(s.title)}</h3>
        ${s.subtitle ? `<p class="modal__sub">${esc(s.subtitle)}</p>` : ''}
        <p>${esc(s.description)}</p>
        ${s.features.length ? `<ul>${s.features.map((f) => `<li>${tick}<span>${esc(f)}</span></li>`).join('')}</ul>` : ''}
        <p class="modal__price">${esc(s.price)}</p>
        <a href="#contacts" class="btn btn--dark" data-pick="${esc(fullName)}">Оставить заявку</a>`;
      modal.showModal();
      goal('service_open', { service: fullName });
    });
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
    const pick = e.target.closest('[data-pick]');
    if (pick) {
      const sel = document.querySelector('#lead-form select[name=package]');
      [...sel.options].forEach((o) => { if (o.text === pick.dataset.pick) sel.value = o.value; });
      modal.close();
    }
  });

  // ---------- форма заявки ----------
  const form = document.getElementById('lead-form');
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
    if (!form.checkValidity()) { msg.textContent = 'Пожалуйста, укажите имя и контакт для связи.'; form.reportValidity(); return; }
    form.classList.add('is-loading'); msg.textContent = '';
    try {
      const r = await fetch(form.action, {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error);
      form.reset();
      msg.textContent = 'Спасибо! Заявка отправлена — я свяжусь с вами в ближайшее время.';
      goal('lead');
    } catch (err) {
      msg.textContent = err.message || 'Не удалось отправить. Напишите, пожалуйста, в Telegram.';
    } finally { form.classList.remove('is-loading'); }
  });
})();
