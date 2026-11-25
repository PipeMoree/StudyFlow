/* =========================================================
   StudyFlow · Registrar (A1 voz, A2 a mano, A3 texto,
   A4 revisión, A6 éxito, A8 avisos, A9 errores,
   A11 sin conexión, A12 micrófono, A13 borrador, A14 recientes)
   ========================================================= */
(function (SF) {
  const { D, T, u, ui, M, C } = SF;
  const I = SF.icon;
  const S = () => SF.store.state;

  let f = null;         // formulario en edición
  let mode = 'texto';   // texto | voz | mano
  let editId = null;
  let voice = { state: 'idle', text: '', timer: null };
  let parsed = null;    // resultado del reconocimiento (A4)

  const blank = () => ({ type: 'tarea', subjectId: (S().subjects[0] || {}).id || null, title: '', date: '', time: '', duration: 60, examLen: 120, weight: 10 });
  const offline = () => S().demo.offline || (typeof navigator !== 'undefined' && navigator.onLine === false);

  /* ---------- Intérprete de lenguaje natural ---------- */
  const DOWS = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 7 };
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const ALIASES = [
    [/calculo|integral|derivad|matemat/, 'calc'], [/comput|mysql|sql|base(s)? de datos|program|laboratorio/, 'comp'], [/disen|boceto|dibujo/, 'dise']
  ];
  SF.parseActivity = function (text) {
    const raw = String(text || '').trim();
    let t = ' ' + u.norm(raw) + ' ';
    const out = blank();
    let rest = raw;
    const cut = (re) => { rest = rest.replace(re, ' '); };
    if (/parcial|examen|quiz|prueba|final\b/.test(t)) out.type = 'examen';
    else if (/\bleer\b|lectura|capitulo/.test(t)) out.type = 'lectura';
    else if (/reunion|evento|cita|charla|partido|tutoria|conferencia/.test(t)) out.type = 'evento';
    out.duration = SF.TYPES[out.type].dur;
    if (out.type === 'examen') { out.duration = 150; out.examLen = 120; out.weight = 30; }
    // Materia
    const subs = S().subjects;
    let subj = subs.find((s) => t.includes(u.norm(s.name)) || u.norm(s.name).split(/\s+/).some((w) => w.length >= 5 && t.includes(w)));
    if (!subj) ALIASES.forEach(([re, key]) => { if (!subj && re.test(t)) subj = subs.find((s) => u.norm(s.name).startsWith(key.slice(0, 4))); });
    if (subj) out.subjectId = subj.id;
    // Fecha
    const valid = (y, mo, d) => { const iso = y + '-' + u.pad(mo) + '-' + u.pad(d); return D.iso(D.parse(iso)) === iso ? iso : ''; };
    let m;
    if (/pasado manana/.test(t)) { out.date = D.add(D.TODAY, 2); cut(/pasado mañana/i); }
    else if (/\bmanana\b/.test(t.replace(/(de|por) la manana/g, ' '))) { out.date = D.add(D.TODAY, 1); rest = rest.replace(/((?:de|por) la )?mañana/gi, (m, p) => (p ? m : ' ')); }
    else if (/\bhoy\b/.test(t)) { out.date = D.TODAY; cut(/\bhoy\b/i); }
    else if ((m = t.match(/\b(?:el\s+)?(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/))) {
      const target = DOWS[m[1]]; let d = D.TODAY;
      for (let i = 0; i < 7; i++) { if (D.wd(d) === target) break; d = D.add(d, 1); }
      out.date = d; cut(new RegExp('(el\\s+)?' + m[1].replace('miercoles', 'mi[ée]rcoles').replace('sabado', 's[áa]bado'), 'i'));
    } else if ((m = t.match(/\b(?:el\s+)?(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/))) {
      // Año de hoy; si esa fecha ya pasó, el siguiente. Una fecha que no existe (31 de febrero) se ignora.
      const y0 = Number(D.TODAY.slice(0, 4)), mo = MONTHS.indexOf(m[2]) + 1;
      let dt = valid(y0, mo, Number(m[1]));
      if (dt && D.diff(dt, D.TODAY) < 0) dt = valid(y0 + 1, mo, Number(m[1]));
      if (dt) { out.date = dt; cut(new RegExp('(el\\s+)?' + m[1] + '\\s+de\\s+' + m[2], 'i')); }
    } else if ((m = t.match(/\bel (\d{1,2})\b(?!\s*(?:am|pm|h))/))) {
      // «el N»: el primer mes, desde el actual, en que ese día existe y no ha pasado
      const y0 = Number(D.TODAY.slice(0, 4)), m0 = Number(D.TODAY.slice(5, 7));
      for (let k = 0; k < 12; k++) {
        const dt = valid(y0 + Math.floor((m0 - 1 + k) / 12), (m0 - 1 + k) % 12 + 1, Number(m[1]));
        if (dt && D.diff(dt, D.TODAY) >= 0) { out.date = dt; cut(new RegExp('el ' + m[1] + '\\b', 'i')); break; }
      }
    }
    // Hora
    if ((m = t.match(/\ba las? (\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.?\s?m\.?|p\.?\s?m\.?|de la manana|de la tarde|de la noche|del mediodia)?/))) {
      let h = Number(m[1]); const mm = Number(m[2] || 0); const ap = (m[3] || '').replace(/[.\s]/g, '');
      if ((/pm|tarde|noche|mediodia/.test(ap)) && h < 12) h += 12;
      if (!ap && h > 0 && h < 8) h += 12;
      if (/am|manana/.test(ap) && h === 12) h = 0;
      if (h <= 23 && mm <= 59) { // una hora imposible se ignora y no se recorta del título
        out.time = u.pad(h) + ':' + u.pad(mm);
        cut(/\ba las?\s+\d{1,2}(?:[:.]\d{2})?\s*(am|pm|a\.?\s?m\.?|p\.?\s?m\.?|de la mañana|de la tarde|de la noche|del mediod[ií]a)?/i);
      }
    } else if ((m = t.match(/\b(\d{1,2})\s*(am|pm)\b/))) {
      let h = Number(m[1]); if (m[2] === 'pm' && h < 12) h += 12;
      if (h <= 23) { out.time = u.pad(h) + ':00'; cut(/\b\d{1,2}\s*(am|pm)\b/i); }
    }
    if (!out.time && out.date) out.time = out.type === 'examen' || out.type === 'evento' ? '10:00' : '23:59';
    // Duración
    if ((m = t.match(/(\d+(?:[.,]\d)?)\s*(h|horas?)\b/))) { out.duration = Math.round(parseFloat(m[1].replace(',', '.')) * 60); cut(/\d+(?:[.,]\d)?\s*(h|horas?)\b/i); }
    else if ((m = t.match(/(\d+)\s*(min|minutos)\b/))) { out.duration = Number(m[1]); cut(/\d+\s*(min|minutos)\b/i); }
    if ((m = t.match(/(\d{1,3})\s*(%|por ?ciento)/))) { out.weight = Number(m[1]); cut(/(vale\s+)?(el\s+)?\d{1,3}\s*(%|por ?ciento)/i); }
    // Título
    let title = rest.replace(/\s+(para|el|la|de|a|y)\s*$/i, '').replace(/^\s*(tengo|hay|agrega|añade|apunta|registra|recuérdame)\s+(que\s+)?(un|una|el|la)?\s*/i, '').replace(/\s{2,}/g, ' ').replace(/[\s,.]+$/, '').trim();
    title = title.replace(/\s+(para|el|la|de)$/i, '');
    out.title = title ? title.charAt(0).toUpperCase() + title.slice(1) : '';
    return out;
  };

  /* ---------- Pantalla ---------- */
  SF.screens.registrar = {
    tab: 'registrar',
    static: true,
    title: (p) => (p && p.editId ? 'Editar actividad' : 'Registrar actividad'),
    render(p) {
      p = p || {};
      editId = p.editId || null;
      parsed = null; stopVoice(); voice.state = 'idle';
      if (editId) {
        const a = M.activity(editId);
        f = a ? { type: a.type, subjectId: a.subjectId, title: a.title, date: a.date, time: a.time, duration: a.duration, examLen: a.examLen || 120, weight: a.weight || 0 } : blank();
        mode = 'texto';
      } else {
        f = blank();
        if (p.prefill) Object.assign(f, Object.fromEntries(Object.entries(p.prefill).filter(([, v]) => v !== '' && v != null)));
        if (p.mode) mode = p.mode;
      }
      const st = S();
      const draft = !editId && !p.prefill && st.session.draft && st.session.draft.title;
      return C.topbar(editId ? 'Editar actividad' : 'Registrar actividad', {
        back: !!editId || (SF.router.depth() > 1 && !!p.prefill),
        sub: editId ? 'Los cambios se verán en Hoy, Plan y Calendario' : 'Dilo como te salga. Primero lo ordeno.',
        right: editId ? '' : '<button type="button" class="icon-label" data-act="reg-recent" aria-label="Recientes: usar una actividad anterior como plantilla">' + I('rotate-ccw', 20) + '<span>Recientes</span></button>'
      }) +
        '<div class="screen-body" id="reg">' +
        '<div id="reg-offline">' + offlineBanner() + '</div>' +
        (draft ? '<div class="callout" id="reg-draft">' + I('file-text', 18) + '<span class="grow">Tienes un borrador sin terminar: <b>' + u.esc(st.session.draft.title) + '</b></span><span class="hrow" style="gap:6px"><button type="button" class="btn btn-xs btn-ghost" data-act="reg-draft-drop">Descartar</button><button type="button" class="btn btn-xs btn-primary" data-act="reg-draft-use">Recuperar</button></span></div>' : '') +
        (editId ? '' : '<div class="seg" role="radiogroup" aria-label="Forma de registrar">' + [['texto', 'type', 'Texto'], ['voz', 'mic', 'Voz'], ['mano', 'pen-line', 'A mano']].map(([k, ic, l]) => '<button type="button" role="radio" aria-checked="' + (mode === k) + '" data-act="reg-mode" data-v="' + k + '">' + I(ic, 16) + l + '</button>').join('') + '</div>') +
        '<div id="reg-area">' + areaHtml() + '</div></div>' +
        '<footer class="screen-foot" id="reg-foot">' + footHtml() + '</footer>';
    },
    mount(el) { bindArea(el); },
    update(el) { const o = el.querySelector('#reg-offline'); if (o) o.innerHTML = offlineBanner(); },
    unmount() { stopVoice(); },
    async canLeave() {
      if (editId ? !(M.activity(editId) && editChanges().length) : !unsaved()) return true;
      return ui.confirm({ icon: 'alert-triangle', tone: 'warning', title: editId ? '¿Salir sin guardar?' : '¿Descartar lo que registraste?', body: editId ? 'Los cambios de esta actividad se perderán.' : 'Aún no lo has guardado como actividad y se perderá.', cancel: 'Seguir editando', ok: 'Salir' });
    }
  };
  /* Lo dictado o escrito a mano que todavía no es una actividad */
  const unsaved = () => !!parsed || !!(mode === 'mano' && document.querySelector('#hand-canvas') && hand && hand.strokes.length);
  /* Diferencias entre la actividad guardada y el formulario, para confirmarlas */
  function editChanges() {
    const a = M.activity(editId); const out = [];
    const add = (label, x, y) => { if (String(x) !== String(y)) out.push(label + ': ' + x + ' → ' + y); };
    add('Tipo', SF.TYPES[a.type].label, SF.TYPES[f.type].label);
    add('Materia', M.subjName(a.subjectId), M.subjName(f.subjectId));
    add('Nombre', a.title, (f.title || '').trim() || 'sin nombre');
    add('Fecha', D.short(a.date), D.short(f.date));
    add('Hora', a.time, f.time);
    if (f.type === 'examen') add('Duración del examen', T.dur(a.examLen || 120), T.dur(f.examLen));
    add(f.type === 'evento' ? 'Duración' : 'Tiempo de trabajo', T.dur(a.duration), T.dur(f.duration));
    if (f.type !== 'evento') add('Peso', (a.weight || 0) + ' %', f.weight + ' %');
    return out;
  }

  function offlineBanner() {
    if (!offline()) return '';
    return '<div class="callout warning">' + I('wifi-off', 18) + '<span><b>Sin conexión.</b> Puedes registrar por texto; lo guardamos en este dispositivo y se sincroniza al volver la conexión.</span></div>';
  }
  function footHtml() {
    if (mode === 'voz' && S().demo.micDenied && !parsed) return ''; // la pantalla ya ofrece «Escribirlo» y «Volver a intentar»
    if (mode === 'texto') return '<button type="button" class="btn btn-primary btn-block" data-act="reg-save">' + I('check', 18) + (editId ? 'Guardar cambios' : 'Guardar actividad') + '</button>';
    if (parsed) return '<div class="row"><button type="button" class="btn btn-secondary" data-act="reg-edit-parsed">' + I('pencil', 18) + 'Editar</button><button type="button" class="btn btn-primary" data-act="reg-save-parsed">' + I('check', 18) + 'Guardar</button></div>';
    if (mode === 'mano') return '<button type="button" class="btn btn-primary btn-block" data-act="reg-recognize">' + I('sparkles', 18) + 'Reconocer escritura</button>';
    return '<button type="button" class="btn btn-secondary btn-block" data-act="reg-mode" data-v="texto">' + I('keyboard', 18) + 'Prefiero escribirlo</button>';
  }
  function setFoot() { const ft = document.querySelector('#reg-foot'); if (ft) ft.innerHTML = footHtml(); }
  function areaHtml() {
    if (parsed) return reviewHtml();
    if (mode === 'voz') return voiceHtml();
    if (mode === 'mano') return handHtml();
    return formHtml();
  }
  function rerender() {
    const area = document.querySelector('#reg-area'); if (!area) return;
    const reg = document.querySelector('#reg'); const sc = reg ? reg.scrollTop : 0;
    area.innerHTML = areaHtml();
    if (reg) reg.scrollTop = sc;
    area.classList.remove('rise'); void area.offsetWidth; area.classList.add('rise');
    setFoot();
    bindArea(document.querySelector('#reg'));
    ui.segs(document.querySelector('#reg'));
  }

  /* ---------- A3 · Formulario ---------- */
  function formHtml() {
    const st = S();
    const fixed = f.type === 'evento' || f.type === 'examen';
    const dateBtn = (f.date ? D.longCap(f.date) : 'Elegir fecha');
    return '<form class="stack" id="reg-form" novalidate><p class="t-sm t-2">Completa los campos con <span class="req">*</span> para guardar.</p>' +
      (editId ? '' : '<div class="field quick"><label for="quick">Escríbelo en una frase <span class="t-3">(opcional)</span></label><div class="input-wrap"><input class="input" id="quick" placeholder="Ej.: ' + u.esc(SF.examplePhrases()[0]) + '" autocomplete="off"><button type="button" class="btn btn-xs btn-soft iw-end" data-act="reg-quick">' + I('sparkles', 16) + 'Rellenar</button></div><p class="t-xs t-3">Rellenamos los campos por ti; luego puedes corregirlos.</p></div>') +
      '<div class="field" data-field="type"><span class="label" id="ft-l">Tipo<span class="req" aria-hidden="true"> *</span></span><div class="chips" role="radiogroup" aria-labelledby="ft-l">' + Object.keys(SF.TYPES).map((k) => '<button type="button" class="chip" role="radio" aria-checked="' + (f.type === k) + '" data-act="reg-type" data-v="' + k + '">' + I(SF.TYPES[k].icon, 16) + SF.TYPES[k].label + '</button>').join('') + '</div></div>' +
      '<div class="field" data-field="subject"><span class="label" id="fs-l">Materia<span class="req" aria-hidden="true"> *</span></span><div class="chips" role="radiogroup" aria-labelledby="fs-l">' + st.subjects.map((s) => '<button type="button" class="chip" role="radio" aria-checked="' + (f.subjectId === s.id) + '" data-act="reg-subj" data-v="' + s.id + '" style="' + M.subjVar(s.id) + '"><span class="subject-dot"></span>' + u.esc(s.name) + '</button>').join('') + '<button type="button" class="chip add-chip" data-act="reg-new-subj">' + I('plus', 16) + 'Nueva materia</button></div></div>' +
      '<div class="field" data-field="title"><label for="ftitle">Nombre<span class="req" aria-hidden="true"> *</span></label><input class="input" id="ftitle" maxlength="70" placeholder="' + ({ tarea: 'Ej.: Taller de integrales', examen: 'Ej.: Parcial de cálculo', lectura: 'Ej.: Leer capítulo 5', evento: 'Ej.: Reunión de grupo' }[f.type]) + '" value="' + u.esc(f.title) + '" autocomplete="off"></div>' +
      '<div class="grid-2">' +
      '<div class="field" data-field="date"><span class="label" id="fd-l">' + (fixed ? 'Fecha' : 'Fecha de entrega') + '<span class="req" aria-hidden="true"> *</span></span><button type="button" class="input-btn' + (f.date ? '' : ' empty') + '" data-act="reg-date" aria-labelledby="fd-l fd-v"><span id="fd-v" class="clamp-1">' + dateBtn + '</span>' + I('calendar', 18) + '</button></div>' +
      '<div class="field" data-field="time"><span class="label" id="fh-l">' + (fixed ? 'Hora de inicio' : 'Hora límite') + '<span class="req" aria-hidden="true"> *</span></span><button type="button" class="input-btn' + (f.time ? '' : ' empty') + '" data-act="reg-time" aria-labelledby="fh-l fh-v"><span id="fh-v">' + (f.time || 'Elegir') + '</span>' + I('clock', 18) + '</button></div></div>' +
      '<div id="reg-warn" aria-live="polite">' + warnHtml() + '</div>' +
      (f.type === 'examen' ? stepper('examLen', 'Duración del examen', f.examLen) : '') +
      stepper('duration', f.type === 'evento' ? 'Duración' : f.type === 'examen' ? 'Tiempo de estudio que necesitas' : 'Tiempo estimado de trabajo', f.duration) +
      (f.type === 'evento' ? '' : '<div class="field"><div class="hrow between"><label for="fweight">Peso en la nota</label><output class="t-bold t-num" id="fweight-v" for="fweight">' + f.weight + ' %</output></div><input type="range" class="range" id="fweight" min="0" max="100" step="5" value="' + f.weight + '" style="--p:' + f.weight + '%"><p class="t-xs t-3">Sirve para priorizar si eliges el criterio «Importancia».</p></div>') +
      (fixed ? '' : '<p class="callout soft t-sm">' + I('sparkles', 16) + '<span>StudyFlow reparte este tiempo en bloques de hasta 1 h 30 min dentro de tus horas libres, antes de la entrega.</span></p>') +
      '</form>';
  }
  function stepper(key, label, val) {
    return '<div class="field"><span class="label" id="st-' + key + '">' + label + '</span><div class="stepper" role="group" aria-labelledby="st-' + key + '">' +
      '<button type="button" class="icon-btn" data-act="reg-step" data-k="' + key + '" data-d="-15" aria-label="Quitar 15 minutos">' + I('minus', 18) + '</button>' +
      '<output class="t-h3 t-num" id="sv-' + key + '" aria-live="polite">' + T.dur(val) + '</output>' +
      '<button type="button" class="icon-btn" data-act="reg-step" data-k="' + key + '" data-d="15" aria-label="Añadir 15 minutos">' + I('plus', 18) + '</button></div></div>';
  }
  function conflictsNow() {
    if (!(f.type === 'evento' || f.type === 'examen') || !f.date || !f.time) return [];
    return M.conflicts(f.date, f.time, f.type === 'evento' ? f.duration : f.examLen, editId);
  }
  function warnHtml() {
    let h = '';
    if (f.date && D.isPast(f.date, f.time)) h += '<p class="wrn">' + I('alert-triangle', 16) + '<span>Esa fecha ya pasó. Revísala o guárdala igual para tenerla registrada.</span></p>';
    if (f.date && D.wd(f.date) > 5 && f.type !== 'evento') h += '<p class="wrn">' + I('info', 16) + '<span>Cae en fin de semana: planificaremos el trabajo de lunes a viernes.</span></p>';
    const c = conflictsNow();
    if (c.length) h += '<p class="wrn">' + I('alert-triangle', 16) + '<span>Coincide con <b>' + u.esc(c[0].title) + '</b> (' + T.fmt2(c[0].start) + '–' + T.fmt2(c[0].start + c[0].dur) + ').' + (c.length > 1 ? ' Y ' + u.plural(c.length - 1, 'evento más', 'eventos más') + '.' : '') + '</span></p>';
    return h;
  }
  function refreshWarn() { const w = document.querySelector('#reg-warn'); if (w) w.innerHTML = warnHtml(); }
  let draftT = null;
  function saveDraft() {
    if (editId) return;
    clearTimeout(draftT);
    draftT = setTimeout(() => SF.store.commit((s) => { s.session.draft = f.title ? u.clone(f) : null; }, { silent: true }), 400);
  }

  function bindArea(root) {
    if (!root) return;
    const t = root.querySelector('#ftitle');
    if (t) t.addEventListener('input', () => { f.title = t.value; SF.fieldError(root, 'title', ''); saveDraft(); });
    const w = root.querySelector('#fweight');
    if (w) w.addEventListener('input', () => { f.weight = Number(w.value); w.style.setProperty('--p', w.value + '%'); root.querySelector('#fweight-v').textContent = w.value + ' %'; saveDraft(); });
    const q = root.querySelector('#quick');
    if (q) q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); SF.act['reg-quick'](); } });
    const form = root.querySelector('#reg-form');
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); SF.act['reg-save'](); });
    const cv = root.querySelector('#hand-canvas');
    if (cv) handPad(cv);
  }

  SF.act['reg-mode'] = async (b) => {
    const v = b.dataset.v;
    if ((v !== mode || parsed) && unsaved() && !(await ui.confirm({ icon: 'alert-triangle', tone: 'warning', title: '¿Cambiar de forma de registrar?', body: parsed ? 'Lo que reconocimos se perderá.' : 'Lo que escribiste a mano se perderá.', cancel: 'Seguir aquí', ok: 'Cambiar' }))) return;
    if (v === 'voz' && offline()) { ui.dialog({ icon: 'wifi-off', tone: 'warning', title: 'La voz necesita conexión', body: 'Sin internet no podemos entender lo que dices. Escríbelo ahora o inténtalo cuando vuelvas a tener conexión.', actions: [{ label: 'Escribirlo', kind: 'primary', value: 1 }] }).then(() => { mode = 'texto'; syncSeg(); rerender(); }); return; }
    stopVoice(); parsed = null; mode = v; syncSeg(); rerender();
  };
  function syncSeg() { document.querySelectorAll('#reg .seg [role=radio]').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.v === mode))); ui.segs(document.querySelector('#reg')); }
  SF.act['reg-type'] = (b) => {
    const prev = f.type; f.type = b.dataset.v;
    if (prev !== f.type && f.duration === SF.TYPES[prev].dur) f.duration = SF.TYPES[f.type].dur;
    rerender(); saveDraft();
  };
  SF.act['reg-subj'] = (b) => { f.subjectId = b.dataset.v; b.parentNode.querySelectorAll('[role=radio]').forEach((x) => x.setAttribute('aria-checked', String(x === b))); SF.fieldError(document.querySelector('#reg'), 'subject', ''); saveDraft(); };
  SF.act['reg-date'] = async () => {
    const v = await C.pickDate(f.date || D.TODAY, { title: f.type === 'evento' || f.type === 'examen' ? 'Fecha' : 'Fecha de entrega' });
    if (!v) return;
    f.date = v;
    const b = document.querySelector('[data-act="reg-date"]'); b.classList.remove('empty'); b.querySelector('span').textContent = D.longCap(v);
    SF.fieldError(document.querySelector('#reg'), 'date', ''); refreshWarn(); saveDraft();
  };
  SF.act['reg-time'] = async () => {
    const v = await C.pickTime(f.time || (f.type === 'evento' || f.type === 'examen' ? '10:00' : '23:59'), { title: f.type === 'evento' || f.type === 'examen' ? 'Hora de inicio' : 'Hora límite' });
    if (!v) return;
    f.time = v;
    const b = document.querySelector('[data-act="reg-time"]'); b.classList.remove('empty'); b.querySelector('span').textContent = v;
    SF.fieldError(document.querySelector('#reg'), 'time', ''); refreshWarn(); saveDraft();
  };
  SF.act['reg-step'] = (b) => {
    const k = b.dataset.k;
    f[k] = u.clamp((f[k] || 0) + Number(b.dataset.d), 15, k === 'examLen' ? 300 : 600);
    document.querySelector('#sv-' + k).textContent = T.dur(f[k]);
    refreshWarn(); saveDraft();
  };
  SF.act['reg-quick'] = () => {
    const q = document.querySelector('#quick'); if (!q || !q.value.trim()) { ui.toast('Escribe una frase, por ejemplo «Leer capítulo 5 mañana»', { icon: 'info' }); if (q) q.focus(); return; }
    const p = SF.parseActivity(q.value);
    const filled = ['type', 'subjectId', 'title', 'date', 'time', 'duration'].filter((k) => p[k] && p[k] !== f[k]).length;
    Object.assign(f, Object.fromEntries(Object.entries(p).filter(([, v]) => v !== '' && v != null)));
    rerender(); saveDraft();
    ui.toast(filled ? 'Rellenamos ' + u.plural(filled, 'campo', 'campos') + '. Revisa que esté bien.' : 'No entendimos la frase; rellena los campos a mano.', { icon: filled ? 'sparkles' : 'info' });
  };

  /* A13 · Borrador */
  const replaceOk = async () => !(f.title || '').trim() || ui.confirm({ icon: 'alert-triangle', tone: 'warning', title: '¿Reemplazar lo que escribiste?', body: '«' + f.title.trim() + '» se sustituye por los datos que elegiste.', ok: 'Reemplazar' });
  const dropDraftBox = () => { const bx = document.querySelector('#reg-draft'); if (bx) bx.remove(); };
  SF.act['reg-draft-use'] = async () => { if (!(await replaceOk())) return; const dr = S().session.draft; if (!dr) { dropDraftBox(); return; } f = Object.assign(blank(), dr); mode = 'texto'; syncSeg(); dropDraftBox(); rerender(); ui.toast('Borrador recuperado', { icon: 'file-text' }); };
  SF.act['reg-draft-drop'] = async () => { const d = S().session.draft; if (!d) { dropDraftBox(); return; } if (!(await ui.confirm({ danger: true, title: '¿Descartar el borrador?', body: '«' + d.title + '» no se guardará como actividad.', ok: 'Descartar' }))) return; SF.store.commit((s) => { s.session.draft = null; }, { silent: true }); const box = document.querySelector('#reg-draft'); if (box) box.remove(); ui.toast('Borrador descartado', { action: 'Deshacer', onAction: () => SF.store.commit((s) => { s.session.draft = d; }) }); };

  /* A14 · Recientes */
  SF.act['reg-recent'] = () => {
    const list = S().activities.slice().reverse().filter((a) => !a.sample).slice(0, 6);
    ui.sheet({
      title: 'Recientes', sub: 'Usa una actividad anterior como plantilla',
      body: list.length ? '<ul class="list">' + list.map((a) => '<li><button type="button" class="row" data-id="' + a.id + '" style="' + M.subjVar(a.subjectId) + '"><span class="row-icon">' + I(SF.TYPES[a.type].icon, 18) + '</span><span class="row-main"><span class="row-title">' + u.esc(a.title) + '</span><span class="row-sub">' + u.esc(M.subjName(a.subjectId)) + ' · ' + SF.TYPES[a.type].label + ' · ' + T.dur(a.duration) + '</span></span>' + I('copy', 18, 't-3') + '</button></li>').join('') + '</ul>' : '<p class="t-2">Aún no has registrado actividades.</p>',
      mount(el, ly) {
        el.addEventListener('click', async (e) => {
          const b = e.target.closest('[data-id]'); if (!b) return;
          const a = M.activity(b.dataset.id);
          if (!(await replaceOk())) return;
          f = { type: a.type, subjectId: a.subjectId, title: a.title, date: '', time: a.time, duration: a.duration, examLen: a.examLen || 120, weight: a.weight || 0 };
          mode = 'texto'; parsed = null; ly.close(); syncSeg(); rerender();
          ui.toast('Plantilla aplicada. Elige la nueva fecha.', { icon: 'copy' });
          setTimeout(() => { const rg = document.querySelector('#reg'); if (rg) SF.fieldError(rg, 'date', 'Elige la fecha de esta nueva actividad.'); }, 50);
        });
      }
    });
  };

  /* ---------- A9 · Validación y guardado ---------- */
  function validate(root) {
    const errs = [];
    if (!f.title || f.title.trim().length < 3) errs.push(['title', f.title ? 'El nombre es muy corto (mínimo 3 letras).' : 'Escribe el nombre de la actividad.']);
    if (!f.subjectId) errs.push(['subject', 'Elige una materia.']);
    if (!f.date) errs.push(['date', 'Elige una fecha.']);
    if (!f.time) errs.push(['time', 'Elige una hora.']);
    if (root) { ['title', 'subject', 'date', 'time'].forEach((k) => SF.fieldError(root, k, '')); errs.forEach(([k, m]) => SF.fieldError(root, k, m)); }
    return errs;
  }
  SF.act['reg-save'] = ui.once(async () => {
    const root = document.querySelector('#reg');
    const errs = validate(root);
    if (errs.length) {
      const first = root.querySelector('.invalid input, .invalid .input-btn, .invalid .chip');
      if (first) { first.focus(); first.scrollIntoView({ block: 'center', behavior: ui.motion() }); }
      root.querySelector('#reg-form').classList.remove('shake'); void root.offsetWidth; root.querySelector('#reg-form').classList.add('shake');
      ui.toast(errs.length === 1 ? 'Falta un dato: ' + errs[0][1].toLowerCase() : 'Revisa ' + errs.length + ' campos marcados en rojo', { icon: 'alert-circle' });
      return;
    }
    await commitActivity();
  });

  async function commitActivity() {
    if (editId) {
      const list = editChanges();
      if (!list.length) { SF.router.back(); ui.toast('No había cambios que guardar', { icon: 'info' }); return; }
      if (!(await ui.confirm({ title: '¿Guardar los cambios?', body: '«' + M.activity(editId).title + '» se actualiza en Hoy, Plan y Calendario.', list, ok: 'Guardar' }))) return;
    }
    // A8 · avisos antes de guardar
    if (D.isPast(f.date, f.time) && !editId) {
      const v = await ui.dialog({ icon: 'alert-triangle', tone: 'warning', title: 'Esa fecha ya pasó', body: D.longCap(f.date) + ' a las ' + f.time + ' es anterior a ahora. ¿Quieres cambiarla o guardarla igualmente?', actions: [{ label: 'Cambiar fecha', kind: 'secondary', value: 'change' }, { label: 'Guardar igual', kind: 'primary', value: 'save' }] });
      if (v !== 'save') { if (v === 'change') { if (mode !== 'texto' || parsed) { parsed = null; mode = 'texto'; syncSeg(); rerender(); } SF.act['reg-date'](); } return; }
    }
    const c = conflictsNow();
    if (c.length) {
      const v = await ui.dialog({ icon: 'calendar', tone: 'warning', title: 'Choca con otra actividad', html: 'Coincide con <b>' + u.esc(c[0].title) + '</b> de ' + T.fmt2(c[0].start) + ' a ' + T.fmt2(c[0].start + c[0].dur) + '. Puedes cambiar la hora o guardarlo igual.', actions: [{ label: 'Cambiar hora', kind: 'secondary', value: 'change' }, { label: 'Guardar igual', kind: 'primary', value: 'save' }] });
      if (v !== 'save') { if (v === 'change') { if (mode !== 'texto' || parsed) { parsed = null; mode = 'texto'; syncSeg(); rerender(); } SF.act['reg-time'](); } return; }
    }
    const wasOffline = offline();
    const L = ui.loading({ title: editId ? 'Guardando cambios…' : 'Guardando tu actividad…', steps: ['Guardando ' + (f.type === 'evento' ? 'evento' : 'actividad'), f.type === 'evento' ? 'Bloqueando ese horario' : 'Buscando hueco en tu semana', 'Actualizando Hoy y calendario'], duration: 950 });
    await L.done;
    const snap = SF.store.snapshot();
    const id = editId || u.uid('a');
    let changes = [];
    SF.store.commit((s) => {
      const data = { type: f.type, subjectId: f.subjectId, title: f.title.trim(), date: f.date, time: f.time, duration: f.duration, examLen: f.type === 'examen' ? f.examLen : undefined, weight: f.type === 'evento' ? 0 : f.weight };
      if (editId) { const a = s.activities.find((x) => x.id === editId); Object.assign(a, data); }
      else s.activities.push(Object.assign({ id, progress: 0, createdAt: Date.now(), pending: wasOffline || undefined }, data));
      s.session.draft = null;
      s.lastActivityId = s.lastActivityId || id;
      changes = M.recalc(editId ? 'edit' : 'new');
      if (s.plan.status === 'none') s.plan.status = 'confirmed';
    }, { noRender: true });
    L.close();
    const was = editId;
    parsed = null;
    if (was) {
      SF.router.back();
      ui.toast('Cambios guardados en Hoy, Plan y Calendario', { action: 'Deshacer', onAction: () => { SF.store.restore(snap); ui.toast('Cambios deshechos', { icon: 'undo' }); } });
      return;
    }
    successSheet(id, changes, snap, wasOffline);
    f = blank(); mode = 'texto';
    SF.router.refresh();
    const sc = document.querySelector('#reg'); if (sc) { sc.querySelector('#reg-area').innerHTML = areaHtml(); setFoot(); bindArea(sc); syncSeg(); }
  }

  /* A6 · Éxito */
  function successSheet(id, changes, snap, wasOffline) {
    const a = M.activity(id);
    const blocks = M.blocksFor(id);
    const fixed = M.isFixed(a);
    const unplaced = S().plan.unplaced.some((x) => x.actId === id);
    const body = '<div class="success-head">' + '<svg class="check-anim" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-15"/></svg>' +
      '<h2 class="t-h1 t-center">' + (fixed ? (a.type === 'examen' ? 'Examen añadido' : 'Evento añadido') : 'Actividad guardada') + '</h2>' +
      '<p class="t-2 t-center">' + u.esc(a.title) + ' · ' + u.esc(M.subjName(a.subjectId)) + '</p></div>' +
      (wasOffline ? '<div class="callout warning">' + I('wifi-off', 18) + '<span>Guardada en este dispositivo. Se sincroniza al recuperar la conexión.</span></div>' : '') +
      '<div class="card soft stack-sm">' +
      '<p class="hrow" style="gap:8px">' + I('calendar', 18, 't-primary') + '<span>' + C.fmtWhen(a) + '</span></p>' +
      (blocks.length ? '<p class="hrow" style="gap:8px;align-items:flex-start">' + I('sparkles', 18, 't-primary') + '<span>Programada en ' + u.plural(blocks.length, 'bloque', 'bloques') + ': ' + blocks.map((b) => M.whenText(b) + ' (' + T.dur(b.dur) + ')').join(', ') + '</span></p>' : '') +
      (unplaced ? '<p class="hrow wrn" style="gap:8px">' + I('alert-triangle', 18) + '<span>No cabe todo antes de la entrega. Revisa el plan.</span></p>' : '') +
      (changes.filter((c) => c.actId !== id).length ? '<p class="hrow t-sm t-2" style="gap:8px">' + I('refresh-cw', 16) + '<span>Reorganizamos otras ' + u.plural(changes.filter((c) => c.actId !== id).length, 'actividad', 'actividades') + ' para hacerle sitio.</span></p>' : '') +
      '</div>';
    ui.sheet({
      title: '', body,
      foot: '<button type="button" class="btn btn-primary btn-block" data-go="cal">' + I('calendar-days', 18) + 'Ver en el calendario</button><div class="row"><button type="button" class="btn btn-secondary" data-go="detail">Ver detalle</button><button type="button" class="btn btn-secondary" data-go="hoy">Volver a Hoy</button></div><button type="button" class="link-btn" data-go="undo" style="align-self:center">' + I('undo', 16) + 'Deshacer registro</button>',
      mount(el, ly) {
        el.classList.add('success-sheet');
        el.addEventListener('click', (e) => {
          const b = e.target.closest('[data-go]'); if (!b) return;
          ly.close();
          const g = b.dataset.go;
          if (g === 'cal') { SF.act['see-calendar']({ dataset: { date: blocks[0] ? blocks[0].date : a.date } }); }
          if (g === 'detail') SF.router.go('detalle', { id });
          if (g === 'hoy') SF.router.tab('hoy');
          if (g === 'undo') { SF.store.restore(snap); ui.toast('Registro deshecho', { icon: 'undo' }); }
        });
      }
    });
  }

  SF.act['reg-new-subj'] = () => {
    const list = u.clone(S().subjects);
    SF.subjectSheet(-1, list, (k, x) => { SF.saveSubject(k, x, list); f.subjectId = x.id; rerender(); });
  };

  /* ---------- A1 · Voz (simulada) ---------- */
  const SAY = new Proxy([], { get: (t, k) => { const l = SF.examplePhrases(); return typeof l[k] === 'function' ? l[k].bind(l) : l[k]; } });
  function voiceHtml() {
    const st = voice.state;
    if (S().demo.micDenied) return micDeniedHtml();
    return '<div class="voice-stage ' + st + '">' +
      '<p class="t-h2 t-center" id="v-title">' + (st === 'listening' ? 'Te escucho…' : st === 'processing' ? 'Entendiendo lo que dijiste…' : 'Toca para hablar') + '</p>' +
      '<p class="t-2 t-center" id="v-sub">' + (st === 'listening' ? 'Toca el micrófono cuando termines' : st === 'processing' ? 'Buscando fecha, hora y materia' : 'Di qué es, de qué materia y cuándo') + '</p>' +
      '<button type="button" class="mic-btn big' + (st === 'listening' ? ' live' : '') + '" data-act="reg-voice" aria-pressed="' + (st === 'listening') + '" aria-label="' + (st === 'listening' ? 'Terminar de hablar' : 'Empezar a hablar') + '"' + (st === 'processing' ? ' disabled' : '') + '>' + (st === 'processing' ? '<span class="spinner" aria-hidden="true"></span>' : I('mic', 36)) + '</button>' +
      '<div class="wave' + (st === 'listening' ? ' on' : '') + '" aria-hidden="true">' + '<i></i>'.repeat(18) + '</div>' +
      '<p class="transcript" id="v-text" aria-live="polite">' + u.esc(voice.text) + '</p>' +
      (st === 'idle' && S().lastActivityId && M.activity(S().lastActivityId) ? (() => { const la = M.activity(S().lastActivityId); return '<button type="button" class="card repeat-card" data-act="repeat" data-id="' + la.id + '">' + I('rotate-ccw', 18) + '<span class="grow stack-xs"><b>Repetir la última</b><span class="t-sm t-2 clamp-1">' + u.esc(M.subjName(la.subjectId)) + ' · ' + u.esc(la.title) + '</span></span>' + I('chevron-right', 18) + '</button>'; })() : '') +
      (st === 'idle' ? '<div class="stack-sm"><p class="section-label t-center">Prueba diciendo</p>' + SAY.slice(0, 3).map((s, i) => '<button type="button" class="chip say" data-act="reg-say" data-i="' + i + '">«' + u.esc(s) + '»</button>').join('') + '</div>' : '') +
      '</div>';
  }
  function micDeniedHtml() {
    return '<div class="empty">' + ui.illus('microfono', 'Micrófono bloqueado') + '<h2>No tenemos acceso al micrófono</h2><p>Para registrar por voz, activa el micrófono para StudyFlow en los Ajustes de tu teléfono. Mientras tanto, puedes escribirlo.</p>' +
      '<div class="stack-sm" style="width:100%"><button type="button" class="btn btn-primary btn-block" data-act="reg-mode" data-v="texto">' + I('keyboard', 18) + 'Escribirlo</button><button type="button" class="btn btn-secondary btn-block" data-act="reg-mic-retry">' + I('refresh-cw', 18) + 'Volver a intentar</button></div></div>';
  }
  SF.micDenied = () => ui.dialog({ icon: 'mic-off', tone: 'warning', title: 'Micrófono bloqueado', body: 'Abre los Ajustes de tu teléfono, entra en StudyFlow, activa el Micrófono y vuelve a la app para intentarlo otra vez.', actions: [{ label: 'Entendido', kind: 'primary', value: 1 }] });

  function stopVoice() { if (voice.timer) { clearInterval(voice.timer); voice.timer = null; } }
  function startListening(sample) {
    voice.state = 'listening'; voice.text = '';
    rerender();
    const words = sample.split(' ');
    let i = 0;
    voice.timer = setInterval(() => {
      i++;
      voice.text = words.slice(0, i).join(' ');
      const t = document.querySelector('#v-text'); if (t) t.textContent = voice.text;
      if (i >= words.length) { stopVoice(); setTimeout(() => { if (voice.state === 'listening') process(); }, 650); }
    }, 230);
  }
  async function process() {
    stopVoice();
    if (!voice.text.trim()) { voice.state = 'idle'; rerender(); ui.toast('No te escuchamos. Inténtalo otra vez, más cerca del micrófono.', { icon: 'mic-off' }); return; }
    voice.state = 'processing'; rerender();
    await u.sleep(900);
    if (mode !== 'voz') return;
    parsed = SF.parseActivity(voice.text);
    parsed.source = 'voz'; parsed.heard = voice.text;
    voice.state = 'idle';
    rerender();
  }
  /* Vuelve a comprobar el permiso: si ya está disponible, muestra la voz; si no, lo dice */
  SF.act['reg-mic-retry'] = () => {
    if (S().demo.micDenied) { ui.toast('El micrófono sigue bloqueado. Actívalo y vuelve a intentarlo.', { icon: 'mic-off' }); return; }
    rerender();
    ui.toast('Micrófono disponible', { icon: 'mic' });
  };
  SF.act['reg-voice'] = () => {
    if (S().demo.micDenied) { SF.micDenied(); rerender(); return; }
    if (voice.state === 'listening') { process(); return; }
    startListening(SAY[Math.floor(Math.random() * SAY.length)]);
  };
  SF.act['reg-say'] = (b) => startListening(SAY[Number(b.dataset.i)]);

  /* ---------- A2 · A mano ---------- */
  let hand = null;
  function handHtml() {
    return '<div class="stack-sm"><p class="t-2">Escribe la actividad con el dedo o el lápiz, como en tu agenda. Por ejemplo: <i>«Taller diseño miércoles»</i>.</p>' +
      '<div class="draw-wrap card flush lined"><canvas id="hand-canvas" class="draw-canvas tall" role="img" aria-label="Zona para escribir a mano"></canvas>' +
      '<div class="draw-tools"><span class="t-xs t-3 grow hand-hint">' + I('pen-line', 14) + ' Escribe aquí</span><button type="button" class="icon-btn sm" data-act="hand-undo" aria-label="Deshacer trazo">' + I('undo', 18) + '</button><button type="button" class="icon-btn sm" data-act="hand-clear" aria-label="Borrar todo">' + I('trash', 18) + '</button></div></div></div>';
  }
  function handPad(cv) {
    const ctx = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr; ctx.scale(dpr, dpr);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 3;
    const strokes = []; let cur = null;
    const ink = getComputedStyle(document.body).getPropertyValue('--text').trim();
    const draw = () => { ctx.clearRect(0, 0, w, h); ctx.strokeStyle = ink; strokes.forEach((s) => { ctx.beginPath(); s.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }); };
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); cur = [pos(e)]; strokes.push(cur); });
    cv.addEventListener('pointermove', (e) => { if (!cur) return; cur.push(pos(e)); draw(); });
    cv.addEventListener('pointerup', () => { cur = null; });
    hand = { strokes, draw };
  }
  SF.act['hand-undo'] = () => { if (hand) { hand.strokes.pop(); hand.draw(); } };
  SF.act['hand-clear'] = async () => { if (hand && hand.strokes.length && await ui.confirm({ danger: true, title: '¿Borrar lo que escribiste?', body: 'Se borran todos los trazos y no se puede deshacer.', ok: 'Borrar' })) { hand.strokes.length = 0; hand.draw(); } };
  SF.act['reg-recognize'] = async () => {
    if (!hand || !hand.strokes.length) { ui.toast('Escribe algo en el recuadro primero', { icon: 'pen-line' }); return; }
    if (offline()) { ui.dialog({ icon: 'wifi-off', tone: 'warning', title: 'Sin conexión', body: 'Reconocer la escritura necesita internet. Tu dibujo sigue aquí: inténtalo al volver la conexión o escríbelo con el teclado.', actions: [{ label: 'Entendido', kind: 'primary', value: 1 }] }); return; }
    const L = ui.loading({ title: 'Leyendo tu letra…', sub: 'Buscando fecha, hora y materia', duration: 900 });
    await L.done; L.close();
    const samples = ['Taller de diseño el miércoles a las 6 pm', 'Leer capítulo 5 de cálculo mañana', 'Laboratorio de computación el jueves'];
    parsed = SF.parseActivity(samples[Math.floor(Math.random() * samples.length)]);
    parsed.source = 'mano';
    rerender();
  };

  /* ---------- A4 · Revisión ---------- */
  function reviewHtml() {
    const p = parsed;
    const miss = [];
    if (!p.subjectId) miss.push('materia'); if (!p.date) miss.push('fecha');
    const row = (ic, label, val, missing) => '<li class="row"><span class="row-icon">' + I(ic, 18) + '</span><span class="row-main"><span class="row-sub">' + label + '</span><span class="row-title' + (missing ? ' t-danger' : '') + '">' + val + '</span></span></li>';
    const conf = M.conflicts(p.date, p.time, p.type === 'evento' ? p.duration : p.examLen);
    const fixed = p.type === 'evento' || p.type === 'examen';
    return '<div class="stack">' +
      (p.heard ? '<div class="card soft"><p class="t-xs t-2">Escuchamos</p><p class="t-bold">«' + u.esc(p.heard) + '»</p></div>' : '<div class="card soft"><p class="t-xs t-2">Leímos</p><p class="t-bold t-hand">' + u.esc(p.title) + '</p></div>') +
      '<h2 class="t-h3">Revisa antes de guardar</h2>' +
      '<ul class="list card flush">' +
      row(SF.TYPES[p.type].icon, 'Tipo', SF.TYPES[p.type].label) +
      row('book-open', 'Materia', p.subjectId ? u.esc(M.subjName(p.subjectId)) : 'Sin detectar · elígela', !p.subjectId) +
      row('type', 'Nombre', u.esc(p.title || 'Sin nombre')) +
      row('calendar', fixed ? 'Fecha' : 'Entrega', p.date ? D.longCap(p.date) + ' · ' + p.time : 'Sin detectar · elígela', !p.date) +
      row('clock', fixed ? 'Duración' : 'Tiempo estimado', T.dur(p.type === 'examen' ? p.examLen : p.duration)) +
      '</ul>' +
      (miss.length ? '<p class="wrn">' + I('alert-circle', 16) + '<span>Falta la ' + miss.join(' y la ') + '. Toca «Editar» para completarlo.</span></p>' : '') +
      (conf.length ? '<p class="wrn">' + I('alert-triangle', 16) + '<span>Coincide con <b>' + u.esc(conf[0].title) + '</b>.</span></p>' : '') +
      '<button type="button" class="link-btn" data-act="reg-retry">' + I('rotate-ccw', 16) + (p.source === 'voz' ? 'Volver a dictar' : 'Volver a escribir') + '</button></div>';
  }
  SF.act['reg-retry'] = () => { parsed = null; voice.text = ''; rerender(); };
  SF.act['reg-edit-parsed'] = () => { f = Object.assign(blank(), parsed); delete f.heard; delete f.source; parsed = null; mode = 'texto'; syncSeg(); rerender(); validate(document.querySelector('#reg')); };
  SF.act['reg-save-parsed'] = ui.once(async () => {
    const p = parsed;
    f = Object.assign(blank(), p);
    if (validate(null).length) { SF.act['reg-edit-parsed'](); ui.toast('Completa los datos que faltan', { icon: 'alert-circle' }); return; }
    await commitActivity();
  });

  /* Al volver la conexión, lo guardado sin ella pasa a sincronizado */
  function syncPending() {
    if (offline()) return;
    const n = S().activities.filter((a) => a.pending).length;
    if (!n) return;
    SF.store.commit((s) => { s.activities.forEach((a) => { delete a.pending; }); }, { silent: true });
    ui.toast(n === 1 ? 'Conexión recuperada. Tu actividad se sincronizó.' : 'Conexión recuperada. ' + n + ' actividades sincronizadas.', { icon: 'refresh-cw' });
  }
  SF.store.on(syncPending);
  window.addEventListener('online', syncPending);
  // Al reemplazar todo el estado, el registro vuelve a su punto de partida
  SF.store.on((st, meta) => { if (meta.replaced) { mode = 'texto'; parsed = null; } });
})(window.SF);
