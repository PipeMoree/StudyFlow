/* =========================================================
   StudyFlow · Tutorial guiado (6 pasos, coach marks)
   Resalta el elemento real de cada pantalla. Se puede
   saltar, retroceder y usar con teclado (← → Esc).
   ========================================================= */
(function (SF) {
  const { ui } = SF;
  const STEPS = [
    { screen: 'hoy', target: '[data-tour="priority"]', title: 'Tu prioridad de hoy', text: 'Arriba siempre verás qué hacer primero y por qué. Toca «Empezar ahora» para cronometrarla.' },
    { screen: 'hoy', target: '[data-tour="settings-btn"]', title: 'Hazla tuya', text: 'En Ajustes cambias el tema oscuro, el tamaño del texto, el alto contraste, el criterio y los avisos.' },
    { screen: 'plan', target: '[data-tour="plan-week"]', title: 'Tu semana, en bloques', text: 'StudyFlow coloca tus tareas en tus horas libres sin tocar tus clases. Toca un bloque libre para añadir algo.' },
    { screen: 'plan', sub: 'calendario', target: '[data-tour="cal-views"]', title: 'Calendario y notas', text: 'Cambia entre día, semana y mes. Tus notas viven en la pestaña de al lado.' },
    { screen: 'plan', sub: 'calendario', target: '[data-tour="tab-registrar"]', title: 'Registra en segundos', text: 'Por voz, por texto o a mano. Dilo como te salga: nosotros detectamos la fecha y la materia.' },
    { screen: 'asistente', target: '[data-tour="assistant-input"]', title: 'Pídeselo al asistente', text: '«Organiza mi semana» o «Mueve el taller al jueves». Siempre te pide confirmación antes de cambiar algo.' }
  ];
  let i = 0, root = null, origin = 'hoy', onKey = null, onResize = null;

  function go(n) {
    i = Math.max(0, Math.min(STEPS.length - 1, n));
    const s = STEPS[i];
    const cur = SF.router.current();
    if (s.sub) SF.planView.sub = s.sub; else if (s.screen === 'plan') SF.planView.sub = 'plan';
    if (!cur || cur.name !== s.screen || SF.router.depth() > 1 || s.screen === 'plan') SF.router.go(s.screen, {}, { reset: true, transition: 'fade' });
    setTimeout(place, 480); setTimeout(place, 900);
  }
  function place() {
    if (!root) return;
    const s = STEPS[i];
    const app = document.querySelector('#app');
    const t = document.querySelector('.screen:last-child ' + s.target) || document.querySelector(s.target);
    const ring = root.querySelector('.coach-ring');
    const card = root.querySelector('.coach-card');
    const ar = app.getBoundingClientRect();
    let r = t ? t.getBoundingClientRect() : null;
    if (t) {
      const body = t.closest('.screen-body');
      if (body && (r.top < ar.top + 60 || r.bottom > ar.bottom - 100)) { t.scrollIntoView({ block: 'center' }); r = t.getBoundingClientRect(); }
    }
    // Primero los textos de la tarjeta: así su altura es la real al colocarla
    card.querySelector('.coach-step').textContent = 'Paso ' + (i + 1) + ' de ' + STEPS.length;
    card.querySelector('h2').textContent = s.title;
    card.querySelector('p').textContent = s.text;
    card.querySelector('.coach-dots').innerHTML = STEPS.map((_, k) => '<i class="' + (k === i ? 'on' : '') + '"></i>').join('');
    card.querySelector('[data-c="prev"]').hidden = i === 0;
    card.querySelector('[data-c="next"]').textContent = i === STEPS.length - 1 ? 'Empezar a usar StudyFlow' : 'Siguiente';
    const scale = ar.width / app.offsetWidth || 1;
    if (r) {
      const pad = 6;
      const x = (r.left - ar.left) / scale - pad, y = (r.top - ar.top) / scale - pad, w = r.width / scale + pad * 2, h = Math.min(r.height / scale + pad * 2, 300);
      Object.assign(ring.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', opacity: 1 });
      const H = app.offsetHeight, ch = card.offsetHeight;
      const below = y + h + 16, above = y - 16 - ch;
      card.style.top = (below + ch <= H - 12 ? below : above >= 12 ? above : Math.max(12, H - ch - 12)) + 'px';
    } else { ring.style.opacity = 0; card.style.top = '40%'; }
    if (card.dataset.step !== String(i)) { card.dataset.step = String(i); card.classList.remove('rise'); void card.offsetWidth; card.classList.add('rise'); }
    ui.announce('Paso ' + (i + 1) + ' de ' + STEPS.length + '. ' + s.title + '. ' + s.text);
    card.querySelector('[data-c="next"]').focus({ preventScroll: true });
  }

  const tour = {
    start(from) {
      if (root) return;
      origin = from || 'hoy';
      ui.closeAll();
      root = document.createElement('div');
      root.className = 'coach';
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-label', 'Tutorial de StudyFlow');
      root.innerHTML = '<div class="coach-catch"></div><div class="coach-ring" aria-hidden="true"></div>' +
        '<div class="coach-card"><div class="coach-top"><span class="coach-step"></span><button type="button" class="link-btn" data-c="skip">Saltar</button></div>' +
        '<h2></h2><p></p><div class="coach-actions"><div class="coach-dots" aria-hidden="true"></div><div class="hrow" style="gap:8px"><button type="button" class="btn btn-sm btn-ghost" data-c="prev">Atrás</button><button type="button" class="btn btn-sm btn-primary" data-c="next">Siguiente</button></div></div></div>';
      document.querySelector('#app').appendChild(root);
      root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-c]'); if (!b) return;
        if (b.dataset.c === 'next') { if (i === STEPS.length - 1) tour.stop(true); else go(i + 1); }
        if (b.dataset.c === 'prev') go(i - 1);
        if (b.dataset.c === 'skip') tour.stop(false);
      });
      onKey = (e) => {
        if (!root) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); if (i < STEPS.length - 1) go(i + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); tour.stop(false); }
        if (e.key === 'Tab') ui.trap(e, root.querySelector('.coach-card'));
      };
      onResize = () => place();
      document.addEventListener('keydown', onKey, true);
      window.addEventListener('resize', onResize);
      go(0);
    },
    stop(finished, silent) {
      if (!root) return;
      root.classList.add('out');
      const r = root; root = null;
      setTimeout(() => r.remove(), 220);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', onResize);
      SF.store.commit((s) => { s.session.tutorialDone = true; }, { silent: true });
      SF.planView.sub = 'plan';
      if (silent) return;
      if (origin === 'ajustes') { SF.router.go('hoy', {}, { reset: true, transition: 'fade' }); setTimeout(() => SF.router.go('ajustes'), 30); }
      else SF.router.go('hoy', {}, { reset: true, transition: 'fade' });
      ui.toast(finished ? '¡Listo! Ya conoces StudyFlow' : 'Puedes ver el tutorial cuando quieras en Ajustes → Ayuda', { icon: finished ? 'sparkles' : 'info' });
    },
    active: () => !!root
  };
  SF.tour = tour;
})(window.SF);
