/* ═══════════════════════════════════════════
   BAR LEADS V2 — interactions
   ═══════════════════════════════════════════ */
(() => {
  'use strict';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── nav: glass on scroll + progress bar ── */
  const nav = document.getElementById('nav');
  const bar = document.getElementById('progress-bar');
  const onScroll = () => {
    nav.classList.toggle('is-scrolled', scrollY > 24);
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar && max > 0) bar.style.width = (scrollY / max * 100) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── reveal on scroll (headlines + blocks) ── */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
    }
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  const startObserving = () => document.querySelectorAll('.reveal, .line-mask, .section-title, h1').forEach(el => io.observe(el));
  if (document.body.classList.contains('is-loading')) {
    addEventListener('preloader:done', startObserving, { once: true });
    setTimeout(startObserving, 4000); // safety net if preloader script ever fails
  } else {
    startObserving();
  }

  /* ── count-up stats ── */
  const fmt = new Intl.NumberFormat('en-US');
  const countIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      countIO.unobserve(e.target);
      const el = e.target, end = +el.dataset.count;
      if (reduceMotion || end === 0) { el.textContent = fmt.format(end); continue; }
      const t0 = performance.now(), dur = 1400;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = fmt.format(Math.round(end * (1 - Math.pow(1 - p, 4))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => countIO.observe(el));

  /* ── cursor spotlight on cards ── */
  document.querySelectorAll('.spotlight').forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ── 3D tilt on feature photos ── */
  if (!reduceMotion && matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.tilt').forEach(el => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ── "how it works": image preview follows cursor ── */
  const preview = document.getElementById('step-preview');
  if (preview && matchMedia('(hover:hover)').matches) {
    const img = preview.querySelector('img');
    let raf = null, px = 0, py = 0;
    const move = (e) => {
      px = e.clientX + 28; py = e.clientY - 120;
      if (!raf) raf = requestAnimationFrame(() => {
        preview.style.left = Math.min(px, innerWidth - 250) + 'px';
        preview.style.top = Math.max(20, Math.min(py, innerHeight - 300)) + 'px';
        raf = null;
      });
    };
    document.querySelectorAll('.step').forEach(step => {
      step.addEventListener('pointerenter', () => {
        img.src = (window.__resources && window.__resources[step.dataset.img]) || step.dataset.img;
        preview.classList.add('is-active');
      });
      step.addEventListener('pointermove', move);
      step.addEventListener('pointerleave', () => preview.classList.remove('is-active'));
    });
  }

  /* ── qualify form ── */
  const form = document.getElementById('qualify-form');
  const thanks = document.getElementById('qualify-thanks');
  if (form) {
    const note = form.querySelector('.form__note');
    const noteText = note ? note.textContent : '';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; btn.style.opacity = '.6';
      try {
        const r = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            venue: document.getElementById('f-venue').value,
            city: document.getElementById('f-city').value,
            type: document.getElementById('f-type').value,
            email: document.getElementById('f-email').value
          })
        });
        if (!r.ok) throw new Error('status ' + r.status);
        form.style.display = 'none';
        thanks.hidden = false;
        thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (err) {
        btn.disabled = false; btn.style.opacity = '';
        if (note) {
          note.textContent = "Something hiccuped sending that — try again, or email us directly.";
          note.style.color = '#e8890c';
          setTimeout(() => { note.textContent = noteText; note.style.color = ''; }, 6000);
        }
      }
    });
  }
})();
