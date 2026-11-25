/* =========================================================
   StudyFlow · Hoy (H0), Actividad en curso (C2), Cambiar
   orden (C1), Resumen del día (C4), Avisos (42) y Detalle (D3)
   ========================================================= */
(function (SF) {
  const { D, T, u, ui, M, C } = SF;
  const I = SF.icon;
  const S = () => SF.store.state;

  /* ---------- H0 · Hoy ---------- */
  SF.screens.hoy = {
    tab: 'hoy',
    title: () => 'Hoy',
    render() {
      const st = S();
      const focus = M.focus();
      const ws = M.weekStats();
      const unread = M.unread();
      const name = u.firstName(st.profile.name) || 'estudiante';
      const next = M.upNext(focus && focus.id);
      const last = st.lastActivityId && M.activity(st.lastActivityId);
      const timer = st.timer && M.activity(st.timer.actId);
      const hasSample = st.activities.some((a) => a.sample);
      let h = '<header class="topbar pad hoy-head">' +
        '<div class="grow"><h1 class="tb-title big">Hoy</h1><p class="tb-sub">¡Hola, ' + u.esc(name) + '! ' + D.longCap(D.TODAY) + '</p></div>' +
        SF.streak.headerButton() +
        '<button type="button" class="icon-label" data-act="go" data-to="avisos"><span class="icon-btn filled" aria-hidden="true">' + I('bell') + (unread ? '<span class="dot">' + unread + '</span>' : '') + '</span>Avisos' + (unread ? '<span class="sr-only">, ' + unread + ' sin leer</span>' : '') + '</button>' +
        '<button type="button" class="icon-label" data-act="go" data-to="ajustes" data-tour="settings-btn" aria-label="Ajustes"><span class="icon-btn filled">' + I('settings') + '</span>Ajustes</button>' +
        '</header><div class="screen-body stagger">';

      if (timer) {
        h += '<button type="button" class="card soft tap running-pill" data-act="go" data-to="actividad" data-params=\'{"id":"' + timer.id + '"}\'>' +
          '<span class="live-dot" aria-hidden="true"></span><span class="grow stack-xs"><span class="t-sm t-2">' + (st.timer.running ? 'En curso' : 'En pausa') + '</span><b class="clamp-1">' + u.esc(timer.title) + '</b></span><span class="t-num t-bold" data-clock>' + T.clock(elapsed()) + '</span>' + I('chevron-right', 18) + '</button>';
      }

      h += '<button type="button" class="week-bar" data-act="go" data-to="resumen">' +
        I('calendar-check', 18) + '<span class="grow">' + (ws.total ? 'Semana al día · ' + ws.done + ' de ' + ws.total + ' actividades listas' : 'Sin actividades esta semana') + '</span>' + (ws.total ? '<b class="t-primary">' + ws.pct + '%</b>' : '') + '<span class="sr-only">. Ver resumen del día</span></button>';

      if (hasSample) h += '<div class="callout info sample-callout">' + I('sparkles', 18) + '<span class="grow">Son <b>actividades de ejemplo</b> para que veas cómo funciona. Cuando registres las tuyas, quítalas.</span><button type="button" class="btn btn-xs btn-secondary" data-act="clear-samples">Quitar ejemplos</button></div>';

      if (focus) {
        const nb = M.nextBlock(focus.id);
        const prog = focus.steps ? Math.round(focus.steps.done / focus.steps.total * 100) : focus.progress || 0;
        h += '<article class="card hero focus-card" data-tour="priority" style="' + M.subjVar(focus.subjectId) + '">' +
          '<div class="hrow between"><span class="pill primary">' + I('zap', 14) + 'HAZ ESTO PRIMERO</span><span class="t-sm t-2 t-num">' + T.dur(nb ? nb.dur : M.remaining(focus)) + '</span></div>' +
          '<div class="stack-xs" style="margin-top:12px">' + C.subjTag(focus.subjectId) + '<h2 class="t-display focus-title">' + u.esc(focus.title) + '</h2>' +
          '<p class="t-2">' + u.esc(M.reason(focus)) + '</p></div>' +
          '<div class="progress" role="progressbar" aria-label="Avance" aria-valuenow="' + prog + '" aria-valuemin="0" aria-valuemax="100" style="margin-top:14px"><i style="--v:' + prog + '%"></i></div>' +
          '<p class="t-sm t-2" style="margin-top:6px">' + (focus.steps ? focus.steps.done + ' de ' + focus.steps.total + ' ejercicios listos' : 'Avance ' + prog + ' %') + (nb ? ' · bloque a las ' + nb.start : '') + '</p>' +
          '<div class="focus-actions"><button type="button" class="btn btn-primary btn-block" data-act="start" data-id="' + focus.id + '">' + I('play', 18) + (st.timer && st.timer.actId === focus.id ? 'Continuar' : 'Empezar ahora') + '</button>' +
          '<button type="button" class="icon-btn filled" data-act="focus-menu" data-id="' + focus.id + '" aria-label="Más opciones para ' + u.esc(focus.title) + '" aria-haspopup="dialog">' + I('more-horizontal') + '</button></div>' +
          '</article>';
      } else if (M.dayClosed() && st.activities.length) {
        h += '<article class="card success day-off">' + ui.illus('dia-libre', 'Taza de café') +
          '<div class="stack-sm t-center"><h2 class="t-h2">Día terminado</h2><p class="t-2">Lo pendiente pasó a tus próximos bloques libres.</p>' +
          '<div class="grid-2"><button type="button" class="btn btn-secondary" data-act="day-reopen">Reabrir el día</button><button type="button" class="btn btn-primary" data-act="tab" data-tab="plan">Ver plan semanal</button></div></div></article>';
      } else if (!st.activities.some((a) => !a.done)) {
        h += '<article class="card day-off">' + ui.illus('plan', 'Tu semana por llenar') +
          '<div class="stack-sm t-center"><h2 class="t-h2">Registra tu primera actividad</h2><p class="t-2">Dinos qué tienes pendiente (una tarea, un parcial, una lectura) y lo repartimos en tus horas libres.</p>' +
          '<button type="button" class="btn btn-primary btn-block" data-act="tab" data-tab="registrar">' + I('plus', 18) + 'Registrar actividad</button></div></article>';
      } else {
        h += '<article class="card success day-off">' + ui.illus('dia-libre', 'Taza de café') +
          '<div class="stack-sm t-center"><h2 class="t-h2">Nada pendiente para hoy</h2><p class="t-2">Completaste todo lo de hoy. Disfruta tu tiempo libre o adelanta algo de mañana.</p>' +
          '<div class="grid-2"><button type="button" class="btn btn-secondary" data-act="go" data-to="resumen">Resumen del día</button><button type="button" class="btn btn-primary" data-act="tab" data-tab="plan">Ver plan semanal</button></div></div></article>';
      }

      h += '<section class="stack-sm" aria-labelledby="h-next"><div class="section-head"><h2 id="h-next">Después sigue</h2><button type="button" class="link-btn" data-act="tab" data-tab="plan">Ver plan</button></div>';
      if (next.length) h += '<div class="stack-sm">' + next.map(C.agendaRow).join('') + '</div>';
      else h += '<p class="card t-2">No hay más actividades planificadas esta semana.</p>';
      h += '</section>';

      if (last && !last.done && last.id !== (focus && focus.id) && !(timer && timer.id === last.id)) {
        h += '<section class="card last-card" aria-label="Última actividad"><span class="row-icon round">' + I('rotate-ccw', 20) + '</span>' +
          '<span class="grow stack-xs"><span class="t-sm t-2">Última actividad</span><b class="clamp-1">' + u.esc(last.title) + '</b><span class="t-xs t-2 clamp-1">' + u.esc(M.subjName(last.subjectId)) + ' · ' + T.dur(last.duration) + ' · ' + (last.weight || 0) + ' %</span></span>' +
          '<button type="button" class="btn btn-primary btn-sm" data-act="repeat" data-id="' + last.id + '" aria-label="Repetir ' + u.esc(last.title) + '">Repetir</button></section>';
      }
      h += '</div>';
      return h;
    },
    mount(el) {
      clearInterval(this._t);
      const clock = el.querySelector('[data-clock]');
      if (clock) this._t = setInterval(() => { clock.textContent = T.clock(elapsed()); }, 1000);
      SF.app && SF.app.maybePush();
      const ss = S().session;
      if (ss.loggedIn && ss.hasPlan && !ss.tutorialDone) setTimeout(() => { const c = SF.router.current(); if (c && c.name === 'hoy' && !S().session.tutorialDone && !SF.ui.layers()) SF.tour.start('hoy'); }, 700);
    },
    unmount() { clearInterval(this._t); }
  };

  SF.act['clear-samples'] = async () => {
    const n = S().activities.filter((a) => a.sample).length;
    const v = await ui.dialog({ icon: 'trash', tone: 'danger', title: '¿Quitar las actividades de ejemplo?', body: 'Se quitarán ' + u.plural(n, 'actividad de ejemplo', 'actividades de ejemplo') + '. Tus materias y clases se quedan. Podrás deshacerlo justo después.', actions: [{ label: 'Cancelar', kind: 'secondary', value: 0 }, { label: 'Quitar ejemplos', kind: 'danger', value: 1 }] });
    if (!v) return;
    const snap = SF.store.snapshot();
    SF.store.commit((s) => {
      const ids = s.activities.filter((a) => a.sample).map((a) => a.id);
      s.activities = s.activities.filter((a) => !a.sample);
      if (s.timer && ids.includes(s.timer.actId)) s.timer = null;
      if (ids.includes(s.lastActivityId)) s.lastActivityId = null;
      if (s.todayOrder) s.todayOrder = s.todayOrder.filter((id) => !ids.includes(id));
      s.notifications = s.notifications.filter((x) => !ids.includes(x.actId));
      M.recalc('silent');
    });
    ui.toast('Ejemplos quitados. Registra tu primera actividad.', { icon: 'check', action: 'Deshacer', onAction: () => { SF.store.restore(snap); ui.toast('Ejemplos de vuelta', { icon: 'undo' }); } });
  };
  SF.act['focus-menu'] = (el) => {
    const a = M.activity(el.dataset.id); if (!a) return;
    const opt = (k, ic, t, sub) => '<li><button type="button" class="row" data-k="' + k + '"><span class="row-icon">' + I(ic, 20) + '</span><span class="row-main"><span class="row-title">' + t + '</span>' + (sub ? '<span class="row-sub">' + sub + '</span>' : '') + '</span></button></li>';
    ui.sheet({
      title: a.title, sub: M.subjName(a.subjectId),
      body: '<ul class="list card flush">' +
        opt('detail', 'info', 'Ver detalle', 'Fecha, tiempo y notas vinculadas') +
        opt('progress', 'percent', 'Registrar avance', 'Cuánto llevas hecho') +
        opt('order', 'arrow-up-down', 'Cambiar orden de hoy', 'Elige qué va primero') +
        opt('edit', 'pencil', 'Editar actividad', 'Nombre, fecha, duración…') + '</ul>',
      mount(sh, ly) {
        sh.addEventListener('click', (e) => {
          const b = e.target.closest('[data-k]'); if (!b) return;
          ly.close();
          const k = b.dataset.k;
          if (k === 'detail') SF.router.go('detalle', { id: a.id });
          if (k === 'progress') { const x = document.createElement('button'); x.dataset.id = a.id; SF.act['progress-sheet'](x); }
          if (k === 'order') SF.router.go('cambiar-orden');
          if (k === 'edit') SF.router.go('registrar', { editId: a.id });
        });
      }
    });
  };
  SF.act.repeat = (el) => {
    const a = M.activity(el.dataset.id);
    if (!a) return;
    SF.router.go('registrar', { mode: 'texto', prefill: { subjectId: a.subjectId, type: a.type, title: a.title, duration: a.duration, weight: a.weight, date: '', time: a.time } });
    ui.toast('Copiamos los datos. Elige la nueva fecha.', { icon: 'rotate-ccw' });
  };

  /* ---------- Cronómetro ---------- */
  function elapsed() {
    const t = S().timer;
    if (!t) return 0;
    return t.acc + (t.running ? Date.now() - t.start : 0);
  }
  SF.elapsed = elapsed;

  /* ---------- C2 · Actividad en curso ---------- */
  SF.screens.actividad = {
    title: () => 'Actividad en curso',
    static: true,
    render(p) {
      const a = M.activity(p.id);
      if (!a) return C.topbar('Actividad en curso', { back: true }) + '<div class="screen-body">' + C.empty('notas', 'Esta actividad ya no existe', 'Puede que la hayas eliminado.') + '</div>';
      if (a.done) return C.topbar('Actividad en curso', { back: true }) + '<div class="screen-body">' + C.empty('exito', 'Actividad completada', 'Ya la marcaste como terminada. Elige otra para seguir.', '<button type="button" class="btn btn-secondary" data-act="tab" data-tab="hoy">Volver a Hoy</button>') + '</div>';
      const t = S().timer;
      const plan = M.remaining(a);
      const nextIt = M.upNext(a.id)[0];
      const R = 92, CIRC = 2 * Math.PI * R;
      return C.topbar('Actividad en curso', { back: true }) +
        '<div class="screen-body" style="' + M.subjVar(a.subjectId) + '">' +
        '<article class="card timer-card">' +
        '<div class="stack-xs t-center">' + '<span class="pill soft" style="justify-self:center;margin-inline:auto">' + u.esc(M.subjName(a.subjectId)) + '</span>' +
        '<h2 class="t-h2">' + u.esc(a.title) + '</h2><p class="t-sm t-2">' + C.dueText(a) + ' · vale ' + (a.weight || 0) + ' %</p></div>' +
        '<div class="ring-wrap"><svg class="ring" viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="' + R + '" class="ring-bg"/><circle cx="110" cy="110" r="' + R + '" class="ring-fg" stroke-dasharray="' + CIRC + '" stroke-dashoffset="' + CIRC + '" data-circ="' + CIRC + '"/></svg>' +
        '<div class="ring-center"><output class="ring-time t-num" data-time role="timer" aria-live="off">' + T.clock(elapsed()) + '</output><span class="t-sm t-2" data-sub>de ' + T.dur(plan) + '</span><span class="pill warning" data-paused ' + (t && !t.running ? '' : 'hidden') + '>' + I('pause', 12) + 'En pausa</span></div></div>' +
        '<p class="t-sm t-2 t-center">Avance registrado: <b data-prog>' + (a.progress || 0) + ' %</b></p>' +
        '</article>' +
        (nextIt ? '<button type="button" class="card tight tap hrow" data-act="detail" data-id="' + (nextIt.actId || (nextIt.act && nextIt.act.id) || '') + '">' + I('arrow-right', 20, 't-primary') + '<span class="grow t-bold clamp-1">Después: ' + u.esc(nextIt.act ? nextIt.act.title : nextIt.title) + '</span><span class="t-sm t-2">' + T.fmt2(nextIt.start) + '</span></button>' : '') +
        '<div class="grid-2 timer-actions">' +
        '<button type="button" class="btn btn-secondary" data-act="timer-toggle" data-pause aria-pressed="' + (t && !t.running) + '">' + (t && !t.running ? I('play', 18) + 'Reanudar' : I('pause', 18) + 'Pausar') + '</button>' +
        '<button type="button" class="btn btn-soft" data-act="progress-sheet" data-id="' + a.id + '">Anotar avance</button></div>' +
        '<button type="button" class="btn btn-primary btn-block" data-act="timer-finish" data-id="' + a.id + '">' + I('check', 18) + 'Terminar sesión</button>' +
        '<p class="t-xs t-2 t-center">«Anotar avance» guarda cuánto llevas sin parar el cronómetro. «Terminar sesión» lo detiene y te pregunta tu avance.</p>' +
        '<button type="button" class="btn btn-ghost btn-block" data-act="go" data-to="cambiar-orden">' + I('arrow-up-down', 18) + 'Cambiar orden de hoy</button>' +
        '</div>';
    },
    mount(el, p) {
      clearInterval(this._t);
      const act = M.activity(p.id);
      if (act && act.done) return; // ya terminada: sin cronómetro
      if (!S().timer && M.activity(p.id)) SF.store.commit((s) => { s.timer = { actId: p.id, start: Date.now(), acc: 0, running: true }; }, { noRender: true });
      this.update(el, p);
      clearInterval(this._t);
      this._t = setInterval(() => this.tick(el, p), 1000);
      this.tick(el, p);
    },
    tick(el, p) {
      const a = M.activity(p.id); if (!a) return;
      const ms = elapsed();
      const plan = M.remaining(a) * 60000;
      const out = el.querySelector('[data-time]'); if (out) out.textContent = T.clock(ms);
      const ring = el.querySelector('.ring-fg');
      if (ring) { const c = Number(ring.dataset.circ); ring.style.strokeDashoffset = String(c * (1 - Math.min(1, ms / plan))); ring.classList.toggle('over', ms >= plan); }
      const sub = el.querySelector('[data-sub]');
      if (sub) sub.textContent = ms >= plan ? 'Tiempo planificado cumplido' : 'de ' + T.dur(M.remaining(a));
    },
    update(el, p) {
      const t = S().timer;
      const b = el.querySelector('[data-pause]');
      if (b && t) { b.innerHTML = t.running ? I('pause', 18) + 'Pausar' : I('play', 18) + 'Reanudar'; b.setAttribute('aria-pressed', String(!t.running)); b.setAttribute('aria-label', t.running ? 'Pausar cronómetro' : 'Reanudar cronómetro'); }
      const pz = el.querySelector('[data-paused]'); if (pz) pz.hidden = !(t && !t.running);
      const a = M.activity(p.id); const pr = el.querySelector('[data-prog]'); if (a && pr) pr.textContent = (a.progress || 0) + ' %';
      this.tick(el, p);
    },
    unmount() { clearInterval(this._t); }
  };

  SF.act['timer-toggle'] = () => {
    const t = S().timer; if (!t) return;
    SF.store.commit((s) => {
      if (s.timer.running) { s.timer.acc += Date.now() - s.timer.start; s.timer.running = false; }
      else { s.timer.start = Date.now(); s.timer.running = true; }
    });
    ui.announce(S().timer.running ? 'Cronómetro reanudado' : 'Cronómetro en pausa');
  };

  SF.act['timer-finish'] = async (el) => {
    const a = M.activity(el.dataset.id); if (!a) return;
    const ms = elapsed();
    const plan = M.remaining(a) * 60000;
    if (ms < plan) {
      const wasRunning = S().timer && S().timer.running;
      if (wasRunning) SF.act['timer-toggle']();
      const v = await ui.dialog({
        icon: 'timer', tone: 'warning', title: '¿Terminar antes de tiempo?',
        body: 'Llevas ' + T.clock(ms) + ' de ' + T.dur(M.remaining(a)) + ' planificados. Si terminas ahora, registra cuánto avanzaste para que el plan se ajuste.',
        actions: [{ label: 'Seguir', kind: 'secondary', value: 'keep', autofocus: true }, { label: 'Terminar', kind: 'primary', value: 'end' }]
      });
      if (v !== 'end') { if (wasRunning && S().timer && !S().timer.running) SF.act['timer-toggle'](); return; }
    }
    progressSheet(a.id, true);
  };

  SF.act['progress-sheet'] = (el) => progressSheet(el.dataset.id, false);

  /* C3 · Registrar avance (hoja) + C3b · Confirmar avance */
  function progressSheet(id, finishing) {
    const a = M.activity(id); if (!a) return;
    let val = Math.max(a.progress || 0, finishing ? Math.min(100, (a.progress || 0) + Math.round(elapsed() / (M.remaining(a) * 60000) * (100 - (a.progress || 0)))) : (a.progress || 0));
    val = Math.round(val / 5) * 5;
    ui.sheet({
      title: 'Registrar avance', sub: '¿Cuánto llevas de «' + a.title + '»?',
      body: '<div class="prog-big t-num" aria-hidden="true"><span data-pv>' + val + '</span>%</div>' +
        '<label class="sr-only" for="prog-r">Porcentaje de avance</label><input class="range" id="prog-r" type="range" min="0" max="100" step="5" value="' + val + '">' +
        '<div class="hrow between t-xs t-2"><span>0 %</span><span>100 %</span></div>' +
        '<div class="chips">' + [25, 50, 75, 100].map((v) => '<button type="button" class="chip sm" data-pp="' + v + '">' + v + ' %</button>').join('') + '</div>',
      foot: '<button type="button" class="btn btn-primary btn-block" data-done>' + I('check', 18) + 'Marcar completada</button><button type="button" class="btn btn-secondary btn-block" data-part>Guardar avance parcial</button>',
      mount(el, ly) {
        const r = el.querySelector('#prog-r');
        const set = (v) => { val = Number(v); r.value = val; el.querySelector('[data-pv]').textContent = val; };
        r.addEventListener('input', () => set(r.value));
        el.addEventListener('click', async (e) => {
          const pp = e.target.closest('[data-pp]'); if (pp) { set(pp.dataset.pp); return; }
          const done = e.target.closest('[data-done]'), part = e.target.closest('[data-part]');
          if (!done && !part) return;
          const complete = !!done || val >= 100;
          ly.close();
          const ok = await ui.dialog({
            icon: complete ? 'circle-check' : 'percent', title: 'Confirmar avance',
            body: complete ? '¿Confirmas «' + a.title + '» como realizada? Se quitará de tu plan.' : '¿Guardamos un avance del ' + val + ' %? Recalcularemos el tiempo que te falta.',
            actions: [{ label: 'Editar', kind: 'secondary', value: 'edit' }, { label: 'Confirmar', kind: 'primary', value: 'ok', autofocus: true }]
          });
          if (ok === 'edit') { progressSheet(id, finishing); return; }
          if (ok !== 'ok') return;
          const snap = SF.store.snapshot();
          const counted = SF.streak.get().doneToday;
          SF.store.commit((s) => {
            const x = s.activities.find((q) => q.id === id);
            x.progress = complete ? 100 : val;
            if (x.steps) x.steps.done = Math.round(x.steps.total * x.progress / 100);
            if (complete) { x.done = true; x.doneAt = D.TODAY; }
            s.lastActivityId = id;
            if (s.timer && s.timer.actId === id && (complete || finishing)) s.timer = null;
            if (s.todayOrder) s.todayOrder = s.todayOrder.filter((q) => q !== id || !complete);
            s.notifications.forEach((n) => { if (n.actId === id) n.read = true; });
            M.recalc('silent');
            if (complete || finishing) SF.streak.recordToday(); // terminar la sesión suma el día de racha
          }, { noRender: true });
          ui.toast(complete ? '¡Actividad completada!' : 'Avance guardado: ' + val + ' %', { action: 'Deshacer', onAction: () => SF.confirmUndo(snap, complete ? 'la actividad completada' : 'el avance de ' + val + ' %') });
          if (complete || finishing) SF.router.go('resumen', {}, { replace: true });
          else SF.router.refresh();
          if (!counted && SF.streak.get().doneToday) SF.streak.celebrate();
        });
      }
    });
  }
  SF.progressSheet = progressSheet;

  /* ---------- C1 · Cambiar orden ---------- */
  SF.screens['cambiar-orden'] = {
    title: () => 'Cambiar orden',
    static: true,
    canLeave() { return this._order.join() === this._start ? true : ui.confirm({ icon: 'alert-triangle', tone: 'warning', title: '¿Salir sin guardar el orden?', body: 'El nuevo orden de hoy se perderá.', cancel: 'Seguir aquí', ok: 'Salir' }); },
    render() {
      const list = M.todayCandidates();
      this._order = list.map((a) => a.id); this._start = this._order.join();
      return C.topbar('Cambiar orden', { back: true, sub: 'Mantén pulsado y arrastra, o usa las flechas.' }) +
        '<div class="screen-body"><ol class="reorder" aria-label="Orden de hoy">' + list.map((a, i) => this.item(a, i, list.length)).join('') + '</ol>' +
        (list.length ? '' : C.empty('dia-libre', 'Nada que ordenar', 'No tienes actividades pendientes para hoy.')) + '</div>' +
        '<footer class="screen-foot row"><button type="button" class="btn btn-secondary" data-act="back">Cancelar</button><button type="button" class="btn btn-primary" data-act="order-save">Guardar orden</button></footer>';
    },
    item(a, i, n) {
      return '<li class="card tight reorder-item" data-id="' + a.id + '" style="' + M.subjVar(a.subjectId) + '">' +
        '<span class="drag-handle" aria-hidden="true">' + I('grip-vertical', 20) + '</span>' +
        '<span class="order-num t-num">' + (i + 1) + '</span>' +
        '<span class="grow stack-xs"><b class="clamp-1">' + u.esc(a.title) + '</b><span class="t-xs t-2">' + u.esc(M.subjName(a.subjectId)) + ' · ' + C.dueText(a) + ' · vale ' + (a.weight || 0) + ' %</span></span>' +
        '<span class="stack-xs"><button type="button" class="icon-btn" data-mv="-1" aria-label="Subir ' + u.esc(a.title) + '"' + (i === 0 ? ' disabled' : '') + '>' + I('chevron-up', 18) + '</button><button type="button" class="icon-btn" data-mv="1" aria-label="Bajar ' + u.esc(a.title) + '"' + (i === n - 1 ? ' disabled' : '') + '>' + I('chevron-down', 18) + '</button></span></li>';
    },
    mount(el) {
      const list = el.querySelector('.reorder'); if (!list) return;
      const redraw = (focusId, dir) => {
        const items = this._order.map(M.activity);
        list.innerHTML = items.map((a, i) => this.item(a, i, items.length)).join('');
        if (focusId) { const b = list.querySelector('[data-id="' + focusId + '"] [data-mv="' + dir + '"]') || list.querySelector('[data-id="' + focusId + '"] [data-mv]:not([disabled])'); if (b) b.focus(); }
      };
      list.addEventListener('click', (e) => {
        const b = e.target.closest('[data-mv]'); if (!b) return;
        const id = b.closest('[data-id]').dataset.id; const i = this._order.indexOf(id); const j = i + Number(b.dataset.mv);
        if (j < 0 || j >= this._order.length) return;
        this._order.splice(i, 1); this._order.splice(j, 0, id);
        redraw(id, b.dataset.mv);
        ui.announce(M.activity(id).title + ' ahora en la posición ' + (j + 1));
      });
      SF.dragSort(list, '.reorder-item', (ids) => { this._order = ids; redraw(); });
      SF.act['order-save'] = () => {
        const prev = S().todayOrder;
        SF.store.commit((s) => { s.todayOrder = this._order.slice(); }, { noRender: true });
        SF.router.back();
        const first = M.activity(this._order[0]);
        ui.toast(first ? 'Orden guardado. «' + first.title + '» va primero.' : 'Orden guardado', { action: 'Deshacer', onAction: () => { SF.store.commit((s) => { s.todayOrder = prev; }); ui.toast('Orden anterior restaurado', { icon: 'undo' }); } });
      };
    }
  };

  /* Ordenar arrastrando (puntero), con animación suave. */
  SF.dragSort = function (list, sel, onDrop) {
    let drag = null, startY = 0, timer = null;
    list.addEventListener('pointerdown', (e) => {
      const item = e.target.closest(sel); if (!item || e.target.closest('button')) return;
      startY = e.clientY;
      const begin = () => {
        drag = item; item.classList.add('dragging'); item.setPointerCapture(e.pointerId);
        if (navigator.vibrate) try { navigator.vibrate(12); } catch (x) {}
      };
      if (e.target.closest('.drag-handle')) begin(); else timer = setTimeout(begin, 280);
    });
    list.addEventListener('pointermove', (e) => {
      if (!drag) { if (timer && Math.abs(e.clientY - startY) > 8) { clearTimeout(timer); timer = null; } return; }
      e.preventDefault();
      const dy = e.clientY - startY;
      drag.style.transform = 'translateY(' + dy + 'px) scale(1.02)';
      const items = Array.from(list.querySelectorAll(sel)).filter((x) => x !== drag);
      const mid = drag.getBoundingClientRect().top + drag.offsetHeight / 2;
      let target = null;
      items.forEach((x) => { const r = x.getBoundingClientRect(); if (mid > r.top && mid < r.bottom) target = x; });
      if (target) {
        const before = target.getBoundingClientRect().top > drag.getBoundingClientRect().top - dy;
        const r0 = drag.getBoundingClientRect().top;
        list.insertBefore(drag, before ? target : target.nextSibling);
        startY += drag.getBoundingClientRect().top - r0;
        drag.style.transform = 'translateY(' + (e.clientY - startY) + 'px) scale(1.02)';
      }
    });
    const end = () => {
      clearTimeout(timer); timer = null;
      if (!drag) return;
      drag.classList.remove('dragging'); drag.style.transform = '';
      drag = null;
      onDrop(Array.from(list.querySelectorAll(sel)).map((x) => x.dataset.id));
    };
    list.addEventListener('pointerup', end); list.addEventListener('pointercancel', end);
  };

  /* ---------- C4 · Resumen del día ---------- */
  SF.screens.resumen = {
    title: () => 'Resumen del día',
    render() {
      const ts = M.todayStats();
      const ws = M.weekStats();
      const total = ts.done.length + ts.pending.length;
      const pct = total ? Math.round(ts.done.length / total * 100) : 0;
      return C.topbar('Resumen del día', { back: true, sub: D.longCap(D.TODAY) }) +
        '<div class="screen-body stagger">' +
        '<article class="card t-center stack-sm summary-hero"><div class="donut" style="--p:' + pct + '"><span class="t-num"><b>' + ts.done.length + '</b> de ' + total + '</span></div><p class="t-2">tareas completadas hoy</p></article>' +
        SF.streak.summaryRow() +
        '<section class="stack-sm"><h2 class="section-label">Completadas</h2>' + (ts.done.length ? '<ul class="list">' + ts.done.map((a) => '<li class="row">' + I('circle-check', 22, 't-success') + '<span class="row-main"><span class="row-title">' + u.esc(a.title) + '</span><span class="row-sub">' + u.esc(M.subjName(a.subjectId)) + '</span></span></li>').join('') + '</ul>' : '<p class="card t-2">Aún nada. ¡La primera es la que más cuesta!</p>') + '</section>' +
        '<section class="stack-sm"><h2 class="section-label">Pendientes</h2>' + (ts.pending.length ? '<ul class="list">' + ts.pending.map((a) => '<li><button type="button" class="row" data-act="detail" data-id="' + a.id + '">' + I('circle', 22, 't-3') + '<span class="row-main"><span class="row-title">' + u.esc(a.title) + '</span><span class="row-sub">' + u.esc(M.subjName(a.subjectId)) + ' · ' + C.dueText(a) + '</span></span>' + I('chevron-right', 18) + '</button></li>').join('') + '</ul>' : '<p class="card t-2">No queda nada pendiente para hoy.</p>') + '</section>' +
        (ws.total ? '<section class="card stack-sm"><div class="hrow between"><b>Avance semanal</b><b class="t-primary">' + ws.pct + '%</b></div><div class="progress"><i style="--v:' + ws.pct + '%"></i></div><p class="t-sm t-2">' + ws.done + ' de ' + ws.total + ' actividades de la semana.</p></section>' : '<section class="card stack-sm"><b>Avance semanal</b><p class="t-sm t-2">Sin actividades esta semana.</p></section>') +
        '</div>' +
        '<footer class="screen-foot stack-sm">' + (M.dayClosed() ? '<button type="button" class="btn btn-primary btn-block" data-act="day-reopen">' + I('undo', 18) + 'Reabrir el día</button>' : '<button type="button" class="btn btn-primary btn-block" data-act="day-done">' + I('circle-check', 18) + 'Marcar como terminado</button>') + '<button type="button" class="btn btn-gray btn-block" data-act="tab" data-tab="hoy">Volver a Hoy</button></footer>';
    }
  };
  SF.act['day-done'] = async () => {
    const ts = M.todayStats();
    if (ts.pending.length) {
      const v = await ui.dialog({ icon: 'circle-check', title: '¿Terminar el día?', body: 'Te quedan ' + u.plural(ts.pending.length, 'actividad pendiente', 'actividades pendientes') + '. Las repartiremos en tus próximos bloques libres.', actions: [{ label: 'Seguir hoy', kind: 'secondary', value: 0 }, { label: 'Terminar día', kind: 'primary', value: 1 }] });
      if (!v) return;
    }
    const snap = SF.store.snapshot();
    SF.store.commit((s) => { s.session.dayClosed = D.TODAY; M.recalc('silent'); }, { noRender: true });
    SF.router.tab('hoy');
    ui.toast('Día terminado. ¡Buen trabajo!', { icon: 'sparkles', action: 'Deshacer', onAction: () => { SF.store.commit((s) => { s.session.dayClosed = null; }, { silent: true }); SF.store.restore(snap); ui.toast('Día reabierto', { icon: 'undo' }); } });
  };
  SF.act['day-reopen'] = () => {
    SF.store.commit((s) => { s.session.dayClosed = null; M.recalc('silent'); });
    ui.toast('Día reabierto', { icon: 'undo' });
  };
  SF.act['keep-going'] = () => { const f = M.focus(); if (f) C.startActivity(f.id); else { SF.router.tab('plan'); ui.toast('Todo listo por hoy. Mira lo que viene.', { icon: 'sparkles' }); } };

  /* ---------- 42 · Centro de avisos ---------- */
  SF.screens.avisos = {
    title: () => 'Avisos',
    render() {
      const st = S();
      const list = st.notifications;
      const unread = M.unread();
      const groups = [['plan', 'Tu plan'], ['urgent', 'Urgente'], ['pending', 'Pendientes']];
      let h = C.topbar('Avisos', { back: true, right: list.length ? '<button type="button" class="btn btn-ghost btn-sm" data-act="notif-readall"' + (unread ? '' : ' disabled') + '>Marcar leídos</button>' : '' }) +
        '<div class="screen-body stagger"><p class="t-2">' + (unread ? u.plural(unread, 'aviso sin leer', 'avisos sin leer') : 'Todo leído') + ' · Intensidad ' + SF.INTENSITY[st.settings.intensity].label.toLowerCase() + ': ' + SF.INTENSITY[st.settings.intensity].summary + '</p>';
      if (!list.length) {
        h += C.empty('avisos', 'Sin avisos pendientes', 'Todo al día. Aquí verás los recordatorios de tus actividades cuando necesiten tu atención.', '<button type="button" class="btn btn-secondary" data-act="tab" data-tab="hoy">Volver a Hoy</button>');
      }
      groups.forEach(([k, label]) => {
        const items = list.filter((n) => n.kind === k);
        if (!items.length) return;
        h += '<section class="stack-sm"><div class="section-head"><h2 class="' + (k === 'urgent' ? 't-danger' : '') + '">' + label + '</h2><span class="badge-count ' + (k === 'urgent' ? 'danger' : '') + '">' + items.length + '</span></div>' +
          items.map((n) => '<div class="notif card tight ' + (k === 'urgent' ? 'urgent' : '') + (n.read ? ' read' : '') + '">' +
            '<button type="button" class="notif-main" data-act="notif-open" data-id="' + n.id + '"><span class="notif-ic">' + I(k === 'plan' ? 'refresh-cw' : 'bell-ring', 22) + '</span>' +
            '<span class="grow stack-xs"><b>' + u.esc(n.title) + (n.read ? '' : '<span class="sr-only"> (sin leer)</span>') + '</b><span class="t-sm t-2">' + (n.time ? n.time + ' · ' : '') + u.esc(n.body) + '</span>' + (k === 'pending' ? '<span class="t-sm t-primary t-bold">Pendiente</span>' : '') + '</span>' + (n.read ? '' : '<span class="unread-dot" aria-hidden="true"></span>') + '</button>' +
            '<button type="button" class="icon-btn" data-act="notif-dismiss" data-id="' + n.id + '" aria-label="Descartar aviso">' + I('x', 18) + '</button></div>').join('') + '</section>';
      });
      return h + '</div>';
    }
  };
  SF.act['notif-readall'] = () => {
    const snap = SF.store.snapshot(['notifications']);
    SF.store.commit((s) => s.notifications.forEach((n) => { n.read = true; }));
    ui.toast('Avisos marcados como leídos', { action: 'Deshacer', onAction: () => SF.store.restore(snap) });
  };
  SF.act['notif-dismiss'] = (el) => {
    const snap = SF.store.snapshot(['notifications']);
    SF.store.commit((s) => { s.notifications = s.notifications.filter((n) => n.id !== el.dataset.id); });
    ui.toast('Aviso descartado', { icon: 'x', action: 'Deshacer', onAction: () => SF.store.restore(snap) });
  };
  SF.act['notif-open'] = (el) => {
    const n = S().notifications.find((x) => x.id === el.dataset.id); if (!n) return;
    SF.store.commit((s) => { const x = s.notifications.find((q) => q.id === n.id); if (x) x.read = true; }, { noRender: true });
    if (n.kind === 'plan') { SF.planChanges(); return; }
    if (n.actId && M.activity(n.actId)) SF.router.go('detalle', { id: n.actId });
    else SF.router.refresh();
  };
  SF.act['push-test'] = () => SF.app.showPush(true);

  /* ---------- D3 · Detalle de actividad ---------- */
  SF.screens.detalle = {
    title: () => 'Detalle',
    render(p) {
      const a = M.activity(p.id);
      if (!a) return C.topbar('Detalle', { back: true }) + '<div class="screen-body">' + C.empty('notas', 'Esta actividad ya no existe', 'Puede que la hayas eliminado. Vuelve atrás para seguir.') + '</div>';
      const blocks = M.blocksFor(a.id);
      const notes = S().notes.filter((n) => n.activityId === a.id);
      const conf = M.isFixed(a) ? M.conflicts(a.date, a.time, M.fixedLen(a), a.id) : [];
      const typeLabel = SF.TYPES[a.type].label;
      const over = M.isOver(a) && !a.done; // examen que ya pasó
      return C.topbar('Detalle', { back: true, right: '<button type="button" class="icon-btn" data-act="edit-activity" data-id="' + a.id + '" aria-label="Editar">' + I('pencil', 20) + '</button>' }) +
        '<div class="screen-body stagger" style="' + M.subjVar(a.subjectId) + '">' +
        '<div class="stack-sm"><div class="hrow wrap"><span class="pill soft">' + u.esc(M.subjName(a.subjectId)) + '</span><span class="pill">' + I(SF.TYPES[a.type].icon, 14) + typeLabel + '</span>' + (a.done ? '<span class="pill success">' + I('check', 14) + 'Completada</span>' : '') + '</div>' +
        '<h2 class="t-display">' + u.esc(a.title) + '</h2></div>' +
        '<ul class="detail-list">' +
        '<li>' + I('calendar', 20) + '<span>' + D.longCap(a.date) + '</span></li>' +
        '<li>' + I('clock', 20) + '<span>' + (M.isFixed(a) ? a.time + ' · ' + T.dur(M.fixedLen(a)) : 'Entrega a las ' + a.time + ' · ' + T.dur(a.duration) + ' de trabajo') + '</span></li>' +
        (a.type !== 'evento' ? '<li>' + I('percent', 20) + '<span>Peso ' + (a.weight || 0) + ' % de la nota</span></li>' : '') +
        (a.type !== 'evento' ? '<li>' + I('flag', 20) + '<span>Avance ' + (a.progress || 0) + ' %</span></li>' : '') +
        '</ul>' +
        (conf.length ? '<div class="callout warning">' + I('alert-triangle', 18) + '<span>Coincide con ' + conf.map((c) => u.esc(c.title)).join(', ') + '.</span></div>' : '') +
        (over ? '<div class="callout">' + I('info', 18) + '<span>Este examen ya pasó.</span></div>' : '') +
        (a.type !== 'evento' && !a.done && !over ? '<section class="stack-sm"><h3 class="section-label">En tu plan</h3>' + (blocks.length ? '<ul class="list">' + blocks.map((b) => '<li class="row">' + I('calendar-days', 20, 't-primary') + '<span class="row-main"><span class="row-title">' + D.longCap(b.date) + '</span><span class="row-sub">' + b.start + ' · ' + T.dur(b.dur) + (b.parts > 1 ? ' · bloque ' + b.part + ' de ' + b.parts : '') + (b.pinned ? ' · fijado por ti' : '') + '</span></span></li>').join('') + '</ul>' : '<p class="callout warning">' + I('alert-triangle', 18) + '<span>No cabe en tus bloques libres antes de la entrega. Libera tiempo o cambia la fecha.</span></p>') + '</section>' : '') +
        '<section class="stack-sm"><div class="section-head"><h3 class="section-label">Notas vinculadas</h3><button type="button" class="link-btn" data-act="note-new" data-activity="' + a.id + '" data-subject="' + a.subjectId + '">' + I('plus', 16) + 'Nota</button></div>' +
        (notes.length ? notes.map((n) => '<button type="button" class="card tight tap hrow" data-act="note-open" data-id="' + n.id + '">' + I('sticky-note', 20, 't-primary') + '<span class="grow t-bold clamp-1">' + u.esc(n.title) + '</span>' + I('chevron-right', 18) + '</button>').join('') : '<p class="t-sm t-2">Sin notas todavía.</p>') + '</section>' +
        '<button type="button" class="btn btn-danger-ghost btn-sm" data-act="delete-activity" data-id="' + a.id + '" style="align-self:flex-start">' + I('trash', 18) + 'Eliminar ' + (a.type === 'evento' ? 'evento' : 'actividad') + '</button>' +
        '</div>' +
        '<footer class="screen-foot">' + (over ? '<button type="button" class="btn btn-primary btn-block" data-act="exam-done" data-id="' + a.id + '">' + I('check', 18) + 'Marcar como realizado</button>' : '') + (a.type !== 'evento' && !a.done && !over ? '<button type="button" class="btn btn-primary btn-block" data-act="start" data-id="' + a.id + '">' + I('play', 18) + (S().timer && S().timer.actId === a.id ? 'Continuar' : 'Empezar ahora') + '</button>' : '') +
        '<button type="button" class="btn btn-secondary btn-block" data-act="edit-activity" data-id="' + a.id + '">' + I('pencil', 18) + 'Editar</button></footer>';
    }
  };
  SF.act['exam-done'] = async (el) => {
    const a = M.activity(el.dataset.id); if (!a) return;
    const ok = await ui.confirm({ icon: 'circle-check', title: '¿Marcar «' + a.title + '» como realizado?', body: 'Pasará a tus actividades completadas.', ok: 'Marcar' });
    if (!ok) return;
    const snap = SF.store.snapshot();
    SF.store.commit((s) => {
      const x = s.activities.find((q) => q.id === a.id); if (!x) return;
      x.done = true; x.progress = 100; x.doneAt = a.date;
      M.recalc('silent');
    });
    ui.toast('Examen realizado', { action: 'Deshacer', onAction: () => SF.store.restore(snap) });
  };
  SF.act['edit-activity'] = (el) => SF.router.go('registrar', { editId: el.dataset.id });
  SF.act['delete-activity'] = (el) => C.deleteActivity(el.dataset.id);
})(window.SF);
