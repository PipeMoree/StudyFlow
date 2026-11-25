/* =========================================================
   StudyFlow · Ilustraciones vectoriales de respaldo
   Se usan mientras no existan los PNG definitivos en
   assets/img/ilustraciones/ (ver INSTRUCCIONES-CODEX.md).
   Colores tomados de los tokens, así siguen el tema activo.
   ========================================================= */
window.SF = window.SF || {};
(function (SF) {
  const f = (v) => 'style="fill:var(' + v + ')"';
  const s = (v, w) => 'style="stroke:var(' + v + ');stroke-width:' + (w || 6) + ';fill:none;stroke-linecap:round;stroke-linejoin:round"';
  const wrap = (inner) => '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + inner + '</svg>';

  SF.ILLUS = {
    bienvenida: wrap(
      '<rect x="10" y="10" width="180" height="140" rx="28" ' + f('--primary-soft') + '/>' +
      '<rect x="62" y="30" width="76" height="100" rx="14" ' + f('--surface') + '/>' +
      '<rect x="80" y="40" width="10" height="16" rx="5" ' + f('--primary') + '/><rect x="110" y="40" width="10" height="16" rx="5" ' + f('--primary') + '/>' +
      '<rect x="76" y="68" width="48" height="7" rx="3.5" ' + f('--text-2') + '/><rect x="76" y="83" width="40" height="7" rx="3.5" ' + f('--text-2') + '/><rect x="76" y="98" width="30" height="7" rx="3.5" ' + f('--text-2') + '/>' +
      '<circle cx="138" cy="118" r="20" ' + f('--primary') + '/><path d="M129 118l6 6 12-12" ' + s('--on-primary', 5) + '/>'),
    avisos: wrap(
      '<circle cx="100" cy="80" r="64" ' + f('--primary-soft') + '/>' +
      '<path d="M70 92c6-6 6-18 6-26a24 24 0 0 1 48 0c0 8 0 20 6 26z" ' + f('--surface') + ' ' + 'stroke-width="0"/>' +
      '<path d="M70 92c6-6 6-18 6-26a24 24 0 0 1 48 0c0 8 0 20 6 26z" ' + s('--primary', 5) + '/>' +
      '<path d="M92 102a8 8 0 0 0 16 0" ' + s('--primary', 5) + '/>' +
      '<circle cx="134" cy="52" r="15" ' + f('--success') + '/><path d="M127 52l5 5 9-9" ' + s('--surface', 4) + '/>'),
    'dia-libre': wrap(
      '<circle cx="100" cy="80" r="64" ' + f('--warning-soft') + '/>' +
      '<circle cx="138" cy="44" r="14" ' + f('--warning') + '/>' +
      '<path d="M64 76h62v20a22 22 0 0 1-22 22h-18a22 22 0 0 1-22-22z" ' + f('--surface') + '/>' +
      '<path d="M64 76h62v20a22 22 0 0 1-22 22h-18a22 22 0 0 1-22-22z" ' + s('--warning', 5) + '/>' +
      '<path d="M126 84h6a10 10 0 0 1 0 20h-8" ' + s('--warning', 5) + '/>' +
      '<path d="M82 58c0-6 6-6 6-12M98 58c0-6 6-6 6-12" ' + s('--warning', 4) + '/>'),
    notas: wrap(
      '<rect x="20" y="16" width="160" height="128" rx="28" ' + f('--primary-soft') + '/>' +
      '<rect x="58" y="34" width="84" height="96" rx="12" ' + f('--surface') + '/>' +
      '<rect x="72" y="52" width="56" height="7" rx="3.5" ' + f('--text-2') + '/><rect x="72" y="68" width="44" height="7" rx="3.5" ' + f('--text-3') + '/><rect x="72" y="84" width="50" height="7" rx="3.5" ' + f('--text-3') + '/>' +
      '<path d="M120 122l26-26 8 8-26 26h-8z" ' + f('--primary') + '/>'),
    asistente: wrap(
      '<circle cx="100" cy="80" r="62" ' + f('--primary-soft') + '/>' +
      '<circle cx="100" cy="80" r="40" ' + f('--surface') + '/>' +
      '<path d="M78 80a22 22 0 0 1 37.5-15.5L122 70M122 58v12h-12M122 80a22 22 0 0 1-37.5 15.5L78 90M78 102V90h12" ' + s('--primary', 5) + '/>' +
      '<path d="M150 34l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" ' + f('--primary') + '/>'),
    exito: wrap(
      '<circle cx="100" cy="80" r="64" ' + f('--success-soft') + '/>' +
      '<circle cx="100" cy="80" r="38" ' + f('--success') + '/>' +
      '<path d="M82 80l12 12 24-24" style="stroke:var(--surface);stroke-width:8;fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:60;animation:check-draw .6s .2s ease-out both"/>' +
      '<circle cx="40" cy="40" r="5" ' + f('--primary') + '/><circle cx="160" cy="44" r="4" ' + f('--warning') + '/><circle cx="158" cy="122" r="5" ' + f('--primary') + '/><circle cx="44" cy="118" r="4" ' + f('--success') + '/>'),
    offline: wrap(
      '<circle cx="100" cy="80" r="62" ' + f('--warning-soft') + '/>' +
      '<path d="M60 70a56 56 0 0 1 80 0M74 86a36 36 0 0 1 52 0M88 102a16 16 0 0 1 24 0" ' + s('--warning', 6) + '/>' +
      '<path d="M60 40l80 80" ' + s('--danger', 6) + '/>'),
    microfono: wrap(
      '<circle cx="100" cy="80" r="62" ' + f('--danger-soft') + '/>' +
      '<rect x="86" y="40" width="28" height="52" rx="14" ' + f('--surface') + '/>' +
      '<rect x="86" y="40" width="28" height="52" rx="14" ' + s('--danger', 5) + '/>' +
      '<path d="M72 82a28 28 0 0 0 56 0M100 110v14" ' + s('--danger', 5) + '/>'),
    plan: wrap(
      '<rect x="18" y="18" width="164" height="124" rx="26" ' + f('--primary-soft') + '/>' +
      '<rect x="38" y="42" width="30" height="80" rx="8" ' + f('--surface') + '/><rect x="85" y="42" width="30" height="80" rx="8" ' + f('--surface') + '/><rect x="132" y="42" width="30" height="80" rx="8" ' + f('--surface') + '/>' +
      '<rect x="42" y="52" width="22" height="26" rx="5" ' + f('--primary') + '/><rect x="89" y="84" width="22" height="30" rx="5" ' + f('--success') + '/><rect x="136" y="56" width="22" height="20" rx="5" ' + f('--warning') + '/>')
  };
})(window.SF);
