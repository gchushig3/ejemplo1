# Auditoría de Accesibilidad (WCAG 2.2 AA), UX y Diseño Responsive

- **Objetivo auditado:** `C:\ejemplo1\paginaCristianoRonaldo\` (index.html, styles.css, script.js)
- **Método:** auditoría estática no destructiva (no se modificó ningún archivo). Contraste calculado con la fórmula oficial WCAG, sintaxis JS validada con `node --check`, marcado HTML y CSS analizados en detalle. Las medidas que dependen de renderizado se marcan como **"requiere verificación"**.
- **Enfoque:** WCAG 2.2 Nivel AA, UX y responsive en 320 px, 390 px, 768 px y escritorio.
- **Fecha:** 20/09/2026

---

## 1. Resumen ejecutivo

La página tiene una base sólida y por encima del promedio: marcado semántico correcto (`header`, `nav`, `main`, `footer`, `section`, `article`, `figure`, tablas con `thead`/`tbody`/`tfoot`), textos alternativos descriptivos en todas las imágenes, soporte de teclado en filtros, menú y lightbox, indicador de foco global robusto, `prefers-reduced-motion` contemplado en CSS y JS, y contrastes de texto mayormente muy holgados.

Se detectaron **0 hallazgos críticos**, **1 hallazgo alto**, **8 medios** y **6 bajos**. El principal problema es de diseño responsive: el punto de ruptura de 768 px muestra el menú de escritorio cuando todavía no cabe, lo que en anchos intermedios (~768–900 px) puede dejar enlaces del menú fuera de pantalla sin ninguna alternativa (el botón hamburguesa ya no existe) y con el `overflow-x: hidden` del `body` enmascarando el desbordamiento. También hay dos fallos reales de contraste 1.4.11 (borde del CTA `btn-outline`) y de texto sobre el degradado de la insignia de marca (CR7), además de una mala aplicación del patrón ARIA `toolbar`.

| Severidad | Cantidad |
|-----------|----------|
| Críticos  | 0        |
| Altos     | 1        |
| Medios    | 8        |
| Bajos     | 6        |

---

## 2. Hallazgos

### 2.1 Hallazgos críticos

No se detectaron hallazgos críticos. Se consideraría crítico un fallo que impida por completo el uso con teclado, bloquee lectores de pantalla o haga incomprensible el contenido en todas las resoluciones; ninguno de los siguientes llega a ese grado (todos tienen una vía alternativa utilizables o afectan a un subconjunto de anchos de pantalla).

### 2.2 Hallazgos altos

**H-A1 — Menú de navegación inaccesible en anchos intermedios (768–~900 px).**
En `styles.css:1112-1122` el bloque `@media (min-width: 768px)` oculta el botón hamburguesa (`.menu-toggle { display: none }`) y muestra el menú horizontal (`.main-nav { display: block }`), pero el conjunto marca (≈246 px) + 6 enlaces con su padding y espacios (est. ≈600…610 px con `gap: 0.5rem`, padding `0.5rem 0.9rem` y fuente 0.95rem) supera el ancho disponible (768 px − 40 px de `padding-inline: 1.25rem` del `.container` = 728 px). El cálculo estimado total es ≈850 px, por lo que los últimos enlaces quedan recortados. Como `.nav-list` no permite `wrap` ni scroll y `body { overflow-x: hidden }` (`styles.css:79`) enmascara el desbordamiento, los destinos quedan **inutilizables sin aviso** y sin el menú móvil como alternativa. Relacionado con 1.4.10 (Reflow), 1.4.11 y usabilidad móvil/tablet. **Requiere verificación** en 768–900 px.

### 2.3 Hallazgos medios

**H-M1 — Contraste insuficiente del texto de la insignia de marca.**
`.brand-badge` (`styles.css:201-208`) aplica un degradado lineal `#e11d48 → #f59e0b` con texto blanco 0.95rem (negrita, no es "texto grande" según WCAG: exige 4.5:1). El contraste medido es: blanco sobre `#f59e0b` = **2.15:1**; sobre el punto medio del degradado `#DA5824` = **3.89:1** (solo sobre el extremo `#be123c` se alcanza 6.29:1). Incumple 1.4.3 (Contraste mínimo). El texto "CR7" es el nombre de la marca y contenido significativo.

**H-M2 — Borde del CTA "Ver Récords y Cifras" sin contraste no textual.**
`.btn-outline` (`styles.css:368-372`) es un enlace que se identifica únicamente por su borde de 2 px `#475569` sobre fondo `#0a0e17`: contraste **2.55:1**, inferior al 3:1 exigido por 1.4.11 (Contraste no textual, límite del componente; fondo transparente, sin relleno identificador).

**H-M3 — `role="toolbar"` aplicado sin el patrón de "roving tabindex".**
`index.html:161` declara `role="toolbar"` sobre los filtros. El patrón ARIA APG de toolbar exige un único foco dentro de la barra y desplazamiento solo con flechas; aquí los 7 botones permanecen en el orden de tabulación normal **y además** `script.js:156-171` implementa flechas `←/→`, `Home`/`End` para mover el foco, duplicando mecánicas de navegación y entrando en conflicto con Tab. Es un uso incorrecto de ARIA (afecta a 4.1.2 y a la previsibilidad del teclado). Los 7 botones accionables por pestaña serían correctos sin el rol.

**H-M4 — Salto de nivel de encabezado h1 → h3.**
`index.html:63` declara el `h1` del hero y `index.html:76` el `h3` "Perfil Rápido" del `aside`, saltándose el nivel `h2`. Incluso siendo un bloque lateral, el encabezado pertenece al flujo del documento; los lectores de pantalla anuncian la ruptura de jerarquía (relacionado con 1.3.1). El resto de niveles (h1 → h2 → h3 → h4) es correcto.

**H-M5 — Pérdida de foco al cerrar el menú móvil.**
Al pulsar un enlace, `script.js:47-55` oculta el menú (`display: none`) dejando el foco sobre un elemento ya no visible; el navegador reasigna el foco a `body`, por lo que un usuario de teclado debe recorrer de nuevo toda la página desde el inicio. El salto de ancla no gestiona el foco (excepto en el `skip-link`). Afecta a 2.4.3 (Orden de foco) y a la navegación por teclado.

**H-M6 — Cabecera demasiado estrecha a 320 px.**
`.nav-container` (`styles.css:183-188`) tiene altura fija 72 px, `justify-content: space-between` y sin `flex-wrap`; a 320 px el ancho disponible es 280 px y el bloque marca (≈247 px) + botón hamburguesa (44 px, `styles.css:214-225`) suma ≈291 px. Riesgo de solapamiento entre el texto de la marca y el botón en pantallas de 320 px (iPhone SE). **Requiere verificación** con renderizado real.

**H-M7 — Tarjetas de la línea de tiempo enfocables sin interacción.**
Siete tarjetas tienen `tabindex="0"` (`index.html:176`, `:193`, `:210`, `:227`, `:244`, `:261`, `:278`) con estilo de foco dedicado (`styles.css:651-656`), pero no son interactivas: al enfocarlas, Tab detiene la navegación y Enter/Espacio no hacen nada. Añaden pestañas "fantasma" que confunden a usuarios de teclado (relacionado con 2.4.3 y UX de teclado).

**H-M8 — Navegación móvil inaccesible sin JavaScript.**
`.main-nav` está en `display: none` (`styles.css:236-250`) y solo se muestra con la clase `.is-open` que agrega `script.js`. Si JS falla o está deshabilitado, en <768 px no hay forma de llegar al menú (mejora progresiva ausente para la navegación principal). En ≥768 px el menú sí es visible sin JS.

### 2.4 Hallazgos bajos

**H-B1 — La tabla no usa `<caption>`.**
`index.html:360` describe la tabla solo con `aria-label`. Un `<caption>` asociado mejoraría la accesibilidad estándar y la coherencia visual (técnica aceptada para 1.3.1/4.1.2; el `aria-label` actual ya cumple).

**H-B2 — La tecla Escape no cierra el menú móvil.**
El menú se cierra por toggle, clic en enlace o clic fuera (`script.js:34-66`), pero no con `Esc`. Recomendado por convención de navegación por teclado (el lightbox sí lo gestiona de forma nativa).

**H-B3 — Fallback del `dialog` limitado en navegadores antiguos.**
`script.js:289-297` y `:299-306` prevén la ausencia de `showModal()/close()` usando el atributo `open`, pero en ese fallback no hay trampa de foco ni `::backdrop`, y el resto del contenido queda operable. Solo afecta a navegadores sin soporte de `<dialog>` (≈pre-2022); degradación aceptable pero conviene evaluarla.

**H-B4 — El `alt` del lightbox se vacía al cerrar y el `src` queda vacío.**
`script.js:309-310` restablece `src=""` y `alt=""`. Mientras el diálogo está cerrado es inofensivo, pero algunos navegadores llegan a lanzar una petición al vaciar `src`. Alternativa: `src` a un dato transparente o `removeAttribute`.

**H-B5 — Enlaces de pie con anclas internas sin gestión de foco.**
Los enlaces "Mapa del Sitio" (`index.html:635-642`) saltan por anclas sin mover el foco programático; en usuarios de teclado el foco permanece en el enlace y la siguiente pestaña reinicia desde el pie. Patrón extendido: mover el foco al destino (`tabindex="-1"`) como ya hace `initSmoothScrollFocus` con el skip-link.

**H-B6 — Cultivos de código dificultan la localización del desbordamiento.**
`body { overflow-x: hidden }` (`styles.css:79`) oculta cualquier exceso horizontal en lugar de permitir informarlo; enmascara el problema H-A1 y complica depurar desbordes futuros (relacionado con 1.4.10).

---

## 3. Evidencia concreta

| ID | Archivo:línea | Elemento afectado | Justificación |
|----|---------------|-------------------|---------------|
| H-A1 | `styles.css:1112-1122`, `:236-250`, `:79`; `index.html:45-54` | `.main-nav`, `.menu-toggle`, `.nav-list`, 6 `.nav-link` | Cambio de breakpoint a 768 px; medico de marca+menú ≈850 px > 728 px disponibles; sin wrap ni scroll; `overflow-x: hidden` oculta el recorte |
| H-M1 | `styles.css:201-208`; `index.html:27` | `.brand-badge`, texto "CR7" | Degradado `#e11d48 → #f59e0b`; blanco sobre `#f59e0b` = 2.15:1; mid = 3.89:1; mínimo 4.5:1 |
| H-M2 | `styles.css:368-372` | `.btn-outline` ("Ver Récords y Cifras") | Borde `#475569` sobre `#0a0e17` = 2.55:1; 1.4.11 exige ≥3:1 |
| H-M3 | `index.html:161`; `script.js:152-173` | `div[role="toolbar"]`, `.filter-btn` | Rol toolbar sin roving tabindex; flechas redundantes con buttons en tab order |
| H-M4 | `index.html:63`, `:76` | `h1.hero-title` → `h3` "Perfil Rápido" | Nivel h2 omitido en el `aside` del header |
| H-M5 | `script.js:47-55`, `:34-44` | Cierre del menú al seleccionar el enlace | `display:none` deja el foco en elemento oculto; sin reposicionamiento programático |
| H-M6 | `styles.css:183-188`, `:214-225`; `index.html:26-29` | `.nav-container` a 320 px | 280 px disponibles vs ≈291 px de marca+hamburguesa |
| H-M7 | `index.html:176`, `:193`, `:210`, `:227`, `:244`, `:261`, `:278`; `styles.css:651-656` | `.timeline-card` con `tabindex="0"` | Enfocables sin acción; 7 tab stops sin propósito |
| H-M8 | `styles.css:236-250`; `script.js:26-67` | `.main-nav` | `display:none` por defecto, solo `.is-open` (requiere JS) lo muestra |
| H-B1 | `index.html:360` | `<table class="data-table">` | Solo `aria-label`, sin `<caption>` |
| H-B2 | `script.js:34-66` | Cierre del menú móvil | No hay handler de `Escape` para el menú |
| H-B3 | `script.js:289-297`, `:299-306` | Fallback sin `showModal/close` | Trampa de foco y backdrop ausentes en la rama `open` |
| H-B4 | `script.js:309-310` | `#lightbox-img` | `src=""`/`alt=""` al cerrar |
| H-B5 | `index.html:635-642` | Enlaces "Mapa del Sitio" | Anclas sin gestión de foco |
| H-B6 | `styles.css:79` | `body` | `overflow-x: hidden` enmascara debordes |

### Criterios verificados que cumplen (sin hallazgos)

- **1.3.1 (Información y relaciones):** estructura completa de landmarks (`header`, `nav` con `aria-label`, `main`, `footer`); listas (`ul`/`ol`), `<dl>` en la ficha técnica, tablas con `thead/tbody/tfoot` y `scope` (`index.html:360-423`); un solo `h1`; tarjetas con `figure`/`figcaption` (`index.html:441-521`).
- **1.1.1 (Texto alternativo):** todas las imágenes de la galería tienen `alt` descriptivo y específico (`index.html:450`, `:471`, `:492`, `:512`); iconos decorativos con `aria-hidden="true"` (`index.html:310`, `:318`, `:326`, `:334`, `:342`, `:350`, `:553`, `:571`, `:589`, `:607`, `:454`, `:475`, `:496`, `:517`). `width`/`height` declarados evitar desplazamiento de layout.
- **1.4.3/1.4.6 (Contraste de texto):** contrastes verificados: cuerpo `#cbd5e1`/`#0a0e17` = 13.0:1; `#94a3b8`/`#111827` = 6.92:1; dorado `#f59e0b`/tarjeta `#1f293d` = 6.78:1; `#fbbf24`/tarjeta = 8.72:1; negro sobre botón de filtro activo = 9.78:1; blanco sobre `#e11d48` (skip-link) = 4.70:1 (mínimo, con margen).
- **1.4.1/1.4.11 (Uso del color, contraste no textual):** estados activos reforzados con doble indicación (fondo dorado + texto negro en `.filter-btn.active`, `styles.css:586-592`; `.nav-link.active` con fondo y borde, `styles.css:277-281`); el indicador de foco global `#38bdf8` sobre fondo oscuro = 9.01:1, con `outline-offset` (`styles.css:109-113`); los puntos del timeline y el foco de tarjeta tienen contraste >3:1.
- **1.4.10 (Reflow):** grids con `repeat(auto-fit, minmax(...))` (`styles.css:720`, `:832`, `:977`) y `clamp()` en tipografías; la tabla tiene wrapper con `overflow-x: auto` (`styles.css:768-775`), evitando el desbordamiento de la tabla en 320/390 px.
- **2.1.1/2.1.2 (Teclado):** todos los controles son `button` o `a` nativos; el lightbox es `<dialog>` nativo con `showModal` (Escape, trampa de foco y devolución de foco en `script.js:289-340`); los filtros responden a clic y teclado (`script.js:152-173`); el menú es operable por teclado.
- **2.4.1 (Saltar bloques):** `skip-link` válido que además reposiciona el foco (`index.html:20`, `script.js:349-361`); un solo `nav`.
- **2.4.7 (Foco visible):** `:focus-visible` global (`styles.css:109-113`), con sobreescritura específica en `.timeline-card` y `.skip-link:focus`.
- **2.5.8/2.5.5 (Tamaño de objetivo):** `#menu-toggle` 44×44 (`styles.css:219-220`), `#lightbox-close` 44×44 (`styles.css:927-928`), `.nav-link` ≈50 px, `.filter-btn` ≈45 px de alto; los enlaces de tarjeta (`.card-link`) alcanzan ~24 px mínimos exigidos por 2.5.8.
- **2.3.x / 2.2.2 (Movimiento reducido):** `@media (prefers-reduced-motion: reduce)` desactiva animaciones y desplazamiento suave (`styles.css:1183-1200`) y el contador de estadísticas respeta el render directo sin animar (`script.js:224-235`).
- **ARIA (nombres y estados):** `aria-expanded`/`aria-controls`/`aria-label` en el toggle (`index.html:32-42`), `aria-pressed` en filtros (HTML y `script.js:123-128`), `aria-current` gestionado por el scroll spy (`script.js:87-105`), región `aria-live="polite"` con anuncio de resultados (`index.html:170`, `script.js:146-149`), `aria-hidden` en elementos filtrados (`script.js:140-142`), nativos `aria-labelledby` en el diálogo.
- **Errores JavaScript:** `node --check script.js` = sin errores de sintaxis; todos los accesos al DOM comprueban la existencia previa (`if (!toggleBtn || !navMenu) return;`, etc.).
- **Vínculos e IDs:** todos los `href="#..."` resuelven a un `id` existente y único (verificado programáticamente; sin IDs duplicados).

---

## 4. Recomendaciones de corrección

**H-A1 (alto):**
- Subir el breakpoint del menú a `min-width: 1024px` o medir el ancho real del `.nav-list` y fijarlo donde quepa con margen de seguridad.
- Si se mantiene 768 px: permitir `flex-wrap: wrap` en `.nav-list`, o reducir paddings/tamaño de fuente, o añadir `overflow-x: auto` al `.main-nav` en lugar de recortar.
- Evitar depender de `body { overflow-x: hidden }` para maquetar; quitar el recorte una vez resuelto.

**H-M1:** Usar texto oscuro (`#000` con contraste 9.78:1 sobre el extremo dorado) o reducir el rango del degradado y limitarlo a tonos rojos (p. ej. `#e11d48 → #be123c`), o añadir un fondo de `#be123c` sólido detras del texto.

**H-M2:** Aumentar el contraste del borde (usar `#60a5fa`/`#fbbf24` u otro ≥3:1 sobre `#0a0e17`) o añadir un relleno de fondo identificador; mantener el `color` del enlace ≥4.5:1.

**H-M3:** Eliminar `role="toolbar"` y dejar una fila accesible de botones de alternancia (`aria-pressed`) en orden de tabulación normal; alternativa: implementar roving tabindex (un solo `tabindex="0"`, el resto `"-1"`) y conservar las flechas.

**H-M4:** Cambiar el `h3` "Perfil Rápido" a `h2` (respetando la jerarquía tras el `h1` del hero).

**H-M5:** Al cerrar el menú por selección de un enlace, aplicar el mismo patrón del skip-link: `tabindex="-1"` + `focus()` sobre la sección destino (`#trayectoria`, `#estadisticas`, etc.) antes de ocultar el menú.

**H-M6:** Permitir que la marca se contraiga a pantallas pequeñas (`white-space: nowrap` + `overflow: hidden; text-overflow: ellipsis`) o reducir `font-size` en `@media (max-width: 360px)`; verificar sin solapamiento.

**H-M7:** Eliminar `tabindex="0"` de las tarjetas sin interacción; si se desea selección, implementar una acción real (Enter/Espacio) con estado `aria-pressed`/expansión correspondiente.

**H-M8:** Añadir una clase `no-js` en `<html>` que mantenga el menú visible en <768 px (o un estilo base `details>`-like) y eliminarla vía JS al cargar; garantiza navegación móvil sin JS.

**H-B1:** Añadir `<caption class="sr-only">Resumen de goles oficiales de Cristiano Ronaldo por equipo</caption>` a la tabla.

**H-B2:** Escuchar `keydown` con `event.key === "Escape"` en `document` para cerrar el menú y devolver el foco al toggle cuando esté abierto.

**H-B3:** En el fallback del diálogo, introducir una trampa de foco mínima (bloquear Tab) y `aria-modal="true"`; o aceptar/validar el soporte actual de `dialog` si el período de soporte de navegadores antiguos no es relevante.

**H-B4:** En `closeLightbox` evitar `src=""` (p. ej. `modalImg.removeAttribute("src")` y eliminar también el `alt`) para no provocar peticiones residuales.

**H-B5:** Aplicar a los enlaces de "Mapa del Sitio" la misma gestión de foco que el skip-link (mover el foco al destino con `tabindex="-1"`).

**H-B6:** Sustituir `overflow-x: hidden` global por causas localizadas (ya se usa en `.table-responsive-wrapper`); de mantenerse, solo como último recurso con justificación.

---

## 5. Pruebas a repetir después de corregir

1. **Contraste automatizado y manual:** reescanear con axe DevTools y Lighthouse; medir manualmente H-M1 (badge CR7) y H-M2 (borde `btn-outline`); verificar en 1.4.11.
2. **Breakpoints responsivos:** recorrer 320, 390, 768, 1024 y 1440 px comprobando que todos los enlaces del menú son visibles y operables sin scroll horizontal; repetir con zoom al 200 % y con `prefers-reduced-motion`.
3. **Navegación por teclado (WCAG 2.1.1/2.4.3/2.4.7):** Tab desde el inicio verificando: skip-link → marca → menú → contenido; foco visible en cada elemento; Enter en galería y filtros; Escape en lightbox y (tras H-B2) en menú móvil; confirmar foco devuelto al elemento que disparó.
4. **Lectores de pantalla (NVDA/VoiceOver):** comprobar jerarquía de encabezados (sin saltos), lectura de `aria-live` en filtros, anuncio de `aria-pressed`/`aria-expanded`, nombre de la tabla.
5. **Modales:** abrir/cerrar el lightbox por botón, fondo y Escape; verificar trampa de foco y restauración del foco.
6. **Sin JavaScript:** deshabilitar JS y confirmar acceso al menú móvil (tras H-M8) y lectura de todo el contenido con imágenes `alt`.
7. **Interacciones móviles:** tamaño/ubicación de objetivos ≥44 px (toggle, filtros, tarjetas); cierre del menú por enlace y por clic exterior con foco bien administrado (tras H-M5).
8. **Flujo de regresión:** volver a ejecutar `node --check script.js` y una validación HTML (W3C Nu) tras las correcciones.