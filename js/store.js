/* =========================================================
   StudyFlow · Estado global y persistencia
   Un único estado, guardado en localStorage. Cada cambio
   notifica a la pantalla visible, que se vuelve a pintar,
   así Hoy, Plan, Calendario y Detalle siempre coinciden.
   ========================================================= */
window.SF = window.SF || {};
(function (SF) {
  const KEY = 'studyflow:v1';
  const u = SF.u;

  function defaults() {
    return {
      v: 1,
      session: { loggedIn: false, hasPlan: false, tutorialDone: false, pushShown: false, draft: null, lastNav: null, welcomeSeen: false },
      profile: { name: '', email: '', career: '' },
      settings: {
        theme: 'light', themeV2: true, density: 'comfortable', text: 'normal', contrast: false,
        criteria: ['fecha', 'importancia', 'esfuerzo', 'duracion'],
        intensity: 'normal', style: 'equilibrado', seed: 0
      },
      subjects: [],
      activities: [],
      notes: [], notesTrash: [],
      notifications: [],
      plan: { blocks: [], status: 'none', prev: null, changes: null, changedAt: null, unplaced: [] },
      timer: null,
      chat: [],
      lastActivityId: null,
      todayOrder: null,
      demo: { offline: false, micDenied: false, today: null, base: null },
      streak: { current: 0, best: 0, lastDate: null, history: [], hits: {} }
    };
  }

  const listeners = new Set();
  let state = defaults();
  let saveTimer = null;

  /* Datos guardados incompletos o dañados: se completan con los valores por defecto para que la app arranque. */
  function sane(st, d) {
    const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
    const arr = (v) => (Array.isArray(v) ? v : []);
    const isStr = (v) => typeof v === 'string' && v !== '';
    const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
    const isTime = (v) => typeof v === 'string' && /^\d{1,2}:\d{2}$/.test(v);
    ['profile', 'session', 'settings', 'plan', 'demo', 'streak'].forEach((k) => { st[k] = isObj(st[k]) ? Object.assign({}, d[k], st[k]) : d[k]; });
    ['subjects', 'activities', 'notes', 'notesTrash', 'notifications', 'chat'].forEach((k) => { st[k] = arr(st[k]); });
    st.plan.blocks = arr(st.plan.blocks); st.plan.unplaced = arr(st.plan.unplaced);
    st.streak.history = arr(st.streak.history).filter(isDate);
    if (!isObj(st.streak.hits)) st.streak.hits = {};
    st.subjects = st.subjects.filter((s) => isObj(s) && isStr(s.id) && isStr(s.name)).map((s) => Object.assign(s, { classes: arr(s.classes) }));
    st.activities = st.activities.filter((a) => isObj(a) && isStr(a.id) && isStr(a.title) && Object.prototype.hasOwnProperty.call(SF.TYPES, a.type) && isDate(a.date) && isTime(a.time));
    st.notes = st.notes.filter((n) => isObj(n) && isStr(n.id) && isStr(n.date));
    st.notesTrash = st.notesTrash.filter((n) => isObj(n) && isStr(n.id) && isStr(n.date));
    st.plan.blocks = st.plan.blocks.filter((b) => isObj(b) && isStr(b.id) && isStr(b.actId) && isStr(b.date) && isStr(b.start));
    const s = st.settings;
    const keys = Object.keys(SF.CRITERIA);
    if (!Array.isArray(s.criteria) || s.criteria.length !== keys.length || !keys.every((k) => s.criteria.includes(k))) s.criteria = d.settings.criteria;
    if (!(s.style in SF.STYLES)) s.style = d.settings.style;
    if (!(s.intensity in SF.INTENSITY)) s.intensity = d.settings.intensity;
    if (!['light', 'dark', 'system'].includes(s.theme)) s.theme = d.settings.theme;
    if (!['normal', 'large'].includes(s.text)) s.text = d.settings.text;
    if (!['comfortable', 'compact'].includes(s.density)) s.density = d.settings.density;
    if (!isDate(st.demo.today)) st.demo.today = null;
    if (!isObj(st.timer) || !st.activities.some((a) => a.id === st.timer.actId)) st.timer = null;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.v === 1) {
          const d = defaults();
          state = Object.assign(d, data);
          state.session = Object.assign(d.session, data.session);
          state.settings = Object.assign(d.settings, data.settings);
          if (!state.settings.themeV2) { state.settings.theme = 'light'; state.settings.themeV2 = true; }
          state.plan = Object.assign(d.plan, data.plan);
          state.demo = Object.assign(d.demo, data.demo);
          state.streak = Object.assign(d.streak, data.streak || {});
          sane(state, defaults());
        }
      }
    } catch (e) { state = defaults(); }
    syncDay();
    return state;
  }

  /* El «hoy» de la demo vive en el estado (día simulado o día inicial). */
  function syncDay() { SF.D.setToday(state.demo && state.demo.today); }

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* almacenamiento no disponible */ }
    }, 120);
  }

  function emit(meta) { syncDay(); listeners.forEach((fn) => { try { fn(state, meta || {}); } catch (e) { console.error(e); } }); }

  SF.store = {
    get state() { return state; },
    defaults,
    load,
    /* Aplica un cambio y repinta. meta.silent evita repintar. */
    commit(fn, meta) {
      fn(state);
      save();
      if (!meta || !meta.silent) emit(meta);
    },
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    snapshot(keys) {
      const snap = {};
      (keys || ['activities', 'plan', 'notes', 'notifications', 'lastActivityId', 'todayOrder', 'timer', 'streak']).forEach((k) => { snap[k] = u.clone(state[k]); });
      return snap;
    },
    restore(snap) { Object.keys(snap).forEach((k) => { state[k] = u.clone(snap[k]); }); save(); emit({ restored: true }); },
    replace(next) { state = next; save(); emit({ replaced: true }); },
    wipe() {
      try { localStorage.removeItem(KEY); } catch (e) {}
      state = defaults();
      emit({ replaced: true });
    }
  };
})(window.SF);
