/* =========================================================
   StudyFlow · Modelo y planificador
   Calcula bloques de estudio en tu tiempo libre (lun–vie,
   8:00–21:00) sin tocar clases ni eventos fijos, según el
   criterio de priorización y el estilo de reparto.
   ========================================================= */
window.SF = window.SF || {};
(function (SF) {
  const { D, T, u } = SF;
  const S = () => SF.store.state;
  const DAY_START = 8 * 60, DAY_END = 21 * 60, MAX_CHUNK = 90, MIN_SLOT = 20, GAP = 10;

  const M = {};

  /* ---------- Consultas básicas ---------- */
  M.subject = (id) => S().subjects.find((s) => s.id === id) || null;
  M.activity = (id) => S().activities.find((a) => a.id === id) || null;
  M.subjName = (id) => (M.subject(id) || { name: 'Sin materia' }).name;
  M.subjVar = (id) => { const s = M.subject(id); return '--subj: var(--s-' + (s ? s.color : 'blue') + '); --subj-soft: var(--s-' + (s ? s.color : 'blue') + '-soft);'; };
  M.isFixed = (a) => a.type === 'evento' || a.type === 'examen';
  M.fixedLen = (a) => a.type === 'evento' ? a.duration : (a.examLen || 120);
  M.remaining = (a) => Math.max(15, Math.round((a.duration * (1 - (a.progress || 0) / 100)) / 5) * 5);
  /* ¿Ya se marcó el día de hoy como terminado? */
  M.dayClosed = () => S().session.dayClosed === D.TODAY;
  /* Examen que ya pasó */
  M.isOver = (a) => a.type === 'examen' && D.isPast(a.date, a.time);
  /* Quita bloques de actividades que ya no existen o están hechas */
  M.cleanBlocks = (blocks) => blocks.filter((b) => { const a = M.activity(b.actId); return a && !a.done; });
  M.weekActivities = () => { const mon = D.monday(D.TODAY); return S().activities.filter((a) => { const n = D.diff(a.date, mon); return a.type !== 'evento' && n >= 0 && n < 7; }); };

  /* ---------- Clases y eventos fijos de un día ---------- */
  M.classesOn = (date) => {
    const wd = D.wd(date);
    const out = [];
    S().subjects.forEach((s) => (s.classes || []).forEach((c, i) => {
      if (c.day === wd) out.push({ kind: 'class', key: 'c_' + s.id + '_' + i, subjectId: s.id, title: 'Clase · ' + s.name, start: T.toMin(c.start), dur: c.dur || 120 });
    }));
    return out;
  };
  M.fixedOn = (date) => S().activities
    .filter((a) => M.isFixed(a) && a.date === date && !(a.type === 'evento' && a.done))
    .map((a) => ({ kind: a.type === 'evento' ? 'event' : 'exam', key: 'f_' + a.id, actId: a.id, subjectId: a.subjectId,
      title: (a.type === 'examen' ? 'Examen · ' : '') + a.title, start: T.toMin(a.time), dur: M.fixedLen(a) }));
  M.blocksOn = (date) => S().plan.blocks.filter((b) => b.date === date)
    .map((b) => { const a = M.activity(b.actId); return a ? Object.assign({ kind: 'block', key: b.id, subjectId: a.subjectId, title: a.title, start: T.toMin(b.start), dur: b.dur }, { block: b, act: a }) : null; })
    .filter(Boolean);
  M.dayItems = (date) => [].concat(M.classesOn(date), M.fixedOn(date), M.blocksOn(date)).sort((a, b) => a.start - b.start);

  /* Huecos libres de un día (descontando ocupados). */
  M.freeSlots = (date, busy) => {
    const wd = D.wd(date);
    if (wd > 5) return [];
    if (date === D.TODAY && M.dayClosed()) return [];
    let from = DAY_START;
    if (date === D.TODAY) from = Math.max(from, Math.ceil((D.NOW_MIN + 4) / 15) * 15);
    if (D.diff(date, D.TODAY) < 0) return [];
    const occ = (busy || [].concat(M.classesOn(date), M.fixedOn(date))).map((x) => [x.start, x.start + x.dur]).sort((a, b) => a[0] - b[0]);
    const slots = [];
    let cur = from;
    occ.forEach(([s, e]) => {
      if (s - cur >= MIN_SLOT) slots.push([cur, s]);
      cur = Math.max(cur, e + (e > cur ? GAP : 0));
    });
    if (DAY_END - cur >= MIN_SLOT) slots.push([cur, DAY_END]);
    return slots.filter(([s, e]) => e - s >= MIN_SLOT);
  };
  /* Primer hueco de un día donde cabe `dur` minutos de la actividad `a`, sin pasar de su hora de entrega. */
  M.slotFor = (date, dur, a, busy) => {
    const limit = date === a.date ? Math.min(DAY_END, T.toMin(a.time) - (a.type === 'examen' ? 30 : 0)) : DAY_END;
    return M.freeSlots(date, busy).map(([s, e]) => [s, Math.min(e, limit)]).find(([s, e]) => e - s >= dur) || null;
  };
  M.freeMinutesWeek = () => D.WEEK.slice(0, 5).reduce((sum, d) => sum + M.freeSlots(d).reduce((a, [s, e]) => a + (e - s), 0), 0);

  /* ---------- Orden por criterio ---------- */
  const keyFor = {
    fecha: (a) => D.diff(a.date, D.TODAY) * 1440 + T.toMin(a.time),
    importancia: (a) => -(a.weight || 0),
    esfuerzo: (a) => M.remaining(a) + (a.type === 'examen' ? 60 : 0),
    duracion: (a) => M.remaining(a)
  };
  M.rank = (list, criteria) => {
    criteria = criteria || S().settings.criteria;
    return list.slice().sort((a, b) => {
      for (const c of criteria) { const d = keyFor[c](a) - keyFor[c](b); if (d) return d; }
      return a.title.localeCompare(b.title);
    });
  };

  /* ---------- Planificador ---------- */
  M.build = (opts) => {
    const st = S();
    opts = Object.assign({ style: st.settings.style, criteria: st.settings.criteria, seed: st.settings.seed }, opts || {});
    const days = D.WEEK.slice(0, 5).filter((d) => D.diff(d, D.TODAY) >= 0);
    const busy = {};
    days.forEach((d) => { busy[d] = [].concat(M.classesOn(d), M.fixedOn(d)); });
    const load = {}; days.forEach((d) => { load[d] = 0; });
    const blocks = [];
    const unplaced = [];

    // Ids únicos: el primero libre de la forma b_<actividad>_<n>
    const used = new Set();
    const newId = (actId) => { let n = 0; while (used.has('b_' + actId + '_' + n)) n++; const id = 'b_' + actId + '_' + n; used.add(id); return id; };

    // Bloques fijados por el usuario (se descartan los que ya no encajan y se replanifican)
    const pinned = st.plan.blocks.filter((b) => b.pinned).sort((x, y) => D.diff(x.date, y.date) || T.toMin(x.start) - T.toMin(y.start));
    const pinnedMin = {};
    pinned.forEach((b) => {
      const a = M.activity(b.actId);
      if (!a || a.done || M.isOver(a)) return;
      if (!days.includes(b.date)) return;
      if (M.dayClosed() && b.date === D.TODAY) return;
      const bs = T.toMin(b.start);
      if (busy[b.date].some((x) => T.overlap(bs, b.dur, x.start, x.dur))) return;
      const dlMin = T.toMin(a.time) - (a.type === 'examen' ? 30 : 0);
      if (b.date === a.date && bs + b.dur > dlMin) return;
      if (D.diff(b.date, a.date) > 0 && D.diff(a.date, D.TODAY) >= 0) return;
      const left = M.remaining(a) - (pinnedMin[a.id] || 0);
      if (left <= 0) return;
      const dur = b.dur > left ? Math.max(15, left) : b.dur;
      const nb = Object.assign({}, b, { dur });
      if (used.has(nb.id)) nb.id = newId(a.id); else used.add(nb.id);
      blocks.push(nb);
      busy[b.date].push({ start: bs, dur });
      load[b.date] += dur;
      pinnedMin[b.actId] = (pinnedMin[b.actId] || 0) + dur;
    });

    const tasks = M.rank(st.activities.filter((a) => !a.done && a.type !== 'evento' && !M.isOver(a)), opts.criteria);
    tasks.forEach((a, ti) => {
      let rem = M.remaining(a) - (pinnedMin[a.id] || 0);
      if (rem < 15) return;
      const parts = Math.ceil(rem / MAX_CHUNK);
      const sizes = [];
      for (let i = 0; i < parts; i++) sizes.push(Math.max(15, Math.round(rem / parts / 5) * 5));
      const deadlineDay = a.date;
      const deadlineMin = T.toMin(a.time) - (a.type === 'examen' ? 30 : 0);
      let usedDays = [];
      sizes.forEach((size, pi) => {
        // Vencida (o entrega de hoy con el día terminado): sin límite de hora, en el primer hueco disponible
        const late = D.diff(deadlineDay, D.TODAY) < 0 || (M.dayClosed() && deadlineDay === D.TODAY);
        const cands = late ? days : days.filter((d) => D.diff(d, deadlineDay) <= 0);
        if (!cands.length) { unplaced.push({ actId: a.id, dur: size }); return; }
        const options = [];
        cands.forEach((d) => {
          const limit = !late && d === deadlineDay ? Math.min(DAY_END, deadlineMin) : DAY_END;
          const slots = M.freeSlots(d, busy[d]).map(([s, e]) => [s, Math.min(e, limit)]).filter(([s, e]) => e - s >= size);
          if (!slots.length) return;
          let slot = slots[0];
          if (opts.style === 'dificultad' && ((a.weight || 0) >= 20 || size >= 60)) {
            const morning = slots.find(([s]) => s < 13 * 60);
            if (morning) slot = morning;
          }
          if (opts.seed % 2 === 1 && opts.style !== 'dificultad') slot = slots[slots.length - 1];
          let start = slot[0];
          if (opts.seed % 2 === 1 && opts.style !== 'dificultad') start = Math.max(slot[0], Math.floor((slot[1] - size) / 15) * 15);
          options.push({ d, start, idx: days.indexOf(d) });
        });
        if (!options.length) { unplaced.push({ actId: a.id, dur: size }); return; }
        let pick;
        if (late || opts.style === 'fecha') {
          pick = options[0];
        } else if (opts.style === 'dificultad') {
          pick = options.find((o) => o.start < 13 * 60) || options[0];
        } else {
          const rot = (opts.seed + ti) % Math.max(1, options.length);
          pick = options.slice().sort((x, y) => {
            const sx = load[x.d] + (usedDays.includes(x.d) ? 240 : 0);
            const sy = load[y.d] + (usedDays.includes(y.d) ? 240 : 0);
            if (sx !== sy) return sx - sy;
            return ((x.idx + rot) % options.length) - ((y.idx + rot) % options.length);
          })[0];
        }
        const b = { id: newId(a.id), actId: a.id, date: pick.d, start: T.fmt2(pick.start), dur: size, part: pi + 1, parts: sizes.length };
        blocks.push(b);
        busy[pick.d].push({ start: pick.start, dur: size });
        load[pick.d] += size;
        usedDays.push(pick.d);
      });
    });
    // numeración de partes coherente con fijados
    const byAct = {};
    blocks.forEach((b) => { (byAct[b.actId] = byAct[b.actId] || []).push(b); });
    Object.values(byAct).forEach((list) => {
      list.sort((x, y) => D.diff(x.date, y.date) || T.toMin(x.start) - T.toMin(y.start));
      list.forEach((b, i) => { b.part = i + 1; b.parts = list.length; });
    });
    return { blocks, unplaced };
  };

  /* Diferencias entre dos planes, por actividad. */
  M.diff = (oldBlocks, newBlocks) => {
    const first = (list, id) => list.filter((b) => b.actId === id).sort((x, y) => D.diff(x.date, y.date) || T.toMin(x.start) - T.toMin(y.start))[0];
    const ids = new Set([].concat(oldBlocks.map((b) => b.actId), newBlocks.map((b) => b.actId)));
    const out = [];
    ids.forEach((id) => {
      const o = first(oldBlocks, id), n = first(newBlocks, id);
      const a = M.activity(id);
      const title = a ? a.title : 'Actividad';
      if (!o && n) out.push({ actId: id, title, kind: 'nueva', to: n });
      else if (o && !n) out.push({ actId: id, title, kind: 'eliminada', from: o });
      else if (o.date !== n.date || o.start !== n.start) out.push({ actId: id, title, kind: 'movida', from: o, to: n });
    });
    return out;
  };

  /* Recalcula y guarda el plan. Devuelve los cambios. */
  M.recalc = (reason, opts) => {
    const st = S();
    const prev = st.plan.blocks;
    const res = M.build(opts);
    const changes = M.diff(prev, res.blocks);
    st.plan.prev = u.clone(prev);
    st.plan.blocks = res.blocks;
    st.plan.unplaced = res.unplaced;
    if (changes.length && reason !== 'silent') {
      st.plan.changes = changes;
      st.plan.changedAt = Date.now();
      st.notifications = st.notifications.filter((n) => n.kind !== 'plan');
      st.notifications.unshift({ id: u.uid('nt'), kind: 'plan', time: '09:41', title: 'Tu plan se ha recalculado', body: M.changeSummary(changes), read: false });
    }
    return changes;
  };
  M.changeSummary = (changes) => {
    const c = { nueva: 0, movida: 0, eliminada: 0 };
    changes.forEach((x) => { c[x.kind]++; });
    const parts = [];
    if (c.nueva) parts.push(c.nueva + (c.nueva === 1 ? ' nueva' : ' nuevas'));
    if (c.movida) parts.push(c.movida + (c.movida === 1 ? ' movida' : ' movidas'));
    if (c.eliminada) parts.push(c.eliminada + (c.eliminada === 1 ? ' eliminada' : ' eliminadas'));
    return parts.join(' · ') || 'Sin cambios';
  };
  M.whenText = (b) => b ? (D.rel(b.date) === 'hoy' ? 'Hoy' : D.short(b.date).replace(/^./, (c) => c.toUpperCase())) + ' ' + b.start : '';

  /* ---------- Hoy ---------- */
  M.todayCandidates = () => {
    const st = S();
    if (M.dayClosed()) return [];
    const today = D.TODAY;
    const ids = new Set(st.plan.blocks.filter((b) => b.date === today).map((b) => b.actId));
    st.activities.forEach((a) => { if (!a.done && a.type !== 'evento' && D.diff(a.date, today) <= 0) ids.add(a.id); });
    let list = Array.from(ids).map(M.activity).filter((a) => a && !a.done && !M.isOver(a));
    list = M.rank(list);
    if (st.todayOrder) {
      const ord = st.todayOrder;
      list.sort((a, b) => (ord.indexOf(a.id) === -1 ? 99 : ord.indexOf(a.id)) - (ord.indexOf(b.id) === -1 ? 99 : ord.indexOf(b.id)));
    }
    return list;
  };
  M.focus = () => M.todayCandidates()[0] || null;
  M.blocksFor = (actId) => S().plan.blocks.filter((b) => b.actId === actId).sort((x, y) => D.diff(x.date, y.date) || T.toMin(x.start) - T.toMin(y.start));
  M.nextBlock = (actId) => M.blocksFor(actId)[0] || null;

  M.reason = (a) => {
    const c = S().settings.criteria[0];
    const nb = M.blocksFor(a.id).length;
    const due = D.rel(a.date);
    const dueTxt = due === 'hoy' ? 'vence hoy a las ' + a.time : due === 'mañana' ? 'vence mañana' : (D.diff(a.date, D.TODAY) < 0 ? 'venció el ' : 'vence el ') + D.short(a.date);
    if (c === 'importancia') return 'Primero porque vale el ' + a.weight + ' % de la nota de ' + M.subjName(a.subjectId) + '.';
    if (c === 'esfuerzo') return 'Primero porque es la más ligera: ' + T.dur(M.remaining(a)) + ' para arrancar con energía.';
    if (c === 'duracion') return 'Primero porque la terminas en ' + T.dur(M.remaining(a)) + '.';
    return 'Primero porque ' + dueTxt + (nb > 1 ? ' y requiere ' + nb + ' bloques de concentración.' : '.');
  };

  M.upNext = (excludeId) => {
    // Los bloques traen it.act; exámenes y eventos, it.actId
    const isDone = (it) => { const a = it.act || (it.actId ? M.activity(it.actId) : null); return !!(a && a.done); };
    const out = [];
    const today = D.TODAY;
    M.dayItems(today).forEach((it) => {
      if (it.kind === 'class' || isDone(it)) return;
      if (it.start + it.dur <= D.NOW_MIN) return;
      if (it.actId === excludeId || (it.act && it.act.id === excludeId)) return;
      out.push(Object.assign({ date: today }, it));
    });
    if (out.length < 3) {
      for (let i = 1; i < 5 && out.length < 3; i++) {
        const d = D.add(today, i);
        M.dayItems(d).forEach((it) => {
          if (it.kind === 'class' || isDone(it) || out.length >= 3) return;
          if (it.actId === excludeId || (it.act && it.act.id === excludeId)) return;
          out.push(Object.assign({ date: d }, it));
        });
      }
    }
    return out.slice(0, 3);
  };

  M.weekStats = () => {
    const list = M.weekActivities();
    const done = list.filter((a) => a.done).length;
    const total = list.length;
    const planned = S().plan.blocks.reduce((s, b) => s + b.dur, 0);
    const days = new Set(S().plan.blocks.map((b) => b.date)).size;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0, planned, days, count: new Set(S().plan.blocks.map((b) => b.actId)).size };
  };
  M.todayStats = () => {
    const today = S().activities.filter((a) => a.type !== 'evento' && (a.doneAt === D.TODAY || M.blocksFor(a.id).some((b) => b.date === D.TODAY) || a.date === D.TODAY));
    return { done: today.filter((a) => a.done), pending: today.filter((a) => !a.done && !M.isOver(a)) };
  };

  /* ---------- Conflictos ---------- */
  M.conflicts = (date, time, dur, excludeId) => {
    if (!date || !time) return [];
    const s = T.toMin(time), d = dur || 60;
    return [].concat(M.classesOn(date), M.fixedOn(date).filter((x) => x.actId !== excludeId))
      .filter((x) => T.overlap(s, d, x.start, x.dur));
  };

  /* ---------- Avisos ---------- */
  M.unread = () => S().notifications.filter((n) => !n.read).length;

  SF.M = M;
})(window.SF);
