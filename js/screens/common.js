/* =========================================================
   StudyFlow · Piezas comunes de pantalla
   Barras superiores, tarjetas de actividad, selectores de
   fecha, hora y día, y acciones compartidas (detalle,
   eliminar con deshacer, empezar actividad).
   ========================================================= */
window.SF = window.SF || {};
(function (SF) {
  const { D, T, u, ui, M } = SF;
  const C = {};
  const I = SF.icon;

  C.topbar = function (title, opts) {
    opts = opts || {};
    return '<header class="topbar' + (opts.back ? '' : ' pad') + '">' +
      (opts.back ? '<button type="button" class="icon-btn" data-act="' + (opts.backAct || 'back') + '" aria-label="Volver">' + I('arrow-left') + '</button>' : '') +
      '<div class="grow"><h1 class="tb-title' + (opts.big ? ' big' : '') + '">' + u.esc(title) + '</h1>' + (opts.sub ? '<p class="tb-sub">' + opts.sub + '</p>' : '') + '</div>' +
      (opts.right || '') + '</header>';
  };

  C.subjTag = (subjectId) => '<span class="subject-tag" style="' + M.subjVar(subjectId) + '"><span class="subject-dot"></span>' + u.esc(M.subjName(subjectId)) + '</span>';

  C.typePill = (a) => '<span class="pill">' + u.esc(SF.TYPES[a.type].label) + '</span>';

  C.dueText = (a) => {
    if (a.type === 'evento') return D.short(a.date) + ' · ' + a.time;
    const r = D.rel(a.date);
    if (a.type === 'examen') return (r === 'hoy' ? 'Hoy' : r === 'mañana' ? 'Mañana' : D.short(a.date)) + ' a las ' + a.time;
    if (D.diff(a.date, D.TODAY) < 0) return 'Venció el ' + D.short(a.date);
    return 'Vence ' + (r === 'hoy' ? 'hoy a las ' + a.time : r === 'mañana' ? 'mañana' : 'el ' + D.short(a.date));
  };

  /* Fila de agenda (hora + título) usada en Hoy y en listas. */
  C.agendaRow = function (it) {
    const a = it.act || (it.actId ? M.activity(it.actId) : null);
    const id = a ? a.id : '';
    const sub = it.kind === 'block'
      ? T.dur(it.dur) + ' · ' + (it.block.parts > 1 ? 'bloque ' + it.block.part + ' de ' + it.block.parts : C.dueText(a).toLowerCase())
      : it.kind === 'exam' ? 'Examen · ' + T.dur(it.dur) : it.kind === 'event' ? 'Evento · ' + T.dur(it.dur) : T.dur(it.dur);
    const day = it.date && it.date !== D.TODAY ? '<span class="t-xs t-3">' + D.short(it.date) + '</span>' : '';
    return '<button type="button" class="card tight tap agenda-row" data-act="detail" data-id="' + id + '" style="' + M.subjVar(it.subjectId) + '">' +
      '<span class="ag-time t-num"><b>' + T.fmt2(it.start) + '</b>' + day + '</span>' +
      '<span class="ag-bar" aria-hidden="true"></span>' +
      '<span class="grow stack-xs"><span class="t-bold clamp-1">' + u.esc(a ? a.title : it.title) + '</span><span class="t-sm t-2 clamp-1">' + sub + '</span></span>' +
      I('chevron-right', 18, 't-3') + '</button>';
  };

  C.empty = (illus, title, text, action) =>
    '<div class="empty">' + ui.illus(illus, title) + '<h2>' + u.esc(title) + '</h2><p>' + u.esc(text) + '</p>' + (action || '') + '</div>';

  /* ---------- Selector de fecha (hoja) ---------- */
  C.pickDate = function (current, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      const d0 = D.parse(current || D.TODAY);
      let y = d0.getFullYear(), m = d0.getMonth();
      const friday = D.add(D.TODAY, (12 - D.wd(D.TODAY)) % 7), nextMon = D.add(D.monday(D.TODAY), 7);
      let result = null;
      const grid = () => {
        const first = new Date(y, m, 1, 12);
        const lead = (first.getDay() + 6) % 7;
        const daysIn = new Date(y, m + 1, 0).getDate();
        let h = '<div class="cal-head hrow between"><button type="button" class="icon-btn" data-nav="-1" aria-label="Mes anterior">' + I('chevron-left') + '</button><p class="t-h3" aria-live="polite">' + D.monthTitle(y, m) + '</p><button type="button" class="icon-btn" data-nav="1" aria-label="Mes siguiente">' + I('chevron-right') + '</button></div>';
        h += '<div class="month-grid" role="group" aria-label="Días de ' + D.monthTitle(y, m).toLowerCase() + '">' + ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((x) => '<span class="mg-dow" aria-hidden="true">' + x + '</span>').join('');
        for (let i = 0; i < lead; i++) h += '<span></span>';
        for (let d = 1; d <= daysIn; d++) {
          const iso = y + '-' + u.pad(m + 1) + '-' + u.pad(d);
          const past = D.diff(iso, D.TODAY) < 0;
          const cls = (iso === D.TODAY ? ' today' : '') + (iso === current ? ' sel' : '') + (past ? ' past' : '');
          h += '<button type="button" class="mg-day' + cls + '" data-date="' + iso + '" aria-label="' + D.long(iso) + (past ? ', ya pasó' : '') + '"' + (iso === current ? ' aria-pressed="true"' : '') + '>' + d + '</button>';
        }
        return h + '</div>';
      };
      const layer = ui.sheet({
        title: opts.title || 'Fecha de entrega',
        sub: 'Hoy es ' + D.long(D.TODAY) + ' (marcado en azul).',
        body: '<div class="date-picker">' + grid() + '</div>' +
          '<div class="chips">' + [['Hoy', D.TODAY], ['Mañana', D.add(D.TODAY, 1)], ['Viernes', friday], ['Próx. lunes', nextMon]].map(([l, v]) => '<button type="button" class="chip sm" data-date="' + v + '">' + l + '</button>').join('') + '</div>',
        foot: '<button type="button" class="btn btn-secondary btn-block" data-close>Cancelar</button>',
        onClose: () => resolve(result),
        mount(el, ly) {
          el.addEventListener('click', (e) => {
            const nav = e.target.closest('[data-nav]');
            if (nav) { m += Number(nav.dataset.nav); if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } el.querySelector('.date-picker').innerHTML = grid(); return; }
            const b = e.target.closest('[data-date]');
            if (b) { result = b.dataset.date; ly.close(); }
          });
        }
      });
    });
  };

  /* ---------- Selector de hora (hoja) ---------- */
  C.pickTime = function (current, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      let [hh, mm] = (current || opts.def || '18:00').split(':').map(Number);
      let result = null;
      const shortcuts = opts.shortcuts || [['8:00', '08:00'], ['12:00', '12:00'], ['18:00', '18:00'], ['Fin del día', '23:59']];
      const view = () =>
        '<div class="time-picker" role="group" aria-label="Hora">' +
        '<div class="tp-col"><button type="button" class="icon-btn filled" data-t="h+" aria-label="Sumar una hora">' + I('plus') + '</button><output class="tp-val t-num" aria-live="polite" aria-label="Hora">' + u.pad(hh) + '</output><button type="button" class="icon-btn filled" data-t="h-" aria-label="Restar una hora">' + I('minus') + '</button><span class="t-xs t-2">Hora</span></div>' +
        '<span class="tp-sep" aria-hidden="true">:</span>' +
        '<div class="tp-col"><button type="button" class="icon-btn filled" data-t="m+" aria-label="Sumar cinco minutos">' + I('plus') + '</button><output class="tp-val t-num" aria-live="polite" aria-label="Minutos">' + u.pad(mm) + '</output><button type="button" class="icon-btn filled" data-t="m-" aria-label="Restar cinco minutos">' + I('minus') + '</button><span class="t-xs t-2">Minutos</span></div>' +
        '</div>';
      ui.sheet({
        title: opts.title || 'Hora de entrega',
        sub: 'Usa + y − para elegir la hora. Los minutos cambian de 5 en 5.',
        body: '<div class="tp-wrap">' + view() + '</div><div class="stack-sm"><p class="section-label">Atajos</p><div class="chips">' + shortcuts.map(([l, v]) => '<button type="button" class="chip sm" data-sc="' + v + '">' + l + '</button>').join('') + '</div></div>',
        foot: '<div class="grid-2"><button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-ok>Usar esta hora</button></div>',
        onClose: () => resolve(result),
        mount(el, ly) {
          let hold = null;
          const step = (t) => {
            if (t === 'h+') hh = (hh + 1) % 24; if (t === 'h-') hh = (hh + 23) % 24;
            if (t === 'm+') mm = mm % 5 ? Math.ceil(mm / 5) * 5 % 60 : (mm + 5) % 60;
            if (t === 'm-') mm = mm % 5 ? Math.floor(mm / 5) * 5 : (mm + 55) % 60;
            el.querySelectorAll('.tp-val')[0].textContent = u.pad(hh);
            el.querySelectorAll('.tp-val')[1].textContent = u.pad(mm);
          };
          el.addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-t]'); if (!b) return; step(b.dataset.t); let n = 0; hold = setInterval(() => { if (++n > 3) step(b.dataset.t); }, 110); });
          ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => el.addEventListener(ev, () => clearInterval(hold)));
          el.addEventListener('keydown', (e) => { const b = e.target.closest('[data-t]'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); step(b.dataset.t); } });
          el.addEventListener('click', (e) => {
            const sc = e.target.closest('[data-sc]');
            if (sc) { result = sc.dataset.sc; ly.close(); return; }
            if (e.target.closest('[data-ok]')) { result = u.pad(hh) + ':' + u.pad(mm); ly.close(); }
          });
        }
      });
    });
  };

  /* ---------- Selector de opciones genérico (hoja) ---------- */
  C.pickOne = function (title, options, current, sub) {
    return new Promise((resolve) => {
      let result = null;
      ui.sheet({
        title, sub,
        body: '<div class="stack-sm" role="radiogroup" aria-label="' + u.esc(title) + '">' + options.map((o) =>
          '<button type="button" class="option" role="radio" aria-checked="' + (o.value === current) + '" data-v="' + u.esc(o.value) + '"><span class="radio"></span><span class="grow stack-xs"><span class="t-bold">' + u.esc(o.label) + '</span>' + (o.desc ? '<span class="t-sm t-2">' + u.esc(o.desc) + '</span>' : '') + '</span></button>').join('') + '</div>',
        foot: '<button type="button" class="btn btn-secondary btn-block" data-close>Cancelar</button>',
        onClose: () => resolve(result),
        mount(el, ly) {
          el.addEventListener('click', (e) => {
            const b = e.target.closest('[data-v]'); if (!b) return;
            el.querySelectorAll('.option').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
            result = b.dataset.v;
            setTimeout(() => ly.close(), 160);
          });
        }
      });
    });
  };

  /* ---------- Acciones compartidas ---------- */
  SF.act.detail = (el) => { if (el.dataset.id) SF.router.go('detalle', { id: el.dataset.id }); };

  SF.act.start = (el) => C.startActivity(el.dataset.id);
  C.startActivity = function (id) {
    const a = M.activity(id);
    if (!a) { ui.toast('Esta actividad ya no existe', { icon: 'info' }); return; }
    if (a.done) { ui.toast('Ya completaste esta actividad', { icon: 'circle-check' }); return; }
    if (M.isOver(a)) { ui.toast('Este examen ya pasó', { icon: 'info' }); return; }
    const st = SF.store.state;
    if (st.timer && st.timer.actId !== id) {
      ui.dialog({
        icon: 'timer', title: 'Ya tienes una actividad en curso',
        body: '«' + (M.activity(st.timer.actId) || {}).title + '» sigue contando. ¿Quieres pararla y empezar esta?',
        actions: [{ label: 'Seguir con la actual', kind: 'secondary', value: 'keep' }, { label: 'Empezar esta', kind: 'primary', value: 'switch' }]
      }).then((v) => {
        if (v === 'keep') SF.router.go('actividad', { id: st.timer.actId });
        if (v === 'switch') { SF.store.commit((s) => { s.timer = null; }, { noRender: true }); C.startActivity(id); }
      });
      return;
    }
    if (!st.timer) SF.store.commit((s) => { s.timer = { actId: id, start: Date.now(), acc: 0, running: true }; s.lastActivityId = id; }, { noRender: true });
    SF.router.go('actividad', { id });
  };

  /* Elimina con confirmación y permite deshacer. */
  C.deleteActivity = async function (id, after) {
    const a = M.activity(id);
    if (!a) return;
    const ok = await ui.dialog({
      icon: 'trash', tone: 'danger', title: '¿Eliminar «' + a.title + '»?',
      body: 'Se quitará de Hoy, del plan semanal y del calendario. Podrás deshacerlo durante unos segundos.',
      actions: [{ label: 'Cancelar', kind: 'secondary', value: false }, { label: 'Eliminar', kind: 'danger', value: true }]
    });
    if (!ok) return;
    const snap = SF.store.snapshot();
    SF.store.commit((s) => {
      s.activities = s.activities.filter((x) => x.id !== id);
      s.notes.forEach((n) => { if (n.activityId === id) n.activityId = null; });
      s.notifications = s.notifications.filter((n) => n.actId !== id);
      if (s.timer && s.timer.actId === id) s.timer = null;
      if (s.lastActivityId === id) s.lastActivityId = null;
      M.recalc('silent');
    }, { noRender: true });
    if (after) after(); else SF.router.back();
    setTimeout(() => SF.router.refresh(), 20);
    ui.toast(a.type === 'evento' ? 'Evento eliminado' : a.type === 'examen' ? 'Examen eliminado' : 'Actividad eliminada', {
      icon: 'trash', action: 'Deshacer', onAction: () => { SF.store.restore(snap); ui.toast('Restaurado', { icon: 'undo' }); }
    });
  };

  C.fmtWhen = (a) => a.type === 'evento' || a.type === 'examen'
    ? D.short(a.date) + ' · ' + a.time + ' · ' + T.dur(M.fixedLen(a))
    : 'Entrega ' + D.short(a.date) + ' · ' + a.time;

  SF.C = C;
  /* Deshacer con confirmación (para cambios de avance) */
  SF.confirmUndo = async (snap, what) => {
    const v = await SF.ui.dialog({ icon: 'undo', title: '¿Deshacer ' + what + '?', body: 'Volverá al valor que tenía antes. Puedes registrarlo de nuevo cuando quieras.', actions: [{ label: 'Cancelar', kind: 'secondary', value: 0 }, { label: 'Sí, deshacer', kind: 'primary', value: 1 }] });
    if (v) { SF.store.restore(snap); SF.ui.toast('Cambio deshecho', { icon: 'undo' }); }
  };
})(window.SF);
