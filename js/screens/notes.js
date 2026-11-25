/* =========================================================
   StudyFlow · Notas (D4 nueva nota, D5 detalle, lista)
   Teclado, voz (simulada) y lápiz (lienzo real).
   ========================================================= */
(function (SF) {
  const { D, T, u, ui, M, C } = SF;
  const I = SF.icon;
  const S = () => SF.store.state;
  const view = () => SF.planView;

  /* Si la materia del filtro ya no existe, vuelve a «Todas» */
  function fixFilter() {
    const v = view();
    if (v.noteFilter !== 'all' && !S().subjects.some((s) => s.id === v.noteFilter)) v.noteFilter = 'all';
  }
  function filtered() {
    fixFilter();
    const v = view();
    const q = u.norm(v.noteQuery);
    return S().notes
      .filter((n) => v.noteFilter === 'all' || n.subjectId === v.noteFilter)
      .filter((n) => !q || u.norm(n.title + ' ' + (n.body || '') + ' ' + M.subjName(n.subjectId)).includes(q))
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }
  function noteCard(n) {
    const a = n.activityId ? M.activity(n.activityId) : null;
    const kindIc = n.kind === 'draw' ? 'pen-line' : n.kind === 'voice' ? 'mic' : 'sticky-note';
    return '<button type="button" class="card tap note-card" data-act="note-open" data-id="' + n.id + '" style="' + M.subjVar(n.subjectId) + '">' +
      '<span class="hrow between">' + C.subjTag(n.subjectId) + '<span class="t-xs t-3 t-num">' + D.dayMonth(n.date) + ' · ' + n.time + '</span></span>' +
      '<span class="hrow" style="gap:8px">' + I(kindIc, 18, 't-primary') + '<b class="grow clamp-1 t-h3">' + u.esc(n.title) + '</b></span>' +
      (n.kind === 'draw' && n.drawing ? '<img class="note-thumb" src="' + n.drawing + '" alt="Dibujo de la nota">' : '<span class="t-sm t-2 clamp-2">' + u.esc(n.excerpt || n.body || '') + '</span>') +
      (a ? '<span class="t-xs t-2 hrow" style="gap:4px">' + I('link', 14) + u.esc(a.title) + '</span>' : '') + '</button>';
  }
  function listHtml() {
    const list = filtered();
    if (!list.length) {
      return S().notes.length
        ? '<div class="empty small"><h2>Sin resultados</h2><p>No hay notas que coincidan. Prueba con otra palabra o quita el filtro.</p><button type="button" class="btn btn-sm btn-secondary" data-act="notes-clear">Quitar filtros</button></div>'
        : C.empty('notas', 'Aún no tienes notas', 'Escribe, dicta o dibuja tus apuntes y vincúlalos a una actividad.', '<button type="button" class="btn btn-primary" data-act="note-new">' + I('plus', 18) + 'Crear nota</button>');
    }
    return list.map(noteCard).join('');
  }

  function trashLink() {
    const n = (S().notesTrash || []).length;
    return n ? '<button type="button" class="trash-link" data-act="notes-trash">' + I('rotate-ccw', 18) + '<span class="grow">Notas borradas</span><span class="badge-count">' + n + '</span>' + I('chevron-right', 18) + '</button>' : '';
  }
  SF.act['notes-trash'] = () => {
    const draw = () => (S().notesTrash || []).slice().reverse().map((n) => '<li class="row"><span class="row-main"><span class="row-title">' + u.esc(n.title || 'Sin título') + '</span><span class="row-sub">' + u.esc(M.subjName(n.subjectId)) + '</span></span><button type="button" class="btn btn-sm btn-soft" data-restore="' + n.id + '">Restablecer</button></li>').join('');
    const restore = (ids) => {
      SF.store.commit((s) => { const back = s.notesTrash.filter((x) => ids.includes(x.id)).map((x) => { const c = Object.assign({}, x); delete c.deletedAt; return c; }); s.notes = back.concat(s.notes); s.notesTrash = s.notesTrash.filter((x) => !ids.includes(x.id)); });
      ui.toast(ids.length === 1 ? 'Nota restablecida' : u.plural(ids.length, 'nota restablecida', 'notas restablecidas'), { icon: 'rotate-ccw' });
    };
    ui.sheet({
      title: 'Notas borradas', sub: 'Restablece las que necesites',
      body: '<ul class="list card flush" id="trash-l">' + draw() + '</ul>',
      foot: '<button type="button" class="btn btn-primary btn-block" data-all>' + I('rotate-ccw', 18) + 'Restablecer todas</button>',
      mount(el, ly) {
        el.addEventListener('click', (e) => {
          const r = e.target.closest('[data-restore]');
          if (r) { restore([r.dataset.restore]); if (!(S().notesTrash || []).length) ly.close(); else el.querySelector('#trash-l').innerHTML = draw(); return; }
          if (e.target.closest('[data-all]')) { restore((S().notesTrash || []).map((x) => x.id)); ly.close(); }
        });
      }
    });
  };

  SF.renderNotes = function (segTop) {
    fixFilter();
    const v = view();
    const subs = S().subjects;
    const none = !S().notes.length;
    return C.topbar('Notas', { sub: none ? 'Tus apuntes, vinculados a tus actividades' : u.plural(S().notes.length, 'nota', 'notas') + ' guardadas' }) +
      '<div class="screen-body">' + segTop() + (none ? '' :
      '<div class="input-wrap search"><span class="iw-ic">' + I('search', 18) + '</span><input class="input" type="search" id="note-q" placeholder="Buscar en tus notas" aria-label="Buscar en tus notas" value="' + u.esc(v.noteQuery) + '" autocomplete="off">' +
      '<button type="button" class="icon-btn sm" data-act="notes-q-clear" aria-label="Borrar búsqueda"' + (v.noteQuery ? '' : ' hidden') + '>' + I('x', 16) + '</button></div>' +
      '<div class="chips scroll" role="radiogroup" aria-label="Filtrar por materia">' +
      [{ id: 'all', name: 'Todas' }].concat(subs).map((s) => '<button type="button" class="chip sm" role="radio" aria-checked="' + (v.noteFilter === s.id) + '" data-act="notes-filter" data-v="' + s.id + '"' + (s.color ? ' style="' + M.subjVar(s.id) + '"' : '') + '>' + (s.color ? '<span class="subject-dot"></span>' : '') + u.esc(s.name) + '</button>').join('') + '</div>' +
      '') +
      '<div class="stack-sm" id="note-list" aria-live="polite">' + listHtml() + '</div>' + trashLink() + '</div>' +
      (none ? '' : '<button type="button" class="fab" data-act="note-new">' + I('plus', 22) + 'Nueva nota</button>');
  };
  SF.mountNotes = function (el) {
    const q = el.querySelector('#note-q');
    if (!q) return;
    let t;
    q.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        view().noteQuery = q.value;
        el.querySelector('#note-list').innerHTML = listHtml();
        el.querySelector('[data-act="notes-q-clear"]').hidden = !q.value;
      }, 120);
    });
  };
  SF.act['notes-filter'] = (el) => { view().noteFilter = el.dataset.v; SF.router.refresh(); };
  SF.act['notes-q-clear'] = () => { view().noteQuery = ''; SF.router.refresh(); const q = document.querySelector('#note-q'); if (q) q.focus(); };
  SF.act['notes-clear'] = () => { view().noteQuery = ''; view().noteFilter = 'all'; SF.router.refresh(); };
  SF.act['note-open'] = (el) => SF.router.go('nota', { id: el.dataset.id });
  SF.act['note-new'] = (el) => SF.router.go('nota-nueva', { activityId: el.dataset.activity || null, subjectId: el.dataset.subject || null }, { transition: 'up' });

  /* ---------- D5 · Detalle de nota ---------- */
  SF.screens.nota = {
    title: () => 'Nota',
    render(p) {
      const n = S().notes.find((x) => x.id === p.id);
      if (!n) return C.topbar('Nota', { back: true }) + '<div class="screen-body">' + C.empty('notas', 'Esta nota ya no existe', 'Puede que la hayas eliminado.', '<button class="btn btn-secondary" data-act="back">Volver</button>') + '</div>';
      const a = n.activityId ? M.activity(n.activityId) : null;
      return C.topbar('Nota', { back: true, right: '<button type="button" class="icon-btn" data-act="note-edit" data-id="' + n.id + '" aria-label="Editar nota">' + I('pencil', 20) + '</button>' }) +
        '<div class="screen-body stagger">' +
        '<div class="stack-sm"><div class="hrow wrap" style="gap:8px">' + C.subjTag(n.subjectId) + '<span class="pill">' + ({ text: 'Teclado', voice: 'Voz', draw: 'Lápiz' }[n.kind] || 'Teclado') + '</span></div>' +
        '<h2 class="t-h1">' + u.esc(n.title) + '</h2><p class="t-sm t-2">' + D.longCap(n.date) + ' · ' + n.time + '</p></div>' +
        (n.drawing ? '<img class="note-drawing card flush" src="' + n.drawing + '" alt="Dibujo: ' + u.esc(n.title) + '">' : '') +
        (n.body ? '<div class="card note-body">' + u.esc(n.body).replace(/\n/g, '<br>') + '</div>' : '') +
        (a ? '<button type="button" class="card tight tap hrow" data-act="detail" data-id="' + a.id + '"><span class="row-icon">' + I('link', 18) + '</span><span class="grow stack-xs"><span class="t-xs t-2">Vinculada a</span><b class="clamp-1">' + u.esc(a.title) + '</b></span>' + I('chevron-right', 18) + '</button>' : '') +
        '</div><footer class="screen-foot row"><button type="button" class="btn btn-danger-ghost" data-act="note-del" data-id="' + n.id + '">' + I('trash', 18) + 'Eliminar</button><button type="button" class="btn btn-primary" data-act="note-edit" data-id="' + n.id + '">' + I('pencil', 18) + 'Editar</button></footer>';
    }
  };
  SF.act['note-edit'] = (el) => SF.router.go('nota-nueva', { id: el.dataset.id }, { transition: 'up' });
  SF.act['note-del'] = async (el) => {
    const n = S().notes.find((x) => x.id === el.dataset.id); if (!n) return;
    const ok = await ui.dialog({ icon: 'trash', tone: 'danger', title: '¿Eliminar esta nota?', body: '«' + n.title + '» se moverá a «Notas borradas». Podrás restablecerla cuando quieras.', actions: [{ label: 'Cancelar', kind: 'secondary', value: false }, { label: 'Eliminar', kind: 'danger', value: true }] });
    if (!ok) return;
    const snap = SF.store.snapshot(['notes', 'notesTrash']);
    SF.store.commit((s) => { s.notes = s.notes.filter((x) => x.id !== n.id); s.notesTrash = (s.notesTrash || []).filter((x) => x.id !== n.id).concat([Object.assign({}, n, { deletedAt: Date.now() })]); }, { noRender: true });
    SF.router.back();
    ui.toast('Nota eliminada', { icon: 'trash', action: 'Deshacer', onAction: () => SF.store.restore(snap) });
  };

  /* ---------- D4 · Nueva nota / editar ---------- */
  let ed = null; // borrador en edición
  const VOICE_SAMPLES = [
    'Repasar la regla de la cadena y los ejercicios del taller. Preguntar al profesor por el ejercicio 7 antes del parcial.',
    'Para el proyecto: crear las tablas de estudiantes y entregas, y probar las consultas con datos de ejemplo.',
    'Ideas de bocetos: composición en tercios, paleta fría y una versión en blanco y negro.'
  ];
  SF.screens['nota-nueva'] = {
    title: () => 'Nueva nota',
    modal: true,
    static: true,
    render(p) {
      const st = S();
      const existing = p.id ? st.notes.find((x) => x.id === p.id) : null;
      ed = existing ? u.clone(existing) : { id: null, title: '', body: '', kind: 'text', subjectId: p.subjectId || (p.activityId && M.activity(p.activityId) ? M.activity(p.activityId).subjectId : (st.subjects[0] || {}).id), activityId: p.activityId || null, drawing: null };
      ed.mode = ed.kind === 'draw' ? 'draw' : ed.kind === 'voice' ? 'voice' : 'text';
      ed.dirty = false;
      const acts = st.activities.filter((a) => !a.done && a.subjectId === ed.subjectId);
      return C.topbar(existing ? 'Editar nota' : 'Nueva nota', { back: true, backAct: 'note-cancel' }) +
        '<div class="screen-body" id="note-form">' +
        '<div class="seg" role="radiogroup" aria-label="Cómo quieres escribir">' + [['text', 'keyboard', 'Teclado'], ['voice', 'mic', 'Voz'], ['draw', 'pen-line', 'Lápiz']].map(([k, ic, l]) => '<button type="button" role="radio" aria-checked="' + (ed.mode === k) + '" data-act="note-mode" data-v="' + k + '">' + I(ic, 16) + l + '</button>').join('') + '</div>' +
        '<div class="field" data-field="ntitle"><label for="ntitle">Título</label><input class="input" id="ntitle" maxlength="60" placeholder="Ej.: Fórmulas para el parcial" value="' + u.esc(ed.title) + '"></div>' +
        '<div class="field"><span class="label" id="nsub-l">Materia</span><div class="chips" role="radiogroup" aria-labelledby="nsub-l">' + st.subjects.map((s) => '<button type="button" class="chip sm" role="radio" aria-checked="' + (ed.subjectId === s.id) + '" data-act="note-subj" data-v="' + s.id + '" style="' + M.subjVar(s.id) + '"><span class="subject-dot"></span>' + u.esc(s.name) + '</button>').join('') + '</div></div>' +
        '<div id="note-mode-area">' + modeArea() + '</div>' +
        '<div class="field"><label for="nact">Vincular a una actividad <span class="t-3">(opcional)</span></label><select class="select" id="nact"><option value="">Sin vincular</option>' + acts.map((a) => '<option value="' + a.id + '"' + (a.id === ed.activityId ? ' selected' : '') + '>' + u.esc(a.title) + '</option>').join('') + '</select></div>' +
        '</div><footer class="screen-foot"><button type="button" class="btn btn-primary btn-block" data-act="note-save">' + I('check', 18) + 'Guardar nota</button></footer>';
    },
    mount(el) { bindForm(el); },
    update(el) { /* el borrador vive en la pantalla; no se repinta desde el estado */ },
    unmount() { stopVoice(); }
  };

  function modeArea() {
    if (ed.mode === 'voice') {
      return '<div class="voice-box card soft stack" id="vbox"><button type="button" class="mic-btn" data-act="note-voice" aria-label="Empezar a dictar" aria-pressed="false">' + I('mic', 30) + '</button>' +
        '<p class="t-center t-sm t-2" id="vstatus">Toca el micrófono y dicta tu nota.</p><div class="wave" aria-hidden="true">' + '<i></i>'.repeat(14) + '</div></div>' +
        '<div class="field"><label for="nbody">Transcripción · revísala antes de guardar</label><textarea class="textarea" id="nbody" rows="5" placeholder="Aquí aparecerá lo que digas">' + u.esc(ed.body) + '</textarea></div>';
    }
    if (ed.mode === 'draw') {
      return '<div class="draw-wrap card flush"><canvas id="ncanvas" class="draw-canvas" role="img" aria-label="Lienzo de dibujo. Dibuja con el dedo, el ratón o el lápiz."></canvas>' +
        '<div class="draw-tools" role="toolbar" aria-label="Herramientas de dibujo">' +
        '<button type="button" class="icon-btn sm" data-tool="pen" aria-pressed="true" aria-label="Lápiz">' + I('pen-line', 18) + '</button>' +
        '<button type="button" class="icon-btn sm" data-tool="eraser" aria-pressed="false" aria-label="Borrador">' + I('eraser', 18) + '</button>' +
        ['text', 'primary', 's-rose', 's-green'].map((c, i) => '<button type="button" class="swatch" data-color="' + c + '" aria-pressed="' + (i === 0) + '" aria-label="Color ' + ['tinta', 'azul', 'rosa', 'verde'][i] + '" style="--sw:var(--' + c + ')"></button>').join('') +
        '<span class="grow"></span><button type="button" class="icon-btn sm" data-tool="undo" aria-label="Deshacer trazo">' + I('undo', 18) + '</button><button type="button" class="icon-btn sm" data-tool="clear" aria-label="Borrar todo">' + I('trash', 18) + '</button></div></div>' +
        '<div class="field"><label for="nbody">Texto adicional <span class="t-3">(opcional)</span></label><textarea class="textarea" id="nbody" rows="2">' + u.esc(ed.body) + '</textarea></div>';
    }
    return '<div class="field" data-field="nbody"><label for="nbody">Contenido</label><textarea class="textarea" id="nbody" rows="8" placeholder="Escribe tus apuntes…">' + u.esc(ed.body) + '</textarea><p class="t-xs t-3 t-right" id="ncount">' + ed.body.length + ' caracteres</p></div>';
  }

  let canvasApi = null;
  function bindForm(el) {
    const title = el.querySelector('#ntitle');
    title.addEventListener('input', () => { ed.title = title.value; ed.dirty = true; SF.fieldError(el, 'ntitle', ''); });
    el.querySelector('#nact').addEventListener('change', (e) => { ed.activityId = e.target.value || null; ed.dirty = true; });
    bindArea(el);
  }
  function bindArea(el) {
    const body = el.querySelector('#nbody');
    if (body) body.addEventListener('input', () => { ed.body = body.value; ed.dirty = true; const c = el.querySelector('#ncount'); if (c) c.textContent = body.value.length + ' caracteres'; SF.fieldError(el, 'nbody', ''); });
    canvasApi = null;
    const cv = el.querySelector('#ncanvas');
    if (cv) canvasApi = drawPad(cv, el);
  }

  SF.act['note-mode'] = (b) => {
    if (canvasApi) { ed.drawing = canvasApi.data(); }
    stopVoice();
    ed.mode = b.dataset.v;
    const seg = b.closest('.seg');
    seg.querySelectorAll('[role=radio]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    ui.segs(seg.parentNode);
    const area = document.querySelector('#note-mode-area');
    area.innerHTML = modeArea();
    area.classList.remove('rise'); void area.offsetWidth; area.classList.add('rise');
    bindArea(document.querySelector('#note-form'));
  };
  SF.act['note-subj'] = (b) => {
    ed.subjectId = b.dataset.v; ed.dirty = true;
    b.parentNode.querySelectorAll('[role=radio]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    const sel = document.querySelector('#nact');
    const acts = S().activities.filter((a) => !a.done && a.subjectId === ed.subjectId);
    if (!acts.some((a) => a.id === ed.activityId)) ed.activityId = null;
    sel.innerHTML = '<option value="">Sin vincular</option>' + acts.map((a) => '<option value="' + a.id + '"' + (a.id === ed.activityId ? ' selected' : '') + '>' + u.esc(a.title) + '</option>').join('');
  };

  /* Voz simulada: el navegador del prototipo no da acceso al micrófono. */
  let vTimer = null;
  function stopVoice() { if (vTimer) { clearInterval(vTimer); vTimer = null; } const b = document.querySelector('.mic-btn'); if (b) { b.classList.remove('live'); b.setAttribute('aria-pressed', 'false'); } const w = document.querySelector('#vbox'); if (w) w.classList.remove('listening'); }
  SF.act['note-voice'] = (b) => {
    if (S().demo.micDenied) { SF.micDenied(); return; }
    if (vTimer) { stopVoice(); document.querySelector('#vstatus').textContent = 'Dictado en pausa. Toca para seguir.'; return; }
    const box = document.querySelector('#vbox'); const status = document.querySelector('#vstatus'); const body = document.querySelector('#nbody');
    b.classList.add('live'); b.setAttribute('aria-pressed', 'true'); box.classList.add('listening');
    status.textContent = 'Escuchando… toca para pausar';
    const text = VOICE_SAMPLES[Math.floor(Math.random() * VOICE_SAMPLES.length)];
    const words = text.split(' ');
    let i = 0;
    const base = body.value ? body.value.trim() + ' ' : '';
    vTimer = setInterval(() => {
      i++;
      body.value = base + words.slice(0, i).join(' ');
      ed.body = body.value; ed.dirty = true;
      if (i >= words.length) { stopVoice(); status.textContent = 'Listo. Revisa la transcripción y corrige lo que haga falta.'; ui.announce('Transcripción lista'); if (!ed.title) { const t = document.querySelector('#ntitle'); t.value = ed.title = words.slice(0, 4).join(' ').replace(/[.,:]$/, ''); } }
    }, 170);
  };

  function drawPad(cv, root) {
    const ctx = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr; ctx.scale(dpr, dpr);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const strokes = [];
    let tool = 'pen', color = 'text', cur = null;
    const cssColor = (c) => getComputedStyle(document.body).getPropertyValue('--' + c).trim() || '#172033';
    let base = null; // dibujo ya guardado: se pinta debajo de los trazos nuevos
    function redraw() {
      ctx.clearRect(0, 0, w, h);
      if (base) ctx.drawImage(base, 0, 0, w, h);
      strokes.forEach((s) => {
        ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over';
        ctx.strokeStyle = s.color; ctx.lineWidth = s.erase ? 18 : 3;
        ctx.beginPath(); s.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); if (s.pts.length === 1) ctx.lineTo(s.pts[0][0] + 0.1, s.pts[0][1]); ctx.stroke();
      });
      ctx.globalCompositeOperation = 'source-over';
    }
    if (ed.drawing) { const img = new Image(); img.onload = () => { base = img; redraw(); }; img.src = ed.drawing; }
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); cur = { erase: tool === 'eraser', color: cssColor(color), pts: [pos(e)] }; strokes.push(cur); redraw(); });
    cv.addEventListener('pointermove', (e) => { if (!cur) return; cur.pts.push(pos(e)); redraw(); });
    const end = () => { if (cur) { cur = null; ed.dirty = true; ed.hasInk = true; } };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    root.querySelector('.draw-tools').addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.tool === 'pen' || b.dataset.tool === 'eraser') { tool = b.dataset.tool; root.querySelectorAll('[data-tool=pen],[data-tool=eraser]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }
      if (b.dataset.tool === 'undo') { if (!strokes.length) return; strokes.pop(); ed.dirty = true; redraw(); }
      if (b.dataset.tool === 'clear') { if (!strokes.length && !ed.drawing) return; if (!(await ui.confirm({ danger: true, title: '¿Borrar todo el dibujo?', body: 'Se borran todos los trazos y no se puede deshacer.', ok: 'Borrar' }))) return; ed.dirty = true; strokes.length = 0; ed.drawing = null; base = null; redraw(); ui.toast('Lienzo vacío', { icon: 'eraser' }); }
      if (b.dataset.color) { color = b.dataset.color; tool = 'pen'; root.querySelectorAll('.swatch').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); root.querySelectorAll('[data-tool=pen],[data-tool=eraser]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.tool === 'pen'))); }
    });
    return { data: () => (strokes.length || ed.drawing) ? cv.toDataURL('image/png') : null, empty: () => !strokes.length && !ed.drawing };
  }

  SF.act['note-save'] = ui.once(async () => {
    const form = document.querySelector('#note-form');
    if (canvasApi) ed.drawing = canvasApi.data();
    stopVoice();
    ed.title = ed.title.trim(); ed.body = (ed.body || '').trim();
    let bad = false;
    if (!ed.title) {
      if (ed.body) ed.title = ed.body.split(/\s+/).slice(0, 5).join(' ');
      else { SF.fieldError(form, 'ntitle', 'Ponle un título a la nota.'); bad = true; }
    }
    if (ed.mode === 'text' && !ed.body) { SF.fieldError(form, 'nbody', 'Escribe algo en la nota.'); bad = true; }
    if (ed.mode === 'voice' && !ed.body) { ui.toast('Dicta algo o cambia a Teclado', { icon: 'mic' }); bad = true; }
    if (ed.mode === 'draw' && !ed.drawing && !ed.body) { ui.toast('Dibuja algo en el lienzo antes de guardar', { icon: 'pen-line' }); bad = true; }
    if (bad) { const f = form.querySelector('.invalid input, .invalid textarea'); if (f) f.focus(); return; }
    const isNew = !ed.id;
    if (!isNew) {
      if (!ed.dirty) { SF.router.back(); ui.toast('No había cambios que guardar', { icon: 'info' }); return; }
      const old = S().notes.find((x) => x.id === ed.id) || {};
      const act = (id) => (M.activity(id) || { title: 'sin vincular' }).title;
      const list = [];
      if (old.title !== ed.title) list.push('Título: ' + old.title + ' → ' + ed.title);
      if ((old.body || '') !== ed.body) list.push('Contenido editado');
      if (old.subjectId !== ed.subjectId) list.push('Materia: ' + M.subjName(old.subjectId) + ' → ' + M.subjName(ed.subjectId));
      if ((old.activityId || null) !== (ed.activityId || null)) list.push('Actividad: ' + act(old.activityId) + ' → ' + act(ed.activityId));
      if ((old.drawing || null) !== (ed.drawing || null)) list.push(ed.drawing ? 'Dibujo editado' : 'Dibujo borrado');
      if (!(await ui.confirm({ title: '¿Guardar los cambios de esta nota?', body: 'La versión anterior se reemplaza.', list, ok: 'Guardar' }))) return;
    }
    const btn = document.querySelector('[data-act="note-save"]'); btn.classList.add('is-loading');
    await u.sleep(350);
    const n = { id: ed.id || u.uid('n'), title: ed.title, body: ed.body, excerpt: ed.body.slice(0, 80), kind: ed.mode === 'draw' ? 'draw' : ed.mode === 'voice' ? 'voice' : 'text', subjectId: ed.subjectId, activityId: ed.activityId, drawing: ed.drawing || null, date: D.TODAY, time: T.fmt2(D.NOW_MIN) };
    SF.store.commit((s) => { if (isNew) s.notes.unshift(n); else s.notes = s.notes.map((x) => x.id === n.id ? Object.assign(x, n, { date: x.date, time: x.time }) : x); }, { noRender: true });
    ed.dirty = false;
    SF.router.back();
    ui.toast(isNew ? 'Nota guardada' : 'Cambios guardados', { icon: 'circle-check', action: 'Ver', onAction: () => SF.router.go('nota', { id: n.id }) });
  });
  SF.act['note-cancel'] = async () => {
    if (ed && ed.dirty) {
      const v = await ui.dialog({ icon: 'alert-triangle', tone: 'warning', title: '¿Descartar la nota?', body: 'Tienes cambios sin guardar. Si sales ahora, se perderán.', actions: [{ label: 'Seguir editando', kind: 'secondary', value: false }, { label: 'Descartar', kind: 'danger', value: true }] });
      if (!v) return;
    }
    stopVoice(); ed = null; SF.router.back();
  };
  SF.screens['nota-nueva'].guard = () => SF.act['note-cancel']();
})(window.SF);
