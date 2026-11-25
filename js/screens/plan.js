/* =========================================================
   StudyFlow · Plan semanal (B0–B5), Calendario (D1, D7, D2)
   ========================================================= */
(function (SF) {
  const { D, T, u, ui, M, C } = SF;
  const I = SF.icon;
  const S = () => SF.store.state;
  const view = { sub: 'plan', day: D.TODAY, cal: 'dia', cursor: D.TODAY, monthSel: D.TODAY, noteFilter: 'all', noteQuery: '' };
  SF.planView = view;
  // Al reemplazar todo el estado (restablecer o cargar otro), la vista vuelve a su punto de partida
  SF.store.on((st, meta) => { if (meta.replaced) { view.sub = 'plan'; view.noteFilter = 'all'; view.noteQuery = ''; } });

  const segTop = () => '<div class="seg pill-style" role="tablist" aria-label="Sección" data-tour="plan-seg">' +
    [['plan', 'Plan'], ['calendario', 'Calendario'], ['notas', 'Notas']].map(([k, l]) => '<button type="button" role="tab" aria-selected="' + (view.sub === k) + '" data-act="plan-sub" data-v="' + k + '">' + l + '</button>').join('') + '</div>';

  SF.screens.plan = {
    tab: 'plan',
    title: () => 'Plan',
    render(p) {
      if (p && p.sub) { view.sub = p.sub; delete p.sub; }
      if (p && p.date) { view.day = p.date; view.cursor = p.date; view.monthSel = p.date; delete p.date; }
      if (p && p.cal) { view.cal = p.cal; delete p.cal; }
      if (view.sub === 'calendario') return renderCalendar();
      if (view.sub === 'notas') return SF.renderNotes(segTop);
      return renderPlan();
    },
    mount(el) {
      if (view.sub === 'calendario') { const now = el.querySelector('.now-line'); if (now) { const body = el.querySelector('.cal-scroll'); if (body) body.scrollTop = Math.max(0, now.offsetTop - 120); } }
      if (view.sub === 'notas') SF.mountNotes(el);
      const chip = el.querySelector('.day-chip[aria-selected="true"]'); if (chip) chip.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
  };
  SF.act['plan-sub'] = (el) => { view.sub = el.dataset.v; SF.router.refresh(); const b = document.querySelector('.screen:last-child .screen-body'); if (b) b.classList.add('stagger'); };

  /* ---------- B0 · Plan semanal ---------- */
  function renderPlan() {
    const st = S();
    const free = M.freeMinutesWeek();
    const stats = M.weekStats();
    const wk5 = D.WEEK.slice(0, 5);
    if (!wk5.includes(view.day)) view.day = wk5.includes(D.TODAY) ? D.TODAY : D.WEEK[0];
    const items = M.dayItems(view.day);
    const planned = items.filter((x) => x.kind === 'block').reduce((s, x) => s + x.dur, 0);
    let h = C.topbar('Plan semanal', { sub: D.range(D.WEEK[0], D.WEEK[6]) + ' · ' + T.dur(free) + ' libres' }) +
      '<div class="screen-body stagger">' + segTop();
    if (st.plan.changes && st.plan.changes.length && Date.now() - (st.plan.changedAt || 0) < 1000 * 60 * 30) {
      h += '<div class="card soft hrow banner">' + I('refresh-cw', 20, 't-primary') + '<span class="grow stack-xs"><b>Tu plan se ha recalculado</b><span class="t-sm t-2">' + M.changeSummary(st.plan.changes) + '</span></span><button type="button" class="btn btn-xs btn-primary" data-act="plan-changes">Qué cambió</button></div>';
    } else if (st.plan.status === 'proposal') {
      h += '<div class="card soft hrow banner">' + I('sparkles', 20, 't-primary') + '<span class="grow stack-xs"><b>Tu plan está listo para confirmar</b><span class="t-sm t-2">' + stats.count + ' actividades repartidas en tus horas libres. Revísalo y confírmalo abajo.</span></span></div>';
    }
    if (st.plan.unplaced && st.plan.unplaced.length) {
      const names = Array.from(new Set(st.plan.unplaced.map((x) => (M.activity(x.actId) || {}).title))).filter(Boolean);
      h += '<div class="callout warning">' + I('alert-triangle', 18) + '<span><b>No todo cabe:</b> ' + u.esc(names.join(', ')) + '. Libera tiempo, cambia la fecha o divide la actividad.</span></div>';
    }
    h += '<button type="button" class="chip style-chip" data-act="plan-style">' + I('sliders', 16) + 'Estilo: ' + SF.STYLES[st.settings.style].label + I('chevron-down', 16) + '</button>';
    h += '<div class="day-chips" role="tablist" aria-label="Día de la semana">' + D.WEEK.slice(0, 5).map((d) => {
      const has = st.plan.blocks.some((b) => b.date === d) || M.fixedOn(d).length;
      return '<button type="button" role="tab" class="day-chip" aria-selected="' + (view.day === d) + '" data-act="plan-day" data-v="' + d + '"><span>' + D.DOW_CAP[D.dow(d)] + '</span> <b class="t-num">' + D.parse(d).getDate() + '</b><span class="sr-only"> de ' + D.MON_LONG[D.parse(d).getMonth()] + '</span>' + (has ? '<i aria-hidden="true"></i>' : '') + '</button>';
    }).join('') + '</div>';
    h += '<div class="hrow between"><h2 class="t-h3">' + D.longCap(view.day) + '</h2><span class="t-sm t-2 t-right">' + T.dur(planned) + ' planificadas</span></div>';
    h += '<ol class="timeline" data-tour="plan-week">' + timeline(view.day, items) + '</ol>';
    h += '<p class="t-sm t-2 hrow" style="justify-content:center;gap:6px">' + I('refresh-cw', 14) + 'Se recalcula solo cuando cambias actividades o clases.</p></div>';
    h += '<footer class="screen-foot row">' + (st.plan.status === 'proposal'
      ? '<button type="button" class="btn btn-secondary" data-act="go" data-to="ajustar">' + I('sliders', 18) + 'Ajustar</button><button type="button" class="btn btn-primary" data-act="plan-confirm">' + I('check', 18) + 'Confirmar plan</button>'
      : '<button type="button" class="btn btn-secondary" data-act="go" data-to="ajustar">' + I('sliders', 18) + 'Ajustar</button><button type="button" class="btn btn-primary" data-act="add-at" data-date="' + view.day + '">' + I('plus', 18) + 'Añadir</button>') + '</footer>';
    return h;
  }

  function timeline(date, items) {
    const free = M.freeSlots(date, items.map((x) => ({ start: x.start, dur: x.dur })));
    const all = items.map((x) => Object.assign({ t: 'item' }, x)).concat(free.filter(([s, e]) => e - s >= 30).map(([s, e]) => ({ t: 'free', start: s, dur: e - s })));
    all.sort((a, b) => a.start - b.start);
    if (!all.length) return '<li class="card t-2">Día sin clases ni actividades.</li>';
    return all.map((it) => {
      const time = '<span class="tl-time t-num">' + T.fmt2(it.start) + '</span><span class="tl-dot" aria-hidden="true"></span>';
      if (it.t === 'free') return '<li class="tl-row">' + time + '<button type="button" class="tl-card free" data-act="add-at" data-date="' + date + '" data-time="' + T.fmt2(it.start) + '"><span class="grow">Bloque libre · ' + T.dur(it.dur) + '<span class="sr-only"> a las ' + T.fmt2(it.start) + '. Añadir actividad</span></span>' + I('plus', 18) + '</button></li>';
      if (it.kind === 'class') return '<li class="tl-row">' + time + '<div class="tl-card class" style="' + M.subjVar(it.subjectId) + '"><span class="grow stack-xs"><b>' + u.esc(it.title) + '</b><span class="t-xs t-2">' + T.fmt2(it.start) + ' – ' + T.fmt2(it.start + it.dur) + '</span></span>' + I('lock', 16, 't-3') + '<span class="sr-only">Clase fija</span></div></li>';
      const a = it.act || M.activity(it.actId);
      const sub = it.kind === 'block' ? u.esc(M.subjName(a.subjectId)) + ' · ' + T.dur(it.dur) + (it.block.parts > 1 ? ' · bloque ' + it.block.part + ' de ' + it.block.parts : '') + (it.block.pinned ? ' · fijado' : '') : (it.kind === 'exam' ? 'Examen' : 'Evento') + ' · ' + T.fmt2(it.start) + ' – ' + T.fmt2(it.start + it.dur);
      return '<li class="tl-row">' + time + '<button type="button" class="tl-card ' + it.kind + '" style="' + M.subjVar(it.subjectId) + '" data-act="detail" data-id="' + a.id + '"><span class="grow stack-xs"><b class="clamp-1">' + u.esc(a.title) + '</b><span class="t-xs t-2">' + sub + '</span></span>' + I('chevron-right', 18) + '</button></li>';
    }).join('');
  }

  SF.act['plan-day'] = (el) => { view.day = el.dataset.v; SF.router.refresh(); };
  SF.act['add-at'] = (el) => SF.router.go('registrar', { prefill: { date: el.dataset.date, time: el.dataset.time || '' } });
  SF.act['plan-changes'] = () => SF.planChanges();

  /* B1 · Elegir reparto */
  SF.act['plan-style'] = async () => {
    const st = S();
    const v = await C.pickOne('¿Cómo repartimos tu semana?', Object.keys(SF.STYLES).map((k) => ({ value: k, label: SF.STYLES[k].label, desc: SF.STYLES[k].desc })), st.settings.style, 'Elige lo que mejor encaja contigo.');
    if (!v || v === st.settings.style) return;
    if (!(await ui.confirm({ icon: 'sliders', title: '¿Cambiar el reparto a «' + SF.STYLES[v].label + '»?', body: 'Volveremos a repartir tus bloques de la semana. Los que fijaste a mano no se mueven.', ok: 'Cambiar reparto' }))) return;
    await recompute({ style: v }, 'Estilo: ' + SF.STYLES[v].label);
  };

  async function recompute(settingsPatch, msg) {
    const body = document.querySelector('.screen:last-child .timeline');
    if (body) body.innerHTML = '<li class="skel" style="height:56px"></li><li class="skel" style="height:56px"></li><li class="skel" style="height:56px"></li>';
    await u.sleep(450);
    let changes = [];
    const snap = SF.store.snapshot(['plan', 'settings', 'notifications']);
    SF.store.commit((s) => { Object.assign(s.settings, settingsPatch); changes = M.recalc('user'); s.plan.status = 'proposal'; });
    ui.toast((msg ? msg + ' · ' : '') + (changes.length ? M.changeSummary(changes) : 'Propuesta lista'), { icon: 'sparkles', action: 'Deshacer', onAction: () => { SF.store.restore(snap); ui.toast('Reparto anterior restaurado', { icon: 'undo' }); } });
  }
  SF.recompute = recompute;

  SF.act['plan-confirm'] = () => {
    SF.store.commit((s) => { s.plan.status = 'confirmed'; s.plan.changes = null; }, { noRender: true });
    SF.router.go('plan-confirmado', {}, { transition: 'up' });
  };

  /* Hoja "Qué cambió" (43) */
  SF.planChanges = function () {
    const st = S();
    const ch = st.plan.changes || [];
    const kindPill = { nueva: 'success', movida: 'soft', eliminada: 'danger' };
    ui.sheet({
      title: 'Qué cambió', sub: 'Tu plan se ha recalculado · ' + M.changeSummary(ch),
      body: ch.length ? '<ul class="list">' + ch.map((c) => '<li class="row"><span class="row-main"><span class="row-title">' + u.esc(c.title) + '</span><span class="row-sub">' +
        (c.kind === 'movida' ? M.whenText(c.from) + ' → ' + M.whenText(c.to) : c.kind === 'nueva' ? M.whenText(c.to) : 'Sale del plan (completada o eliminada)') + '</span></span><span class="pill ' + kindPill[c.kind] + '">' + c.kind.charAt(0).toUpperCase() + c.kind.slice(1) + '</span></li>').join('') + '</ul>' : '<p class="t-2">No hay cambios pendientes de revisar.</p>',
      foot: '<button type="button" class="btn btn-primary btn-block" data-ok>Confirmar plan</button>' + (st.plan.prev ? '<button type="button" class="btn btn-secondary btn-block" data-keep>Mantener plan anterior</button>' : ''),
      mount(el, ly) {
        el.addEventListener('click', async (e) => {
          if (e.target.closest('[data-ok]')) {
            SF.store.commit((s) => { s.plan.changes = null; s.plan.status = 'confirmed'; s.notifications.forEach((n) => { if (n.kind === 'plan') n.read = true; }); });
            ly.close(); ui.toast('Plan actualizado');
          }
          if (e.target.closest('[data-keep]')) {
            if (!(await ui.confirm({ icon: 'undo', title: '¿Mantener el plan anterior?', body: 'Se descartan los cambios que acabamos de calcular y tus bloques quedan fijos como estaban.', ok: 'Mantener' }))) return;
            const snap = SF.store.snapshot(['plan']);
            SF.store.commit((s) => {
              s.plan.blocks = (s.plan.prev || []).filter((b) => M.activity(b.actId) && !M.activity(b.actId).done).map((b) => Object.assign(b, { pinned: true }));
              s.plan.changes = null; s.notifications = s.notifications.filter((n) => n.kind !== 'plan');
            });
            ly.close(); ui.toast('Mantienes el plan anterior', { icon: 'undo', action: 'Deshacer', onAction: () => SF.store.restore(snap) });
          }
        });
      }
    });
  };

  /* ---------- B3/B4 · Ajusta tu semana ---------- */
  let adj = { day: D.TODAY, prevBlocks: null };
  /* Al simular otro día, el plan y el calendario se sitúan en él (en fin de semana, en el lunes siguiente). */
  D.onDay((today) => {
    view.day = adj.day = D.wd(today) > 5 ? D.WEEK[0] : today;
    view.cursor = view.monthSel = today;
    adj.prevBlocks = null;
  });
  SF.screens.ajustar = {
    title: () => 'Ajusta tu semana',
    render() {
      const st = S();
      const all = M.cleanBlocks(st.plan.blocks);
      const blocks = all.filter((b) => b.date === adj.day).sort((a, b) => T.toMin(a.start) - T.toMin(b.start));
      const total = (d) => all.filter((b) => b.date === d).reduce((s, b) => s + b.dur, 0);
      return C.topbar('Ajusta tu semana', { back: true, sub: 'Mantén pulsado y arrastra, o usa las flechas' }) +
        '<div class="screen-body">' +
        (adj.prevBlocks ? '<div class="callout success">' + I('sparkles', 18) + '<span class="grow">Nueva distribución lista.</span><button type="button" class="btn btn-xs btn-secondary" data-act="adj-undo">Volver a la anterior</button></div>' : '') +
        '<div class="day-chips" role="tablist" aria-label="Día">' + D.WEEK.slice(0, 5).map((d) => '<button type="button" role="tab" class="day-chip" aria-selected="' + (adj.day === d) + '" data-act="adj-day" data-v="' + d + '"><span>' + D.DOW_CAP[D.dow(d)] + '</span> <b class="t-num">' + D.parse(d).getDate() + '</b><span class="sr-only"> de ' + D.MON_LONG[D.parse(d).getMonth()] + '</span>' + (total(d) ? '<i aria-hidden="true"></i>' : '') + '</button>').join('') + '</div>' +
        '<div class="hrow between"><h2 class="t-h3">' + D.longCap(adj.day) + '</h2><span class="t-sm t-2">' + T.dur(total(adj.day)) + '</span></div>' +
        (blocks.length ? '<ol class="reorder" id="adj-list">' + blocks.map((b, i) => {
          const a = M.activity(b.actId);
          return '<li class="card tight reorder-item adj-item" data-id="' + b.id + '" style="' + M.subjVar(a.subjectId) + '"><span class="drag-handle" aria-hidden="true">' + I('grip-vertical', 20) + '</span><span class="t-num t-bold" style="min-width:44px">' + b.start + '</span><span class="grow stack-xs"><b class="clamp-1">' + u.esc(a.title) + '</b><span class="t-xs t-2">' + u.esc(M.subjName(a.subjectId)) + ' · ' + T.dur(b.dur) + (b.pinned ? ' · fijado' : '') + '</span><button type="button" class="btn btn-xs btn-secondary" data-act="adj-move" data-id="' + b.id + '" aria-label="Mover a otro día: ' + u.esc(a.title) + '">Mover a otro día</button></span>' +
            (blocks.length > 1 ? '<span class="stack-xs"><button type="button" class="icon-btn" data-act="adj-mv" data-id="' + b.id + '" data-d="-1" aria-label="Subir ' + u.esc(a.title) + '"' + (i === 0 ? ' disabled' : '') + '>' + I('chevron-up', 18) + '</button><button type="button" class="icon-btn" data-act="adj-mv" data-id="' + b.id + '" data-d="1" aria-label="Bajar ' + u.esc(a.title) + '"' + (i === blocks.length - 1 ? ' disabled' : '') + '>' + I('chevron-down', 18) + '</button></span>' : '') + '</li>';
        }).join('') + '</ol>' : '<p class="card t-2">Este día no tiene bloques de estudio.</p>') +
        '<section class="stack-sm"><h2 class="section-label">El resto de tu semana</h2><ul class="list">' + D.WEEK.slice(0, 5).filter((d) => d !== adj.day).map((d) => {
          const n = new Set(all.filter((b) => b.date === d).map((b) => b.actId)).size;
          return '<li><button type="button" class="row" data-act="adj-day" data-v="' + d + '"><span class="row-main"><span class="row-title">' + D.longCap(d) + '</span><span class="row-sub">' + u.plural(n, 'actividad', 'actividades') + '</span></span><span class="t-sm t-2 t-num">' + T.dur(total(d)) + '</span>' + I('chevron-right', 18) + '</button></li>';
        }).join('') + '</ul></section></div>' +
        '<footer class="screen-foot"><button type="button" class="btn btn-secondary btn-block" data-act="adj-other">' + I('refresh-cw', 18) + 'Pedir otra propuesta</button><button type="button" class="btn btn-primary btn-block" data-act="adj-save">Guardar cambios</button></footer>';
    },
    mount(el) {
      const list = el.querySelector('#adj-list'); if (!list) return;
      SF.dragSort(list, '.reorder-item', reorderDay);
    }
  };
  /* Reasigna las horas del día al nuevo orden, respetando duraciones */
  function reorderDay(ids) {
    const st = S();
    const day = M.cleanBlocks(st.plan.blocks).filter((b) => b.date === adj.day).sort((a, b) => T.toMin(a.start) - T.toMin(b.start));
    if (!day.length || day.map((b) => b.id).join() === ids.join()) return;
    const before = u.clone(st.plan.blocks);
    // Coloca cada bloque, en el nuevo orden, en el primer hueco libre (sin pisar clases ni eventos)
    const busy = [].concat(M.classesOn(adj.day), M.fixedOn(adj.day)).map((x) => ({ start: x.start, dur: x.dur }));
    let cursor = T.toMin(day[0].start); const place = {};
    const fits = ids.every((id) => {
      const b = day.find((x) => x.id === id);
      const slot = b && M.freeSlots(adj.day, busy).map(([x, y]) => [Math.max(x, cursor), y]).find(([x, y]) => y - x >= b.dur);
      if (!slot) return false;
      place[id] = slot[0]; cursor = slot[0] + b.dur + 10; return true;
    });
    if (!fits) {
      SF.router.refresh();
      ui.toast('Con ese orden no cabe todo en el día', { icon: 'alert-circle' });
      return;
    }
    // ¿Algún bloque queda después de la hora de entrega de su actividad ese mismo día?
    let late = null;
    ids.forEach((id) => {
      const b = day.find((x) => x.id === id), a = M.activity(b.actId);
      if (!late && a && b.date === a.date && place[id] + b.dur > T.toMin(a.time) - (a.type === 'examen' ? 30 : 0)) late = { a, end: T.toMin(a.time) };
    });
    SF.store.commit((s) => {
      ids.forEach((id) => { const b = s.plan.blocks.find((x) => x.id === id); if (b) { b.start = T.fmt2(place[id]); b.pinned = true; } });
      s.plan.status = 'proposal';
    });
    ui.toast(late ? 'Orden actualizado. «' + late.a.title + '» queda después de su hora de entrega (' + T.fmt2(late.end) + ').' : 'Orden actualizado', { action: 'Deshacer', onAction: () => SF.store.commit((s) => { s.plan.blocks = before; }) });
  }
  SF.act['adj-mv'] = (el) => {
    const ids = S().plan.blocks.filter((b) => b.date === adj.day).sort((a, b) => T.toMin(a.start) - T.toMin(b.start)).map((b) => b.id);
    const i = ids.indexOf(el.dataset.id), j = i + Number(el.dataset.d);
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    const id = el.dataset.id, d = el.dataset.d;
    reorderDay(ids);
    const again = document.querySelector('[data-act="adj-mv"][data-id="' + id + '"][data-d="' + d + '"]:not([disabled])') || document.querySelector('[data-act="adj-mv"][data-id="' + id + '"]:not([disabled])');
    if (again) again.focus({ preventScroll: true });
  };
  SF.act['adj-save'] = async () => {
    const ws = M.weekStats();
    if (await ui.confirm({ icon: 'calendar-check', title: '¿Guardar los cambios del plan?', body: 'Tu semana quedará con ' + u.plural(ws.count, 'actividad', 'actividades') + ' y ' + T.dur(ws.planned) + ' de estudio. Ajustaremos tus recordatorios.', ok: 'Guardar plan' })) SF.act['plan-confirm']();
  };
  SF.act['adj-day'] = (el) => { adj.day = el.dataset.v; SF.router.refresh(); };
  SF.act['adj-move'] = async (el) => {
    const b = S().plan.blocks.find((x) => x.id === el.dataset.id); if (!b) return;
    const a = M.activity(b.actId);
    const late = D.diff(a.date, D.TODAY) < 0;
    const opts = D.WEEK.slice(0, 5).filter((d) => D.diff(d, D.TODAY) >= 0 && (late || D.diff(d, a.date) <= 0) && d !== b.date).map((d) => {
      const busy = M.dayItems(d).map((x) => ({ start: x.start, dur: x.dur }));
      const slot = M.slotFor(d, b.dur, a, busy);
      return slot ? { value: d + '|' + T.fmt2(slot[0]), label: D.longCap(d), desc: 'Libre desde las ' + T.fmt2(slot[0]) } : null;
    }).filter(Boolean);
    if (!opts.length) { ui.dialog({ icon: 'info', title: 'No hay otro día disponible', body: 'No queda un hueco libre de ' + T.dur(b.dur) + ' antes de la entrega.', actions: [{ label: 'Entendido', kind: 'primary', value: 1 }] }); return; }
    const v = await C.pickOne('Mover «' + a.title + '»', opts.map((o) => ({ value: o.value, label: o.label, desc: o.desc })), null, 'Solo mostramos días antes de la entrega.');
    if (!v) return;
    const [d, t] = v.split('|');
    if (!t) { ui.toast('Ese día no tiene un hueco de ' + T.dur(b.dur), { icon: 'alert-circle' }); return; }
    const before = u.clone(S().plan.blocks);
    SF.store.commit((s) => { const x = s.plan.blocks.find((q) => q.id === b.id); x.date = d; x.start = t; x.pinned = true; s.plan.status = 'proposal'; });
    adj.day = d;
    SF.router.refresh();
    ui.toast('Movido al ' + D.short(d) + ' a las ' + t, { action: 'Deshacer', onAction: () => SF.store.commit((s) => { s.plan.blocks = before; }) });
  };
  SF.act['adj-other'] = async () => {
    const fixed = S().plan.blocks.filter((b) => b.pinned).length;
    if (!(await ui.confirm({ icon: 'refresh-cw', title: '¿Pedir otra propuesta?', body: 'Volveremos a repartir toda tu semana' + (fixed ? ' y se soltarán ' + u.plural(fixed, 'bloque que fijaste', 'bloques que fijaste') + ' a mano' : '') + '. Podrás volver a la anterior.', ok: 'Otra propuesta' }))) return;
    adj.prevBlocks = u.clone(S().plan.blocks);
    const L = ui.loading({ title: 'Buscando otra distribución…', duration: 700 });
    await L.done;
    SF.store.commit((s) => { s.plan.blocks.forEach((b) => { b.pinned = false; }); s.settings.seed = (s.settings.seed || 0) + 1; M.recalc('silent'); s.plan.status = 'proposal'; });
    L.close();
    ui.toast('Nueva distribución lista', { icon: 'sparkles' });
  };
  SF.act['adj-undo'] = async () => {
    if (!adj.prevBlocks) return;
    if (!(await ui.confirm({ icon: 'undo', title: '¿Volver a la distribución anterior?', body: 'Se pierde la propuesta actual y lo que hayas movido en ella.', ok: 'Volver' })) || !adj.prevBlocks) return;
    const prev = adj.prevBlocks; adj.prevBlocks = null;
    SF.store.commit((s) => { s.plan.blocks = M.cleanBlocks(prev); s.settings.seed = Math.max(0, (s.settings.seed || 0) - 1); });
    ui.toast('Volviste a la distribución anterior', { icon: 'undo' });
  };

  /* ---------- B5 · Plan confirmado ---------- */
  SF.screens['plan-confirmado'] = {
    title: () => 'Plan confirmado',
    modal: true,
    render() {
      const ws = M.weekStats();
      adj.prevBlocks = null;
      return '<div class="screen-body confirm-screen stagger" style="justify-content:center">' + ui.illus('exito', 'Plan confirmado') +
        '<div class="stack-sm t-center"><h1 class="t-display">Plan confirmado</h1><p class="t-2 t-center confirm-note">' + I('bell-ring', 16) + 'Tus recordatorios están activados (' + SF.INTENSITY[S().settings.intensity].label.toLowerCase() + ')</p></div>' +
        '<div class="card stack"><p class="t-sm t-2 t-center">Tu semana · ' + D.range(D.WEEK[0], D.WEEK[4]) + '</p><div class="stat-row">' +
        '<div><b class="t-num">' + ws.count + '</b><span>actividades</span></div><div><b class="t-num">' + T.dur(ws.planned) + '</b><span>de estudio</span></div><div><b class="t-num">' + ws.days + '</b><span>días</span></div></div></div></div>' +
        '<footer class="screen-foot"><button type="button" class="btn btn-primary btn-block" data-act="tab" data-tab="hoy">Ir a Hoy</button><button type="button" class="btn btn-secondary btn-block" data-act="see-calendar">Ver calendario</button></footer>';
    }
  };
  SF.act['see-calendar'] = (el) => { view.sub = 'calendario'; if (el && el.dataset.date) { view.cursor = el.dataset.date; view.monthSel = el.dataset.date; view.day = el.dataset.date; } SF.router.go('plan', {}, { reset: true, transition: 'fade' }); };

  /* ---------- Calendario ---------- */
  let H0 = 7, H1 = 21;
  /* Ajusta las horas visibles para que quepan clases y actividades fuera del horario habitual */
  function setHours(days) {
    let minStart = 7 * 60, maxEnd = 21 * 60;
    days.forEach((d) => M.dayItems(d).forEach((it) => { minStart = Math.min(minStart, it.start); maxEnd = Math.max(maxEnd, it.start + it.dur); }));
    H0 = Math.max(0, Math.min(7, Math.floor(minStart / 60)));
    H1 = Math.min(24, Math.max(21, Math.ceil(maxEnd / 60)));
  }
  /* Reparte en columnas los eventos que coinciden en el tiempo. Devuelve { i, n } por elemento. */
  function lanes(items) {
    const eff = (it) => Math.max(it.dur, 28);
    const out = items.map(() => ({ i: 0, n: 1 }));
    const order = items.map((_, k) => k).sort((x, y) => items[x].start - items[y].start);
    let group = [], groupEnd = -1, ends = [];
    const close = () => { group.forEach((k) => { out[k].n = ends.length; }); group = []; ends = []; groupEnd = -1; };
    order.forEach((k) => {
      const it = items[k];
      if (group.length && it.start >= groupEnd) close();
      let col = ends.findIndex((e) => e <= it.start);
      if (col < 0) { col = ends.length; ends.push(0); }
      ends[col] = it.start + eff(it);
      out[k].i = col;
      group.push(k);
      groupEnd = Math.max(groupEnd, it.start + eff(it));
    });
    close();
    return out;
  }
  function renderCalendar() {
    let title = '';
    if (view.cal === 'dia') title = D.longCap(view.cursor);
    if (view.cal === 'semana') { const m = D.monday(view.cursor); title = D.parse(m).getDate() + ' – ' + D.dayMonth(D.add(m, 6)); }
    if (view.cal === 'mes') { const d = D.parse(view.cursor); title = D.monthTitle(d.getFullYear(), d.getMonth()); }
    let h = C.topbar('Calendario', { sub: 'Toca un evento para ver su detalle' }) +
      '<div class="screen-body cal-body">' + segTop() +
      '<div class="seg" role="radiogroup" aria-label="Vista" data-tour="cal-views">' + [['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']].map(([k, l]) => '<button type="button" role="radio" aria-checked="' + (view.cal === k) + '" data-act="cal-view" data-v="' + k + '">' + l + '</button>').join('') + '</div>' +
      '<div class="hrow between cal-nav"><button type="button" class="icon-btn" data-act="cal-nav" data-v="-1" aria-label="Anterior">' + I('chevron-left') + '</button><p class="t-h3 t-center grow" aria-live="polite">' + title + '</p>' +
      '<button type="button" class="btn btn-xs btn-secondary" data-act="cal-today">Hoy</button><button type="button" class="icon-btn" data-act="cal-nav" data-v="1" aria-label="Siguiente">' + I('chevron-right') + '</button></div>';
    if (view.cal === 'dia') h += dayView(view.cursor);
    if (view.cal === 'semana') h += weekView(view.cursor);
    if (view.cal === 'mes') h += monthView(view.cursor);
    h += '</div><button type="button" class="fab" data-act="add-at" data-date="' + (view.cal === 'mes' ? view.monthSel : view.cursor) + '">' + I('plus', 22) + 'Añadir</button>';
    return h;
  }
  const PX = 52;
  function evBox(it, compact, lane) {
    lane = lane || { i: 0, n: 1 };
    const A = compact ? 1 : 3, B = compact ? 2 : 6;
    const a = it.act || (it.actId ? M.activity(it.actId) : null);
    const top = (it.start - H0 * 60) / 60 * PX, hgt = Math.max(24, it.dur / 60 * PX - 3);
    const label = it.kind === 'class' ? (compact ? M.subjName(it.subjectId) : it.title) : (a ? a.title : it.title);
    const attrs = a ? ' data-act="detail" data-id="' + a.id + '"' : '';
    const tag = a ? 'button type="button"' : 'div';
    return '<' + tag + ' class="ev ' + it.kind + '"' + attrs + ' style="top:' + top + 'px;height:' + hgt + 'px;left:calc(' + A + 'px + (100% - ' + B + 'px) * ' + lane.i + ' / ' + lane.n + ');width:calc((100% - ' + B + 'px) / ' + lane.n + ' - 1px);right:auto;' + M.subjVar(it.subjectId) + '">' +
      '<b style="-webkit-line-clamp:' + Math.max(1, Math.floor((hgt - 8 - (!compact && hgt > 40 ? 14 : 0)) / (compact ? 11.5 : 15) * (1 / (SF.store.state.settings.text === 'large' ? 1.175 : 1)))) + '">' + u.esc(label) + '</b>' + '<span' + (!compact && hgt > 40 ? '' : ' class="sr-only"') + '> ' + T.fmt2(it.start) + ' – ' + T.fmt2(it.start + it.dur) + '</span>' + '</' + tag.split(' ')[0] + '>';
  }
  function hoursCol() { let h = ''; for (let i = H0; i <= H1; i++) h += '<span class="hr-l t-num" style="top:' + (i - H0) * PX + 'px">' + i + ':00</span>'; return '<div class="hours">' + h + '</div>'; }
  function gridLines() { let h = ''; for (let i = H0; i <= H1; i++) h += '<i style="top:' + (i - H0) * PX + 'px"></i>'; return '<div class="lines" aria-hidden="true">' + h + '</div>'; }
  function nowLine(date) { return date === D.TODAY ? '<div class="now-line" style="top:' + ((D.NOW_MIN - H0 * 60) / 60 * PX) + 'px"><span>9:41</span></div>' : ''; }
  function dayView(date) {
    setHours([date]);
    const items = M.dayItems(date);
    const ln = lanes(items);
    return '<div class="cal-scroll"><div class="cal-grid day" style="height:' + ((H1 - H0) * PX + 20) + 'px">' + hoursCol() + '<div class="col">' + gridLines() + items.map((it, k) => evBox(it, false, ln[k])).join('') + nowLine(date) + '</div></div></div>' +
      (items.length ? '' : '<p class="t-2 t-center">Nada programado este día.</p>');
  }
  function weekView(cursor) {
    const mon = D.monday(cursor);
    const days = [0, 1, 2, 3, 4, 5, 6].map((i) => D.add(mon, i));
    setHours(days);
    return '<div class="week-head"><span></span>' + days.map((d) => '<button type="button" class="wh-day' + (d === D.TODAY ? ' today' : '') + '" data-act="cal-goday" data-v="' + d + '"><span>' + D.DOW_CAP[D.dow(d)] + '</span> <b class="t-num">' + D.parse(d).getDate() + '</b><span class="sr-only"> de ' + D.MON_LONG[D.parse(d).getMonth()] + ', ver día</span></button>').join('') + '</div>' +
      '<div class="cal-scroll"><div class="cal-grid week" style="height:' + ((H1 - H0) * PX + 20) + 'px">' + hoursCol() + days.map((d) => '<div class="col' + (D.wd(d) > 5 ? ' weekend' : '') + '">' + gridLines() + (() => { const its = M.dayItems(d), ln = lanes(its); return its.map((it, k) => evBox(it, true, ln[k])).join(''); })() + nowLine(d) + '</div>').join('') + '</div></div>';
  }
  function monthView(cursor) {
    const d0 = D.parse(cursor);
    const y = d0.getFullYear(), m = d0.getMonth();
    const lead = (new Date(y, m, 1).getDay() + 6) % 7;
    const n = new Date(y, m + 1, 0).getDate();
    let h = '<div class="month-grid big" role="group" aria-label="Días de ' + D.monthTitle(y, m).toLowerCase() + '">' + ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((x) => '<span class="mg-dow">' + x + '</span>').join('');
    for (let i = 0; i < lead; i++) h += '<span></span>';
    for (let d = 1; d <= n; d++) {
      const iso = y + '-' + u.pad(m + 1) + '-' + u.pad(d);
      const items = M.dayItems(iso).filter((x) => x.kind !== 'class');
      const dots = items.slice(0, 3).map((x) => '<i style="' + M.subjVar(x.subjectId) + '"></i>').join('');
      h += '<button type="button" class="mg-day' + (iso === D.TODAY ? ' today' : '') + (iso === view.monthSel ? ' sel' : '') + '" data-act="cal-msel" data-v="' + iso + '" aria-label="' + D.long(iso) + ', ' + u.plural(items.length, 'elemento', 'elementos') + '"' + (iso === view.monthSel ? ' aria-pressed="true"' : '') + '>' + d + '<span class="mg-dots">' + dots + '</span></button>';
    }
    h += '</div>';
    const sel = M.dayItems(view.monthSel);
    h += '<section class="stack-sm"><h2 class="section-label">' + D.longCap(view.monthSel) + '</h2>' + (sel.length ? '<div class="stack-sm">' + sel.map((it) => it.kind === 'class'
      ? '<div class="card tight hrow" style="' + M.subjVar(it.subjectId) + '"><span class="ag-bar"></span><span class="grow stack-xs"><b>' + u.esc(it.title) + '</b><span class="t-sm t-2">' + T.fmt(it.start) + ' – ' + T.fmt(it.start + it.dur) + '</span></span>' + I('lock', 16, 't-3') + '</div>'
      : C.agendaRow(Object.assign({ date: view.monthSel }, it))).join('') + '</div>' : '<p class="card t-2">Sin clases ni actividades.</p>') + '</section>';
    return h;
  }
  SF.act['cal-view'] = (el) => { view.cal = el.dataset.v; SF.router.refresh(); };
  SF.act['cal-nav'] = (el) => {
    const n = Number(el.dataset.v);
    if (view.cal === 'dia') view.cursor = D.add(view.cursor, n);
    if (view.cal === 'semana') view.cursor = D.add(view.cursor, 7 * n);
    if (view.cal === 'mes') { const d = D.parse(view.cursor); d.setMonth(d.getMonth() + n, 1); view.cursor = D.iso(d); view.monthSel = view.cursor; }
    SF.router.refresh();
  };
  SF.act['cal-today'] = () => { view.cursor = D.TODAY; view.monthSel = D.TODAY; SF.router.refresh(); };
  SF.act['cal-goday'] = (el) => { view.cal = 'dia'; view.cursor = el.dataset.v; SF.router.refresh(); };
  SF.act['cal-msel'] = (el) => { view.monthSel = el.dataset.v; SF.router.refresh(); };
})(window.SF);
