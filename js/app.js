/* =========================================================
   StudyFlow · Arranque
   Carga el estado, aplica tema / texto / contraste,
   muestra la pantalla de inicio y decide la primera vista.
   ========================================================= */
(function (SF) {
  const { ui, u, M, D } = SF;
  const S = () => SF.store.state;
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const app = {};

  app.applySettings = function () {
    const s = S().settings;
    const dark = s.theme === 'dark' || (s.theme === 'system' && mq.matches);
    const b = document.body;
    b.dataset.theme = dark ? 'dark' : 'light';
    b.dataset.density = s.density === 'compact' ? 'compact' : 'comfortable';
    b.dataset.text = s.text === 'large' ? 'large' : 'normal';
    b.dataset.contrast = s.contrast ? 'high' : 'normal';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0E1424' : '#F7F9FC');
    // Los controles segmentados dependen del ancho del texto
    requestAnimationFrame(() => ui.segs(document));
    setTimeout(() => ui.segs(document), 320);
    const tl = document.querySelector('[data-stage="theme"]');
    if (tl) tl.innerHTML = SF.icon(dark ? 'sun' : 'moon', 16) + (dark ? 'Tema claro' : 'Tema oscuro');
  };
  mq.addEventListener && mq.addEventListener('change', () => { if (S().settings.theme === 'system') app.applySettings(); });

  /* Carga la semana de ejemplo (Ana). */
  app.loadSample = function (withProfile) {
    D.setToday(null); // la semana de ejemplo siempre empieza en el día inicial
    SF.store.commit((s) => {
      s.demo.today = null; s.demo.base = null;
      s.streak = SF.store.defaults().streak;
      if (withProfile !== false || !s.profile.name) s.profile = { name: 'Ana Martínez', email: 'ana.martinez@uni.edu', career: 'Estudiante de Ingeniería' };
      s.session.loggedIn = true; s.session.hasPlan = true; s.session.tutorialDone = false; s.session.welcomeSeen = true;
      s.subjects = u.clone(SF.SAMPLE_SUBJECTS);
      s.activities = SF.sampleActivities();
      s.notes = SF.sampleNotes(); s.notesTrash = [];
      s.notifications = SF.sampleNotifications();
      s.lastActivityId = 'a4'; s.timer = null; s.todayOrder = null; s.chat = [];
      s.plan.blocks = []; M.recalc('silent'); s.plan.status = 'confirmed'; s.plan.changes = null;
    }, { noRender: true });
  };

  /* ---------- Avisos push simulados según la intensidad ---------- */
  let pushTimer = null, pushCount = 0, pushedThisLoad = false;
  app.showPush = function (force) {
    if (!force && ((S().timer && S().timer.running) || ((SF.router.current() || {}).name === 'actividad'))) return;
    const st = S();
    const a = M.focus();
    if (!a) { if (force) ui.toast('No hay actividades pendientes para avisarte', { icon: 'bell' }); return; }
    const nb = M.nextBlock(a.id);
    ui.push({
      tag: 'Primero',
      title: a.title,
      body: (nb && nb.date === D.TODAY ? 'Tu bloque empieza a las ' + nb.start + '. ' : '') + M.reason(a),
      onOpen: async () => { clearTimeout(pushTimer); if (await SF.router.canLeave()) SF.router.go('detalle', { id: a.id }); },
      onSnooze: (min) => {
        clearTimeout(pushTimer);
        SF.store.commit((s) => { s.notifications.unshift({ id: u.uid('nt'), kind: 'pending', actId: a.id, time: '09:41', title: a.title, body: 'Pospuesto ' + min + ' min.', read: false }); });
        pushTimer = setTimeout(() => app.showPush(true), 12000); // en la demo, el minuto dura un segundo
      }
    });
    pushCount++;
    const it = st.settings.intensity;
    clearTimeout(pushTimer);
    if (!force && ((it === 'normal' && pushCount < 2) || (it === 'intensa' && pushCount < 4))) {
      pushTimer = setTimeout(() => { if (!SF.ui.layers() && !(SF.tour && SF.tour.active())) app.showPush(false); }, it === 'intensa' ? 25000 : 45000);
    }
  };
  app.maybePush = function () {
    const st = S();
    if (pushedThisLoad || !st.session.tutorialDone || !st.session.hasPlan) return;
    pushedThisLoad = true;
    setTimeout(() => {
      const cur = SF.router.current();
      if (SF.ui.layers() || document.querySelector('.racha-fx') || (SF.tour && SF.tour.active()) || !cur || cur.name !== 'hoy' || (S().timer && S().timer.running)) { pushedThisLoad = false; return; }
      app.showPush(false);
    }, 2600);
  };

  /* ---------- Inicio ---------- */
  async function boot() {
    SF.store.load();
    SF.streak.sync();
    app.applySettings();
    ui.init();
    SF.router.init();
    SF.stage.init();
    const st = S();
    // Si el cronómetro estaba corriendo, sigue contando
    const splash = document.querySelector('#splash');
    let first = 'pregunta';
    if (st.session.loggedIn && st.session.hasPlan) first = 'hoy';
    else if (st.session.loggedIn) first = 'crear-plan';
    const hash = (location.hash || '').slice(1);
    const deep = ['plan', 'registrar', 'asistente', 'ajustes', 'avisos', 'apariencia', 'ayuda', 'perfil', 'criterio', 'intensidad', 'racha'];
    await u.sleep(splash ? 900 : 0);
    if (first === 'hoy' && deep.includes(hash)) {
      SF.router.go('hoy', {}, { reset: true, transition: 'none' });
      if (hash !== 'hoy') SF.router.go(hash, {}, SF.screens[hash].tab ? { reset: true, transition: 'none' } : { transition: 'none' });
    } else SF.router.go(first, {}, { reset: true, transition: 'none' });
    if (splash) { splash.classList.add('out'); setTimeout(() => splash.remove(), 420); }
    try { history.replaceState({ sf: 0 }, '', location.href); history.pushState({ sf: 1 }, '', location.href); } catch (e) {}
    // Reloj de la barra de estado (hora de la demo)
    const clock = document.querySelector('#sb-time'); if (clock) clock.textContent = '9:41';
    window.addEventListener('online', () => SF.router.refresh());
    window.addEventListener('offline', () => SF.router.refresh());
  }

  SF.app = app;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.SF);
