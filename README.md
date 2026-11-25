# StudyFlow · Prototipo web

App de planificación de estudio con aspecto de app móvil, hecha con HTML, CSS y JavaScript puros (sin frameworks ni instalación).

## Cómo abrirla

- **Doble clic en `index.html`**: funciona directamente en Chrome, Edge o Firefox.
- **Como servidor local** (recomendado para probar en el celular de la misma red):

  ```bash
  python -m http.server 5173
  ```

  y abre `http://localhost:5173`.
- **Para subirla a la web**: arrastra la carpeta completa a Netlify Drop, Vercel o GitHub Pages. No hay que compilar nada.

En escritorio se ve dentro de un teléfono. En un móvil real ocupa toda la pantalla.

**Controles del prototipo** (a los lados del teléfono, solo en escritorio): entrar con la cuenta de ejemplo, ver el tutorial, cambiar el tema, empezar de cero, simular días y simular situaciones (sin conexión, micrófono bloqueado, aviso push, restaurar datos). Están en `js/stage.js` y `css/stage.css`, fuera de la app: sus mensajes y confirmaciones salen en el panel y nunca dentro del teléfono.
**Datos de prueba**: la demo vive en la semana del 5 al 11 de octubre de 2026; «hoy» es el lunes 5 a las 9:41. Con «Pasar al siguiente día» (panel derecho) la fecha avanza en toda la app; «Dar hoy por cumplido» suma el día sin estudiar, «Ir al día de un hito» salta hasta cualquiera de los 7 hitos y «Volver al lun 5 oct» lo deja como estaba.

## Estructura

```
StudyFlow-App/
├── index.html            Documento principal
├── manifest.json         Para instalarla como app
├── css/
│   ├── tokens.css        Colores, tipografía, espaciado; temas claro/oscuro, alto contraste, texto grande
│   ├── base.css          Escenario, marco del teléfono, pantallas
│   ├── components.css    Botones, campos, tarjetas, hojas, diálogos, avisos, tutorial…
│   ├── screens.css       Estilos propios de cada pantalla
│   ├── animations.css    Transiciones y animaciones (con modo «reducir movimiento»)
│   ├── vivid.css         Degradados sutiles, iconos en dos tonos y microinteracciones
│   ├── stage.css         Panel del prototipo, fuera de la app
│   └── racha.css         Racha: botón de Hoy, insignias de hitos, calendario y compartir
├── js/
│   ├── icons.js          Iconos SVG (Lucide)
│   ├── util.js           Fechas, horas y texto
│   ├── data.js           Datos de ejemplo, criterios, estilos, FAQ
│   ├── store.js          Estado único guardado en el navegador
│   ├── model.js          Planificador: reparte tareas en tu tiempo libre
│   ├── ui.js             Avisos, hojas, diálogos, cargas, banner push
│   ├── illus.js          Ilustraciones SVG de respaldo
│   ├── router.js         Navegación con transiciones y barra de pestañas
│   ├── tour.js           Tutorial de 6 pasos
│   ├── app.js            Arranque
│   ├── stage.js          Panel del prototipo, fuera de la app (simular días y situaciones)
│   └── screens/          Una carpeta por zona de la app
│       ├── common.js     Piezas compartidas (selector de fecha y hora, borrar con deshacer…)
│       ├── onboarding.js Inicio, registro, login, crear plan
│       ├── hoy.js        Hoy, cronómetro, cambiar orden, resumen, avisos, detalle
│       ├── plan.js       Plan semanal, ajustar semana, plan confirmado, calendario
│       ├── notes.js      Notas: lista, detalle, nueva nota (teclado, voz, lápiz)
│       ├── registrar.js  Registrar por voz, texto o a mano
│       ├── asistente.js  Chat con propuestas confirmables
│       ├── ajustes.js    Perfil, apariencia, criterio, avisos, ayuda
│       └── racha.js      Racha, hitos, animación al sumar un día y compartir como imagen
└── assets/
    ├── README-ASSETS.md  Inventario de fuentes, imágenes, iconos y colores
    ├── fonts/            Manrope y Caveat (OFL)
    ├── img/              Logo e iconos de app (+ ilustraciones/ que genera Codex)
    ├── icons/            92 iconos SVG sueltos y en sprite
    └── referencias/      Capturas de Figma + INSTRUCCIONES-CODEX.md
```

## Pantallas incluidas

| Zona | Pantallas |
|---|---|
| Inicio | ¿Has usado StudyFlow? · Bienvenido · Crear cuenta · Iniciar sesión · Crear tu plan (carrera con materias sugeridas u «Otra», materias, horario, estilo, avisos) · Tutorial guiado obligatorio la primera vez |
| Hoy | Prioridad con su motivo · Después sigue · Última actividad · Actividad en curso (cronómetro) · Registrar avance · Cambiar orden · Resumen del día · Terminar y reabrir el día · Avisos · Detalle |
| Racha | Icono en Hoy junto a Avisos · Semana actual · Próximo hito · 7 hitos con insignia propia · Últimas 4 semanas · Compartir como imagen o texto · Animación al sumar un día (distinta en cada hito) |
| Plan | Plan semanal por día · Elegir reparto · Ajustar semana (arrastrar, mover, otra propuesta, volver a la anterior) · Plan confirmado · Qué cambió |
| Calendario | Día · Semana · Mes, con línea de «ahora» |
| Notas | Lista con buscador y filtros · Notas borradas (restablecer) · Detalle · Nueva/editar nota por teclado, voz o lápiz |
| Registrar | Voz (simulada) · Texto con frase inteligente · A mano · Revisión · Éxito · Recientes · Borrador · Sin conexión · Micrófono bloqueado |
| Asistente | Qué hago primero · Organiza mi semana · Mueve X al día · Aligerar un día · Error de conexión |
| Ajustes | Perfil · Mis materias (añadir, editar, quitar) · Apariencia (tema, texto grande, alto contraste, compacto) · Criterio · Intensidad de avisos · Estilo de reparto · Centro de ayuda · Cerrar sesión |

## Heurísticas de Nielsen: dónde se cumplen

| # | Heurística | Cómo se aplica |
|---|---|---|
| 1 | Visibilidad del estado | Pantallas de carga con pasos, cronómetro en vivo con anillo, píldora «En curso» en Hoy, «Semana al día» con %, estado «En pausa», avisos de plan recalculado, punto de no leídos. |
| 2 | Relación con el mundo real | Lenguaje de estudiante («entrega», «parcial», «bloque libre»), registro por frase natural («Parcial de cálculo el viernes a las 10»), calendario de día, semana y mes. |
| 3 | Control y libertad | Deshacer en cada borrado, edición, cambio de criterio, plan y registro; «Volver a la anterior» en Ajustar; «Mantener plan anterior»; saltar o retroceder en el tutorial; Esc cierra; botón Atrás del navegador. |
| 4 | Consistencia y estándares | Mismos componentes y tokens en toda la app, barra inferior fija con 4 pestañas, botón principal siempre a la derecha o abajo, iconos de una sola familia. |
| 5 | Prevención de errores | Validación junto a cada campo, aviso de choque con clases o eventos, aviso de fecha pasada, y confirmación antes de eliminar o modificar algo importante (ver «Confirmaciones»). |
| 6 | Reconocer antes que recordar | Recientes como plantilla, borrador recuperable, atajos de fecha y hora, sugerencias en el chat, motivo visible de cada prioridad. |
| 7 | Flexibilidad y eficiencia | Voz, texto o a mano; frase inteligente que rellena el formulario; arrastrar para reordenar; Repetir última actividad; tocar un bloque libre para añadir ahí. |
| 8 | Diseño estético y minimalista | Una prioridad por pantalla, tarjetas limpias, información secundaria en Detalle, ilustraciones solo en estados vacíos. |
| 9 | Ayudar a reconocer y recuperarse de errores | Mensajes que dicen qué pasó y qué hacer («Revisa el correo: falta la @»), Reintentar en el chat, sin conexión con alternativa, micrófono bloqueado con pasos para activarlo. |
| 10 | Ayuda y documentación | Tutorial de 6 pasos repetible, Centro de ayuda con buscador y preguntas frecuentes, textos de ayuda bajo los campos. |

## Confirmaciones

| Tipo de acción | Qué hace la app |
|---|---|
| Eliminar (actividad, nota, materia, conversación, dibujo, borrador, ejemplos, sesión) | Ventana de confirmación con el foco en «Cancelar». Casi todas se pueden deshacer justo después. |
| Modificar algo guardado (actividad, nota, materia, perfil) | Ventana con la lista de cambios «antes → después». Si no hay cambios, no pregunta. |
| Cambiar todo el plan (criterio, estilo de reparto, otra propuesta, volver a la anterior, guardar el ajuste, mantener el plan anterior) | Ventana que explica la consecuencia, y «Deshacer» cuando se aplica. |
| Salir con cambios sin guardar (también con la barra inferior, Atrás o Esc) | «Seguir editando» o «Salir». |
| Cambios ligeros (tema, texto, intensidad de avisos, orden de hoy, mover un bloque, marcar avisos) | Se aplican al momento; son fáciles de revertir o tienen «Deshacer». |

Se usa siempre `ui.confirm()` (`js/ui.js`); las hojas aceptan `guard` y las pantallas `canLeave`.

## Accesibilidad

- Contraste AA en el tema normal y **AAA (7:1)** en alto contraste, en claro y oscuro.
- Texto grande ×1,175 en **todos** los textos; los botones crecen en alto en lugar de cortar el texto.
- Objetivos táctiles de 44–48 px (los días y eventos del calendario, al ser 7 columnas, pueden medir menos en pantallas estrechas, siempre 24 px o más), foco visible, navegación completa con teclado (flechas en opciones y pestañas), trampa de foco en hojas y diálogos.
- Todo lo que se arrastra también se puede ordenar con botones. El nombre accesible de cada control incluye su texto visible y cada pantalla tiene su título de página.
- Las animaciones decorativas se detienen en menos de 5 s y los avisos con «Deshacer» esperan mientras los señalas o enfocas.
- Roles ARIA (pestañas, radios, interruptores, temporizador, registro del chat) y anuncios por lector de pantalla.
- Respeta «reducir movimiento» del sistema.
