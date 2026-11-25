# StudyFlow · Inventario de assets visuales

Todo lo que la app usa para verse como se ve. Las rutas son relativas a `StudyFlow-App/`.

## 1. Fuentes (`assets/fonts/`)

| Archivo | Familia | Uso | Licencia |
|---|---|---|---|
| `Manrope-Variable.ttf` | Manrope 200–800 (variable) | Toda la interfaz: títulos, textos, botones, números | SIL OFL 1.1 (`OFL-Manrope.txt`) |
| `Caveat-Variable.ttf` | Caveat 400–700 (variable) | Texto «a mano» (clase `.t-hand`, revisión de escritura) | SIL OFL 1.1 (`OFL-Caveat.txt`) |

Se cargan con `@font-face` en `css/tokens.css`. No dependen de internet.

**Escala tipográfica** (`--fs-N`, multiplicada por `--ts`; con texto grande `--ts = 1.175`):
10 · 11 · 12 · 13 · 14 · 15 · 16 (base) · 18 · 20 · 24 · 28 · 32 px.
Pesos usados: 500, 600, 700, 800. Interlineado base 1.45.

## 2. Imágenes (`assets/img/`)

| Archivo | Tamaño | Origen | Uso |
|---|---|---|---|
| `logo-studyflow.png` | 390×390 | Exportado de Figma (nodo 120:557) | Splash, pantalla «¿Has usado StudyFlow?», escenario |
| `icon-192.png` | 192×192 | Generado del logo | Favicon, banner push, manifest |
| `icon-512.png` | 512×512 | Generado del logo | Manifest (instalar como app) |
| `ilustraciones/*.png` | — | **Pendiente: generar con Codex** | Ver `referencias/INSTRUCCIONES-CODEX.md` |

Mientras no existan los PNG de `ilustraciones/`, la app muestra ilustraciones SVG de respaldo dibujadas en código (`js/illus.js`). Cuando pongas los PNG con el nombre exacto, se usan solos, sin tocar código.

## 3. Ilustraciones (respaldo SVG en `js/illus.js`)

| Clave | Dónde aparece |
|---|---|
| `bienvenida` | O2 Bienvenido |
| `avisos` | Avisos vacíos |
| `dia-libre` | Hoy sin pendientes |
| `notas` | Notas vacías, nota/actividad inexistente |
| `asistente` | Inicio del chat del Asistente |
| `exito` | B5 Plan confirmado |
| `offline` | Errores de conexión |
| `microfono` | A12 Micrófono bloqueado |
| `plan` | Crear plan |

## 4. Iconos (`assets/icons/`)

92 iconos de trazo de [Lucide](https://lucide.dev) (licencia ISC), 24×24, trazo 2 px, `currentColor`. Las variantes de llama (`flame-*`, salvo `flame-kindling`) y `calendar-next` son propias, dibujadas con la misma rejilla y el mismo trazo.

- Un SVG por icono: `assets/icons/<nombre>.svg`
- Sprite con todos: `assets/icons/_sprite.svg` (uso: `<svg><use href="_sprite.svg#i-calendar"/></svg>`)
- Lista de nombres: `assets/icons/_lista.txt`
- En la app se pintan desde `js/icons.js` con `SF.icon('nombre', tamaño)`.

## 5. Color (tokens en `css/tokens.css`)

### Claro (por defecto)
| Token | Hex | Contraste sobre fondo |
|---|---|---|
| `--bg` | `#F7F9FC` | — |
| `--surface` | `#FFFFFF` | — |
| `--text` | `#172033` | 15.4:1 |
| `--text-2` | `#5A6478` | 5.9:1 |
| `--text-3` | `#5C6679` | 5.6:1 |
| `--primary` | `#3A5BE0` | 5.6:1 |
| `--primary-soft` | `#E6ECFF` | — |
| `--border-strong` | `#8A94A6` | 3:1 (bordes de controles) |

### Colores de materia
| Nombre | Claro | Fondo suave | Oscuro |
|---|---|---|---|
| blue | `#3450D0` | `#E6ECFF` | `#9DB0FF` |
| teal | `#0F766E` | `#DDF4F1` | `#5EE0CF` |
| rose | `#B4235A` | `#FCE7F0` | `#FF9CC3` |
| amber | `#8A5A00` | `#FFF1D6` | `#F2C46B` |
| violet | `#6D3FD0` | `#EFE7FF` | `#C3A8FF` |
| green | `#247144` | `#E5F3EA` | `#6ED29A` |

### Variantes
- **Oscuro** (`body[data-theme=dark]`): fondo `#111827`, texto `#F7F9FC`, primario `#7C96FF` con texto sobre primario `#0B1230`.
- **Alto contraste AAA** (`body[data-contrast=high]`): texto `#000` sobre `#FFF`, primario `#1A36A8`, bordes negros de 2 px. En oscuro: texto `#FFF` sobre `#000`, primario `#AFC0FF`.
- **Texto grande** (`body[data-text=large]`): todas las fuentes ×1,175 y los botones crecen en alto en lugar de cortar el texto.
- **Compacto** (`body[data-density=compact]`): menos espacio vertical.

## 6. Espaciado, radios y movimiento

- Espaciado: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 px (`--sp-1` … `--sp-10`).
- Radios: 8 · 12 · 16 · 22 px y píldora (`--r-sm` … `--r-pill`). Marco del teléfono: 54 px, pantalla: 42 px.
- Altura mínima de control: 48 px (táctil ≥ 44 px).
- Curvas: `--ease-out` (.22,1,.36,1), `--ease-spring` (.34,1.36,.64,1).
- Duraciones: 140 ms (rápida), 260 ms (media), 420 ms (lenta).
- Solo se animan `transform` y `opacity`. Con «reducir movimiento» del sistema, todo pasa a fundidos de 120 ms.

## 7. Referencias de Figma (`assets/referencias/`)

Capturas del prototipo original de Figma, para comparar: `H0-hoy`, `B0-plan-semanal`, `D7-calendario-semana`, `D3-detalle`, `A1-registrar-voz`, `A3c-registro-manual`, `E2-asistente`, `42-avisos`, `O2-bienvenido`, `P7-crear-plan`.
