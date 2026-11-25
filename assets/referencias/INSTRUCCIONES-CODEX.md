# Encargo para Codex: ilustraciones de StudyFlow

Hola, Codex. Necesito que generes las imágenes de esta lista para la app StudyFlow (planificador de estudio para universitarios). La app ya funciona con dibujos SVG de respaldo; tus PNG los reemplazan solos si respetas **el nombre y la carpeta exactos**.

## Dónde guardar

```
StudyFlow-App/assets/img/ilustraciones/<nombre>.png
```

No cambies nombres ni carpetas. No toques ningún archivo `.js`, `.css` ni `.html`.

## Estilo común (para que todas parezcan de la misma familia)

- Ilustración plana con volumen suave (flat + sombras muy sutiles), sin texturas ni ruido.
- Formas redondeadas, trazo exterior opcional de 2–3 px en `#172033` al 15 %.
- **Fondo transparente** (PNG con canal alfa). Nada de recuadro ni fondo de color.
- Sin texto ni letras dentro de la imagen.
- Sin personas realistas. Si aparece alguien, que sea una figura simple, sin rasgos detallados y de tono de piel neutro.
- Deben verse bien sobre fondo claro (`#F7F9FC`) **y** sobre fondo oscuro (`#111827`): evita blancos puros grandes en los bordes y negros puros.
- Proporción 6:5 (horizontal). Tamaño: **720 × 600 px**. Peso objetivo menor de 120 KB por archivo (optimiza el PNG).
- Composición centrada, con unos 8 % de margen libre alrededor.

## Paleta (usa solo estos colores)

| Uso | Hex |
|---|---|
| Primario (azul) | `#3A5BE0` |
| Azul claro | `#9DB0FF` |
| Azul muy suave | `#E6ECFF` |
| Turquesa | `#0F766E` / `#5EE0CF` |
| Rosa | `#B4235A` / `#FF9CC3` |
| Ámbar | `#F2C46B` |
| Verde | `#247144` / `#6ED29A` |
| Tinta (contornos, detalles) | `#172033` |
| Gris medio | `#8A94A6` |

## Lista de imágenes

| # | Archivo | Qué debe mostrar | Dónde se ve |
|---|---|---|---|
| 1 | `bienvenida.png` | Un portapapeles con una lista de tareas marcadas, un calendario pequeño detrás y unas chispas. Sensación de «todo en orden». | Pantalla de bienvenida |
| 2 | `plan.png` | Una semana en bloques de colores (5 columnas de lunes a viernes) con un lápiz al lado. | Crear tu plan |
| 3 | `exito.png` | Una insignia o sello circular con una marca de verificación grande y confeti suave alrededor. | Plan confirmado |
| 4 | `dia-libre.png` | Una taza de café humeante sobre un libro cerrado, con una planta pequeña. Calma. | Hoy, cuando no queda nada pendiente |
| 5 | `avisos.png` | Una campana con una onda suave y un pequeño reloj. | Avisos vacíos |
| 6 | `notas.png` | Un cuaderno abierto con notas adhesivas de colores y un lápiz. | Notas vacías |
| 7 | `asistente.png` | Un globo de diálogo amable con chispas (símbolo de ayuda inteligente), sin cara de robot. | Inicio del Asistente |
| 8 | `offline.png` | Una nube con el símbolo de wifi tachado, tono tranquilo, sin dramatismo. | Errores de conexión |
| 9 | `microfono.png` | Un micrófono con un pequeño candado al lado. | Micrófono bloqueado |

## Extras opcionales (si te sobra tiempo)

| Archivo | Tamaño | Descripción |
|---|---|---|
| `assets/img/splash.png` | 1170 × 2532 | Fondo `#F7F9FC` con el logo centrado (usa `assets/img/logo-studyflow.png`) para la pantalla de carga al instalarla como app. |
| `assets/img/icon-maskable-512.png` | 512 × 512 | El logo dentro de un círculo seguro del 80 %, fondo `#3A5BE0`, para Android. |

## Cómo comprobar que quedó bien

1. Abre `StudyFlow-App/index.html` en el navegador (o sírvelo con `python -m http.server`).
2. Entra con «Entrar con cuenta de ejemplo» (botón a la izquierda en escritorio).
3. Revisa: Bienvenida (cierra sesión desde Ajustes), Plan confirmado, Notas vacías (filtra por una materia sin notas), Asistente (borra la conversación) y Ajustes → Ayuda → Laboratorio (sin conexión y micrófono bloqueado).
4. Cambia a tema oscuro (Ajustes → Apariencia) y comprueba que las imágenes se siguen viendo bien.

Las capturas de Figma de esta misma carpeta (`*.png`) muestran el estilo general de la app.
