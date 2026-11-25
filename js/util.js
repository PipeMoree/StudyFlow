/* =========================================================
   StudyFlow · Utilidades (fechas, tiempo, texto)
   La demo vive en la semana del 5 al 11 de octubre de 2026,
   igual que el prototipo de Figma. "Hoy" empieza el lunes 5 a
   las 9:41 y avanza con «Pasar al siguiente día».
   ========================================================= */
window.SF = window.SF || {};
(function (SF) {
  const DOW_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const DOW_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const DOW_CAP = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const MON_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
  const MON_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  const BASE = '2026-10-05'; // día inicial de la demo
  const NOW_MIN = 9 * 60 + 41;
  const dayHooks = [];

  const pad = (n) => String(n).padStart(2, '0');
  const parse = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

  const D = {
    /* TODAY y WEEK cambian al simular días (ver setToday). Léelos siempre como D.TODAY / D.WEEK. */
    TODAY: BASE, WEEK: [], BASE, NOW_MIN, DOW_SHORT, DOW_LONG, DOW_CAP, MON_SHORT, MON_LONG,
    parse, iso,
    add(isoStr, n) { const d = parse(isoStr); d.setDate(d.getDate() + n); return iso(d); },
    dow(isoStr) { return parse(isoStr).getDay(); },
    /* 1 = lunes … 7 = domingo */
    wd(isoStr) { const g = parse(isoStr).getDay(); return g === 0 ? 7 : g; },
    diff(a, b) { return Math.round((parse(a) - parse(b)) / 86400000); },
    short(isoStr) { const d = parse(isoStr); return DOW_SHORT[d.getDay()] + ' ' + d.getDate() + ' ' + MON_SHORT[d.getMonth()]; },
    dayMonth(isoStr) { const d = parse(isoStr); return d.getDate() + ' ' + MON_SHORT[d.getMonth()]; },
    long(isoStr) { const d = parse(isoStr); return DOW_LONG[d.getDay()] + ', ' + d.getDate() + ' de ' + MON_LONG[d.getMonth()]; },
    longCap(isoStr) { const s = D.long(isoStr); return s.charAt(0).toUpperCase() + s.slice(1); },
    rel(isoStr) {
      const n = D.diff(isoStr, D.TODAY);
      if (n === 0) return 'hoy';
      if (n === 1) return 'mañana';
      if (n === -1) return 'ayer';
      return D.short(isoStr);
    },
    monthTitle(y, m) { return MON_LONG[m].charAt(0).toUpperCase() + MON_LONG[m].slice(1) + ' ' + y; },
    isPast(isoStr, time) {
      const n = D.diff(isoStr, D.TODAY);
      if (n < 0) return true;
      if (n > 0) return false;
      return time ? T.toMin(time) < NOW_MIN : false;
    },
    monday(isoStr) { return D.add(isoStr, 1 - D.wd(isoStr)); },
    /* «5–11 de octubre» o «28 de septiembre – 4 de octubre» */
    range(a, b) {
      const x = parse(a), y = parse(b);
      return x.getMonth() === y.getMonth()
        ? x.getDate() + '–' + y.getDate() + ' de ' + MON_LONG[y.getMonth()]
        : x.getDate() + ' de ' + MON_LONG[x.getMonth()] + ' – ' + y.getDate() + ' de ' + MON_LONG[y.getMonth()];
    },
    /* Cambia el «hoy» de la demo. WEEK es la semana que se planifica:
       la actual de lunes a viernes y la siguiente en fin de semana. */
    setToday(isoStr) {
      const next = isoStr || BASE;
      if (next === D.TODAY && D.WEEK.length) return;
      D.TODAY = next;
      const start = D.add(D.monday(next), D.wd(next) > 5 ? 7 : 0);
      D.WEEK = [0, 1, 2, 3, 4, 5, 6].map((i) => D.add(start, i));
      dayHooks.forEach((fn) => fn(next));
    },
    onDay(fn) { dayHooks.push(fn); }
  };
  D.setToday(BASE);

  const T = {
    toMin(t) { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); },
    fmt(min) { min = Math.max(0, Math.round(min)); return Math.floor(min / 60) + ':' + pad(min % 60); },
    fmt2(min) { min = Math.max(0, Math.round(min)); return pad(Math.floor(min / 60)) + ':' + pad(min % 60); },
    dur(min) {
      min = Math.round(min || 0);
      const h = Math.floor(min / 60), m = min % 60;
      if (!h) return m + ' min';
      if (!m) return h + ' h';
      return h + ' h ' + pad(m) + ' min';
    },
    durShort(min) { const h = Math.floor(min / 60), m = min % 60; return (h ? h + 'h ' : '') + m + 'min'; },
    clock(ms) {
      const s = Math.floor(ms / 1000);
      return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor((s % 3600) / 60)) + ':' + pad(s % 60);
    },
    overlap(aStart, aDur, bStart, bDur) { return aStart < bStart + bDur && bStart < aStart + aDur; }
  };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = (p) => (p || 'id') + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const initials = (name) => {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || '';
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  SF.D = D; SF.T = T;
  SF.u = { esc, uid, clone, initials, firstName, norm, isEmail, plural, sleep, clamp, pad };
})(window.SF);
