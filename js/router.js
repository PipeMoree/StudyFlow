/* =========================================================
   StudyFlow · Navegación
   Pila de pantallas con transiciones (empujar, volver,
   pestañas, modal), barra de pestañas y botón "Atrás" del
   navegador. Cada pantalla se registra en SF.screens.
   ========================================================= */
window.SF = window.SF || {};
(function (SF) {
  SF.screens = SF.screens || {};
  const { ui } = SF;
  const TABS = [
    { id: 'hoy', label: 'Hoy', icon: 'home', root: 'hoy' },
    { id: 'plan', label: 'Plan', icon: 'calendar-days', root: 'plan' },
    { id: 'registrar', label: 'Registrar', icon: 'plus-circle', root: 'registrar' },
    { id: 'asistente', label: 'Asistente', icon: 'message-circle', root: 'asistente' }
  ];

  let views, tabbar;
  let stack = [];
  let busy = false;
  const scrollMemo = {};

  const R = {};
  R.TABS = TABS;

  R.init = function () {
    views = ui.$('#views');
    tabbar = ui.$('#tabbar');
    tabbar.innerHTML = TABS.map((t) =>
      '<button type="button" class="tab" data-act="tab" data-tab="' + t.id + '" ' + (t.id === 'registrar' ? 'data-tour="tab-registrar"' : '') + ' aria-label="' + t.label + '">' +
      '<span class="tab-ic">' + SF.icon(t.icon, 22) + '</span><span>' + t.label + '</span></button>').join('');
    SF.act.tab = async (el) => { const id = el.dataset.tab, top = R.current(); const same = top && stack.length === 1 && SF.screens[top.name].tab === id; if (same || await R.canLeave()) R.tab(id); };
    SF.act.back = async () => { if (await R.canLeave()) R.back(); };
    SF.act.go = (el) => R.go(el.dataset.to, el.dataset.params ? JSON.parse(el.dataset.params) : {});

    window.addEventListener('popstate', () => {
      if (ui.layers()) { ui.dismissTop(); pushHistory(); return; }
      if (SF.tour && SF.tour.active()) { SF.tour.stop(); pushHistory(); return; }
      if (stack.length > 1) { const g = SF.screens[stack[stack.length - 1].name].guard; if (g) { pushHistory(); g(); } else if (SF.screens[stack[stack.length - 1].name].canLeave) { pushHistory(); SF.act.back(); } else R.back(true); }
      else { pushHistory(); const c = R.current(); const ss = SF.store.state.session; if (c && c.name !== 'hoy' && ss.loggedIn && ss.hasPlan) SF.act.back(); }
    });
    SF.store.on((state, meta) => { if (!meta.noRender) R.refresh(); });
  };

  function pushHistory() { try { history.pushState({ sf: Date.now() }, '', location.href); } catch (e) {} }
  function setHash(name) { try { history.replaceState(history.state, '', '#' + name); } catch (e) {} }

  function build(entry) {
    const def = SF.screens[entry.name];
    const el = document.createElement('section');
    el.className = 'screen' + (def.tab ? ' has-tabbar' : '');
    el.dataset.screen = entry.name;
    el.setAttribute('aria-label', def.title ? def.title(entry.params) : entry.name);
    el.innerHTML = def.render(entry.params || {}, entry);
    entry.el = el;
    return el;
  }
  function mount(entry) {
    const def = SF.screens[entry.name];
    ui.segs(entry.el);
    document.title = (def.title ? def.title(entry.params) + ' · ' : '') + 'StudyFlow';
    // Una zona con desplazamiento sin controles dentro debe poder recorrerse con el teclado
    const sb = entry.el.querySelector('.screen-body');
    if (sb && sb.scrollHeight > sb.clientHeight + 1 && !sb.querySelector('button, input, select, textarea, a[href], summary')) sb.setAttribute('tabindex', '0');
    if (def.mount) def.mount(entry.el, entry.params || {}, entry);
  }
  function unmount(entry) {
    const def = SF.screens[entry.name];
    if (def && def.unmount) def.unmount(entry.el, entry.params || {}, entry);
  }
  function updateTabbar() {
    const top = stack[stack.length - 1];
    const def = top && SF.screens[top.name];
    const tabId = def && def.tab;
    tabbar.classList.toggle('hidden', !tabId);
    ui.$$('.tab', tabbar).forEach((b) => {
      if (b.dataset.tab === tabId) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    const hasUnread = SF.M && SF.M.unread() > 0;
    ui.$$('.tab-badge', tabbar).forEach((x) => x.remove());
    if (hasUnread && SF.store.state.session.loggedIn) { /* el aviso vive en el botón de Hoy */ }
  }
  R.hasTabbar = () => !tabbar.classList.contains('hidden');

  function animate(inEl, outEl, kind, done) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const map = { push: ['enter-push', 'leave-push'], pop: ['enter-pop', 'leave-pop'], fade: ['enter-fade', 'leave-fade'], up: ['enter-up', 'leave-fade'], down: ['enter-fade', 'leave-down'], none: [null, null] };
    const [ci, co] = map[kind] || map.fade;
    if (kind === 'pop' || kind === 'down') { views.appendChild(inEl); if (outEl) views.appendChild(outEl); }
    else views.appendChild(inEl);
    if (kind === 'none' || reduce && kind === 'none') { if (outEl) outEl.remove(); done(); return; }
    if (ci) inEl.classList.add(ci);
    if (outEl && co) outEl.classList.add(co);
    const ms = kind === 'fade' ? 260 : 430;
    setTimeout(() => {
      if (ci) inEl.classList.remove(ci);
      if (outEl) outEl.remove();
      done();
    }, reduce ? 140 : ms);
  }

  /* ¿Se puede salir de la pantalla actual? (pregunta si hay cambios sin guardar) */
  let asking = false;
  R.canLeave = async function () {
    const top = stack[stack.length - 1];
    const def = top && SF.screens[top.name];
    if (!def || !def.canLeave) return true;
    if (asking) return false;
    asking = true;
    try { return await def.canLeave(top); } finally { asking = false; }
  };

  /* Ir a una pantalla. opts: { replace, reset, transition } */
  R.go = function (name, params, opts) {
    if (!SF.screens[name]) { console.warn('Pantalla desconocida', name); return; }
    opts = opts || {};
    const prev = stack[stack.length - 1];
    // Ignora el doble toque: la misma pantalla con los mismos datos no se vuelve a abrir
    if (prev && !opts.reset && !opts.replace && prev.name === name && JSON.stringify(prev.params) === JSON.stringify(params || {})) return prev;
    if (prev && prev.el) scrollMemo[prev.name] = (prev.el.querySelector('.screen-body') || {}).scrollTop || 0;
    const entry = { name, params: params || {} };
    let kind = opts.transition || 'push';
    if (opts.reset) { stack.forEach((e) => { if (e !== prev) { unmount(e); e.el && e.el.remove(); } }); stack = []; }
    else if (opts.replace && prev) { stack.pop(); }
    if (prev) unmount(prev);
    stack.push(entry);
    const el = build(entry);
    ui.closeAll();
    animate(el, prev && prev.el ? prev.el : null, prev && prev.el ? kind : 'none', () => {});
    mount(entry);
    updateTabbar();
    ui.placeToasts();
    setHash(name);
    if (!opts.replace && !opts.reset) pushHistory();
    focusScreen(el);
    const st = SF.store.state;
    if (SF.screens[name].tab) SF.store.commit((s) => { s.session.lastNav = { name, params: entry.params }; }, { silent: true });
    return entry;
  };

  R.back = function (fromHistory) {
    if (stack.length < 2) { const c = stack[0]; const ss = SF.store.state.session; if (c && c.name !== 'hoy' && ss.loggedIn && ss.hasPlan) R.tab('hoy'); return; }
    const cur = stack.pop();
    unmount(cur);
    const prev = stack[stack.length - 1];
    const fresh = build(prev);
    animate(fresh, cur.el, SF.screens[cur.name].modal ? 'down' : 'pop', () => {});
    mount(prev);
    const body = fresh.querySelector('.screen-body');
    if (body && scrollMemo[prev.name]) body.scrollTop = scrollMemo[prev.name];
    updateTabbar();
    ui.placeToasts();
    setHash(prev.name);
    focusScreen(fresh);
  };

  R.tab = function (id) {
    const t = TABS.find((x) => x.id === id);
    if (!t) return;
    const top = stack[stack.length - 1];
    if (top && SF.screens[top.name].tab === id && stack.length === 1) {
      const body = top.el.querySelector('.screen-body');
      if (body) body.scrollTo({ top: 0, behavior: ui.motion() });
      return;
    }
    R.go(t.root, {}, { reset: true, transition: 'fade' });
  };

  /* Repinta la pantalla visible conservando el desplazamiento. */
  R.refresh = function () {
    const top = stack[stack.length - 1];
    if (!top || !top.el) return;
    const def = SF.screens[top.name];
    if (def.static) { if (def.update) def.update(top.el, top.params, top); updateTabbar(); ui.placeToasts(); return; }
    const body = top.el.querySelector('.screen-body');
    const sc = body ? body.scrollTop : 0;
    // Recuerda qué control tenía el foco (con todos sus datos) para devolvérselo tras repintar
    const act = document.activeElement && top.el.contains(document.activeElement) ? document.activeElement : null;
    const focusSel = !act ? '' : act.id ? '#' + CSS.escape(act.id) : act.dataset.act ? Array.from(act.attributes).filter((x) => /^data-(act|id|v|k|i|d|to|tab|date|time)$/.test(x.name)).map((x) => '[' + x.name + '="' + CSS.escape(x.value) + '"]').join('') : '';
    unmount(top);
    top.el.innerHTML = def.render(top.params || {}, top);
    top.el.querySelectorAll('.stagger').forEach((x) => x.classList.remove('stagger'));
    mount(top);
    const nb = top.el.querySelector('.screen-body');
    if (nb) nb.scrollTop = sc;
    if (focusSel) {
      const again = top.el.querySelector(focusSel);
      if (again) again.focus({ preventScroll: true });
    }
    updateTabbar();
    ui.placeToasts();
  };

  R.current = () => stack[stack.length - 1] || null;
  R.depth = () => stack.length;

  function focusScreen(el) {
    const h = el.querySelector('h1, .tb-title');
    if (h) { h.setAttribute('tabindex', '-1'); setTimeout(() => { if (!SF.ui.layers()) h.focus({ preventScroll: true }); }, 60); }
  }

  SF.router = R;
})(window.SF);
