/* =========================================================
   StudyFlow · Racha
   Días seguidos con al menos una sesión de estudio terminada
   (o una actividad completada). El historial de días es la
   única fuente de verdad: la racha actual se calcula siempre
   a partir de él y del «hoy» de la demo. Incluye el botón de
   Hoy, la pantalla de detalle, los hitos, la animación al
   sumar un día y compartir.
   ========================================================= */
(function (SF) {
  const { D, u, ui, M, C } = SF;
  const I = SF.icon;
  const S = () => SF.store.state;

  /* ---------- Hitos: cada uno con su llama, color, silueta y animación (fx, duración en ms) ---------- */
  const HITOS = [
    { days: 3,   name: 'Chispa',    icon: 'flame-spark',    color: 's-teal',   lobes: 4,  amp: .062, fx: 'chispa',   ms: 2600, desc: 'Tres días seguidos. La parte difícil es empezar, y ya lo hiciste.' },
    { days: 7,   name: 'Llama',     icon: 'flame',          color: 's-blue',   lobes: 5,  amp: .04,  fx: 'llama',    ms: 2700, desc: 'Una semana completa sin saltarte un día.' },
    { days: 14,  name: 'Antorcha',  icon: 'flame-torch',    color: 's-green',  lobes: 6,  amp: .028, fx: 'antorcha', ms: 2800, desc: 'Dos semanas. Estudiar un poco cada día ya es parte de tu rutina.' },
    { days: 21,  name: 'Fogata',    icon: 'flame-kindling', color: 's-violet', lobes: 8,  amp: .05,  fx: 'fogata',   ms: 2900, desc: 'Tres semanas seguidas. Esto ya es un hábito.' },
    { days: 30,  name: 'Hoguera',   icon: 'flame-double',   color: 's-rose',   lobes: 10, amp: .048, fx: 'hoguera',  ms: 3000, desc: 'Un mes entero avanzando todos los días.' },
    { days: 60,  name: 'Caldero',   icon: 'flame-bowl',     color: 's-amber',  lobes: 12, amp: .044, fx: 'caldero',  ms: 3100, desc: 'Dos meses de constancia, con parciales incluidos.' },
    { days: 100, name: 'Leyenda',   icon: 'flame-rays',     color: 'primary',  lobes: 16, amp: .042, fx: 'leyenda',  ms: 3400, solid: true, desc: 'Cien días seguidos. El hito más alto de StudyFlow.' }
  ];
  const INICIO = { days: 0, icon: 'flame', color: 'primary', fx: 'inicio', ms: 2400 }; // antes del primer hito
  const hito = (n) => HITOS.find((m) => m.days === n) || null;
  const dias = (n) => u.plural(n, 'día', 'días');
  const seguidos = (n) => (n === 1 ? 'día seguido' : 'días seguidos');

  /* Silueta ondulada de la insignia (SVG y canvas usan la misma) */
  function rosette(cx, cy, r, m) {
    let d = '';
    for (let i = 0; i < 240; i++) {
      const t = i / 240 * Math.PI * 2;
      const k = r * (1 + m.amp * Math.cos(m.lobes * t)) / (1 + m.amp);
      d += (i ? 'L' : 'M') + (cx + k * Math.sin(t)).toFixed(2) + ' ' + (cy - k * Math.cos(t)).toFixed(2);
    }
    return d + 'Z';
  }

  /* ================================================================
     LÓGICA
     ================================================================ */
  function runAt(set, date) { let n = 0; while (set.has(date)) { n++; date = D.add(date, -1); } return n; }

  const R = {
    HITOS,

    /* Estado calculado. status: on (hoy cuenta) · wait (falta hoy) · lost (se rompió) · new */
    get() {
      const raw = S().streak || {};
      const history = raw.history || [];
      const set = new Set(history);
      const today = D.TODAY;
      const doneToday = set.has(today);
      const current = runAt(set, doneToday ? today : D.add(today, -1));
      const last = history.reduce((a, b) => (b <= today && b > a ? b : a), '') || null;
      return {
        current, doneToday, last, set,
        best: Math.max(raw.best || 0, current),
        total: set.size,
        lastRun: last ? runAt(set, last) : 0,
        hits: raw.hits || {},
        status: doneToday ? 'on' : current ? 'wait' : last ? 'lost' : 'new'
      };
    },

    next(current) { return HITOS.find((m) => m.days > current) || null; },
    level(current) { return HITOS.filter((m) => m.days <= current).pop() || null; },

    /* Marca hoy como cumplido. Devuelve el hito alcanzado (o null). */
    recordToday() {
      if (R.get().doneToday) return null;
      const today = D.TODAY;
      SF.store.commit((s) => {
        const str = s.streak = Object.assign(SF.store.defaults().streak, s.streak);
        str.history = [today].concat(str.history.filter((d) => d !== today)).sort().reverse().slice(0, 1000);
        const now = R.get();
        str.current = now.current; str.best = now.best; str.lastDate = today;
        if (hito(now.current) && !str.hits[now.current]) str.hits[now.current] = today;
      }, { silent: true });
      return hito(R.get().current);
    },

    /* Si hay una actividad completada hoy y aún no cuenta, la suma. */
    sync() {
      const today = D.TODAY;
      if (!S().activities.some((a) => a.done && a.doneAt === today)) return null;
      return R.recordToday();
    }
  };
  SF.streak = R;

  /* Cada cambio de estado revisa si hoy ya cuenta (antes de repintar). */
  SF.store.on(() => { R.sync(); });

  /* ================================================================
     ANIMACIÓN AL SUMAR UN DÍA
     Se lanza solo cuando la acción del usuario sumó el día (al
     terminar una sesión o completar una actividad), nunca al
     cargar datos ni al deshacer. Si ese día cae en un hito,
     después aparece su insignia.
     ================================================================ */
  let closeFx = null, celebrating = 0;

  R.celebrate = async function () {
    const turn = ++celebrating;
    const day = D.TODAY, n = R.get().current;
    const valid = () => { const now = R.get(); return turn === celebrating && D.TODAY === day && now.doneToday && now.current === n; };
    if (await whenFree(valid, 520)) await playFx(n);
    const m = hito(n);
    if (!m || !(await whenFree(valid, 380))) return;
    const v = await ui.dialog({
      top: '<div class="hito-pop">' + badge(m, 'done') + '</div>',
      title: 'Hito «' + m.name + '»: ' + dias(m.days),
      body: m.desc,
      actions: [{ label: 'Seguir', kind: 'secondary', value: 0 }, { label: 'Compartir', kind: 'primary', value: 1 }]
    });
    if (v) share(m);
  };

  /* Espera a que no haya nada encima (por ejemplo, «¿Deshacer?») mientras siga siendo válido. */
  async function whenFree(valid, ms) {
    for (let i = 0; i < 12; i++) {
      await u.sleep(i ? 700 : ms);
      if (!valid()) return false;
      if (!ui.layers() && !(SF.tour && SF.tour.active())) return true;
    }
    return false;
  }

  /* Muestra la animación del nivel actual. Cualquier toque o tecla la cierra;
     el aviso con «Deshacer» queda por encima y se puede usar. */
  function playFx(n) {
    if (closeFx) closeFx();
    return new Promise((resolve) => {
      const m = R.level(n) || INICIO, nx = R.next(n);
      const left = nx ? nx.days - n : 0;
      const sub = m.days === n ? 'Hito «' + m.name + '» conseguido'
        : n === 1 ? 'Tu racha empieza hoy'
          : nx ? (left === 1 ? 'Falta 1 día' : 'Faltan ' + left + ' días') + ' para «' + nx.name + '»' : 'Todos los hitos conseguidos';
      const el = document.createElement('div');
      el.className = 'racha-fx';
      el.dataset.fx = m.fx;
      el.setAttribute('aria-hidden', 'true');
      el.style.cssText = '--fx:var(--' + m.color + ');--fx-soft:var(--' + (m.color === 'primary' ? 'primary-soft' : m.color + '-soft') + ')';
      el.innerHTML = '<div class="fx-card">' + fxScene(m) +
        '<p class="fx-num t-num"><span class="fx-reel"><b>' + (n - 1) + '</b><b>' + n + '</b></span></p>' +
        '<p class="fx-lbl">' + seguidos(n) + '</p><p class="fx-sub">' + sub + '</p></div>';
      ui.$('#app').appendChild(el);
      setTimeout(() => ui.announce('Racha: ' + n + ' ' + seguidos(n) + '. ' + sub), 400);

      const timer = setTimeout(close, m.ms);
      let closed = false;
      function close() {
        if (closed) return; closed = true;
        clearTimeout(timer); closeFx = null;
        document.removeEventListener('pointerdown', close, true);
        document.removeEventListener('keydown', close, true);
        window.removeEventListener('popstate', close);
        el.classList.add('out');
        setTimeout(() => el.remove(), 260);
        resolve();
      }
      closeFx = close;
      document.addEventListener('pointerdown', close, true);
      document.addEventListener('keydown', close, true);
      window.addEventListener('popstate', close);
    });
  }
  R.playFx = playFx;

  /* Escena de cada nivel: el icono por partes (p0, p1…) y sus partículas, centrado en (80, 70) */
  function fxScene(m) {
    const range = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join('');
    const at = (a, inner) => '<g transform="translate(80 70) rotate(' + a + ')">' + inner + '</g>';
    const rays = (n, r, len, d, off) => range(n, (i) => at(360 / n * i + (off || 0), '<path class="fx-ray" d="M0 -' + r + 'v-' + len + '" style="--d:' + (d + (i % 2) * .12).toFixed(2) + 's"/>'));
    const dots = (n, r, d, color) => range(n, (i) => at(360 / n * i, '<circle class="fx-dot" cy="-' + r + '" r="' + (i % 3 ? 2.6 : 3.8) + '" style="--d:' + (d + (i % 4) * .07).toFixed(2) + 's;--go:-' + (24 + i % 3 * 7) + 'px' + (color ? ';fill:var(--' + color(i) + ')' : '') + '"/>'));
    const embers = (xs, d) => xs.map((x, i) => '<circle class="fx-ember" cx="' + x + '" cy="' + (92 - i % 3 * 6) + '" r="' + (i % 2 ? 2 : 3) + '" style="--x:' + ((x - 80) / 3 + (i % 2 ? 5 : -5)).toFixed(1) + 'px;--d:' + (d + i * .13).toFixed(2) + 's"/>').join('');
    const rings = (n, d) => range(n, (i) => '<circle class="fx-ring" cx="80" cy="70" r="48" style="--d:' + (d + i * .3).toFixed(2) + 's"/>');
    const waves = (n, d) => range(n, (i) => '<path class="fx-wave" d="M' + (58 - i * 9) + ' ' + (34 - i * 7) + 'q' + (22 + i * 9) + ' -' + (14 + i * 3) + ' ' + (44 + i * 18) + ' 0" style="--d:' + (d + i * .18).toFixed(2) + 's"/>');
    const back = {
      inicio: () => rings(1, .75),
      chispa: () => rays(10, 42, 9, .45, 18),
      llama: () => rings(1, .55) + embers([62, 98, 72, 90, 80], .6),
      antorcha: () => rings(2, .85) + rays(6, 52, 6, .9, 30),
      fogata: () => embers([58, 100, 68, 92, 80, 64, 96], .75),
      hoguera: () => rings(3, .5) + embers([48, 112, 58, 102, 70, 90, 52, 108, 80], .6),
      caldero: () => waves(3, 1) + embers([54, 106, 66, 94, 60, 100], 1) + rings(1, .95),
      leyenda: () => rays(16, 58, 8, .55) + dots(16, 46, .6, (i) => HITOS[i % HITOS.length].color) + rings(2, .6)
    }[m.fx]();
    const halo = m.solid ? '<path class="fx-halo fx-seal" d="' + rosette(80, 70, 48, m) + '"/>' : '<circle class="fx-halo" cx="80" cy="70" r="48"/>';
    let k = 0;
    const parts = SF.ICONS[m.icon].replace(/<path /g, () => '<path class="p' + (k++) + '" pathLength="1" ');
    return '<svg class="fx-scene" viewBox="0 0 160 140" focusable="false">' + halo + back +
      '<g class="fx-ico"><svg class="fx-ic" x="46" y="36" width="68" height="68" viewBox="0 0 24 24">' + parts + '</svg></g></svg>';
  }

  /* ================================================================
     PIEZAS VISUALES
     ================================================================ */

  /* Insignia de un hito. state: done · next · locked */
  function badge(m, state, pct) {
    const on = state !== 'locked';
    const w = 14 + String(m.days).length * 7;
    return '<svg class="hito-badge ' + state + (m.solid && state === 'done' ? ' solid' : '') + '" viewBox="0 0 72 78" aria-hidden="true" focusable="false"' +
      (on ? ' style="--bd:var(--' + m.color + ');--bd-soft:var(--' + (m.color === 'primary' ? 'primary-soft' : m.color + '-soft') + ')"' : '') + '>' +
      '<path class="hb-shape" d="' + rosette(36, 34, 32, m) + '"/>' +
      '<circle class="hb-ring" cx="36" cy="34" r="21"/>' +
      (state === 'next' ? '<circle class="hb-prog" cx="36" cy="34" r="21" pathLength="100" stroke-dasharray="' + Math.max(1, pct || 0) + ' 100" transform="rotate(-90 36 34)"/>' : '') +
      '<svg class="hb-ic" x="22" y="20" width="28" height="28" viewBox="0 0 24 24">' + SF.ICONS[m.icon] + '</svg>' +
      '<rect class="hb-plate" x="' + (36 - w / 2) + '" y="58" width="' + w + '" height="18" rx="9"/>' +
      '<text class="hb-num" x="36" y="71" text-anchor="middle">' + m.days + '</text></svg>';
  }
  R.badge = badge;

  /* Llama grande de la pantalla de racha: crece con el hito alcanzado */
  function heroArt(str) {
    const lv = R.level(str.current);
    const icon = str.status === 'lost' ? 'flame-off' : lv ? lv.icon : 'flame';
    const dot = (x, y, r, c) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="var(--' + c + ')"/>';
    return '<svg class="streak-art ' + str.status + '" viewBox="0 0 200 144" aria-hidden="true" focusable="false">' +
      '<circle class="sa-halo" cx="100" cy="72" r="66"/><circle class="sa-disc" cx="100" cy="72" r="47"/>' +
      '<svg class="sa-flame" x="66" y="37" width="68" height="68" viewBox="0 0 24 24">' + SF.ICONS[icon] + '</svg>' +
      (str.status === 'on' ? dot(30, 34, 5, 'primary') + dot(168, 30, 4, 'warning') + dot(174, 108, 5, 'primary') + dot(26, 104, 4, 'success') : '') + '</svg>';
  }

  const pctTo = (m, current) => Math.min(100, Math.round(current / m.days * 100));

  /* Botón de Hoy, junto a Avisos */
  R.headerButton = function () {
    const str = R.get();
    const label = str.status === 'on' ? str.current + ' ' + seguidos(str.current) + '. Hoy ya cuenta'
      : str.status === 'wait' ? str.current + ' ' + seguidos(str.current) + '. Termina una sesión hoy para mantenerla'
        : str.status === 'lost' ? 'se terminó. Empieza otra hoy' : 'empieza hoy';
    return '<button type="button" class="icon-label" data-act="go" data-to="racha">' +
      '<span class="icon-btn filled streak-btn ' + str.status + '" aria-hidden="true">' + I(str.status === 'lost' ? 'flame-off' : 'flame') +
      (str.current ? '<span class="dot">' + str.current + '</span>' : '') + '</span>Racha<span class="sr-only">: ' + label + '</span></button>';
  };

  /* Fila del Resumen del día */
  R.summaryRow = function () {
    const str = R.get();
    const txt = str.status === 'on' ? 'Racha de ' + dias(str.current) + ' · hoy ya cuenta'
      : str.status === 'wait' ? 'Racha de ' + dias(str.current) + ' · falta una sesión hoy'
        : 'Termina una sesión hoy y empieza una racha';
    return '<button type="button" class="week-bar" data-act="go" data-to="racha">' + I(str.doneToday ? 'flame-check' : 'flame', 18) + '<span class="grow">' + txt + '</span>' + I('chevron-right', 18) + '</button>';
  };

  /* Semana actual (lunes a domingo) */
  function weekStrip(str) {
    const mon = D.monday(D.TODAY);
    return '<ol class="streak-week" aria-label="Esta semana">' + ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((l, i) => {
      const d = D.add(mon, i);
      const done = str.set.has(d), n = D.diff(d, D.TODAY);
      const cls = done ? 'done' : n === 0 ? 'now' : n > 0 ? 'future' : 'miss';
      const say = D.long(d) + ': ' + (done ? 'cumplido' : n === 0 ? 'hoy, pendiente' : n > 0 ? 'por venir' : 'sin actividad');
      return '<li class="' + cls + (n === 0 ? ' today' : '') + '"><span class="sw-l" aria-hidden="true">' + l + '</span><span class="sw-c" aria-hidden="true">' + (n > 0 ? '' : I(done || n === 0 ? 'flame' : 'minus', 18)) + '</span><span class="sr-only">' + say + '</span></li>';
    }).join('') + '</ol>';
  }

  /* Últimas 4 semanas, alineadas de lunes a domingo; los días seguidos se unen */
  function calendar(str) {
    const start = D.add(D.monday(D.TODAY), -21);
    let cells = '';
    for (let i = 0; i < 28; i++) {
      const d = D.add(start, i), n = D.diff(d, D.TODAY);
      const done = str.set.has(d);
      const cls = [done ? 'done' : '', n === 0 ? 'today' : '', n > 0 ? 'future' : '',
        done && (i % 7 === 0 || !str.set.has(D.add(d, -1))) ? 'start' : '', done && (i % 7 === 6 || !str.set.has(D.add(d, 1))) ? 'end' : ''].filter(Boolean).join(' ');
      cells += '<li' + (cls ? ' class="' + cls + '"' : '') + '><span class="t-num" aria-hidden="true">' + D.parse(d).getDate() + '</span><span class="sr-only">' + D.long(d) + (done ? ', cumplido' : n === 0 ? ', hoy' : '') + '</span></li>';
    }
    return '<div class="card streak-cal"><div class="streak-dow" aria-hidden="true">' + ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((x) => '<span>' + x + '</span>').join('') + '</div>' +
      '<ol class="streak-grid">' + cells + '</ol>' +
      '<div class="streak-legend t-xs t-2" aria-hidden="true"><span><i class="done"></i>Día cumplido</span><span><i class="today"></i>Hoy</span></div></div>';
  }

  function hitoState(m, str) { const nx = R.next(str.best); return str.best >= m.days ? 'done' : nx && nx.days === m.days ? 'next' : 'locked'; }
  function hitosHtml(str) {
    return '<div class="hitos-grid">' + HITOS.map((m, i) => {
      const st = hitoState(m, str);
      const left = m.days - str.current;
      const sub = st === 'done' ? 'Conseguido' : st === 'next' ? (left === 1 ? 'Falta 1 día' : 'Faltan ' + left) : dias(m.days);
      const wide = i === HITOS.length - 1;
      return '<button type="button" class="card tap hito ' + st + (wide ? ' wide' : '') + '" data-act="racha-hito" data-d="' + m.days + '" aria-haspopup="dialog">' +
        badge(m, st, pctTo(m, str.current)) +
        '<span class="hito-txt"><b>' + m.name + '</b><span class="hito-sub">' + (st === 'done' ? I('check', 12) : st === 'locked' ? I('lock', 11) : '') + sub + '</span>' + (st === 'locked' ? '<span class="sr-only">, por conseguir</span>' : '<span class="sr-only">, ' + dias(m.days) + '</span>') +
        (wide ? '<span class="t-xs t-2">' + m.desc + '</span>' : '') + '</span>' + (wide ? I('chevron-right', 18, 't-3') : '') + '</button>';
    }).join('') + '</div>';
  }

  /* ================================================================
     PANTALLA · Mi racha
     ================================================================ */
  SF.screens.racha = {
    title: () => 'Mi racha',
    render() {
      const str = R.get();
      const nx = R.next(str.current);
      const got = HITOS.filter((m) => str.best >= m.days).length;
      const note = str.status === 'on' ? '<div class="callout success">' + I('flame-check', 18) + '<span>Hoy ya cuenta. Vuelve mañana para llegar a ' + dias(str.current + 1) + '.</span></div>'
        : str.status === 'wait' ? '<div class="callout warning">' + I('flame', 18) + '<span>Termina una sesión de estudio hoy para llegar a ' + dias(str.current + 1) + '.</span></div>'
          : str.status === 'lost' ? '<div class="callout danger">' + I('flame-off', 18) + '<span>Tu racha de ' + dias(str.lastRun) + ' terminó el ' + D.short(str.last) + '. Hoy puedes empezar otra.</span></div>'
            : '<div class="callout info">' + I('flame', 18) + '<span>Termina tu primera sesión de estudio para empezar tu racha.</span></div>';

      return C.topbar('Mi racha', { back: true, right: '<button type="button" class="icon-btn" data-act="racha-share" aria-label="Compartir mi racha">' + I('share', 20) + '</button>' }) +
        '<div class="screen-body stagger">' +

        '<article class="card hero streak-hero">' + heroArt(str) +
        '<p class="streak-num t-num"><b>' + str.current + '</b><span>' + seguidos(str.current) + '</span></p>' +
        weekStrip(str) + note + '</article>' +

        '<section class="card stat-row streak-stats" aria-label="Resumen de tu racha">' +
        [['flame', str.current, 'Actual'], ['flag', str.best, 'Récord'], ['calendar-check', str.total, 'Días totales']].map(([ic, v, l]) => '<div>' + I(ic, 18, 't-primary') + '<b class="t-num">' + v + '</b><span>' + l + '</span></div>').join('') +
        '</section>' +

        '<section class="stack-sm" aria-labelledby="h-next-hito"><div class="section-head"><h2 id="h-next-hito">Próximo hito</h2></div>' +
        (nx ? '<button type="button" class="card tap next-hito" data-act="racha-hito" data-d="' + nx.days + '">' + badge(nx, str.best >= nx.days ? 'done' : 'next', pctTo(nx, str.current)) +
          '<span class="grow stack-sm"><span class="hrow between"><b>' + nx.name + '</b><span class="t-sm t-2 t-num">' + str.current + ' de ' + nx.days + '</span></span>' +
          '<span class="progress" role="progressbar" aria-label="Avance hacia ' + nx.name + '" aria-valuemin="0" aria-valuemax="' + nx.days + '" aria-valuenow="' + str.current + '"><i style="--v:' + pctTo(nx, str.current) + '%"></i></span>' +
          '<span class="t-sm t-2">Te ' + (nx.days - str.current === 1 ? 'falta 1 día' : 'faltan ' + (nx.days - str.current) + ' días') + '</span></span></button>'
          : '<div class="callout success">' + I('flame-rays', 18) + '<span>Tienes todos los hitos. Cada día que sumes mejora tu récord.</span></div>') + '</section>' +

        '<section class="stack-sm" aria-labelledby="h-hitos"><div class="section-head"><h2 id="h-hitos">Hitos</h2><span class="badge-count">' + got + ' de ' + HITOS.length + '</span></div>' + hitosHtml(str) + '</section>' +

        '<section class="stack-sm" aria-labelledby="h-cal"><div class="section-head"><h2 id="h-cal">Últimas 4 semanas</h2></div>' + calendar(str) + '</section>' +

        '</div>' +
        '<footer class="screen-foot row streak-foot"><button type="button" class="btn btn-secondary" data-act="racha-share">' + I('share', 18) + 'Compartir</button>' +
        '<button type="button" class="btn btn-primary" data-act="tab" data-tab="hoy">' + I('zap', 18) + (str.doneToday ? 'Ir a Hoy' : 'Ir a estudiar') + '</button></footer>';
    }
  };

  /* Detalle de un hito */
  SF.act['racha-hito'] = (el) => {
    const m = hito(Number(el.dataset.d)); if (!m) return;
    const str = R.get();
    const st = hitoState(m, str);
    const done = st === 'done';
    const left = m.days - str.current;
    ui.sheet({
      title: m.name, sub: dias(m.days) + ' seguidos',
      body: '<div class="hito-hero">' + badge(m, st, pctTo(m, str.current)) + '</div><p class="t-center t-2">' + u.esc(m.desc) + '</p>' +
        (done ? '<div class="callout success">' + I('circle-check', 18) + '<span>Conseguido' + (str.hits[m.days] ? ' el ' + D.long(str.hits[m.days]) : '') + '.</span></div>'
          : '<div class="stack-sm"><div class="progress"><i style="--v:' + pctTo(m, str.current) + '%"></i></div><p class="t-sm t-2 hrow between"><span>' + str.current + ' de ' + dias(m.days) + '</span><span>' + (left === 1 ? 'Falta 1 día' : 'Faltan ' + left + ' días') + '</span></p></div>'),
      foot: done ? '<button type="button" class="btn btn-primary btn-block" data-share>' + I('share', 18) + 'Compartir este hito</button>' : '<button type="button" class="btn btn-secondary btn-block" data-close>Entendido</button>',
      mount(sh, ly) { sh.addEventListener('click', (e) => { if (e.target.closest('[data-share]')) { ly.close(); share(m); } }); }
    });
  };

  /* ================================================================
     COMPARTIR
     ================================================================ */
  SF.act['racha-share'] = () => share(null);

  /* Qué se comparte: un hito, la racha actual o, si está en cero, el récord */
  function shareData(m) {
    const str = R.get();
    const nx = R.next(str.current);
    if (m) return { str, n: m.days, label: 'días seguidos', mark: m, tag: 'Hito «' + m.name + '»', text: 'Conseguí el hito «' + m.name + '» en StudyFlow: ' + m.days + ' días seguidos estudiando.' };
    if (str.current) return {
      str, n: str.current, label: seguidos(str.current), mark: R.level(str.current), tag: nx ? (nx.days - str.current === 1 ? 'A 1 día' : 'A ' + (nx.days - str.current) + ' días') + ' de «' + nx.name + '»' : 'Todos los hitos conseguidos',
      text: 'Llevo ' + str.current + ' ' + seguidos(str.current) + ' estudiando con StudyFlow. Mi récord: ' + dias(str.best) + '.'
    };
    return { str, n: str.best, label: seguidos(str.best), mark: R.level(str.best), tag: 'Mi récord', text: 'Mi récord en StudyFlow es de ' + str.best + ' ' + seguidos(str.best) + ' estudiando.' };
  }

  function share(m) {
    if (!R.get().best) { ui.toast('Termina tu primera sesión para tener una racha que compartir', { icon: 'flame' }); return; }
    const data = shareData(m);
    const file = 'studyflow-racha-' + data.n + '-dias.png';
    const native = !!navigator.share;
    let blob = null, url = null;
    ui.$$('.toast', ui.$('#toasts')).forEach((t) => t.remove()); // que ningún aviso tape los botones
    ui.sheet({
      title: m ? 'Compartir hito' : 'Compartir mi racha', sub: 'Así se verá tu imagen',
      body: '<div class="share-prev"><div class="skel"></div></div><p class="card soft tight t-sm">' + u.esc(data.text) + '</p>',
      foot: (native ? '<button type="button" class="btn btn-primary btn-block" data-s="native" disabled>' + I('share', 18) + 'Compartir</button>' : '') +
        '<div class="share-btns"><button type="button" class="btn ' + (native ? 'btn-secondary' : 'btn-primary') + '" data-s="save" disabled>' + I('download', 18) + 'Guardar imagen</button>' +
        '<button type="button" class="btn btn-secondary" data-s="copy">' + I('copy', 18) + 'Copiar texto</button></div>',
      onClose: () => { if (url) setTimeout(() => URL.revokeObjectURL(url), 1500); },
      mount(el) {
        const box = el.querySelector('.share-prev');
        drawCard(data).then((b) => {
          if (!el.isConnected) return;
          blob = b; url = URL.createObjectURL(b);
          box.innerHTML = '<img src="' + url + '" alt="' + u.esc(data.text) + '">';
          el.querySelectorAll('[data-s]').forEach((x) => { x.disabled = false; });
        }).catch((e) => {
          console.error(e);
          box.innerHTML = '<div class="callout warning">' + I('alert-triangle', 18) + '<span>No pudimos crear la imagen en este dispositivo. Puedes compartir el texto.</span></div>';
          const nb = el.querySelector('[data-s="native"]'); if (nb) nb.disabled = false;
        });
        el.addEventListener('click', async (e) => {
          const b = e.target.closest('[data-s]'); if (!b) return;
          if (b.dataset.s === 'native') {
            const payload = { title: 'Mi racha en StudyFlow', text: data.text };
            try {
              const f = blob && new File([blob], file, { type: 'image/png' });
              if (f && navigator.canShare && navigator.canShare({ files: [f] })) payload.files = [f];
              await navigator.share(payload);
              ui.toast('Racha compartida', { icon: 'share' });
            } catch (err) {
              if (err && err.name !== 'AbortError') ui.toast('No pudimos abrir el menú de compartir. Guarda la imagen o copia el texto.', { icon: 'info' });
            }
          }
          if (b.dataset.s === 'save' && url) {
            const a = document.createElement('a');
            a.href = url; a.download = file;
            document.body.appendChild(a); a.click(); a.remove();
            ui.toast('Imagen guardada en tus descargas', { icon: 'download' });
          }
          if (b.dataset.s === 'copy') {
            try { await navigator.clipboard.writeText(data.text); ui.toast('Texto copiado', { icon: 'copy' }); }
            catch (err) { ui.toast('No pudimos copiar. Selecciona el texto y cópialo a mano.', { icon: 'info' }); }
          }
        });
      }
    });
  }

  /* Imagen 1080×1350 dibujada solo con vectores y los tokens del tema activo
     (así también funciona al abrir index.html con doble clic). */
  async function drawCard(d) {
    try { await Promise.all([document.fonts.load('800 100px Manrope'), document.fonts.load('600 40px Manrope')]); } catch (e) { /* usa la fuente del sistema */ }
    const W = 1080, H = 1350;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    const css = getComputedStyle(document.body);
    const tk = (n) => css.getPropertyValue('--' + n).trim();
    const font = css.getPropertyValue('--font').trim() || 'sans-serif';
    const str = d.str;

    const box = (bx, by, w, h, r, fill, stroke, lw) => {
      x.beginPath();
      x.moveTo(bx + r, by); x.arcTo(bx + w, by, bx + w, by + h, r); x.arcTo(bx + w, by + h, bx, by + h, r); x.arcTo(bx, by + h, bx, by, r); x.arcTo(bx, by, bx + w, by, r); x.closePath();
      if (fill) { x.fillStyle = fill; x.fill(); }
      if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw || 2; x.stroke(); }
    };
    const disc = (cx, cy, r, fill, stroke, lw) => { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw; x.stroke(); } };
    const text = (t, tx, ty, size, weight, color, align, max) => {
      x.font = weight + ' ' + size + 'px ' + font; x.fillStyle = color; x.textAlign = align || 'center'; x.textBaseline = 'alphabetic';
      if (max) while (size > 18 && x.measureText(t).width > max) { size -= 2; x.font = weight + ' ' + size + 'px ' + font; }
      x.fillText(t, tx, ty);
    };
    const icon = (name, cx, cy, size, color, tint) => {
      const k = size / 24;
      x.save(); x.translate(cx - size / 2, cy - size / 2); x.scale(k, k);
      x.lineWidth = 2; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = color; x.fillStyle = color;
      (SF.ICONS[name].match(/ d="[^"]+"/g) || []).forEach((p) => {
        const path = new Path2D(p.slice(4, -1));
        if (tint) { x.globalAlpha = tint; x.fill(path); x.globalAlpha = 1; }
        x.stroke(path);
      });
      x.restore();
    };

    /* Fondo y tarjeta */
    x.fillStyle = tk('bg'); x.fillRect(0, 0, W, H);
    const glow = x.createRadialGradient(W, 0, 0, W, 0, 1100);
    glow.addColorStop(0, tk('primary') + '38'); glow.addColorStop(1, tk('primary') + '00');
    x.fillStyle = glow; x.fillRect(0, 0, W, H);
    box(60, 60, 960, 1230, 64, tk('surface'), tk('border'), 3);

    /* Cabecera */
    box(116, 116, 84, 84, 26, tk('primary-soft'));
    icon('book-open', 158, 158, 46, tk('primary-text'), .16);
    text('StudyFlow', 224, 172, 42, 700, tk('text'), 'left');
    const name = u.firstName(S().profile.name);
    text(name ? 'Racha de ' + name : 'Mi racha', 964, 172, 34, 600, tk('text-2'), 'right', 420);

    /* Insignia */
    const mk = d.mark;
    const col = tk(mk ? mk.color : 'primary'), soft = tk(mk && mk.color !== 'primary' ? mk.color + '-soft' : 'primary-soft');
    const solid = mk && mk.solid;
    const shape = new Path2D(rosette(540, 440, 196, mk || { lobes: 8, amp: 0 }));
    x.fillStyle = solid ? col : soft; x.fill(shape);
    x.strokeStyle = col; x.lineWidth = 12; x.lineJoin = 'round'; x.stroke(shape);
    disc(540, 440, 132, solid ? col : tk('surface'), (solid ? tk('on-primary') : col) + '55', 6);
    icon(mk ? mk.icon : 'flame', 540, 440, 168, solid ? tk('on-primary') : col, .18);

    /* Número */
    text(String(d.n), 540, 820, 190, 800, tk('text'));
    text(d.label, 540, 886, 48, 600, tk('text-2'));
    x.font = '700 32px ' + font;
    const pw = x.measureText(d.tag).width + 64;
    box(540 - pw / 2, 916, pw, 62, 31, tk('primary-soft'));
    text(d.tag, 540, 958, 32, 700, tk('primary-text'));

    /* Semana */
    const mon = D.monday(D.TODAY);
    ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach((l, i) => {
      const cx = 180 + i * 120, day = D.add(mon, i), ok = str.set.has(day);
      text(l, cx, 1034, 28, 700, day === D.TODAY ? tk('primary-text') : tk('text-3'));
      disc(cx, 1090, 40, ok ? tk('primary') : tk('surface-2'), day === D.TODAY && !ok ? tk('primary') : null, 5);
      if (ok) icon('flame', cx, 1090, 42, tk('on-primary'), .2);
    });

    /* Cifras */
    x.fillStyle = tk('border'); x.fillRect(116, 1160, 848, 3);
    [['Récord', dias(str.best)], ['Días totales', dias(str.total)], ['Hitos', HITOS.filter((m) => str.best >= m.days).length + ' de ' + HITOS.length]].forEach(([l, v], i) => {
      text(v, 252 + i * 288, 1218, 40, 700, tk('text'));
      text(l, 252 + i * 288, 1258, 28, 600, tk('text-2'));
    });

    return new Promise((ok, no) => cv.toBlob((b) => (b ? ok(b) : no(new Error('Imagen vacía'))), 'image/png'));
  }
  R.drawCard = (m) => drawCard(shareData(m || null));
})(window.SF);
