/* =========================================================
   StudyFlow · Inicio y cuenta (O1–O4) y Crear plan (P1–P7)
   ========================================================= */
(function (SF) {
  const { D, T, u, ui, M, C } = SF;
  const I = SF.icon;
  const S = () => SF.store.state;

  /* ---------- O1 · ¿Has usado StudyFlow antes? ---------- */
  SF.screens.pregunta = {
    title: () => '¿Has usado StudyFlow antes?',
    render: () =>
      '<div class="screen-body onb stagger" style="justify-content:center">' +
      '<img class="onb-logo" src="assets/img/logo-studyflow.png" alt="StudyFlow" width="170" height="170">' +
      '<div class="stack-sm t-center"><h1 class="t-h1">¿Has usado StudyFlow antes?</h1><p class="t-2">Elige una opción para continuar.</p></div>' +
      '<div class="stack-sm">' +
      '<button type="button" class="option" data-act="go" data-to="login"><span class="row-icon">' + I('user-round') + '</span><span class="grow stack-xs"><span class="t-bold">Sí, ya tengo cuenta</span><span class="t-sm t-2">Inicia sesión y recupera tu plan.</span></span>' + I('chevron-right', 20, 't-3') + '</button>' +
      '<button type="button" class="option" data-act="go" data-to="bienvenida"><span class="row-icon">' + I('sparkles') + '</span><span class="grow stack-xs"><span class="t-bold">No, es mi primera vez</span><span class="t-sm t-2">Te mostramos cómo funciona.</span></span>' + I('chevron-right', 20, 't-3') + '</button>' +
      '</div></div>'
  };

  /* ---------- O2 · Bienvenido ---------- */
  SF.screens.bienvenida = {
    title: () => 'Bienvenido',
    render: () =>
      C.topbar('Bienvenido', { back: true, right: '<span class="step-badge" role="img" aria-label="Paso 1 de 3">1º</span>' }) +
      '<div class="screen-body stagger">' +
      '<div class="hero-illus">' + ui.illus('bienvenida', 'Portapapeles con tu plan listo') + '</div>' +
      '<div class="stack-sm t-center"><h2 class="t-display">Tu universidad, en orden.</h2>' +
      '<p class="t-2">Cada semana convertimos tus entregas en un plan. Cada día te decimos qué hacer primero y por qué.</p>' +
      '<p class="t-sm t-primary t-bold hrow" style="justify-content:center;gap:6px">' + I('shield-check', 16) + 'Gratis para siempre · Sin anuncios</p></div>' +
      '<ul class="feature-list">' +
      [['zap', 'Qué hacer primero', 'Una prioridad clara cada día, con su motivo.'], ['calendar-days', 'Plan automático', 'Tus tareas en tus horas libres, sin tocar tus clases.'], ['mic', 'Registro por voz', 'Dilo como te salga y nosotros lo ordenamos.']]
        .map(([ic, t, d]) => '<li><span class="row-icon">' + I(ic, 20) + '</span><span class="stack-xs"><b>' + t + '</b><span class="t-sm t-2">' + d + '</span></span></li>').join('') +
      '</ul></div>' +
      '<footer class="screen-foot">' +
      '<button type="button" class="btn btn-primary btn-block" data-act="go" data-to="registro">' + I('mail', 20) + 'Crear tu cuenta</button>' +
      '<button type="button" class="btn btn-soft btn-block" data-act="go" data-to="login">' + I('user-round', 20) + 'Iniciar sesión</button>' +
      '<p class="t-xs t-2 t-center">Al continuar aceptas los términos y la política de privacidad.</p></footer>'
  };

  /* ---------- Validación de formularios ---------- */
  function fieldError(form, name, msg) {
    if (!form) return;
    const f = form.querySelector('[data-field="' + name + '"]');
    if (!f) return;
    f.classList.toggle('invalid', !!msg);
    let e = f.querySelector('.err');
    if (msg) {
      if (!e) { e = document.createElement('p'); e.className = 'err'; e.id = 'err-' + name; f.appendChild(e); }
      e.innerHTML = I('alert-circle', 16) + '<span>' + u.esc(msg) + '</span>';
      const inp = f.querySelector('input,textarea,select,.input-btn');
      if (inp) { inp.setAttribute('aria-invalid', 'true'); inp.setAttribute('aria-describedby', 'err-' + name); }
    } else {
      if (e) e.remove();
      const inp = f.querySelector('input,textarea,select,.input-btn');
      if (inp) { inp.removeAttribute('aria-invalid'); inp.removeAttribute('aria-describedby'); }
    }
  }
  SF.fieldError = fieldError;

  const pwField = (id, label, ph, auto) =>
    '<div class="field" data-field="' + id + '"><label for="' + id + '">' + label + ' <span class="req" aria-hidden="true">*</span></label>' +
    '<div class="input-wrap"><input class="input" id="' + id + '" name="' + id + '" type="password" placeholder="' + ph + '" autocomplete="' + auto + '" required>' +
    '<button type="button" class="icon-btn" data-eye="' + id + '" aria-label="Mostrar contraseña" aria-pressed="false">' + I('eye', 20) + '</button></div></div>';

  function bindEyes(el) {
    el.querySelectorAll('[data-eye]').forEach((b) => b.addEventListener('click', () => {
      const inp = el.querySelector('#' + b.dataset.eye);
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      b.setAttribute('aria-pressed', String(show));
      b.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
      b.innerHTML = I(show ? 'eye-off' : 'eye', 20);
    }));
  }

  /* ---------- O3 · Crear cuenta ---------- */
  SF.screens.registro = {
    title: () => 'Crear cuenta',
    static: true,
    render: () =>
      C.topbar('Crear cuenta', { back: true, right: '<span class="step-badge" role="img" aria-label="Paso 2 de 3">2º</span>' }) +
      '<form class="screen-body" id="f-reg" novalidate>' +
      '<p class="t-2">Tu cuenta guarda tu plan y tus avisos. Los campos con <span class="req">*</span> son obligatorios.</p>' +
      '<div class="field" data-field="name"><label for="name">Nombre <span class="req" aria-hidden="true">*</span></label><input class="input" id="name" name="name" placeholder="Ingresa tu nombre" autocomplete="name" required></div>' +
      '<div class="field" data-field="email"><label for="email">Correo electrónico <span class="req" aria-hidden="true">*</span></label><input class="input" id="email" name="email" type="email" inputmode="email" placeholder="tu@correo.com" autocomplete="email" required></div>' +
      pwField('pw', 'Contraseña', 'Mínimo 8 caracteres', 'new-password') +
      '<div class="pw-meter" aria-hidden="true"><i></i><i></i><i></i></div><p class="t-xs t-2" id="pw-hint">Usa 8 caracteres o más, con al menos un número.</p>' +
      pwField('pw2', 'Confirmar contraseña', 'Repite tu contraseña', 'new-password') +
      '<button type="button" class="link-btn" data-act="go" data-to="login" style="align-self:flex-start">Ya tengo cuenta</button>' +
      '</form>' +
      '<footer class="screen-foot"><button type="submit" form="f-reg" class="btn btn-primary btn-block">Crear mi cuenta</button><p class="t-xs t-2 t-center">Al continuar aceptas los términos y la política de privacidad.</p></footer>',
    mount(el) {
      const f = el.querySelector('#f-reg');
      bindEyes(el);
      const rules = {
        name: (v) => v.trim().length < 2 ? 'Escribe tu nombre (al menos 2 letras).' : '',
        email: (v) => !v.trim() ? 'Escribe tu correo.' : !u.isEmail(v) ? 'Revisa el correo: falta algo, por ejemplo «@» o el dominio (.com).' : '',
        pw: (v) => v.length < 8 ? 'La contraseña necesita al menos 8 caracteres.' : !/\d/.test(v) ? 'Añade al menos un número.' : '',
        pw2: (v) => !v ? 'Repite tu contraseña.' : v !== f.pw.value ? 'Las contraseñas no coinciden.' : ''
      };
      const touched = {};
      f.addEventListener('focusout', (e) => { const n = e.target.name; if (rules[n]) { touched[n] = true; fieldError(f, n, rules[n](e.target.value)); } });
      f.addEventListener('input', (e) => {
        const n = e.target.name;
        if (n === 'pw') {
          const v = e.target.value; const score = (v.length >= 8) + /\d/.test(v) + (/[A-Z]/.test(v) || /[^\w]/.test(v));
          el.querySelectorAll('.pw-meter i').forEach((i, k) => i.classList.toggle('on', k < score));
          el.querySelector('#pw-hint').textContent = score >= 3 ? 'Contraseña segura.' : score === 2 ? 'Bien. Añade una mayúscula o un símbolo para hacerla más segura.' : 'Usa 8 caracteres o más, con al menos un número.';
        }
        if (touched[n] && rules[n]) fieldError(f, n, rules[n](e.target.value));
      });
      const submit = ui.once(async () => {
        let first = null;
        Object.keys(rules).forEach((n) => { const msg = rules[n](f[n].value); touched[n] = true; fieldError(f, n, msg); if (msg && !first) first = f[n]; });
        if (first) { first.focus(); el.querySelector('.screen-foot .btn').classList.add('shake'); setTimeout(() => el.querySelector('.screen-foot .btn').classList.remove('shake'), 450); ui.announce('Revisa los campos marcados.'); return; }
        const L = ui.loading({ title: 'Creando tu cuenta…', duration: 900 });
        await L.done;
        SF.store.commit((s) => { s.profile = { name: f.name.value.trim(), email: f.email.value.trim(), career: '' }; s.session.loggedIn = true; s.session.welcomeSeen = true; }, { noRender: true });
        SF.router.go('crear-plan', {}, { reset: true, transition: 'fade' });
        L.close();
        ui.toast('Cuenta creada. Ahora, tu plan.');
      });
      f.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
    }
  };

  /* ---------- O4 · Iniciar sesión ---------- */
  SF.screens.login = {
    title: () => 'Iniciar sesión',
    static: true,
    render: () =>
      C.topbar('Iniciar sesión', { back: true }) +
      '<form class="screen-body" id="f-log" novalidate>' +
      '<div class="hero-illus sm"><img src="assets/img/logo-studyflow.png" alt="" width="120" height="120"></div>' +
      '<div class="field" data-field="email"><label for="lemail">Correo electrónico <span class="req" aria-hidden="true">*</span></label><input class="input" id="lemail" name="email" type="email" inputmode="email" placeholder="tu@correo.com" autocomplete="email" value="ana.martinez@gmail.com"></div>' +
      pwField('lpw', 'Contraseña', 'Tu contraseña', 'current-password') +
      '<button type="button" class="link-btn" data-act="forgot" style="align-self:flex-start">¿Olvidaste tu contraseña?</button>' +
      '</form>' +
      '<footer class="screen-foot"><button type="submit" form="f-log" class="btn btn-primary btn-block">Iniciar sesión</button><button type="button" class="btn btn-ghost btn-block" data-act="go" data-to="registro">No tengo cuenta</button></footer>',
    mount(el) {
      const f = el.querySelector('#f-log');
      bindEyes(el);
      f.lpw.name = 'lpw';
      f.addEventListener('input', (e) => fieldError(f, e.target.name === 'email' ? 'email' : 'lpw', ''));
      const submit = ui.once(async () => {
        const em = f.email.value, pw = f.lpw.value;
        const e1 = !em.trim() ? 'Escribe tu correo.' : !u.isEmail(em) ? 'Ese correo no parece válido. Revisa el «@» y el dominio.' : '';
        const e2 = pw.length < 6 ? 'La contraseña debe tener al menos 6 caracteres.' : '';
        fieldError(f, 'email', e1); fieldError(f, 'lpw', e2);
        if (e1 || e2) { (e1 ? f.email : f.lpw).focus(); return; }
        const L = ui.loading({ title: 'Preparando tu espacio…', steps: ['Recuperando tus materias', 'Sincronizando actividades', 'Calculando tu plan'], duration: 1300 });
        await L.done;
        SF.store.commit((s) => {
          s.profile = { name: 'Ana Martínez', email: em.trim(), career: 'Estudiante de Ingeniería' };
          s.session.loggedIn = true; s.session.hasPlan = true; s.session.tutorialDone = false; s.session.welcomeSeen = true;
          s.subjects = u.clone(SF.SAMPLE_SUBJECTS);
          s.activities = SF.sampleActivities();
          s.notes = SF.sampleNotes();
          s.notifications = SF.sampleNotifications();
          s.lastActivityId = 'a4';
          s.plan.blocks = []; M.recalc('silent'); s.plan.status = 'proposal'; s.plan.changes = null;
        }, { noRender: true });
        SF.router.go('hoy', {}, { reset: true, transition: 'fade' });
        L.close();
        ui.toast('¡Hola de nuevo, Ana!', { icon: 'sparkles' });
      });
      f.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
    }
  };
  SF.act.forgot = () => ui.dialog({ icon: 'mail', title: 'Recupera tu contraseña', body: 'Te enviamos un enlace a tu correo para crear una contraseña nueva. Revisa también la carpeta de correo no deseado.', actions: [{ label: 'Entendido', kind: 'primary', value: true }] });

  /* ---------- P1 · Crear plan ---------- */
  const draft = { subjects: [], style: 'equilibrado', intensity: 'normal', career: '', careerOther: '' };
  // Al reemplazar todo el estado, el borrador del plan vuelve a empezar
  SF.store.on((st, meta) => { if (meta.replaced) Object.assign(draft, { subjects: [], style: 'equilibrado', intensity: 'normal', career: '', careerOther: '' }); });
  const DAYS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const DAYS_S = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  function classSummary(subs) {
    if (!subs.length) return 'Sin datos registrados';
    const n = subs.reduce((k, s) => k + s.classes.length, 0);
    const days = [...new Set(subs.flatMap((s) => s.classes.map((c) => c.day)))].sort().map((d) => DAYS_S[d]);
    return u.plural(n, 'clase', 'clases') + ' a la semana · ' + days.join(', ');
  }
  function freeFor(subs) {
    const real = S().subjects; S().subjects = subs;
    const min = M.freeMinutesWeek();
    S().subjects = real;
    return min;
  }

  const careerName = () => draft.career === 'otra' ? draft.careerOther.trim() : ((SF.CAREERS.find((c) => c.id === draft.career) || {}).name || '');
  const SLOT_TIMES = ['08:00', '10:00', '14:00', '16:00', '12:00', '18:00', '07:00', '19:30'];
  const SLOT_DAYS = [[1, 3], [2, 4], [3, 5], [1, 4], [2, 5], [1, 5], [2, 3], [4, 5]];
  function careerHtml() {
    const c = SF.CAREERS.find((x) => x.id === draft.career);
    const has = (n) => draft.subjects.some((x) => u.norm(x.name) === u.norm(n));
    return '<section class="stack-sm" aria-labelledby="h-car"><div class="field" data-field="career"><label for="cp-career" id="h-car">Tu carrera <span class="req">*</span></label>' +
      '<div class="select-wrap"><select class="input" id="cp-career"><option value=""' + (draft.career ? '' : ' selected') + ' disabled>Elige tu carrera</option>' +
      SF.CAREERS.map((x) => '<option value="' + x.id + '"' + (draft.career === x.id ? ' selected' : '') + '>' + u.esc(x.name) + '</option>').join('') +
      '<option value="otra"' + (draft.career === 'otra' ? ' selected' : '') + '>Otra (escribirla)</option></select>' + I('chevron-down', 18) + '</div></div>' +
      (draft.career === 'otra' ? '<div class="field" data-field="careerOther"><label for="cp-career-other">¿Cuál es tu carrera? <span class="req">*</span></label><input class="input" id="cp-career-other" maxlength="60" placeholder="Ej.: Biología marina" value="' + u.esc(draft.careerOther) + '" autocomplete="off"><p class="t-xs t-2">Después añade tus materias con «Añadir».</p></div>' : '') +
      (c ? '<div class="stack-sm"><p class="t-sm t-2">Materias de ' + u.esc(c.name) + '. Toca para añadirlas; luego puedes cambiar su horario.</p><div class="chips" role="group" aria-label="Materias sugeridas">' +
        c.subjects.map((n) => '<button type="button" class="chip sugg" data-act="cp-sugg" data-n="' + u.esc(n) + '" aria-pressed="' + has(n) + '">' + I(has(n) ? 'check' : 'plus', 16) + u.esc(n) + '</button>').join('') + '</div></div>' : '') +
      '</section>';
  }
  SF.act['cp-sugg'] = (el) => {
    const n = el.dataset.n;
    const i = draft.subjects.findIndex((x) => u.norm(x.name) === u.norm(n));
    if (i >= 0) { const gone = draft.subjects.splice(i, 1)[0]; refreshCP(); ui.toast(n + ' quitada', { icon: 'x', action: 'Deshacer', onAction: () => { draft.subjects.splice(Math.min(i, draft.subjects.length), 0, gone); refreshCP(); } }); return; }
    const j = draft.subjects.length;
    const used = new Set(); draft.subjects.forEach((x) => x.classes.forEach((c) => used.add(c.day + '@' + c.start)));
    let days = SLOT_DAYS[0], time = SLOT_TIMES[0];
    outer: for (let ti = 0; ti < SLOT_TIMES.length; ti++) for (let di = 0; di < SLOT_DAYS.length; di++) {
      const dd = SLOT_DAYS[(di + j) % SLOT_DAYS.length], tt = SLOT_TIMES[(ti + j) % SLOT_TIMES.length];
      if (!dd.some((d) => used.has(d + '@' + tt))) { days = dd; time = tt; break outer; }
    }
    draft.subjects.push({ id: u.uid('s'), name: n, credits: 3, color: SF.COLORS[j % SF.COLORS.length], classes: days.map((d) => ({ day: d, start: time, dur: 90 })) });
    refreshCP();
    ui.toast(n + ' añadida con horario sugerido. Tócala en «Tus materias» para cambiarlo.', { icon: 'check' });
  };

  SF.screens['crear-plan'] = {
    title: () => 'Crea tu plan',
    static: true,
    render: () => '<div class="cp-root"></div>',
    mount(el) {
      this.update(el);
      if (el._cpBound) return; el._cpBound = true;
      el.addEventListener('change', (e) => { if (e.target.id === 'cp-career') { draft.career = e.target.value; refreshCP(); const o = el.querySelector('#cp-career-other'); if (o) o.focus(); } });
      el.addEventListener('input', (e) => { if (e.target.id === 'cp-career-other') { draft.careerOther = e.target.value; fieldError(el, 'careerOther', ''); } });
    },
    update(el) {
      const oldBody = el.querySelector('.screen-body');
      const keepScroll = oldBody ? oldBody.scrollTop : 0;
      const ae = document.activeElement && el.contains(document.activeElement) ? document.activeElement : null;
      const focusSel = ae ? (ae.id ? '#' + ae.id : ae.dataset.act ? '[data-act="' + ae.dataset.act + '"]' + (ae.dataset.n ? '[data-n="' + CSS.escape(ae.dataset.n) + '"]' : ae.dataset.i ? '[data-i="' + ae.dataset.i + '"]' : ae.dataset.v ? '[data-v="' + ae.dataset.v + '"]' : '') : '') : '';
      const root = el.querySelector('.cp-root') || el;
      const n = draft.subjects.length;
      const free = freeFor(draft.subjects);
      root.outerHTML;
      el.innerHTML =
        C.topbar('Crea tu plan', { back: false, right: '<span class="step-badge" role="img" aria-label="Paso 3 de 3">3º</span>' }) +
        '<div class="screen-body">' +
        '<p class="t-2">Genera tu propio plan de estudios. Puedes cambiarlo cuando lo necesites en Ajustes.</p>' +
        careerHtml() +
        '<section class="stack-sm" aria-labelledby="h-mat"><div class="section-head"><h2 id="h-mat">Tus materias <span class="t-sm t-2" style="font-weight:600">(' + n + ' de 3 mínimo)</span></h2><button type="button" class="btn btn-xs btn-soft" data-act="cp-add">' + I('plus', 16) + 'Añadir</button></div>' +
        (n ? '<div class="chips">' + draft.subjects.map((s, i) => '<button type="button" class="chip on" data-act="cp-edit" data-i="' + i + '" aria-label="Editar ' + u.esc(s.name) + '">' + I('check', 16) + u.esc(s.name) + '</button>').join('') + '</div>'
          : '<div class="card dashed t-center stack-sm"><p class="t-2">Aún no has añadido materias.</p><button type="button" class="link-btn" data-act="cp-sample" style="justify-content:center">' + I('sparkles', 16) + 'Usar materias de ejemplo</button></div>') +
        '<div class="progress" aria-hidden="true"><i style="--v:' + Math.min(100, n / 3 * 100) + '%"></i></div></section>' +
        '<section class="card stack" aria-labelledby="h-disp"><div><h2 id="h-disp" class="t-h3">Tu disponibilidad</h2><p class="t-sm t-2">Horario y tiempo libre, calculados a partir de tus clases.</p></div>' +
        '<div class="hrow" style="align-items:flex-start"><span class="row-icon">' + I('calendar-check', 20) + '</span><div class="stack-xs"><b>Horario de clases</b><span class="t-sm t-2">' + u.esc(classSummary(draft.subjects)) + '</span><span class="t-xs t-2">Tus clases se reservarán en el plan.</span></div></div>' +
        '<hr class="divider">' +
        '<div class="hrow" style="align-items:flex-start"><span class="row-icon">' + I('clock', 20) + '</span><div class="stack-xs"><b>Bloques libres</b><span class="t-sm t-2">Detectados: ' + T.dur(free) + ' esta semana (8:00–21:00)</span><span class="t-xs t-2">Este tiempo se usará para estudiar.</span></div></div></section>' +
        '<section class="stack-sm" aria-labelledby="h-pri"><h2 id="h-pri" class="t-h3 hrow" style="gap:6px">¿Cómo priorizamos? <button type="button" class="icon-btn cp-info" data-act="cp-info" aria-label="Qué significa cada estilo">' + I('info', 18) + '</button></h2><p class="t-sm t-2">Elige cómo organizamos tus tareas pendientes.</p>' +
        '<div class="chips" role="radiogroup" aria-label="Estilo de reparto">' + Object.keys(SF.STYLES).map((k) => '<button type="button" class="chip" role="radio" aria-checked="' + (draft.style === k) + '" data-act="cp-style" data-v="' + k + '">' + SF.STYLES[k].label + '</button>').join('') + '</div></section>' +
        '<section class="stack-sm" aria-labelledby="h-int"><h2 id="h-int" class="t-h3">Intensidad de avisos</h2><p class="t-sm t-2">Elige la frecuencia de los recordatorios.</p>' +
        '<div class="chips" role="radiogroup" aria-label="Intensidad de avisos">' + Object.keys(SF.INTENSITY).map((k) => '<button type="button" class="chip" role="radio" aria-checked="' + (draft.intensity === k) + '" data-act="cp-int" data-v="' + k + '">' + SF.INTENSITY[k].label + '</button>').join('') + '</div>' +
        '<p class="t-xs t-2">' + u.esc(SF.INTENSITY[draft.intensity].desc) + '</p></section>' +
        '</div>' +
        '<footer class="screen-foot"><button type="button" class="btn btn-primary btn-block" data-act="cp-create" aria-describedby="cp-hint">Crear mi primer plan ' + I('arrow-right', 20) + '</button>' +
        '<p class="t-xs t-2 t-center" id="cp-hint">' + (n < 3 ? 'Añade ' + (3 - n) + ' materia' + (3 - n === 1 ? '' : 's') + ' más para crear tu plan.' : 'Todo listo. Puedes añadir más materias cuando quieras.') + '</p></footer>';
      const nb = el.querySelector('.screen-body'); if (nb) nb.scrollTop = keepScroll;
      if (focusSel) { const f = el.querySelector(focusSel); if (f) f.focus({ preventScroll: true }); }
    }
  };

  const refreshCP = () => { const cur = SF.router.current(); if (cur && cur.name === 'crear-plan') SF.screens['crear-plan'].update(cur.el); };
  SF.act['cp-style'] = (el) => { draft.style = el.dataset.v; refreshCP(); };
  SF.act['cp-int'] = (el) => { draft.intensity = el.dataset.v; refreshCP(); };
  SF.act['cp-info'] = () => ui.sheet({ title: '¿Cómo repartimos tu semana?', body: Object.keys(SF.STYLES).map((k) => '<div class="stack-xs"><b>' + SF.STYLES[k].label + '</b><span class="t-2">' + SF.STYLES[k].desc + '</span></div>').join('<hr class="divider">'), foot: '<button type="button" class="btn btn-primary btn-block" data-close>Entendido</button>' });
  SF.act['cp-sample'] = async () => {
    if (draft.subjects.length && !(await ui.confirm({ icon: 'refresh-cw', tone: 'warning', title: '¿Reemplazar tus materias?', body: 'Cambiaremos ' + (draft.subjects.length === 1 ? 'la que añadiste' : 'las ' + draft.subjects.length + ' que añadiste') + ' por Cálculo II, Computación y Diseño.', ok: 'Reemplazar' }))) return;
    draft.subjects = u.clone(SF.SAMPLE_SUBJECTS); if (!draft.career) draft.career = 'sistemas'; refreshCP(); ui.toast('Añadimos Cálculo II, Computación y Diseño');
  };
  SF.act['cp-add'] = () => subjectSheet(-1);
  SF.act['cp-edit'] = (el) => subjectSheet(Number(el.dataset.i));

  /* before(tipo, materia, anterior) confirma antes de quitar o editar una materia */
  function subjectSheet(index, list, after, before) {
    before = before || ((k, x) => k !== 'del' || ui.confirm({ danger: true, title: '¿Quitar ' + x.name + '?', body: 'Se quita con su horario de clases. Puedes añadirla otra vez cuando quieras.', ok: 'Quitar materia' }));
    list = list || draft.subjects; after = after || ((k, x) => { refreshCP(); ui.toast(k === 'del' ? x.name + ' quitada' : k === 'edit' ? 'Materia actualizada' : x.name + ' agregada', { icon: k === 'del' ? 'trash' : 'check' }); });
    const editing = index >= 0;
    const s = editing ? u.clone(list[index]) : { id: u.uid('s'), name: '', credits: 3, color: SF.COLORS[list.length % SF.COLORS.length], classes: [] };
    const orig = JSON.stringify(s);
    let nameEl = null;
    const classesHtml = () => s.classes.length
      ? s.classes.map((c, i) => '<div class="class-row"><span class="row-icon">' + I('calendar', 18) + '</span><span class="grow"><b>' + DAYS[c.day] + '</b><span class="t-sm t-2"> · ' + c.start + ' · ' + T.dur(c.dur) + '</span></span><button type="button" class="icon-btn" data-rm="' + i + '" aria-label="Quitar clase del ' + DAYS[c.day] + '">' + I('x', 18) + '</button></div>').join('')
      : '<p class="t-sm t-2">Aún no hay clases. Añade al menos una.</p>';
    ui.sheet({
      title: editing ? 'Editar materia' : 'Agregar materia',
      guard: () => JSON.stringify(Object.assign({}, s, { name: nameEl.value.trim() })) === orig ? true : ui.confirm({ icon: 'alert-triangle', tone: 'warning', title: '¿Descartar los cambios?', body: 'Lo que escribiste en esta materia se perderá.', cancel: 'Seguir editando', ok: 'Descartar' }),
      body:
        '<div class="field" data-field="sname"><label for="sname">Nombre de la materia <span class="req">*</span></label><input class="input" id="sname" placeholder="Ej. Cálculo II" value="' + u.esc(s.name) + '" autocomplete="off"></div>' +
        '<div class="field"><span class="label" id="cr-l">Cantidad de créditos <span class="req">*</span></span><div class="stepper" role="group" aria-labelledby="cr-l"><button type="button" class="icon-btn" data-cr="-1" aria-label="Menos créditos">' + I('minus') + '</button><output class="val" id="cr-v" aria-live="polite">' + s.credits + ' créditos</output><button type="button" class="icon-btn" data-cr="1" aria-label="Más créditos">' + I('plus') + '</button></div></div>' +
        '<div class="field" data-field="classes"><span class="label">Horario de clase <span class="req">*</span></span><div class="stack-sm" id="cls">' + classesHtml() + '</div>' +
        '<div class="add-class card tight stack-sm"><p class="t-sm t-bold">Añadir clase</p><div class="chips" role="radiogroup" aria-label="Día">' + [1, 2, 3, 4, 5, 6].map((d) => '<button type="button" class="chip sm" role="radio" aria-checked="false" data-day="' + d + '">' + DAYS_S[d] + '</button>').join('') + '</div>' +
        '<div class="grid-2"><button type="button" class="input-btn" data-ct>' + I('clock', 18) + '<span class="ph" id="ct-l">Hora de inicio</span></button>' +
        '<div class="seg" role="radiogroup" aria-label="Duración" id="cd">' + [[60, '1 h'], [90, '1 h 30'], [120, '2 h']].map(([v, l]) => '<button type="button" role="radio" aria-checked="' + (v === 120) + '" data-dur="' + v + '">' + l + '</button>').join('') + '</div></div>' +
        '<button type="button" class="btn btn-soft btn-sm" data-addc>' + I('plus', 18) + 'Añadir esta clase</button></div></div>' +
        (editing ? '<button type="button" class="btn btn-danger-ghost btn-sm" data-del>' + I('trash', 18) + 'Quitar materia</button>' : ''),
      foot: '<div class="grid-2"><button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-save>' + (editing ? 'Guardar' : 'Agregar') + '</button></div>',
      mount(el, ly) {
        ui.segs(el);
        let day = null, time = null, dur = 120;
        const nameInp = nameEl = el.querySelector('#sname');
        el.addEventListener('click', async (e) => {
          const t = e.target;
          const cr = t.closest('[data-cr]');
          if (cr) { s.credits = u.clamp(s.credits + Number(cr.dataset.cr), 1, 10); el.querySelector('#cr-v').textContent = s.credits + ' créditos'; return; }
          const dy = t.closest('[data-day]');
          if (dy) { day = Number(dy.dataset.day); el.querySelectorAll('[data-day]').forEach((x) => x.setAttribute('aria-checked', String(x === dy))); return; }
          if (t.closest('[data-ct]')) {
            const v = await C.pickTime(time || '10:00', { title: 'Hora de clase', shortcuts: [['8:00', '08:00'], ['10:00', '10:00'], ['12:00', '12:00'], ['14:00', '14:00']] });
            if (v) { time = v; const l = el.querySelector('#ct-l'); l.textContent = v; l.classList.remove('ph'); }
            return;
          }
          const dd = t.closest('[data-dur]');
          if (dd) { dur = Number(dd.dataset.dur); el.querySelectorAll('[data-dur]').forEach((x) => x.setAttribute('aria-checked', String(x === dd))); ui.segs(el); return; }
          if (t.closest('[data-addc]')) {
            if (!day || !time) { ui.toast(!day ? 'Elige el día de la clase' : 'Elige la hora de inicio', { icon: 'info' }); return; }
            s.classes.push({ day, start: time, dur }); s.classes.sort((a, b) => a.day - b.day);
            el.querySelector('#cls').innerHTML = classesHtml();
            SF.fieldError(el, 'classes', '');
            return;
          }
          const rm = t.closest('[data-rm]');
          if (rm) { s.classes.splice(Number(rm.dataset.rm), 1); el.querySelector('#cls').innerHTML = classesHtml(); return; }
          if (t.closest('[data-del]')) { if (!(await before('del', s))) return; list.splice(index, 1); ly.close(); after('del', s); return; }
          if (t.closest('[data-save]')) {
            s.name = nameInp.value.trim();
            const dup = list.some((x, i) => i !== index && u.norm(x.name) === u.norm(s.name));
            SF.fieldError(el, 'sname', !s.name ? 'Escribe el nombre de la materia.' : dup ? 'Ya tienes una materia con ese nombre.' : '');
            SF.fieldError(el, 'classes', s.classes.length ? '' : 'Añade al menos una clase con su día y hora.');
            if (!s.name || dup) { nameInp.focus(); return; }
            if (!s.classes.length) return;
            if (editing && JSON.stringify(s) === orig) { ly.close(); return; }
            if (editing && !(await before('edit', s, list[index]))) return;
            if (editing) list[index] = s; else list.push(s);
            ly.close(); after(editing ? 'edit' : 'add', s);
          }
        });
        nameInp.addEventListener('input', () => SF.fieldError(el, 'sname', ''));
      }
    });
  }

  SF.subjectSheet = subjectSheet;

  function starterActivities(subs) {
    const sampleNames = SF.SAMPLE_SUBJECTS.map((x) => x.name).join('|');
    if (subs.slice(0, 3).map((x) => x.name).join('|') === sampleNames) {
      const map = {}; SF.SAMPLE_SUBJECTS.forEach((x, i) => { map[x.id] = subs[i].id; });
      return SF.sampleActivities().map((a) => Object.assign(a, { subjectId: map[a.subjectId] }));
    }
    const out = [];
    subs.forEach((s, i) => {
      out.push({ id: u.uid('a'), subjectId: s.id, type: 'tarea', title: 'Taller de ' + s.name, date: D.add(D.TODAY, 1 + (i % 3)), time: '23:59', duration: 60, weight: 15, progress: 0, sample: true });
      out.push({ id: u.uid('a'), subjectId: s.id, type: 'lectura', title: 'Lectura de ' + s.name, date: D.add(D.TODAY, 2 + (i % 3)), time: '23:59', duration: 40, weight: 5, progress: 0, sample: true });
    });
    out.push({ id: u.uid('a'), subjectId: subs[0].id, type: 'examen', title: 'Parcial de ' + subs[0].name, date: D.WEEK[4], time: '14:00', duration: 150, examLen: 120, weight: 30, progress: 0, sample: true });
    return out;
  }

  SF.act['cp-create'] = ui.once(async () => {
    const cpEl = SF.router.current().el;
    if (!draft.career || (draft.career === 'otra' && !draft.careerOther.trim())) {
      if (!draft.career) { fieldError(cpEl, 'career', 'Elige tu carrera para sugerirte materias.'); cpEl.querySelector('#cp-career').focus(); }
      else { fieldError(cpEl, 'careerOther', 'Escribe el nombre de tu carrera.'); cpEl.querySelector('#cp-career-other').focus(); }
      ui.toast('Falta tu carrera', { icon: 'alert-circle' });
      return;
    }
    if (draft.subjects.length < 3) {
      const v = await ui.dialog({ icon: 'alert-triangle', tone: 'warning', title: 'Faltan materias', body: 'Necesitas agregar al menos 3 materias para poder crear tu plan de estudio. Llevas ' + draft.subjects.length + '.', actions: [{ label: 'Usar ejemplo', kind: 'secondary', value: 'sample' }, { label: 'Agregar materias', kind: 'primary', value: 'add', autofocus: true }] });
      if (v === 'add') subjectSheet(-1);
      if (v === 'sample') SF.act['cp-sample']();
      return;
    }
    const L = ui.loading({ title: 'Creando tu plan…', sub: 'Esto tarda solo unos segundos.', steps: ['Leyendo tus materias', 'Reservando tus clases', 'Repartiendo actividades en tus bloques libres'], duration: 1700 });
    await L.done;
    SF.store.commit((s) => {
      s.subjects = u.clone(draft.subjects);
      s.profile.career = careerName();
      s.activities = starterActivities(s.subjects);
      s.notes = [];
      s.notifications = [];
      s.settings.style = draft.style;
      s.settings.intensity = draft.intensity;
      s.session.hasPlan = true;
      s.lastActivityId = null;
      s.plan.blocks = []; M.recalc('silent'); s.plan.status = 'proposal'; s.plan.changes = null;
      if (!s.profile.name) s.profile.name = 'Estudiante';
    }, { noRender: true });
    SF.router.go('hoy', {}, { reset: true, transition: 'fade' });
    L.close();
    setTimeout(() => { if (!S().session.tutorialDone) SF.tour.start('hoy'); }, 500);
  });
})(window.SF);
