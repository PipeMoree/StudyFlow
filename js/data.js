/* =========================================================
   StudyFlow · Datos de ejemplo
   Contenido tomado de las pantallas del prototipo de Figma.
   ========================================================= */
window.SF = window.SF || {};
(function (SF) {
  SF.COLORS = ['blue', 'teal', 'rose', 'amber', 'violet', 'green'];

  SF.TYPES = {
    tarea:   { label: 'Tarea',   icon: 'file-text',  dur: 90 },
    examen:  { label: 'Examen',  icon: 'graduation-cap', dur: 150 },
    lectura: { label: 'Lectura', icon: 'book-open',  dur: 45 },
    evento:  { label: 'Evento',  icon: 'calendar',   dur: 60 }
  };

  SF.CRITERIA = {
    fecha:       { label: 'Fecha de entrega', desc: 'Primero, las actividades que vencen antes.' },
    importancia: { label: 'Importancia',      desc: 'Da preferencia a lo que más pesa en tu nota.' },
    esfuerzo:    { label: 'Esfuerzo',         desc: 'Empieza por las actividades que requieren menos energía.' },
    duracion:    { label: 'Duración',         desc: 'Prioriza lo que puedes completar en menos tiempo.' }
  };

  SF.STYLES = {
    equilibrado: { label: 'Equilibrado', desc: 'Reparte la carga por igual entre los días.' },
    fecha:       { label: 'Fecha límite', desc: 'Primero lo que vence antes.' },
    dificultad:  { label: 'Dificultad', desc: 'Lo difícil, en tus mejores horas de la mañana.' }
  };

  SF.INTENSITY = {
    suave:  { label: 'Suave',  desc: 'Un aviso discreto, sin insistir.', summary: 'te avisamos una vez, sin insistir.' },
    normal: { label: 'Normal', desc: 'Aviso en el momento y un recordatorio si no respondes.', summary: 'te avisamos a la hora y una vez más si no respondes.' },
    intensa:{ label: 'Intensa',desc: 'Avisos repetidos hasta que actúes.', summary: 'repetimos el aviso hasta que actúes.' }
  };

  /* Carreras con sus materias habituales (para sugerir en «Crea tu plan») */
  SF.CAREERS = [
    { id: 'sistemas', name: 'Ingeniería de Sistemas', subjects: ['Cálculo II', 'Programación', 'Bases de datos', 'Estructuras de datos', 'Física I', 'Álgebra lineal', 'Redes'] },
    { id: 'industrial', name: 'Ingeniería Industrial', subjects: ['Cálculo II', 'Estadística', 'Investigación de operaciones', 'Física I', 'Procesos industriales', 'Contabilidad', 'Logística'] },
    { id: 'medicina', name: 'Medicina', subjects: ['Anatomía', 'Bioquímica', 'Fisiología', 'Histología', 'Biología celular', 'Microbiología', 'Ética médica'] },
    { id: 'derecho', name: 'Derecho', subjects: ['Derecho constitucional', 'Derecho civil', 'Derecho penal', 'Teoría del Estado', 'Derecho romano', 'Introducción al derecho', 'Argumentación jurídica'] },
    { id: 'administracion', name: 'Administración de Empresas', subjects: ['Contabilidad', 'Microeconomía', 'Matemáticas financieras', 'Mercadeo', 'Estadística', 'Gestión humana', 'Finanzas'] },
    { id: 'psicologia', name: 'Psicología', subjects: ['Psicología general', 'Neuropsicología', 'Estadística', 'Psicología del desarrollo', 'Teorías de la personalidad', 'Psicología social', 'Métodos de investigación'] },
    { id: 'arquitectura', name: 'Arquitectura', subjects: ['Taller de diseño', 'Dibujo técnico', 'Historia de la arquitectura', 'Estructuras', 'Geometría descriptiva', 'Materiales', 'Urbanismo'] },
    { id: 'diseno', name: 'Diseño Gráfico', subjects: ['Diseño', 'Tipografía', 'Teoría del color', 'Ilustración', 'Fotografía', 'Diseño editorial', 'Historia del arte'] },
    { id: 'contaduria', name: 'Contaduría Pública', subjects: ['Contabilidad', 'Costos', 'Tributaria', 'Auditoría', 'Matemáticas financieras', 'Derecho comercial', 'Microeconomía'] }
  ];

  SF.SAMPLE_SUBJECTS = [
    { id: 's1', name: 'Cálculo II', credits: 4, color: 'blue',
      classes: [{ day: 1, start: '10:00', dur: 120 }, { day: 4, start: '08:00', dur: 120 }] },
    { id: 's2', name: 'Computación', credits: 3, color: 'teal',
      classes: [{ day: 3, start: '08:00', dur: 120 }, { day: 5, start: '10:00', dur: 90 }] },
    { id: 's3', name: 'Diseño', credits: 3, color: 'rose',
      classes: [{ day: 2, start: '14:00', dur: 120 }, { day: 5, start: '08:00', dur: 90 }] }
  ];

  SF.sampleActivities = function () {
    return [
      { id: 'a1', subjectId: 's1', type: 'tarea', title: 'Resolver ejercicios 12-20', date: '2026-10-05', time: '20:00', duration: 90, weight: 10, progress: 44, steps: { done: 4, total: 9 } },
      { id: 'a2', subjectId: 's2', type: 'lectura', title: 'Leer capítulo 4', date: '2026-10-06', time: '23:59', duration: 35, weight: 5, progress: 0 },
      { id: 'a3', subjectId: 's3', type: 'tarea', title: 'Bocetos de Diseño', date: '2026-10-08', time: '18:00', duration: 50, weight: 15, progress: 0, flexible: true },
      { id: 'a4', subjectId: 's1', type: 'examen', title: 'Parcial de cálculo', date: '2026-10-09', time: '14:00', duration: 150, examLen: 150, weight: 30, progress: 30 },
      { id: 'a5', subjectId: 's3', type: 'tarea', title: 'Taller de diseño', date: '2026-10-07', time: '23:59', duration: 60, weight: 20, progress: 0 },
      { id: 'a6', subjectId: 's2', type: 'tarea', title: 'Tarea de MySQL', date: '2026-10-06', time: '23:59', duration: 45, weight: 30, progress: 0 },
      { id: 'a7', subjectId: 's2', type: 'tarea', title: 'Laboratorio N.2', date: '2026-10-09', time: '23:59', duration: 60, weight: 40, progress: 0 },
      { id: 'd1', subjectId: 's2', type: 'tarea', title: 'Quiz de computación', date: '2026-10-05', time: '08:00', duration: 30, weight: 10, progress: 100, done: true, doneAt: '2026-10-05' },
      { id: 'd2', subjectId: 's3', type: 'tarea', title: 'Informe de diseño', date: '2026-10-05', time: '09:00', duration: 40, weight: 10, progress: 100, done: true, doneAt: '2026-10-05' },
      { id: 'd3', subjectId: 's1', type: 'lectura', title: 'Resumen tema 2', date: '2026-10-05', time: '09:30', duration: 25, weight: 5, progress: 100, done: true, doneAt: '2026-10-05' }
    ];
  };

  SF.sampleNotes = function () {
    return [
      { id: 'n1', subjectId: 's1', title: 'Fórmulas de integrales', body: '• Integral por partes: ∫u dv = uv − ∫v du\n• Sustitución: elegir u = g(x)\n• Revisar ejercicios 4 al 9 del taller', excerpt: 'Sustitución, partes e integrales inmediatas.', date: '2026-10-04', time: '20:15', activityId: 'a4', kind: 'text' },
      { id: 'n2', subjectId: 's2', title: 'Ideas para el proyecto', body: 'Estructura de la base de datos y consultas SQL.\n\n• Tablas: estudiantes, materias, entregas\n• Índices en fecha de entrega', date: '2026-10-03', time: '18:40', activityId: 'a6', kind: 'text' },
      { id: 'n3', subjectId: 's3', title: 'Referencias de bocetos', body: 'Composición, formas y paletas para el proyecto.', date: '2026-10-02', time: '11:05', activityId: 'a3', kind: 'text' },
      { id: 'n4', subjectId: 's1', title: 'Dudas del parcial', body: 'Repasar límites y el cambio de variable.', date: '2026-10-01', time: '16:20', activityId: 'a4', kind: 'text' }
    ];
  };

  SF.sampleNotifications = function () {
    return [
      { id: 'nt1', kind: 'urgent', actId: 'a1', time: '09:41', title: 'Resolver ejercicios 12-20', body: 'Actividad de las 09:30. Tu actividad sigue pendiente.', read: false },
      { id: 'nt2', kind: 'urgent', actId: 'a6', time: '09:15', title: 'Tarea de MySQL', body: 'Actividad de las 09:00. No has respondido al recordatorio.', read: false },
      { id: 'nt3', kind: 'pending', actId: 'a4', time: '09:40', title: 'Estudiar parcial de cálculo', body: 'Actividad de las 10:00. Pendiente.', read: false },
      { id: 'nt4', kind: 'pending', actId: 'a5', time: '09:35', title: 'Taller de diseño', body: 'Actividad de las 18:00. Pendiente.', read: false }
    ];
  };

  SF.FAQ = [
    { id: 'f1', q: 'Tiempo libre', a: 'Son los bloques de tu horario que no están ocupados por clases ni por eventos fijos. StudyFlow los usa para colocar tus actividades.' },
    { id: 'f2', q: 'Peso de materias y tareas', a: 'Es el porcentaje que vale una entrega o un examen en tu nota final. Cuanto más pesa, antes aparece si eliges el criterio «Importancia».' },
    { id: 'f3', q: 'Criterios de priorización', a: 'Ordenan tu lista: por fecha de entrega, por importancia (peso), por esfuerzo o por duración. El primero de la lista es el que más cuenta. Lo cambias en Ajustes → Criterio de priorización.' },
    { id: 'f4', q: 'Intensidad de avisos', a: 'Suave: un aviso sin insistir. Normal: aviso a la hora y un recordatorio si no respondes. Intensa: repetimos el aviso hasta que actúes.' },
    { id: 'f5', q: '¿Cómo agrego eventos usando la voz?', a: 'En Registrar, toca Voz y di la actividad con su fecha, por ejemplo: «Parcial de cálculo el viernes a las 10 am» o «Entrega de proyecto de bases de datos mañana a las 3 pm». Después revisas los datos antes de guardar.' },
    { id: 'f6', q: '¿Qué pasa si edito o borro un evento?', a: 'El cambio se aplica al instante en Hoy, en el plan semanal y en el calendario. Si lo borras, tienes unos segundos para deshacerlo.' },
    { id: 'f7', q: '¿Puedo usar la app con texto grande o alto contraste?', a: 'Sí. En Ajustes → Apariencia eliges tema claro u oscuro, texto grande y alto contraste (cumple WCAG AAA, contraste de 7:1).' },
    { id: 'f9', q: '¿Cómo funciona la racha?', a: 'Cada día que terminas una sesión de estudio o completas una actividad suma un día a tu racha. Si pasa un día entero sin hacerlo, la racha vuelve a empezar, pero conservas tu récord y tus hitos. La ves en Hoy, junto a Avisos, y puedes compartirla.' },
    { id: 'f8', q: '¿Mis datos se guardan?', a: 'Tus datos se guardan solo en este dispositivo. Cerrar sesión borra de aquí tu perfil, tus actividades, tus notas, tu racha y tus preferencias.' }
  ];

  /* Ejemplos que usan las materias y actividades reales del usuario */
  const WD = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const low1 = (t) => t ? t.charAt(0).toLowerCase() + t.slice(1) : t;
  const pending = () => { const st = SF.store && SF.store.state; return st ? st.activities.filter((a) => !a.done) : []; };
  const subjects = () => { const st = SF.store && SF.store.state; return st ? st.subjects : []; };
  Object.defineProperty(SF, 'ASSIST_SUGGESTIONS', {
    get() {
      const acts = pending();
      const exam = acts.find((a) => a.type === 'examen');
      const mv = acts.find((a) => a.type !== 'examen' && a.type !== 'evento' && a.date > SF.D.WEEK[3]);
      return [
        'Organiza mi semana' + (exam ? ', tengo ' + low1(exam.title) + ' el ' + WD[new Date(exam.date + 'T12:00').getDay()] : ''),
        '¿Qué hago primero hoy?',
        mv ? 'Mueve ' + low1(mv.title) + ' al jueves' : 'Mueve mi próxima tarea al jueves',
        'Quiero el miércoles más ligero'
      ];
    }
  });
  SF.examplePhrases = function () {
    const subs = subjects().map((s) => s.name);
    const a = subs[0] || 'Cálculo II', b = subs[1] || a, c = subs[2] || a;
    return ['Parcial de ' + a + ' el viernes a las 10 am', 'Entrega del taller de ' + b + ' mañana a las 3 pm', 'Leer capítulo 5 de ' + c + ' el miércoles', 'Reunión de grupo de ' + a + ' el jueves a las 4 pm 1 hora'];
  };
})(window.SF);
