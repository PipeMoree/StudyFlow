/* =========================================================
   StudyFlow · Ajustes (perfil, apariencia, criterio,
   intensidad de avisos, ayuda)
   ========================================================= */
(function (SF) {
  const { D, T, u, ui, M, C } = SF;
  const I = SF.icon;
  const S = () => SF.store.state;
  const THEMES = { light: 'Claro', dark: 'Oscuro', system: 'Sistema' };

  const appearanceSummary = (st) => THEMES[st.settings.theme] + ' · ' + (st.settings.text === 'large' ? 'texto grande' : 'texto normal') + (st.settings.contrast ? ' · alto contraste' : '') + (st.settings.density === 'compact' ? ' · compacto' : '');
  const row = (act, ic, title, sub, extra) => '<li><button type="button" class="row" data-act="' + act + '"' + (extra || '') + '><span class="row-icon">' + I(ic, 20) + '</span><span class="row-main"><span class="row-title">' + title + '</span>' + (sub ? '<span class="row-sub">' + sub + '</span>' : '') + '</span>' + I('chevron-right', 18, 't-3') + '</button></li>';

  SF.screens.ajustes = {
    title: () => 'Ajustes',
    render() {
      const st = S();
      return C.topbar('Ajustes', { back: true }) +
        '<div class="screen-body stagger">' +
        '<button type="button" class="card tap hrow profile-card" data-act="go" data-to="perfil"><span class="avatar lg">' + u.esc(u.initials(st.profile.name)) + '</span><span class="grow stack-xs"><b class="t-h3 clamp-1">' + u.esc(st.profile.name || 'Tu perfil') + '</b><span class="t-sm t-2 clamp-1">' + u.esc(st.profile.email || 'Añade tu correo') + '</span>' + (st.profile.career ? '<span class="t-xs t-3 clamp-1">' + u.esc(st.profile.career) + '</span>' : '') + '</span>' + I('chevron-right', 18, 't-3') + '</button>' +
        '<section class="stack-sm"><h2 class="section-label">Preferencias</h2><ul class="list card flush">' +
        row('go', 'book-open', 'Mis materias', u.plural(st.subjects.length, 'materia', 'materias'), ' data-to="materias"') +
        row('go', 'sun', 'Apariencia', appearanceSummary(st), ' data-to="apariencia"') +
        row('go', 'list-filter', 'Criterio de priorización', SF.CRITERIA[st.settings.criteria[0]].label + ' primero', ' data-to="criterio"') +
        row('go', 'bell', 'Intensidad de avisos', SF.INTENSITY[st.settings.intensity].label, ' data-to="intensidad"') +
        row('plan-style', 'sliders', 'Estilo de reparto', SF.STYLES[st.settings.style].label) +
        '</ul></section>' +
        '<section class="stack-sm"><h2 class="section-label">Ayuda</h2><ul class="list card flush">' +
        row('go', 'help-circle', 'Centro de ayuda', 'Preguntas frecuentes y tutorial', ' data-to="ayuda"') +
        row('tour-again', 'compass', 'Ver el tutorial otra vez', 'Recorrido de 6 pasos') +
        '</ul></section>' +
        '<section class="stack-sm"><h2 class="section-label">Cuenta</h2><ul class="list card flush">' +
        '<li><button type="button" class="row" data-act="reset-plan"><span class="row-icon">' + I('rotate-ccw', 20) + '</span><span class="row-main"><span class="row-title">Restablecer preferencias</span><span class="row-sub">Vuelve a los valores recomendados</span></span></button></li>' +
        '<li><button type="button" class="row danger" data-act="logout"><span class="row-icon">' + I('log-out', 20) + '</span><span class="row-main"><span class="row-title">Cerrar sesión</span></span></button></li>' +
        '</ul></section><p class="t-xs t-3 t-center">StudyFlow · versión 1.0</p></div>';
    }
  };
  SF.act['tour-again'] = () => { SF.router.go('hoy', {}, { reset: true, transition: 'fade' }); setTimeout(() => SF.tour.start('ajustes'), 350); };
  SF.act['reset-plan'] = async () => {
    const ok = await ui.dialog({ icon: 'rotate-ccw', title: '¿Restablecer preferencias?', body: 'Apariencia, criterio, intensidad de avisos y estilo de reparto vuelven a sus valores recomendados. Tus actividades y notas no cambian.', actions: [{ label: 'Cancelar', kind: 'secondary', value: false }, { label: 'Restablecer', kind: 'primary', value: true }] });
    if (!ok) return;
    const prev = u.clone(S().settings);
    SF.store.commit((s) => { s.settings = Object.assign(SF.store.defaults().settings, { seed: s.settings.seed }); M.recalc('silent'); });
    SF.app.applySettings();
    ui.toast('Preferencias restablecidas', { action: 'Deshacer', onAction: () => { SF.store.commit((s) => { s.settings = prev; M.recalc('silent'); }); SF.app.applySettings(); } });
  };
  SF.act.logout = async () => {
    const ok = await ui.dialog({ icon: 'log-out', tone: 'danger', title: '¿Cerrar sesión?', body: 'Se borrarán de este dispositivo tu perfil, tus actividades, tus notas, tu racha y tus preferencias.', actions: [{ label: 'Cancelar', kind: 'secondary', value: false }, { label: 'Cerrar sesión', kind: 'danger', value: true }] });
    if (!ok) return;
    const L = ui.loading({ title: 'Cerrando sesión…', duration: 600 });
    await L.done;
    SF.store.wipe();
    SF.app.applySettings();
    L.close();
    SF.router.go('pregunta', {}, { reset: true, transition: 'fade' });
  };

  /* ---------- Perfil ---------- */
  SF.screens.perfil = {
    title: () => 'Perfil',
    static: true,
    render() {
      const p = S().profile;
      const fld = (id, label, val, type, ph, hint) => '<div class="field" data-field="' + id + '"><label for="pf-' + id + '">' + label + '</label><input class="input" id="pf-' + id + '" type="' + type + '" value="' + u.esc(val) + '" placeholder="' + ph + '" autocomplete="' + ({ name: 'name', email: 'email', career: 'organization-title' }[id]) + '">' + (hint ? '<p class="t-xs t-3">' + hint + '</p>' : '') + '</div>';
      return C.topbar('Perfil', { back: true, backAct: 'pf-back' }) +
        '<div class="screen-body"><div class="t-center stack-sm"><span class="avatar xl" id="pf-av" aria-hidden="true">' + u.esc(u.initials(p.name)) + '</span><p class="t-sm t-2">Tus iniciales se actualizan al escribir</p></div>' +
        '<form class="stack" id="pf-form" novalidate>' + fld('name', 'Nombre completo', p.name, 'text', 'Ej.: Ana Martínez') + fld('email', 'Correo', p.email, 'email', 'tu@correo.com', 'Lo usamos para recuperar tu cuenta.') + '<div class="field" data-field="career"><label for="pf-career-sel">Carrera</label><div class="select-wrap"><select class="input" id="pf-career-sel">' + SF.CAREERS.map((c) => '<option' + (c.name === p.career ? ' selected' : '') + '>' + u.esc(c.name) + '</option>').join('') + '<option value="__otra"' + (!SF.CAREERS.some((c) => c.name === p.career) ? ' selected' : '') + '>Otra (escribirla)</option></select>' + I('chevron-down', 18) + '</div></div>' +
          '<div class="field" id="pf-career-other"' + (SF.CAREERS.some((c) => c.name === p.career) ? ' hidden' : '') + '><label for="pf-career">¿Cuál es tu carrera?</label><input class="input" id="pf-career" type="text" maxlength="60" value="' + u.esc(p.career) + '" placeholder="Ej.: Biología marina" autocomplete="off"></div>' + '</form></div>' +
        '<footer class="screen-foot"><button type="button" class="btn btn-primary btn-block" data-act="pf-save" disabled>Guardar cambios</button></footer>';
    },
    mount(el) {
      const p = S().profile;
      const btn = el.querySelector('[data-act="pf-save"]');
      const vals = () => ({ name: el.querySelector('#pf-name').value.trim(), email: el.querySelector('#pf-email').value.trim(), career: (el.querySelector('#pf-career-sel').value === '__otra' ? el.querySelector('#pf-career').value : el.querySelector('#pf-career-sel').value).trim() });
      const csel = el.querySelector('#pf-career-sel');
      csel.addEventListener('change', () => {
        const other = el.querySelector('#pf-career-other'); other.hidden = csel.value !== '__otra';
        if (!other.hidden) { const ci = el.querySelector('#pf-career'); if (SF.CAREERS.some((c) => c.name === ci.value)) ci.value = ''; ci.focus(); }
        el.querySelector('#pf-form').dispatchEvent(new Event('input', { bubbles: true }));
      });
      el.querySelector('#pf-form').addEventListener('input', (e) => {
        const v = vals();
        el.querySelector('#pf-av').textContent = u.initials(v.name);
        btn.disabled = v.name === p.name && v.email === p.email && v.career === p.career;
        const k = e.target.id.replace('pf-', ''); SF.fieldError(el, k, '');
      });
      el.querySelector('#pf-email').addEventListener('blur', (e) => { if (e.target.value && !u.isEmail(e.target.value)) SF.fieldError(el, 'email', 'Revisa el correo: falta la @ o el dominio (ej.: ana@uni.edu).'); });
      el.querySelector('#pf-form').addEventListener('submit', (e) => { e.preventDefault(); if (!btn.disabled) SF.act['pf-save'](); });
      el._vals = vals;
    },
    update() {}
  };
  SF.act['pf-save'] = ui.once(async (b) => {
    const el = document.querySelector('.screen:last-child');
    const v = el._vals();
    let bad = false;
    if (v.name.length < 2) { SF.fieldError(el, 'name', 'Escribe tu nombre.'); bad = true; }
    if (!u.isEmail(v.email)) { SF.fieldError(el, 'email', 'Revisa el correo: falta la @ o el dominio (ej.: ana@uni.edu).'); bad = true; }
    if (bad) { el.querySelector('.invalid input').focus(); return; }
    b = b || el.querySelector('[data-act="pf-save"]');
    const p = S().profile;
    const list = [['name', 'Nombre'], ['email', 'Correo'], ['career', 'Carrera']].filter(([k]) => (p[k] || '') !== v[k]).map(([k, l]) => l + ': ' + (p[k] || 'sin dato') + ' → ' + (v[k] || 'sin dato'));
    if (!(await ui.confirm({ icon: 'user-round', title: '¿Guardar los cambios de tu perfil?', body: 'Revisa que estén bien.', list, ok: 'Guardar' }))) return;
    b.classList.add('is-loading');
    await u.sleep(500);
    SF.store.commit((s) => { Object.assign(s.profile, v); }, { noRender: true });
    SF.router.back();
    ui.toast('Perfil actualizado');
  });
  SF.act['pf-back'] = async () => {
    const btn = document.querySelector('[data-act="pf-save"]');
    if (btn && !btn.disabled) {
      const v = await ui.dialog({ icon: 'alert-triangle', tone: 'warning', title: '¿Salir sin guardar?', body: 'Tienes cambios en tu perfil que se perderán.', actions: [{ label: 'Seguir editando', kind: 'secondary', value: false }, { label: 'Salir', kind: 'danger', value: true }] });
      if (!v) return;
    }
    SF.router.back();
  };
  SF.screens.perfil.guard = () => SF.act['pf-back']();

  /* ---------- Apariencia ---------- */
  SF.screens.apariencia = {
    title: () => 'Apariencia',
    render() {
      const s = S().settings;
      const seg = (key, opts, label) => '<div class="seg" role="radiogroup" aria-label="' + label + '">' + opts.map(([v, l, ic]) => '<button type="button" role="radio" aria-checked="' + (String(s[key]) === String(v)) + '" data-act="set" data-k="' + key + '" data-v="' + v + '">' + (ic ? I(ic, 16) : '') + l + '</button>').join('') + '</div>';
      return C.topbar('Apariencia', { back: true, sub: 'Los cambios se aplican al momento' }) +
        '<div class="screen-body stagger">' +
        '<section class="stack-sm"><h2 class="section-label">Tema</h2>' + seg('theme', [['light', 'Claro', 'sun'], ['dark', 'Oscuro', 'moon'], ['system', 'Sistema', 'settings']], 'Tema') +
        '<p class="t-xs t-3">«Sistema» sigue la configuración de tu dispositivo' + (s.theme === 'system' ? ' (ahora: ' + (matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro') + ')' : '') + '.</p></section>' +
        '<section class="stack-sm"><h2 class="section-label">Tamaño del texto</h2>' + seg('text', [['normal', 'Normal'], ['large', 'Grande']], 'Tamaño del texto') +
        '<div class="cmp" role="group" aria-label="Comparación de tamaños">' + ['normal', 'large'].map((v) => '<button type="button" class="cmp-card size-' + v + '" data-act="set" data-k="text" data-v="' + v + '" aria-pressed="' + (s.text === v) + '"><span class="cmp-tag">' + (v === 'normal' ? 'Normal' : 'Grande') + (s.text === v ? ' · actual' : '') + '</span><b>Resolver ejercicios 12-20</b><span>Cálculo II · vence hoy 20:00</span><i>Empezar</i></button>').join('') + '</div></section>' +
        '<section class="stack-sm"><h2 class="section-label">Accesibilidad</h2><ul class="list card flush">' +
        '<li class="row"><span class="row-icon">' + I('contrast', 20) + '</span><label class="row-main" for="sw-contrast"><span class="row-title">Alto contraste</span><span class="row-sub">Texto y bordes con contraste 7:1 (WCAG AAA)</span></label><input type="checkbox" role="switch" class="switch" id="sw-contrast" data-act="set-switch" data-k="contrast"' + (s.contrast ? ' checked' : '') + '></li>' +
        '<li class="row"><span class="row-icon">' + I('rows', 20) + '</span><label class="row-main" for="sw-density"><span class="row-title">Vista compacta</span><span class="row-sub">Muestra más elementos en pantalla</span></label><input type="checkbox" role="switch" class="switch" id="sw-density" data-act="set-switch" data-k="density"' + (s.density === 'compact' ? ' checked' : '') + '></li>' +
        '</ul></section>' +
        '<div class="cmp" role="group" aria-label="Comparación de contraste">' + [[false, 'Normal · AA 4.5:1'], [true, 'Alto contraste · AAA 7:1']].map(([v, l]) => '<button type="button" class="cmp-card ct-' + (v ? 'high' : 'normal') + '" data-act="set-contrast" data-v="' + v + '" aria-pressed="' + (!!s.contrast === v) + '"><span class="cmp-tag">' + l + (!!s.contrast === v ? ' · actual' : '') + '</span><b>Parcial de cálculo</b><span>Viernes 9 oct · 10:00</span><i>Ver detalle</i></button>').join('') + '</div>' +
        '</div>';
    }
  };
  SF.act['set-contrast'] = (b) => {
    SF.store.commit((s) => { s.settings.contrast = b.dataset.v === 'true'; }, { silent: true });
    SF.app.applySettings(); SF.router.refresh();
    ui.announce(b.dataset.v === 'true' ? 'Alto contraste activado' : 'Alto contraste desactivado');
  };
  SF.act.set = (b) => {
    const k = b.dataset.k, v = b.dataset.v;
    SF.store.commit((s) => { s.settings[k] = v; }, { silent: true });
    SF.app.applySettings();
    SF.router.refresh();
    ui.announce('Aplicado: ' + b.textContent.trim());
  };
  SF.act['set-switch'] = (b) => {
    const k = b.dataset.k;
    SF.store.commit((s) => { if (k === 'density') s.settings.density = b.checked ? 'compact' : 'comfortable'; else s.settings[k] = b.checked; }, { silent: true });
    SF.app.applySettings();
    SF.router.refresh();
    ui.toast((k === 'contrast' ? 'Alto contraste ' : 'Vista compacta ') + (b.checked ? 'activado' : 'desactivado'), { icon: k === 'contrast' ? 'contrast' : 'rows' });
  };

  /* ---------- Mis materias (añadir, editar, quitar) ---------- */
  SF.saveSubject = (kind, subj, list) => {
    const snap = SF.store.snapshot(['subjects', 'activities', 'plan', 'notifications', 'lastActivityId', 'todayOrder', 'timer']);
    const ids = kind === 'del' ? S().activities.filter((a) => a.subjectId === subj.id).map((a) => a.id) : [];
    const gone = ids.length;
    SF.store.commit((st) => {
      st.subjects = list;
      if (kind === 'del') {
        st.activities = st.activities.filter((a) => a.subjectId !== subj.id);
        st.notifications = st.notifications.filter((n) => !ids.includes(n.actId));
        if (st.timer && ids.includes(st.timer.actId)) st.timer = null;
        if (ids.includes(st.lastActivityId)) st.lastActivityId = null;
      }
      M.recalc('silent');
    });
    ui.toast(kind === 'del' ? subj.name + ' quitada' + (gone ? ' con ' + u.plural(gone, 'actividad', 'actividades') : '') : kind === 'edit' ? 'Materia actualizada · plan recalculado' : subj.name + ' agregada · plan recalculado', { icon: kind === 'del' ? 'trash' : 'check', action: 'Deshacer', onAction: () => { SF.store.restore(snap); ui.toast('Cambio deshecho', { icon: 'undo' }); } });
  };
  SF.act['subj-add'] = () => { const list = u.clone(S().subjects); SF.subjectSheet(-1, list, (k, x) => SF.saveSubject(k, x, list)); };
  SF.act['subj-edit'] = (el) => {
    const list = u.clone(S().subjects); const i = Number(el.dataset.i);
    SF.subjectSheet(i, list, (k, x) => SF.saveSubject(k, x, list), (k, x, old) => {
      if (k === 'del') {
        const n = S().activities.filter((a) => a.subjectId === x.id).length;
        return ui.confirm({ danger: true, title: '¿Quitar ' + x.name + '?', body: (n ? 'También se quitarán ' + u.plural(n, 'actividad', 'actividades') + ' de esta materia' : 'Se quita con su horario de clases') + ' y volveremos a repartir tu semana. Tus notas se conservan. Podrás deshacerlo justo después.', ok: 'Quitar materia' });
      }
      const cls = (c) => c.length ? c.map((q) => D.DOW_CAP[q.day % 7] + ' ' + q.start + ' (' + T.dur(q.dur || 120) + ')').join(', ') : 'sin clases';
      const list2 = [];
      if (old.name !== x.name) list2.push('Nombre: ' + old.name + ' → ' + x.name);
      if (old.credits !== x.credits) list2.push('Créditos: ' + old.credits + ' → ' + x.credits);
      if (JSON.stringify(old.classes) !== JSON.stringify(x.classes)) list2.push('Horario: ' + cls(old.classes) + ' → ' + cls(x.classes));
      return ui.confirm({ icon: 'book-open', title: '¿Guardar los cambios de ' + old.name + '?', body: 'Volveremos a repartir tu semana con estos datos.', list: list2, ok: 'Guardar' });
    });
  };
  SF.screens.materias = {
    title: () => 'Mis materias',
    render() {
      const st = S();
      return C.topbar('Mis materias', { back: true, sub: 'Tus clases bloquean esas horas en el plan' }) +
        '<div class="screen-body stagger">' +
        '<ul class="list card flush">' + st.subjects.map((x, i) => {
          const n = st.activities.filter((a) => a.subjectId === x.id && !a.done).length;
          return '<li><button type="button" class="row" data-act="subj-edit" data-i="' + i + '" style="' + M.subjVar(x.id) + '"><span class="row-icon subj-dot">' + I('book-open', 20) + '</span><span class="row-main"><span class="row-title">' + u.esc(x.name) + '</span><span class="row-sub">' + x.credits + ' créditos · ' + u.plural(x.classes.length, 'clase', 'clases') + ' a la semana · ' + u.plural(n, 'pendiente', 'pendientes') + '</span></span>' + I('chevron-right', 18, 't-3') + '</button></li>';
        }).join('') + '</ul>' +
        '<p class="t-sm t-2">Puedes tener todas las materias que necesites. Al añadir o cambiar una, StudyFlow vuelve a repartir tu semana.</p>' +
        '</div>' +
        '<footer class="screen-foot"><button type="button" class="btn btn-primary btn-block" data-act="subj-add">' + I('plus', 18) + 'Agregar materia</button></footer>';
    }
  };

  /* ---------- Criterio (se ordena y después se guarda con confirmación) ---------- */
  let crit = [];
  const critDirty = () => crit.join() !== S().settings.criteria.join();
  function critBody() {
    const first = M.rank(M.todayCandidates(), crit)[0];
    return '<ol class="reorder" id="crit-list">' + crit.map((k, i) => '<li class="card tight reorder-item" data-id="' + k + '"><span class="drag-handle" aria-hidden="true">' + I('grip-vertical', 20) + '</span><span class="order-num t-num">' + (i + 1) + '</span><span class="grow stack-xs"><b>' + SF.CRITERIA[k].label + '</b><span class="t-sm t-2">' + SF.CRITERIA[k].desc + '</span></span>' +
      '<span class="stack-xs"><button type="button" class="icon-btn" data-act="crit-mv" data-i="' + i + '" data-d="-1" aria-label="Subir ' + SF.CRITERIA[k].label + '"' + (i === 0 ? ' disabled' : '') + '>' + I('chevron-up', 18) + '</button><button type="button" class="icon-btn" data-act="crit-mv" data-i="' + i + '" data-d="1" aria-label="Bajar ' + SF.CRITERIA[k].label + '"' + (i === crit.length - 1 ? ' disabled' : '') + '>' + I('chevron-down', 18) + '</button></span></li>').join('') + '</ol>' +
      '<div class="callout soft">' + I('info', 18) + '<span>Con este orden, hoy empezarías por <b>' + u.esc((first || { title: 'lo que registres' }).title) + '</b>.</span></div>';
  }
  function critDraw() {
    const body = document.querySelector('#crit-body'); if (!body) return;
    body.innerHTML = critBody();
    document.querySelector('[data-act="crit-save"]').disabled = !critDirty();
    SF.dragSort(body.querySelector('#crit-list'), '.reorder-item', (ids) => { crit = ids; critDraw(); });
  }
  SF.screens.criterio = {
    title: () => 'Criterio de priorización',
    static: true,
    render() {
      crit = S().settings.criteria.slice();
      return C.topbar('Criterio', { back: true, sub: 'Arrastra o usa las flechas. El primero es el que más cuenta.' }) +
        '<div class="screen-body" id="crit-body"></div>' +
        '<footer class="screen-foot"><button type="button" class="btn btn-primary btn-block" data-act="crit-save" disabled>Guardar criterio</button></footer>';
    },
    mount() { critDraw(); },
    update() {},
    canLeave() { return critDirty() ? ui.confirm({ icon: 'alert-triangle', tone: 'warning', title: '¿Salir sin guardar?', body: 'El nuevo orden de criterios se perderá.', cancel: 'Seguir editando', ok: 'Salir' }) : true; }
  };
  SF.act['crit-mv'] = (b) => {
    const i = Number(b.dataset.i), j = i + Number(b.dataset.d);
    if (j < 0 || j >= crit.length) return;
    [crit[i], crit[j]] = [crit[j], crit[i]];
    critDraw();
    const n = document.querySelector('[data-act="crit-mv"][data-i="' + j + '"][data-d="' + b.dataset.d + '"]:not([disabled])') || document.querySelector('[data-act="crit-mv"][data-i="' + j + '"]:not([disabled])');
    if (n) n.focus();
    ui.announce(SF.CRITERIA[crit[j]].label + ' ahora en la posición ' + (j + 1));
  };
  SF.act['crit-save'] = async () => {
    if (!critDirty()) return;
    if (!(await ui.confirm({ icon: 'list-filter', title: '¿Cambiar el criterio de priorización?', body: 'Volveremos a ordenar tus actividades y a repartir tu semana así:', list: crit.map((k, i) => (i + 1) + '. ' + SF.CRITERIA[k].label), ok: 'Cambiar' }))) return;
    const snap = SF.store.snapshot(['settings', 'plan', 'todayOrder', 'notifications']);
    SF.store.commit((s) => { s.settings.criteria = crit.slice(); s.todayOrder = null; M.recalc('silent'); }, { noRender: true });
    SF.router.back();
    ui.toast(SF.CRITERIA[crit[0]].label + ' primero · plan actualizado', { action: 'Deshacer', onAction: () => { SF.store.restore(snap); ui.toast('Criterio anterior restaurado', { icon: 'undo' }); } });
  };

  /* ---------- Intensidad ---------- */
  SF.screens.intensidad = {
    title: () => 'Intensidad de avisos',
    render() {
      const cur = S().settings.intensity;
      return C.topbar('Intensidad de avisos', { back: true }) +
        '<div class="screen-body stagger"><div class="stack-sm" role="radiogroup" aria-label="Intensidad">' + Object.keys(SF.INTENSITY).map((k) => '<button type="button" class="option" role="radio" aria-checked="' + (k === cur) + '" data-act="set-int" data-v="' + k + '"><span class="radio"></span><span class="grow stack-xs"><b>' + SF.INTENSITY[k].label + '</b><span class="t-sm t-2">' + SF.INTENSITY[k].desc + '</span></span></button>').join('') + '</div>' +
        '<div class="card soft stack-sm"><p class="t-sm"><b>Así te avisaremos:</b> ' + SF.INTENSITY[cur].summary + '</p><button type="button" class="btn btn-sm btn-secondary" data-act="push-test">' + I('bell-ring', 16) + 'Probar un aviso</button></div></div>';
    }
  };
  SF.act['set-int'] = (b) => {
    const prev = S().settings.intensity;
    if (prev === b.dataset.v) return;
    SF.store.commit((s) => { s.settings.intensity = b.dataset.v; s.session.pushShown = false; });
    ui.toast('Avisos: ' + SF.INTENSITY[b.dataset.v].label, { icon: 'bell', action: 'Deshacer', onAction: () => SF.store.commit((s) => { s.settings.intensity = prev; }) });
  };

  /* ---------- Ayuda ---------- */
  SF.screens.ayuda = {
    title: () => 'Centro de ayuda',
    render() {
      const st = S();
      return C.topbar('Centro de ayuda', { back: true }) +
        '<div class="screen-body">' +
        '<div class="input-wrap search"><span class="iw-ic">' + I('search', 18) + '</span><input class="input" type="search" id="faq-q" placeholder="Buscar una duda" aria-label="Buscar en la ayuda" autocomplete="off"></div>' +
        '<button type="button" class="card tap hrow" data-act="tour-again"><span class="row-icon">' + I('compass', 20) + '</span><span class="grow stack-xs"><b>Ver el tutorial</b><span class="t-sm t-2">6 pasos · menos de 1 minuto</span></span>' + I('play', 18, 't-primary') + '</button>' +
        '<section class="stack-sm"><h2 class="section-label">Preguntas frecuentes</h2><div class="faq" id="faq">' + SF.FAQ.map((q) => '<details class="card tight faq-item" data-q="' + u.esc(u.norm(q.q + ' ' + q.a)) + '"><summary><span class="grow">' + u.esc(q.q) + '</span>' + I('chevron-down', 18) + '</summary><p class="t-2">' + u.esc(q.a) + '</p></details>').join('') +
        '<p class="t-2 t-center" id="faq-empty" hidden>No encontramos esa duda. Escríbenos y te ayudamos.</p></div></section>' +
        '<section class="card stack-sm"><h2 class="t-h3">¿Sigues con dudas?</h2><p class="t-sm t-2">Respondemos en menos de 24 horas.</p><div class="hrow between wrap"><span class="t-bold">ayuda@studyflow.app</span><button type="button" class="btn btn-xs btn-secondary" data-act="copy-mail">' + I('copy', 14) + 'Copiar</button></div></section>' +
        '</div>';
    },
    mount(el) {
      const q = el.querySelector('#faq-q');
      q.addEventListener('input', () => {
        const v = u.norm(q.value.trim());
        let n = 0;
        el.querySelectorAll('.faq-item').forEach((d) => { const ok = !v || d.dataset.q.includes(v); d.hidden = !ok; if (ok) n++; if (v && ok) d.open = true; });
        el.querySelector('#faq-empty').hidden = n > 0;
      });
    }
  };
  SF.act['copy-mail'] = async () => {
    try { await navigator.clipboard.writeText('ayuda@studyflow.app'); ui.toast('Correo copiado', { icon: 'copy' }); }
    catch (e) { ui.toast('No pudimos copiar. Correo: ayuda@studyflow.app', { icon: 'info' }); }
  };
})(window.SF);
