/* =========================================================
   StudyFlow · Asistente (E1–E3)
   Entiende peticiones sencillas y propone cambios que
   el usuario confirma o descarta. Nada se aplica solo.
   ========================================================= */
(function (SF) {
  const { D, T, u, ui, M, C } = SF;
  const I = SF.icon;
  const S = () => SF.store.state;
  const DAYS = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5 };
  const pending = {}; // propuestas activas por id de mensaje

  SF.screens.asistente = {
    tab: 'asistente',
    static: true,
    title: () => 'Asistente',
    render() {
      const chat = S().chat;
      return C.topbar('Asistente', { back: true, sub: 'Pídeme que organice o mueva tus actividades', right: chat.length ? '<button type="button" class="icon-btn" data-act="chat-clear" aria-label="Borrar conversación">' + I('trash', 20) + '</button>' : '' }) +
        '<div class="screen-body chat-body" id="chat" role="log" aria-live="polite" aria-label="Conversación con el asistente">' +
        (chat.length ? chat.map(bubble).join('') : intro()) + '</div>' +
        '<footer class="chat-foot">' +
        (chat.length ? '<div class="chips scroll chat-sugg" role="group" aria-label="Sugerencias">' + SF.ASSIST_SUGGESTIONS.slice(1).map((s) => '<button type="button" class="chip sm" data-act="chat-sugg">' + u.esc(s) + '</button>').join('') + '</div>' : '') +
        '<form class="composer" id="composer" data-tour="assistant-input"><label class="sr-only" for="chat-in">Escribe al asistente</label>' +
        '<button type="button" class="icon-btn" data-act="chat-mic" aria-label="Dictar mensaje">' + I('mic', 20) + '</button>' +
        '<input class="input" id="chat-in" placeholder="Escribe o dicta lo que necesitas" autocomplete="off" maxlength="200">' +
        '<button type="submit" class="icon-btn filled" aria-label="Enviar">' + I('send', 20) + '</button></form></footer>';
    },
    mount(el) {
      const form = el.querySelector('#composer');
      form.addEventListener('submit', (e) => { e.preventDefault(); const i = el.querySelector('#chat-in'); send(i.value); i.value = ''; });
      if (S().chat.length) scrollEnd(false); // la introducción empieza arriba
    },
    update(el) { /* el chat se pinta por mensajes */ }
  };

  function intro() {
    return '<div class="chat-intro stagger">' + ui.illus('asistente', 'Asistente de StudyFlow') +
      '<h2 class="t-h2 t-center">¿En qué te ayudo, ' + u.esc(u.firstName(S().profile.name) || 'hola') + '?</h2>' +
      '<p class="t-2 t-center">Puedo organizar tu semana, decirte qué hacer primero o mover una actividad de día. Siempre te pido confirmación antes de cambiar algo.</p>' +
      '<div class="stack-sm">' + SF.ASSIST_SUGGESTIONS.map((s) => '<button type="button" class="card tight tap hrow sugg-card" data-act="chat-sugg">' + I('sparkles', 18, 't-primary') + '<span class="grow">' + u.esc(s) + '</span>' + I('arrow-right', 18, 't-3') + '</button>').join('') + '</div></div>';
  }
  function bubble(m) {
    if (m.from === 'me') return '<div class="msg me"><p>' + u.esc(m.text) + '</p></div>';
    return '<div class="msg bot' + (m.error ? ' error' : '') + '" data-mid="' + m.id + '">' + (m.error ? '' : '<span class="bot-av" aria-hidden="true">' + I('sparkles', 14) + '</span>') + '<div class="msg-body">' + m.html + '</div></div>';
  }
  function scrollEnd(smooth) { const c = document.querySelector('#chat'); if (c) c.scrollTo({ top: c.scrollHeight, behavior: smooth ? ui.motion() : 'auto' }); }
  function push(m, save) {
    const c = document.querySelector('#chat'); if (!c) return;
    const intro = c.querySelector('.chat-intro'); if (intro) { intro.remove(); }
    c.insertAdjacentHTML('beforeend', bubble(m));
    c.lastElementChild.classList.add('rise');
    if (save !== false) SF.store.commit((s) => { s.chat.push(m); if (s.chat.length > 40) s.chat.shift(); }, { silent: true });
    scrollEnd(true);
    if (!document.querySelector('[data-act="chat-clear"]')) {
      const tb = document.querySelector('.screen:last-child .topbar');
      if (tb) tb.insertAdjacentHTML('beforeend', '<button type="button" class="icon-btn" data-act="chat-clear" aria-label="Borrar conversación">' + I('trash', 20) + '</button>');
    }
  }
  function typing() {
    const c = document.querySelector('#chat');
    c.insertAdjacentHTML('beforeend', '<div class="msg bot typing-row"><span class="bot-av" aria-hidden="true">' + I('sparkles', 14) + '</span><div class="msg-body typing" aria-label="El asistente está escribiendo"><i></i><i></i><i></i></div></div>');
    scrollEnd(true);
    return () => { const t = c.querySelector('.typing-row'); if (t) t.remove(); };
  }

  let busy = false;
  async function send(text, retry) {
    text = String(text || '').trim();
    if (!text) { const i = document.querySelector('#chat-in'); if (i) { i.focus(); ui.toast('Escribe algo o toca una sugerencia', { icon: 'info' }); } return; }
    if (busy) return;
    busy = true;
    if (!retry) push({ id: u.uid('m'), from: 'me', text });
    const stop = typing();
    await u.sleep(650 + Math.min(600, text.length * 8));
    stop();
    if (S().demo.offline || navigator.onLine === false) {
      push({ id: u.uid('m'), from: 'bot', error: true, html: '<p class="hrow" style="gap:6px">' + I('wifi-off', 16) + '<b>No pude conectarme</b></p><p>Tu mensaje no se ha procesado. Revisa la conexión e inténtalo otra vez.</p><button type="button" class="btn btn-xs btn-secondary" data-act="chat-retry" data-text="' + u.esc(text) + '">' + I('refresh-cw', 14) + 'Reintentar</button>' }, false);
      busy = false; return;
    }
    const reply = answer(text);
    push(Object.assign({ id: u.uid('m'), from: 'bot' }, reply));
    busy = false;
  }
  SF.act['chat-sugg'] = (b) => send(b.querySelector('.grow') ? b.querySelector('.grow').textContent : b.textContent);
  SF.act['chat-retry'] = (b) => { b.closest('.msg').remove(); send(b.dataset.text, true); };
  SF.act['chat-mic'] = (b) => {
    if (S().demo.micDenied) { SF.micDenied(); return; }
    const inp = document.querySelector('#chat-in');
    const phrase = SF.ASSIST_SUGGESTIONS[Math.floor(Math.random() * SF.ASSIST_SUGGESTIONS.length)];
    b.classList.add('live'); b.setAttribute('aria-label', 'Escuchando');
    inp.value = ''; inp.placeholder = 'Escuchando…';
    const words = phrase.split(' '); let i = 0;
    const t = setInterval(() => { i++; inp.value = words.slice(0, i).join(' '); if (i >= words.length) { clearInterval(t); b.classList.remove('live'); b.setAttribute('aria-label', 'Dictar mensaje'); inp.placeholder = 'Escribe o dicta lo que necesitas'; inp.focus(); ui.announce('Mensaje dictado. Pulsa enviar.'); } }, 180);
  };
  SF.act['chat-clear'] = async () => {
    const ok = await ui.dialog({ icon: 'trash', tone: 'danger', title: '¿Borrar la conversación?', body: 'Se borran los mensajes. Tu plan y tus actividades no cambian.', actions: [{ label: 'Cancelar', kind: 'secondary', value: false }, { label: 'Borrar', kind: 'danger', value: true }] });
    if (!ok) return;
    const old = u.clone(S().chat);
    SF.store.commit((s) => { s.chat = []; }, { silent: true });
    SF.router.go('asistente', {}, { reset: true, transition: 'none' });
    ui.toast('Conversación borrada', { action: 'Deshacer', onAction: () => { SF.store.commit((s) => { s.chat = old; }, { silent: true }); SF.router.go('asistente', {}, { reset: true, transition: 'none' }); } });
  };

  /* ---------- Intenciones ---------- */
  function findAct(t) {
    const words = t.split(/\s+/).filter((w) => w.length >= 4 && !['mueve', 'pasa', 'cambia', 'para', 'jueves', 'viernes', 'lunes', 'martes', 'miercoles'].includes(w));
    let best = null, score = 0;
    S().activities.filter((a) => !a.done).forEach((a) => {
      const hay = u.norm(a.title + ' ' + M.subjName(a.subjectId));
      const sc = words.reduce((s, w) => s + (hay.includes(w.slice(0, 5)) ? 1 : 0), 0);
      if (sc > score) { score = sc; best = a; }
    });
    return best;
  }
  function dayFrom(t) {
    const m = t.match(/\b(lunes|martes|miercoles|jueves|viernes)\b/);
    if (!m) return null;
    return D.WEEK[DAYS[m[1]] - 1];
  }
  function changeList(ch) {
    return '<ul class="mini-changes">' + ch.slice(0, 5).map((c) => '<li><span class="pill ' + ({ nueva: 'success', movida: 'soft', eliminada: 'danger' }[c.kind]) + ' sm">' + c.kind + '</span><span class="grow"><b>' + u.esc(c.title) + '</b><br><span class="t-xs t-2">' + (c.kind === 'movida' ? M.whenText(c.from) + ' → ' + M.whenText(c.to) : M.whenText(c.to || c.from)) + '</span></span></li>').join('') + (ch.length > 5 ? '<li class="t-xs t-2">y ' + (ch.length - 5) + ' más…</li>' : '') + '</ul>';
  }
  function proposal(blocks, summary) {
    const id = u.uid('p');
    pending[id] = blocks;
    return '<div class="proposal" data-pid="' + id + '">' + summary + '<div class="row"><button type="button" class="btn btn-sm btn-secondary" data-act="chat-keep" data-pid="' + id + '">Mantener</button><button type="button" class="btn btn-sm btn-primary" data-act="chat-apply" data-pid="' + id + '">Confirmar</button></div></div>';
  }

  function answer(text) {
    const t = u.norm(text);
    const st = S();
    if (/^(hola|buenas|hey|que tal)/.test(t)) return { html: '<p>¡Hola! Dime qué necesitas: por ejemplo «¿Qué hago primero hoy?» o «Organiza mi semana».</p>' };
    if (/gracias/.test(t)) return { html: '<p>¡A ti! Aquí estoy si necesitas reorganizar algo.</p>' };

    if (/(que|por donde) (hago|empiezo|estudio)|primero|prioridad/.test(t)) {
      const a = M.focus();
      if (!a) return { html: '<p>Hoy no tienes nada pendiente. Buen momento para adelantar o descansar.</p>' };
      const nb = M.nextBlock(a.id);
      return { html: '<p>Empieza por <b>' + u.esc(a.title) + '</b> (' + u.esc(M.subjName(a.subjectId)) + ').</p><p class="t-sm t-2">' + u.esc(M.reason(a)) + (nb ? ' Tienes un bloque ' + (nb.date === D.TODAY ? 'hoy a las ' + nb.start : 'el ' + D.short(nb.date)) + '.' : '') + '</p><div class="row"><button type="button" class="btn btn-sm btn-secondary" data-act="detail" data-id="' + a.id + '">Ver detalle</button><button type="button" class="btn btn-sm btn-primary" data-act="start" data-id="' + a.id + '">' + I('play', 14) + 'Empezar</button></div>' };
    }

    if (/(organiza|planifica|reorganiza|ordena|recalcula).*(semana|plan|todo)?/.test(t) && !/mueve|pasa/.test(t)) {
      const exam = /parcial|examen/.test(t);
      const criteria = exam ? ['importancia', 'fecha', 'esfuerzo', 'duracion'] : st.settings.criteria;
      const res = M.build({ criteria, seed: (st.settings.seed || 0) + 1 });
      const ch = M.diff(st.plan.blocks, res.blocks);
      if (!ch.length) return { html: '<p>Tu semana ya está bien repartida: ' + T.dur(res.blocks.reduce((s, b) => s + b.dur, 0)) + ' de estudio en ' + new Set(res.blocks.map((b) => b.date)).size + ' días. No hace falta cambiar nada.</p>' };
      return { html: '<p>' + (exam ? 'Doy prioridad al parcial y a lo que más pesa en tu nota. ' : '') + 'Te propongo estos cambios:</p>' + proposal(res.blocks, changeList(ch) + '<p class="t-xs t-2">' + M.changeSummary(ch) + '</p>') };
    }

    if (/mueve|pasa|cambia|lleva/.test(t)) {
      const a = findAct(t); const day = dayFrom(t);
      if (!a) return { html: '<p>No encontré esa actividad. Dime su nombre, por ejemplo «Mueve el taller de diseño al jueves».</p>' };
      if (!day) return { html: '<p>¿A qué día quieres mover <b>' + u.esc(a.title) + '</b>? Dime lunes, martes, miércoles, jueves o viernes.</p>' };
      if (M.isFixed(a)) return { html: '<p><b>' + u.esc(a.title) + '</b> es un ' + (a.type === 'examen' ? 'examen' : 'evento') + ' con fecha fija. Para cambiarlo, edítalo desde su detalle.</p><button type="button" class="btn btn-sm btn-secondary" data-act="detail" data-id="' + a.id + '">Abrir detalle</button>' };
      if (D.diff(day, a.date) > 0 && D.diff(a.date, D.TODAY) >= 0) return { html: '<p>No puedo: <b>' + u.esc(a.title) + '</b> vence el ' + D.short(a.date) + ', antes del ' + D.short(day) + '. ¿La muevo a un día anterior?</p>' };
      if (D.diff(day, D.TODAY) < 0) return { html: '<p>Ese día ya pasó. Elige uno a partir de hoy.</p>' };
      const blocks = u.clone(st.plan.blocks);
      const mine = blocks.filter((b) => b.actId === a.id);
      if (!mine.length) return { html: '<p><b>' + u.esc(a.title) + '</b> no tiene bloques en el plan todavía.</p>' };
      const busy = M.dayItems(day).filter((x) => x.actId !== a.id && !(x.block && x.block.actId === a.id)).map((x) => ({ start: x.start, dur: x.dur }));
      const moved = [];
      for (const b of mine) {
        const slot = M.slotFor(day, b.dur, a, busy);
        if (!slot) break;
        const from = Object.assign({}, b);
        b.date = day; b.start = T.fmt2(slot[0]); b.pinned = true;
        busy.push({ start: slot[0], dur: b.dur });
        moved.push({ title: a.title, kind: 'movida', from, to: Object.assign({}, b) });
      }
      if (!moved.length) return { html: '<p>El ' + D.short(day) + ' no tiene un hueco de ' + T.dur(mine[0].dur) + '. ¿Probamos otro día?</p>' };
      return { html: '<p>Puedo mover <b>' + u.esc(a.title) + '</b> al ' + D.long(day) + ':</p>' + proposal(blocks, changeList(moved)) };
    }

    if (/ligero|liviano|menos carga|libre|descansar/.test(t) && dayFrom(t)) {
      const day = dayFrom(t);
      const blocks = u.clone(st.plan.blocks);
      const out = blocks.filter((b) => b.date === day);
      if (!out.length) return { html: '<p>El ' + D.long(day) + ' ya está libre de bloques de estudio.</p>' };
      const moved = [];
      out.forEach((b) => {
        const a = M.activity(b.actId);
        const days = D.WEEK.slice(0, 5).filter((d) => d !== day && D.diff(d, D.TODAY) >= 0 && (D.diff(a.date, D.TODAY) < 0 || D.diff(d, a.date) <= 0));
        for (const d of days) {
          const busy = [].concat(M.classesOn(d), M.fixedOn(d)).concat(blocks.filter((x) => x.date === d).map((x) => ({ start: T.toMin(x.start), dur: x.dur })));
          const slot = M.slotFor(d, b.dur, a, busy);
          if (slot) { const from = Object.assign({}, b); b.date = d; b.start = T.fmt2(slot[0]); b.pinned = true; moved.push({ title: a.title, kind: 'movida', from, to: Object.assign({}, b) }); break; }
        }
      });
      if (!moved.length) return { html: '<p>No encontré otros huecos antes de las entregas para aligerar el ' + D.long(day) + '.</p>' };
      return { html: '<p>Para dejar el ' + D.long(day) + ' más ligero muevo ' + u.plural(moved.length, 'bloque', 'bloques') + (moved.length < out.length ? ' (' + (out.length - moved.length) + ' no caben en otro día)' : '') + ':</p>' + proposal(blocks, changeList(moved)) };
    }

    if (/tiempo libre|cuanto|horas libres/.test(t)) {
      return { html: '<p>Esta semana tienes <b>' + T.dur(M.freeMinutesWeek()) + '</b> libres entre clases, de lunes a viernes. Ya hay ' + T.dur(M.weekStats().planned) + ' planificadas para estudiar.</p>' };
    }

    return { html: '<p>Aún no sé hacer eso. Toca una de estas opciones:</p><div class="chips" style="margin-top:8px">' + SF.ASSIST_SUGGESTIONS.map((x) => '<button type="button" class="chip sm" data-act="chat-sugg">' + u.esc(x) + '</button>').join('') + '</div><p class="t-xs t-2" style="margin-top:8px">Para borrar o editar una actividad, ábrela desde Hoy o el Plan.</p>' };
  }

  SF.act['chat-apply'] = async (b) => {
    const blocks = pending[b.dataset.pid];
    const box = b.closest('.proposal');
    if (!blocks) { ui.toast('Esta propuesta ya no está disponible', { icon: 'info' }); return; }
    b.classList.add('is-loading');
    await u.sleep(400);
    const snap = SF.store.snapshot(['plan']);
    let ch = [];
    SF.store.commit((s) => { ch = M.diff(s.plan.blocks, blocks); s.plan.prev = u.clone(s.plan.blocks); s.plan.blocks = M.cleanBlocks(blocks); s.plan.status = 'confirmed'; s.plan.changes = null; }, { noRender: true });
    delete pending[b.dataset.pid];
    box.innerHTML = '<p class="hrow t-success t-bold" style="gap:6px">' + I('circle-check', 16) + 'Aplicado: ' + M.changeSummary(ch) + '</p><button type="button" class="link-btn" data-act="tab" data-tab="plan">Ver plan</button>';
    ui.toast('Plan actualizado', { action: 'Deshacer', onAction: () => { SF.store.restore(snap); box.innerHTML = '<p class="t-sm t-2">Cambios deshechos.</p>'; } });
  };
  SF.act['chat-keep'] = (b) => {
    delete pending[b.dataset.pid];
    b.closest('.proposal').innerHTML = '<p class="t-sm t-2 hrow" style="gap:6px">' + I('check', 14) + 'Mantienes tu plan actual.</p>';
  };
})(window.SF);
