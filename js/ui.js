/* =========================================================
   StudyFlow · Interfaz compartida
   Avisos, hojas, diálogos, cargas, banner push, ilustraciones
   y la delegación de eventos con data-act.
   ========================================================= */
window.SF = window.SF || {};
(function (SF) {
  const { u } = SF;
  const ui = {};
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  ui.$ = $; ui.$$ = $$;
  SF.act = SF.act || {};

  let app, overlayRoot, toastRegion, live;
  const stack = [];

  ui.init = function () {
    app = $('#app');
    overlayRoot = $('#overlays');
    toastRegion = $('#toasts');
    live = $('#live');

    // Delegación de clics
    app.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn, .chip, .icon-btn, .row, .option, .tab');
      if (btn && !btn.disabled) ui.ripple(btn, e);
      const el = e.target.closest('[data-act]');
      if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
      const name = el.dataset.act;
      const fn = SF.act[name];
      if (fn) { if (el.type !== 'checkbox') e.preventDefault(); fn(el, e); }
      else console.warn('Acción sin definir:', name);
    });
    // Teclado: Escape cierra la capa superior
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && stack.length) { const top = stack[stack.length - 1]; if (top.dismissible !== false) top.dismiss(); }
      if (e.key === 'Tab' && stack.length) ui.trap(e, stack[stack.length - 1].el);
      ui.arrows(e);
    });
  };

  ui.announce = function (msg) { if (!live) return; live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 30); };

  ui.ripple = function (el, e) {
    if (!el.classList.contains('btn') || el.classList.contains('btn-xs')) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.width = s.style.height = size + 'px';
    s.style.left = ((e.clientX || r.left + r.width / 2) - r.left - size / 2) + 'px';
    s.style.top = ((e.clientY || r.top + r.height / 2) - r.top - size / 2) + 'px';
    el.appendChild(s);
    setTimeout(() => s.remove(), 560);
  };

  /* Flechas, Inicio y Fin mueven el foco dentro de opciones (radio) y pestañas. */
  ui.arrows = function (e) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: 'first', End: 'last' }[e.key];
    const cur = e.target.closest && e.target.closest('[role="radio"], [role="tab"]');
    if (!step || !cur) return;
    const group = cur.closest('[role="radiogroup"], [role="tablist"]');
    if (!group || !app.contains(group)) return;
    const items = $$('[role="radio"], [role="tab"]', group).filter((x) => !x.disabled && x.offsetParent !== null);
    const i = items.indexOf(cur);
    const next = step === 'first' ? items[0] : step === 'last' ? items[items.length - 1] : items[(i + step + items.length) % items.length];
    e.preventDefault();
    if (next) next.focus();
  };

  /* Desplazamiento suave solo si la persona no pidió reducir el movimiento */
  ui.motion = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

  ui.trap = function (e, root) {
    const f = $$('button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', root).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    const act = document.activeElement;
    if (!root.contains(act) && (act === document.body || app.contains(act))) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  /* Evita repetir una acción mientras sigue en marcha (doble toque) */
  ui.once = (fn) => { let on = false; return async (...a) => { if (on) return; on = true; try { return await fn(...a); } finally { on = false; } }; };

  /* ---------- Toast ---------- */
  /* Coloca la región de avisos por encima de la barra de pestañas, del pie de la pantalla o de la hoja abierta */
  ui.placeToasts = function () {
    if (!toastRegion || !app) return;
    let base = SF.router && SF.router.hasTabbar() ? 98 : 24;
    let sheet = null;
    for (let i = stack.length - 1; i >= 0; i--) { if (stack[i].el && stack[i].el.classList.contains('sheet')) { sheet = stack[i].el; break; } }
    if (sheet) base = Math.min(sheet.offsetHeight + 8, app.offsetHeight - 120);
    else {
      const cur = SF.router && SF.router.current && SF.router.current();
      if (cur && cur.el) {
        $$('.screen-foot, .chat-foot, .fab', cur.el).forEach((x) => {
          if (!x.offsetHeight) return;
          let top = x.offsetTop, p = x.offsetParent;
          while (p && p !== cur.el && p !== document.body) { top += p.offsetTop; p = p.offsetParent; }
          base = Math.max(base, cur.el.offsetHeight - top + 8);
        });
      }
    }
    toastRegion.style.bottom = base + 'px';
  };

  ui.toast = function (msg, opts) {
    opts = opts || {};
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = (opts.icon !== false ? '<span class="toast-ic">' + SF.icon(opts.icon || 'circle-check', 20) + '</span>' : '') +
      '<span class="toast-msg">' + u.esc(msg) + '</span>' +
      (opts.action ? '<button class="toast-act" type="button">' + u.esc(opts.action) + '</button>' : '');
    // Solo un toast a la vez: sustituye al anterior
    $$('.toast', toastRegion).forEach((x) => x.remove());
    toastRegion.appendChild(t);
    ui.placeToasts();
    let done = false, timer = null;
    const ms = opts.duration || (opts.action ? 8000 : 4500);
    const close = () => { if (done) return; done = true; clearTimeout(timer); t.classList.add('out'); setTimeout(() => t.remove(), 260); };
    const arm = () => { clearTimeout(timer); timer = setTimeout(close, ms); };
    ['pointerenter', 'focusin'].forEach((ev) => t.addEventListener(ev, () => clearTimeout(timer)));
    ['pointerleave', 'focusout'].forEach((ev) => t.addEventListener(ev, arm));
    if (opts.action) t.querySelector('.toast-act').addEventListener('click', () => { close(); opts.onAction && opts.onAction(); });
    t.addEventListener('click', (e) => { if (!e.target.closest('.toast-act')) close(); });
    arm();
    return { close };
  };

  /* ---------- Capas (hoja / diálogo) ---------- */
  function openLayer(build, opts) {
    opts = opts || {};
    const prevFocus = document.activeElement;
    const scrim = document.createElement('div');
    scrim.className = 'scrim';
    const el = build();
    overlayRoot.append(scrim, el);
    requestAnimationFrame(() => requestAnimationFrame(() => { scrim.classList.add('in'); el.classList.add('in'); }));
    const layer = {
      el, dismissible: opts.dismissible !== false,
      close(value) {
        if (layer.closed) return; layer.closed = true;
        scrim.classList.remove('in'); el.classList.remove('in');
        const i = stack.indexOf(layer); if (i > -1) stack.splice(i, 1);
        ui.placeToasts();
        setTimeout(() => { scrim.remove(); el.remove(); }, 320);
        if (prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus({ preventScroll: true });
        opts.onClose && opts.onClose(value);
      },
      /* Cierre pedido por la persona (X, velo, Esc, arrastrar, atrás): puede pedir confirmación */
      async dismiss() {
        if (layer.closed || layer.asking) return;
        if (opts.guard) { layer.asking = true; const ok = await opts.guard(); layer.asking = false; if (!ok) return; }
        layer.close();
      }
    };
    if (layer.dismissible) scrim.addEventListener('click', () => layer.dismiss());
    stack.push(layer);
    ui.placeToasts();
    setTimeout(() => {
      const f = el.querySelector('[autofocus]') || el.querySelector('.sheet-body button, .sheet-body input, button, input');
      if (f) f.focus({ preventScroll: true });
    }, 60);
    return layer;
  }
  ui.layers = () => stack.length;
  ui.closeAll = () => stack.slice().forEach((l) => l.close());
  ui.dismissTop = () => { const top = stack[stack.length - 1]; if (top && top.dismissible !== false) top.dismiss(); };

  /* Hoja inferior. content: HTML. Devuelve la capa. */
  ui.sheet = function (opts) {
    let layer;
    layer = openLayer(() => {
      const s = document.createElement('section');
      s.className = 'sheet';
      s.setAttribute('role', 'dialog');
      s.setAttribute('aria-modal', 'true');
      s.setAttribute('aria-label', opts.title || opts.label || 'Opciones');
      s.innerHTML = '<div class="grabber" aria-hidden="true"></div>' +
        (opts.title ? '<header class="sheet-head"><div class="grow"><h2>' + u.esc(opts.title) + '</h2>' + (opts.sub ? '<p class="t-sm t-2" style="margin-top:4px">' + u.esc(opts.sub) + '</p>' : '') + '</div><button class="icon-btn" type="button" data-close aria-label="Cerrar">' + SF.icon('x') + '</button></header>' : '') +
        '<div class="sheet-body">' + (opts.body || '') + '</div>' +
        (opts.foot ? '<div class="sheet-foot">' + opts.foot + '</div>' : '');
      s.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) layer.dismiss(); });
      // Arrastrar hacia abajo para cerrar
      const grab = s.querySelector('.grabber');
      let y0 = null;
      const head = s.querySelector('.sheet-head') || grab;
      [grab, head].forEach((h) => h && h.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; y0 = e.clientY; s.style.transition = 'none'; h.setPointerCapture(e.pointerId); }));
      [grab, head].forEach((h) => h && h.addEventListener('pointermove', (e) => { if (y0 == null) return; const dy = Math.max(0, e.clientY - y0); s.style.transform = 'translateY(' + dy + 'px)'; }));
      [grab, head].forEach((h) => h && h.addEventListener('pointerup', (e) => { if (y0 == null) return; const dy = e.clientY - y0; y0 = null; s.style.transition = ''; s.style.transform = ''; if (dy > 90) layer.dismiss(); }));
      return s;
    }, opts);
    // Un cuerpo con desplazamiento y sin controles dentro debe poder recorrerse con el teclado
    const sbody = layer.el.querySelector('.sheet-body');
    if (sbody && !sbody.querySelector('button, input, select, textarea, a[href], summary, [tabindex]')) sbody.setAttribute('tabindex', '0');
    if (opts.mount) opts.mount(layer.el, layer);
    return layer;
  };

  /* Diálogo de confirmación. Devuelve una promesa con el valor del botón. */
  ui.dialog = function (opts) {
    return new Promise((resolve) => {
      let layer;
      const id = u.uid('dlg');
      layer = openLayer(() => {
        const d = document.createElement('section');
        d.className = 'dialog';
        d.setAttribute('role', 'alertdialog');
        d.setAttribute('aria-modal', 'true');
        d.setAttribute('aria-labelledby', id + 't');
        d.setAttribute('aria-describedby', id + 'b' + (opts.list ? ' ' + id + 'l' : ''));
        d.innerHTML = (opts.top || '') + (opts.icon ? '<div class="dlg-icon ' + (opts.tone || '') + '">' + SF.icon(opts.icon, 26) + '</div>' : '') +
          '<h2 id="' + id + 't">' + u.esc(opts.title) + '</h2>' +
          '<p id="' + id + 'b">' + (opts.html || u.esc(opts.body || '')) + '</p>' +
          (opts.list && opts.list.length ? '<ul class="dlg-list" id="' + id + 'l">' + opts.list.map((x) => '<li>' + u.esc(x) + '</li>').join('') + '</ul>' : '') +
          '<div class="dlg-actions">' + (opts.actions || [{ label: 'Aceptar', kind: 'primary', value: true }]).map((a, i) =>
            '<button type="button" class="btn btn-' + (a.kind || 'secondary') + '" data-v="' + i + '"' + (a.autofocus ? ' autofocus' : '') + '>' + u.esc(a.label) + '</button>').join('') + '</div>';
        d.addEventListener('click', (e) => {
          const b = e.target.closest('[data-v]');
          if (!b) return;
          const a = opts.actions[Number(b.dataset.v)];
          layer.close(a.value);
        });
        return d;
      }, Object.assign({}, opts, { onClose: (v) => resolve(v === undefined ? (opts.cancelValue !== undefined ? opts.cancelValue : null) : v) }));
    });
  };

  /* Confirmación antes de eliminar o modificar algo importante.
     Devuelve true solo si se confirma; el foco empieza en «Cancelar». */
  ui.confirm = async (o) => (await ui.dialog({
    icon: o.icon || (o.danger ? 'trash' : 'pencil'), tone: o.danger ? 'danger' : o.tone || '', title: o.title, body: o.body, list: o.list,
    actions: [{ label: o.cancel || 'Cancelar', kind: 'secondary', value: false }, { label: o.ok || 'Confirmar', kind: o.danger ? 'danger' : 'primary', value: true }], cancelValue: false
  })) === true;

  /* ---------- Pantallas de carga ---------- */
  ui.loading = function (opts) {
    const el = document.createElement('div');
    el.className = 'loading-screen';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    const steps = opts.steps || [];
    el.innerHTML = (opts.top || '<div class="spinner" aria-hidden="true"></div>') +
      '<div class="stack-sm"><p class="t-h2">' + u.esc(opts.title || 'Cargando…') + '</p>' + (opts.sub ? '<p class="t-2">' + u.esc(opts.sub) + '</p>' : '') + '</div>' +
      (steps.length ? '<ol class="load-steps">' + steps.map((s) => '<li><span class="ls-ic">' + SF.icon('check', 14) + '</span>' + u.esc(s) + '</li>').join('') + '</ol>' : '');
    app.appendChild(el);
    const lis = $$('.load-steps li', el);
    const per = (opts.duration || 1400) / Math.max(1, steps.length);
    const run = async () => {
      for (let i = 0; i < lis.length; i++) {
        lis[i].classList.add('now');
        await u.sleep(per);
        lis[i].classList.remove('now'); lis[i].classList.add('done');
      }
      if (!lis.length) await u.sleep(opts.duration || 900);
      await u.sleep(160);
    };
    const p = run();
    return {
      el,
      done: p,
      close() { el.classList.add('out'); setTimeout(() => el.remove(), 260); }
    };
  };

  /* ---------- Banner de notificación push (simulado) ---------- */
  ui.push = function (n) {
    $$('.push', app).forEach((x) => x.remove());
    const el = document.createElement('div');
    el.className = 'push';
    el.setAttribute('role', 'alert');
    el.innerHTML =
      '<div class="push-app"><img src="assets/img/icon-192.png" alt=""><span>StudyFlow · ' + u.esc(n.tag || 'Primero') + '</span><span style="margin-left:auto">ahora</span></div>' +
      '<button type="button" class="push-main" style="display:block;width:100%;text-align:left;padding-top:6px" aria-expanded="false">' +
      '<p class="t-bold">' + u.esc(n.title) + '</p><p class="t-sm t-2">' + u.esc(n.body) + '</p></button>' +
      '<div class="push-actions" hidden style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">' +
      '<button type="button" class="btn btn-sm btn-primary" data-p="open">Abrir</button>' +
      '<button type="button" class="btn btn-sm btn-secondary" data-p="snooze">Posponer</button></div>' +
      '<div class="push-snooze" hidden style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
      ['5', '10', '15'].map((m) => '<button type="button" class="chip sm" data-p="s' + m + '">' + m + ' min</button>').join('') +
      '<button type="button" class="chip sm" data-p="cancel">Cancelar</button></div>';
    app.appendChild(el);
    let timer = setTimeout(close, 9000);
    ['pointerenter', 'focusin'].forEach((ev) => el.addEventListener(ev, () => clearTimeout(timer)));
    el.addEventListener('pointerleave', () => { clearTimeout(timer); if (el.querySelector('.push-actions').hidden && el.querySelector('.push-snooze').hidden) timer = setTimeout(close, 6000); });
    function close() { clearTimeout(timer); el.classList.add('out'); setTimeout(() => el.remove(), 280); }
    const main = el.querySelector('.push-main');
    main.addEventListener('click', () => {
      clearTimeout(timer);
      const acts = el.querySelector('.push-actions');
      const open = acts.hidden;
      acts.hidden = !open; main.setAttribute('aria-expanded', String(open));
      el.querySelector('.push-snooze').hidden = true;
    });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      const v = b.dataset.p;
      if (v === 'open') { close(); n.onOpen && n.onOpen(); }
      else if (v === 'snooze') { el.querySelector('.push-actions').hidden = true; el.querySelector('.push-snooze').hidden = false; }
      else if (v === 'cancel') { el.querySelector('.push-snooze').hidden = true; el.querySelector('.push-actions').hidden = false; }
      else if (v[0] === 's') { close(); ui.toast('Te lo recordamos en ' + v.slice(1) + ' min', { icon: 'bell' }); n.onSnooze && n.onSnooze(Number(v.slice(1))); }
    });
    // Deslizar hacia arriba para descartar
    let y0 = null;
    el.addEventListener('pointerdown', (e) => { if (e.target.closest('button[data-p]')) return; y0 = e.clientY; });
    el.addEventListener('pointerup', (e) => { if (y0 != null && y0 - e.clientY > 30) close(); y0 = null; });
    return { close };
  };

  /* ---------- Control segmentado: coloca la "píldora" ---------- */
  ui.segs = function (root) {
    $$('.seg', root).forEach((seg) => {
      let thumb = seg.querySelector('.seg-thumb');
      if (!thumb) { thumb = document.createElement('span'); thumb.className = 'seg-thumb'; thumb.setAttribute('aria-hidden', 'true'); seg.prepend(thumb); }
      const sel = seg.querySelector('[aria-selected="true"], [aria-checked="true"]');
      if (!sel) { thumb.style.opacity = '0'; return; }
      thumb.style.opacity = '1';
      thumb.style.width = sel.offsetWidth + 'px';
      thumb.style.transform = 'translateX(' + (sel.offsetLeft - 4) + 'px)';
    });
  };

  /* ---------- Ilustraciones: PNG generado (Codex) o SVG de respaldo ---------- */
  ui.illus = function (name, alt) {
    const svg = (SF.ILLUS && SF.ILLUS[name]) || '';
    return '<div class="illus" role="img" aria-label="' + u.esc(alt || '') + '">' +
      '<img src="assets/img/ilustraciones/' + name + '.png" alt="" loading="lazy" onerror="this.remove()" onload="this.nextElementSibling&&this.nextElementSibling.remove()">' +
      svg + '</div>';
  };

  SF.ui = ui;
})(window.SF);
