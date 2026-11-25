/* =========================================================
   StudyFlow · Panel del prototipo (fuera de la app)
   Todo lo que sirve para enseñar o probar el prototipo vive
   aquí y en las columnas a los lados del teléfono: entrar con
   la cuenta de ejemplo, simular días y simular situaciones.
   Sus mensajes y confirmaciones salen en el panel, nunca
   dentro de la app.
   ========================================================= */
(function (SF) {
  const { ui, u, M, D } = SF;
  const I = SF.icon;
  const S = () => SF.store.state;
  const R = SF.streak;
  const dias = (n) => u.plural(n, 'día', 'días');
  const $ = (sel) => document.querySelector(sel);
  const stage = {};

  /* ---------- Mensajes del panel ---------- */
  let undoTimer = null;
  function say(msg, undo) {
    const box = $('#stage-msg'); if (!box) return;
    clearTimeout(undoTimer);
    box.innerHTML = '<p>' + u.esc(msg) + '</p>';
    box.classList.toggle('on', !!msg);
    if (!undo) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'stage-btn'; b.innerHTML = I('undo', 16) + 'Deshacer';
    b.addEventListener('click', () => { say(''); undo(); });
    box.appendChild(b);
    undoTimer = setTimeout(() => b.remove(), 20000);
  }

  /* ---------- Confirmación dentro del panel ---------- */
  let cancelOpen = null;
  function confirm(btn, o) {
    if (cancelOpen) cancelOpen();
    return new Promise((resolve) => {
      const box = document.createElement('div');
      box.className = 'stage-confirm';
      box.setAttribute('role', 'alertdialog');
      box.setAttribute('aria-labelledby', 'sc-t'); box.setAttribute('aria-describedby', 'sc-b');
      box.innerHTML = '<p id="sc-t"><b>' + u.esc(o.title) + '</b></p><p id="sc-b">' + u.esc(o.body) + '</p>' +
        '<div class="hrow wrap"><button type="button" class="stage-btn" data-c="0">Cancelar</button><button type="button" class="stage-btn ' + (o.danger ? 'danger' : 'primary') + '" data-c="1">' + u.esc(o.ok) + '</button></div>';
      const done = (v) => { if (!cancelOpen) return; cancelOpen = null; box.remove(); btn.focus({ preventScroll: true }); resolve(v); };
      cancelOpen = () => done(false);
      box.addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) done(b.dataset.c === '1'); });
      box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); done(false); } });
      btn.closest('.stage-group').appendChild(box);
      box.querySelector('[data-c="0"]').focus();
    });
  }

  /* Cierra lo que haya abierto en la app antes de cambiarla desde fuera. */
  function clearApp() { if (SF.tour && SF.tour.active()) SF.tour.stop(false, true); ui.closeAll(); ui.$$('.toast, .push', $('#app')).forEach((x) => x.remove()); }

  /* ---------- Simular días ---------- */
  const BASE_KEYS = ['activities', 'plan', 'notifications', 'lastActivityId', 'todayOrder', 'timer', 'streak'];
  const keepBase = (s) => { if (!s.demo.base) s.demo.base = SF.store.snapshot(BASE_KEYS); };
  const stepDay = (s) => { s.demo.today = D.add(D.TODAY, 1); D.setToday(s.demo.today); };
  function replan(s) {
    s.todayOrder = null;
    s.plan.changes = null;
    s.notifications = s.notifications.filter((n) => n.kind !== 'plan');
    M.recalc('silent'); // lo pendiente pasa a los próximos bloques libres
  }
  function ready() {
    const s = S().session;
    if (!s.loggedIn || !s.hasPlan) { say('Entra primero con una cuenta para simular días.'); return false; }
    if (SF.tour && SF.tour.active()) { say('Termina el tutorial para simular días.'); return false; }
    clearApp();
    return true;
  }

  stage.nextDay = function () {
    if (!ready()) return;
    const before = R.get();
    SF.store.commit((s) => { keepBase(s); stepDay(s); replan(s); });
    const now = R.get();
    say(before.current && !now.current ? 'Ayer no hubo ninguna sesión: la racha de ' + dias(before.current) + ' terminó.'
      : now.current ? 'Racha de ' + dias(now.current) + '. Falta una sesión para llegar a ' + dias(now.current + 1) + '.'
        : 'Sin racha. Termina una sesión en la app para empezar una.');
  };

  stage.fulfilDay = function () {
    if (R.get().doneToday || !ready()) return;
    SF.store.commit((s) => { keepBase(s); R.recordToday(); });
    say('Hoy cuenta: racha de ' + dias(R.get().current) + '.');
    R.celebrate();
  };

  /* Salta al día de un hito cumpliendo todos los anteriores. Si la racha ya
     llegó o lo pasó, vuelve a contar desde el día inicial. Con «pending», ese
     día queda sin cumplir para terminar una sesión de verdad. */
  stage.goToHito = function (days, pending) {
    const m = R.HITOS.find((x) => x.days === days);
    if (!m || !ready()) return;
    const prev = SF.store.snapshot(BASE_KEYS.concat('demo'));
    SF.store.commit((s) => {
      keepBase(s);
      if (R.get().current >= days) {
        Object.keys(s.demo.base).forEach((k) => { s[k] = u.clone(s.demo.base[k]); });
        s.demo.today = null; D.setToday(null);
        if (R.get().current >= days) s.streak = SF.store.defaults().streak; // la racha inicial ya superaba el hito
      }
      for (let now = R.get(); now.doneToday || now.current !== days - 1; now = R.get()) {
        if (!now.doneToday) R.recordToday();
        stepDay(s);
      }
      replan(s);
      if (!pending) R.recordToday();
    });
    say(pending ? 'Termina una sesión en la app para conseguir «' + m.name + '».' : 'Hito «' + m.name + '»: racha de ' + dias(days) + '.', () => {
      clearApp(); SF.store.restore(prev); say('De vuelta al ' + D.long(D.TODAY) + '.');
    });
    if (!pending) R.celebrate();
  };

  stage.resetDay = async function (btn) {
    if (!S().demo.base) return;
    const ok = await confirm(btn, { title: '¿Volver al ' + D.long(D.BASE) + '?', body: 'Las actividades, el plan y la racha quedan como estaban antes de simular días. Las notas y los ajustes no cambian.', ok: 'Volver' });
    if (!ok) return;
    clearApp();
    SF.store.commit((s) => {
      const base = s.demo.base;
      s.demo.base = null; s.demo.today = null;
      D.setToday(null);
      Object.keys(base).forEach((k) => { s[k] = base[k]; });
    });
    const back = $('[data-stage="next-day"]'); if (back) back.focus({ preventScroll: true });
    say('De vuelta al ' + D.long(D.BASE) + '.');
  };

  /* ---------- Cuenta y datos ---------- */
  const hasData = () => S().session.loggedIn;
  function enterSample(withProfile, msg) {
    clearApp();
    const seen = S().session.tutorialDone;
    SF.app.loadSample(withProfile);
    if (withProfile === false) SF.store.commit((s) => { s.session.tutorialDone = seen; }, { silent: true });
    SF.router.go('hoy', {}, { reset: true, transition: 'fade' });
    say(msg);
  }
  const ACTIONS = {
    'next-day': () => stage.nextDay(),
    'fulfil-day': () => stage.fulfilDay(),
    'reset-day': (b) => stage.resetDay(b),
    hito(b) {
      const drop = $('#stage-hitos');
      drop.open = false; drop.querySelector('summary').focus();
      stage.goToHito(Number(b.dataset.d), $('#stage-pend').checked);
    },
    theme() {
      const dark = document.body.dataset.theme === 'dark';
      SF.store.commit((s) => { s.settings.theme = dark ? 'light' : 'dark'; });
      SF.app.applySettings();
    },
    tour() {
      if (SF.tour.active()) return;
      if (!S().session.loggedIn) SF.app.loadSample(true);
      clearApp();
      SF.router.go('hoy', {}, { reset: true, transition: 'fade' });
      setTimeout(() => SF.tour.start('hoy'), 350);
      say('');
    },
    async sample(b) {
      if (hasData() && !(await confirm(b, { title: '¿Entrar con la cuenta de ejemplo?', body: 'Reemplaza los datos que hay ahora en la app por los de Ana.', ok: 'Entrar', danger: true }))) return;
      enterSample(true, 'Cuenta de ejemplo cargada.');
    },
    async restore(b) {
      if (!hasData()) { say('Entra primero con una cuenta.'); return; }
      if (!(await confirm(b, { title: '¿Restaurar los datos de ejemplo?', body: 'Se reemplazan las actividades, las notas, el plan y la racha por la semana de ejemplo. El perfil se mantiene.', ok: 'Restaurar', danger: true }))) return;
      enterSample(false, 'Datos de ejemplo restaurados.');
    },
    async reset(b) {
      if (!(await confirm(b, { title: '¿Empezar de cero?', body: 'Se borra todo lo que hay en este navegador y la app vuelve a su pantalla de inicio.', ok: 'Empezar de cero', danger: true }))) return;
      clearApp();
      SF.store.wipe(); SF.app.applySettings();
      SF.router.go('pregunta', {}, { reset: true, transition: 'fade' });
      say('La app está como la primera vez.');
    },
    push() {
      if (!hasData() || !M.focus()) { say('No hay actividades pendientes para mostrar un aviso.'); return; }
      if (SF.tour && SF.tour.active()) { say('Termina el tutorial para ver un aviso.'); return; }
      say(''); SF.app.showPush(true);
    }
  };

  /* ---------- Estado visible del panel ---------- */
  function paint() {
    const str = R.get(), lv = R.level(str.current);
    const lbl = $('#stage-day'), ful = $('[data-stage="fulfil-day"]'), back = $('[data-stage="reset-day"]');
    if (lbl) lbl.textContent = D.longCap(D.TODAY);
    if (ful) { ful.disabled = str.doneToday; ful.innerHTML = I('flame-check', 16) + (str.doneToday ? 'Hoy ya está cumplido' : 'Dar hoy por cumplido'); }
    if (back) { back.hidden = !S().demo.base; back.innerHTML = I('undo', 16) + 'Volver al ' + D.short(D.BASE); }
    document.querySelectorAll('.stage-hito').forEach((x) => { if (lv && Number(x.dataset.d) === lv.days) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current'); });
    document.querySelectorAll('[data-sim]').forEach((x) => { x.checked = !!S().demo[x.dataset.sim]; });
  }

  stage.init = function () {
    const asides = Array.from(document.querySelectorAll('.stage-aside'));
    if (!asides.length) return;
    const icons = { sample: 'user-round', tour: 'compass', reset: 'trash', 'next-day': 'calendar-next', push: 'bell-ring', restore: 'refresh-cw' };
    Object.keys(icons).forEach((k) => { const b = $('[data-stage="' + k + '"]'); if (b) b.innerHTML = I(icons[k], 16) + b.textContent; });
    asides.forEach((a) => {
      a.addEventListener('click', (e) => {
        const b = e.target.closest('[data-stage]'); if (!b || b.disabled) return;
        if (cancelOpen) cancelOpen();
        ACTIONS[b.dataset.stage](b);
      });
      a.addEventListener('change', (e) => {
        const k = e.target.dataset.sim; if (!k) return;
        SF.store.commit((s) => { s.demo[k] = e.target.checked; });
        say(k === 'offline' ? (e.target.checked ? 'Sin conexión: se nota en Registrar y en el Asistente.' : 'Conexión restablecida.') : (e.target.checked ? 'Micrófono bloqueado: la voz pide permiso.' : 'Micrófono disponible.'));
      });
    });

    /* Desplegable de hitos: se cierra al elegir, al tocar fuera o con Esc */
    const drop = $('#stage-hitos');
    drop.querySelector('summary').innerHTML = I('flag', 16) + 'Ir al día de un hito' + I('chevron-down', 16, 'sd-arrow');
    drop.querySelector('.stage-pop').innerHTML = '<ul>' + R.HITOS.map((m) =>
      '<li><button type="button" class="stage-hito" data-stage="hito" data-d="' + m.days + '">' + R.badge(m, 'done') + '<span class="grow"><b>' + m.name + '</b><span>' + m.days + ' días</span></span>' + I('check', 16, 'sd-now') + '</button></li>').join('') + '</ul>' +
      '<label class="stage-pend" for="stage-pend"><span class="grow"><b>Dejar ese día pendiente</b><span>Para terminar tú la sesión</span></span><input type="checkbox" role="switch" class="switch" id="stage-pend"></label>';
    document.addEventListener('pointerdown', (e) => { if (drop.open && !drop.contains(e.target)) drop.open = false; }, true);
    drop.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drop.open) { e.stopPropagation(); drop.open = false; drop.querySelector('summary').focus(); } });

    SF.store.on(paint); paint();
  };

  SF.stage = stage;
})(window.SF);
