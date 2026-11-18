/* ══════════════════════════════════════════════════════════════════
   BloodCube — логика страницы
   Модули: утилиты → particles/snow → header/nav → копирование IP →
           reveal → табы сезонов → FAQ → модалка → toTop
   ══════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───────────── 1. Копирование IP + тост ───────────── */
  const toast = $('#toast');
  let toastTimer = null;

  /**
   * Показывает всплывающее уведомление.
   * @param {string} text
   */
  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-shown'), 2400);
  }

  /**
   * Копирует текст в буфер обмена с фолбэком для старых браузеров
   * и для не-HTTPS контекста (file://).
   */
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) { /* переходим к фолбэку */ }

    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (_) {
      return false;
    }
  }

  // Делегирование: любые элементы с data-ip копируют IP
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-ip]');
    if (!el) return;
    const ip = el.dataset.ip;
    const ok = await copyText(ip);
    const doneLabel = el.dataset.copiedLabel;
    showToast(ok ? (doneLabel || `Скопировано! ${ip}`) : `IP сервера: ${ip}`);

    if (ok) {
      // короткая визуальная реакция на кнопке
      el.classList.add('is-copied');
      setTimeout(() => el.classList.remove('is-copied'), 1400);

      // Кнопки с data-copied-label показывают подтверждение прямо на себе
      if (doneLabel) {
        if (!el.dataset.defaultLabel) el.dataset.defaultLabel = el.textContent.trim();
        el.textContent = doneLabel;
        clearTimeout(el._copiedTimer);
        el._copiedTimer = setTimeout(() => {
          el.textContent = el.dataset.defaultLabel;
        }, 2000);
      }
    }
  });

  /* ───────────── 2. Header: скролл + активный пункт ───────────── */
  const header = $('#header');
  const toTop = $('#toTop');

  const onScroll = () => {
    const y = window.scrollY || 0;
    header?.classList.toggle('is-scrolled', y > 24);
    toTop?.classList.toggle('is-visible', y > 600);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  toTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ───────────── 3. Мобильное меню ───────────── */
  const burger = $('#burger');
  const nav = $('#nav');

  const closeNav = () => {
    nav?.classList.remove('is-open');
    burger?.classList.remove('is-open');
    burger?.setAttribute('aria-expanded', 'false');
    burger?.setAttribute('aria-label', 'Открыть меню');
    document.body.style.overflow = '';
  };

  burger?.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.style.overflow = open ? 'hidden' : '';
  });

  nav?.addEventListener('click', (e) => {
    if (e.target.closest('a')) closeNav();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeNav();
      closeModal();
    }
  });

  // Клик по фону страницы закрывает меню
  document.addEventListener('click', (e) => {
    if (!nav?.classList.contains('is-open')) return;
    if (!nav.contains(e.target) && !burger.contains(e.target)) closeNav();
  });

  /* ───────────── 4. Подсветка активного пункта навигации ───────────── */
  const navLinks = $$('.nav__link');
  const sections = navLinks
    .map((a) => {
      const id = a.getAttribute('href');
      return id && id.startsWith('#') ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id));
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach((s) => navObserver.observe(s));
  }

  /* ───────────── 5. Reveal при скролле ───────────── */
  const revealEls = $$('.reveal');
  revealEls.forEach((el) => {
    const d = Number(el.dataset.delay || 0);
    el.style.setProperty('--d', String(d));
  });

  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    revealEls.forEach((el) => revealObserver.observe(el));

    // Страховка: элементы, уже находящиеся в зоне видимости при загрузке,
    // показываем без ожидания колбэка (и на случай отключённых анимаций).
    requestAnimationFrame(() => {
      const vh = window.innerHeight;
      revealEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.95 && r.bottom > 0) el.classList.add('is-in');
      });
    });
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ───────────── 6. Переключатель сезонов Frost ───────────── */
  const frostCard = $('.card--frost');

  /**
   * Активирует сезон на карточке Frost.
   * @param {HTMLElement} card
   * @param {'ny'|'hw'|'ea'} season
   */
  function setSeason(card, season) {
    if (!card) return;
    card.dataset.season = season;

    const box = $('.season-box', card);
    if (box) box.dataset.active = season;

    // Табы
    $$('.season-tab', card).forEach((tab) => {
      const active = tab.dataset.season === season;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    // Панели
    $$('.season-panel', card).forEach((panel) => {
      const active = panel.dataset.season === season;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });

    // Иконка и код косметики текущего сезона
    const ico = $('.season-box__ico', card);
    if (ico) ico.textContent = { ny: '❄', hw: '👻', ea: '🐰' }[season] || '❄';

    const code = $('.season-box__code', card);
    if (code) {
      code.textContent = { ny: 'FROST', hw: 'GHOST', ea: 'BUNNY' }[season] || 'FROST';
      code.dataset.season = season;
    }

    // Локальные частицы в тему сезона
    renderFrostSnow(card, season);

    const buy = $('.btn--buy', card);
    if (buy) buy.dataset.season = season;
  }

  $$('.season-tab').forEach((tab) => {
    tab.addEventListener('click', () => setSeason(tab.closest('.card--frost'), tab.dataset.season));

    // Навигация клавиатурой внутри tablist (стрелки / Home / End)
    tab.addEventListener('keydown', (e) => {
      const list = $$('.season-tab', tab.parentNode);
      const i = list.indexOf(tab);
      let next = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % list.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + list.length) % list.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = list.length - 1;
      if (next >= 0) {
        e.preventDefault();
        list[next].focus();
        list[next].click();
      }
    });
  });

  /* ───────────── 7. Снежинки ───────────── */
  /**
   * Создаёт слой снежинок внутри контейнера.
   * @param {HTMLElement} container
   * @param {number} count
   * @param {{scale?: number}} opts
   */
  function makeSnow(container, count, opts = {}) {
    if (!container || reduceMotion) return;
    const frag = document.createDocumentFragment();
    const chars = ['❄', '❅', '❆', '·', '✦'];

    for (let i = 0; i < count; i++) {
      const f = document.createElement('span');
      f.className = 'flake';
      f.textContent = chars[Math.floor(Math.random() * chars.length)];
      const size = (Math.random() * 10 + 6) * (opts.scale || 1);
      const dur = Math.random() * 8 + 9;
      f.style.left = `${Math.random() * 100}%`;
      f.style.fontSize = `${size.toFixed(1)}px`;
      f.style.animationDuration = `${dur.toFixed(1)}s`;
      f.style.animationDelay = `${(-Math.random() * dur).toFixed(1)}s`;
      f.style.setProperty('--dx', `${(Math.random() * 60 - 30).toFixed(0)}px`);
      f.style.setProperty('--op', (Math.random() * 0.5 + 0.25).toFixed(2));
      frag.appendChild(f);
    }
    container.appendChild(frag);
  }

  makeSnow($('#snowfall'), window.innerWidth < 720 ? 24 : 46);

  /**
   * Частицы внутри карточки Frost — тема зависит от выбранного сезона.
   * @param {HTMLElement} card
   * @param {string} season
   */
  function renderFrostSnow(card, season) {
    const layer = $('.frost-snow', card);
    if (!layer) return;
    layer.innerHTML = '';
    if (reduceMotion) return;

    const palette = {
      ny: ['#c9f0ff', '#8fdcff', '#ffffff'],
      hw: ['#c084fc', '#8f7bff', '#ffb36b'],
      ea: ['#c8f7d6', '#fdf0c2', '#f9b8d0'],
    }[season] || ['#c9f0ff'];

    const chars = { ny: ['❄', '❅', '❆'], hw: ['✦', '✧', '·'], ea: ['✿', '·', '❀'] }[season] || ['❄'];
    const frag = document.createDocumentFragment();

    for (let i = 0; i < 10; i++) {
      const f = document.createElement('span');
      f.className = 'flake';
      f.textContent = chars[Math.floor(Math.random() * chars.length)];
      f.style.color = palette[Math.floor(Math.random() * palette.length)];
      f.style.left = `${Math.random() * 100}%`;
      f.style.fontSize = `${(Math.random() * 6 + 7).toFixed(0)}px`;
      f.style.animationDuration = `${(Math.random() * 6 + 8).toFixed(1)}s`;
      f.style.animationDelay = `${(-Math.random() * 10).toFixed(1)}s`;
      f.style.setProperty('--dx', `${(Math.random() * 40 - 20).toFixed(0)}px`);
      f.style.setProperty('--op', '0.75');
      frag.appendChild(f);
    }
    layer.appendChild(frag);
  }

  if (frostCard) setSeason(frostCard, frostCard.dataset.season || 'ny');

  /* ───────────── 7b. Карусель отзывов ───────────── */
  (function reviewsCarousel() {
    const track = $('#revTrack');
    const viewport = $('#revViewport');
    const prev = $('#revPrev');
    const next = $('#revNext');
    const dotsBox = $('#revDots');
    if (!track || !viewport || !track.children.length) return;

    let page = 0;

    // сколько карточек видно целиком (1 на мобиле, 2 на планшете и выше)
    function visibleFull() {
      return viewport.clientWidth > 760 ? 2 : 1;
    }

    const pagesCount = () => Math.max(1, track.children.length - visibleFull() + 1);

    function cardStep() {
      const card = track.children[0];
      if (!card) return 0;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      return card.getBoundingClientRect().width + gap;
    }

    function maxOffset() {
      return Math.max(0, track.scrollWidth - viewport.clientWidth);
    }

    function clampPage() {
      page = Math.max(0, Math.min(page, pagesCount() - 1));
    }

    function render() {
      clampPage();
      const offset = Math.min(page * cardStep(), maxOffset());
      track.style.transform = `translateX(${-offset}px)`;

      dotsBox.innerHTML = '';
      for (let i = 0; i < pagesCount(); i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Отзыв ${i + 1}`);
        b.classList.toggle('is-active', i === page);
        b.addEventListener('click', () => { page = i; render(); });
        dotsBox.appendChild(b);
      }

      if (prev) prev.disabled = page === 0;
      if (next) next.disabled = page >= pagesCount() - 1;
    }

    prev?.addEventListener('click', () => { page--; render(); });
    next?.addEventListener('click', () => { page++; render(); });

    // Свайп на тач-устройствах
    let touchX = null;
    viewport.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    viewport.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) { page += dx < 0 ? 1 : -1; render(); }
      touchX = null;
    }, { passive: true });

    window.addEventListener('resize', render);
    render();
  })();

  /* ───────────── 7c. Топ донатеров ─────────────
     Заполняется вручную по мере покупок (или позже из бэкенда).
     Пока список пуст — в разметке уже стоит заглушка. */
  (function topDonators() {
    const list = $('#topdonList');
    const empty = $('#topdonEmpty');
    if (!list || !empty) return;

    // ← заполнять по мере покупок: ник, сумма в ₽
    const TOP_DONATORS = [];

    if (!TOP_DONATORS.length) return;

    empty.hidden = true;
    list.hidden = false;
    list.innerHTML = TOP_DONATORS
      .slice()
      .sort((a, b) => b.sum - a.sum)
      .map((d) => `
        <li class="topdon__row">
          <img class="topdon__avatar" src="https://mc-heads.net/avatar/${encodeURIComponent(d.nick)}/40" alt="" loading="lazy" />
          <span class="topdon__nick">${d.nick}</span>
          <span class="topdon__sum">${d.sum} ₽</span>
        </li>`)
      .join('');
  })();

  /* ───────────── 8. Canvas: капли крови и искры ───────────── */
  (function bloodParticles() {
    const canvas = $('#particles');
    if (!canvas || reduceMotion) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles = [];
    let raf = 0;
    let running = true;

    /** Пересчёт размеров под контейнер (fixed, весь viewport). */
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawn();
    }

    /** Количество частиц зависит от размера экрана. */
    function particleCount() {
      const area = w * h;
      return Math.max(18, Math.min(70, Math.round(area / 24000)));
    }

    function makeParticle(initial = false) {
      const type = Math.random() < 0.72 ? 'blood' : 'spark';
      return {
        type,
        x: Math.random() * w,
        y: initial ? Math.random() * h : -20,
        r: type === 'blood' ? Math.random() * 2.2 + 0.8 : Math.random() * 1.4 + 0.6,
        vy: type === 'blood' ? Math.random() * 0.35 + 0.18 : -(Math.random() * 0.3 + 0.08),
        vx: (Math.random() - 0.5) * 0.22,
        alpha: Math.random() * 0.45 + 0.15,
        phase: Math.random() * Math.PI * 2,
        wobble: Math.random() * 0.5 + 0.2,
        hue: type === 'blood'
          ? 350 + Math.random() * 10
          : 195 + Math.random() * 25,
      };
    }

    function spawn() {
      const target = particleCount();
      particles = Array.from({ length: target }, () => makeParticle(true));
    }

    let t = 0;

    function frame() {
      if (!running) return;
      t += 0.012;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        // Движение: падение капель / подъём искр + лёгкое покачивание
        p.x += p.vx + Math.sin(t * p.wobble + p.phase) * 0.28;
        p.y += p.vy;

        // Перенос по вертикали
        if (p.type === 'blood' && p.y > h + 20) {
          Object.assign(p, makeParticle(false));
        } else if (p.type === 'spark' && p.y < -20) {
          Object.assign(p, makeParticle(false));
          p.y = h + 20;
        }
        // Перенос по горизонтали
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;

        const flicker = p.type === 'spark'
          ? p.alpha * (0.55 + Math.sin(t * 2 + p.phase) * 0.45)
          : p.alpha;

        if (p.type === 'blood') {
          // Свечение
          ctx.beginPath();
          ctx.fillStyle = `hsla(${p.hue}, 85%, 55%, ${flicker * 0.35})`;
          ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
          // Ядро капли
          ctx.beginPath();
          ctx.fillStyle = `hsla(${p.hue}, 88%, 58%, ${flicker})`;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.fillStyle = `hsla(${p.hue}, 90%, 72%, ${Math.max(0, flicker)})`;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    raf = requestAnimationFrame(frame);

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 180);
    });

    // Экономим ресурсы: пауза, когда вкладка не видна
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    });
  })();

  /* ───────────── 9. FAQ-аккордеон ───────────── */
  const faqItems = $$('.faq__item');
  faqItems.forEach((item) => {
    const btn = $('.faq__q', item);
    btn?.addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      // Закрываем остальные — классический «один открыт»
      faqItems.forEach((other) => {
        other.classList.remove('is-open');
        $('.faq__q', other)?.setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ───────────── 10. Модалка покупки ───────────── */
  const modal = $('#modal');
  const modalTitle = $('#modalTitle');
  const modalPrice = $('#modalPrice');
  const buyForm = $('#buyForm');
  let lastFocused = null;

  function openModal(tier, price) {
    if (!modal) return;
    lastFocused = document.activeElement;
    if (modalTitle) modalTitle.textContent = tier;
    if (modalPrice) modalPrice.textContent = price;

    // Перекрашиваем акцент модалки под выбранный донат
    const accent = {
      Blood: ['#c1081f', 'rgba(255, 45, 75, 0.28)'],
      'Blood God': ['#c1081f', 'rgba(242, 193, 78, 0.28)'],
      Vampire: ['#7c3aed', 'rgba(168, 85, 247, 0.3)'],
      Frost: ['#3a8fc0', 'rgba(125, 211, 252, 0.32)'],
    }[tier] || ['#c1081f', 'rgba(255, 45, 75, 0.28)'];

    const dialog = $('.modal__dialog', modal);
    if (dialog) {
      dialog.style.borderColor = accent[1];
      dialog.style.boxShadow = `0 40px 100px -30px #000, 0 0 70px -30px ${accent[1]}`;
    }
    if (modalPrice) modalPrice.style.color = accent[0];

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    setTimeout(() => $('input[name="nick"]', modal)?.focus(), 120);
  }

  function closeModal() {
    if (!modal?.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (!nav?.classList.contains('is-open')) document.body.style.overflow = '';
    lastFocused?.focus?.();
  }

  $$('.btn--buy').forEach((btn) => {
    btn.addEventListener('click', () => openModal(btn.dataset.buy, btn.dataset.price));
  });

  $$('[data-close]', modal || document).forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  // Ловушка фокуса внутри модалки
  modal?.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = $$(
      'button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
      modal
    ).filter((el) => !el.disabled && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  buyForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nick = buyForm.querySelector('input[name="nick"]');
    const value = nick.value.trim();

    // Простая валидация никнейма Minecraft
    if (!/^[A-Za-z0-9_]{3,16}$/.test(value)) {
      nick.style.borderColor = '#ff2d4b';
      nick.focus();
      showToast('Никнейм: 3–16 символов, латиница, цифры и _');
      setTimeout(() => { nick.style.borderColor = ''; }, 2200);
      return;
    }

    const tier = modalTitle?.textContent || 'донат';
    const price = modalPrice?.textContent || '';
    closeModal();
    showToast(`Заявка на ${tier} (${price} ₽) для ${value} создана`);

    // Переходим на страницу подтверждения с данными заявки
    const params = new URLSearchParams({
      tier,
      price: String(price).replace(/[^\d]/g, ''),
      nick: value,
    });
    setTimeout(() => { location.href = `thanks.html?${params}`; }, 700);
  });

  /* ───────────── 12. Интерактивные анимации ───────────── */

  // 12a. 3D-наклон карточек за курсором (только устройства с hover)
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canHover && !reduceMotion) {
    const MAX_TILT = 7;
    $$('.card').forEach((card) => {
      let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
      const apply = () => {
        cx += (tx - cx) * 0.12;
        cy += (ty - cy) * 0.12;
        card.style.transform = `perspective(900px) rotateX(${cy}deg) rotateY(${cx}deg)`;
        if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) raf = requestAnimationFrame(apply);
        else { raf = 0; if (!tx && !ty) card.style.transform = ''; }
      };
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * MAX_TILT * 2;
        ty = -((e.clientY - r.top) / r.height - 0.5) * MAX_TILT * 2;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      card.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(apply); });
    });
  }

  // 12b. Параллакс: капля и фоновые свечения следят за курсором
  if (canHover && !reduceMotion) {
    const drop = $('.drop');
    const glows = $$('.bg-glow');
    let mx = 0, my = 0, cx = 0, cy = 0, rafId = 0;
    const step = () => {
      cx += (mx - cx) * 0.06;
      cy += (my - cy) * 0.06;
      if (drop) drop.style.translate = `${cx * 14}px ${cy * 10}px`;
      glows.forEach((g, i) => {
        const k = (i + 1) * 8;
        g.style.translate = `${-cx * k}px ${-cy * k * 0.6}px`;
      });
      rafId = requestAnimationFrame(step);
    };
    window.addEventListener('pointermove', (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!rafId) rafId = requestAnimationFrame(step);
    }, { passive: true });
  }

  /* ───────────── 13. Плавный скролл (фолбэк для старых браузеров) ───────────── */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const offset = (header?.offsetHeight || 0) + 12;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });
})();
