# Plan de rediseño — Gestión Equipos Críticos HHHA · v2

> Documento de trabajo **estricto**. Cada fase tiene su *gate* de validación.
> Regla de oro: **nada se entrega si la batería de pruebas no está 100 % verde**
> y si alguna tabla deja barra de desplazamiento horizontal.

## 0. Decisiones aprobadas por el usuario
- **Ficha del equipo en 3 pestañas**: `Mantención` · `Historial` · `Archivos`.
- **Navegación = barra SUPERIOR** (se retira el rail lateral izquierdo).
- **"Registro"** (orden por fecha/hora de *creación*): **solo como hoja del Google Sheet**.
- Cada equipo conserva **Notas** y **Registrar gestión**.

## 1. Principios de diseño
1. **Minimalista**: una intención por pantalla, menos clics, jerarquía clara.
2. **Operativo**: el norte es *mantener todo operativo* + *trazabilidad de cada gestión*.
3. **Sin scroll horizontal**: criterio de aceptación duro en toda tabla/lista.
4. **Sin perder funcionalidades**: se rediseña la PRESENTACIÓN, no se elimina lógica.
5. **Reversible**: commits por fase, build reproducible, Code.gs versionado.

## 2. Inventario de funcionalidades a PRESERVAR (checklist anti-regresión)
- [ ] Cola de trabajo / **Mi día** (pendientes priorizados + avanzar 1 clic).
- [ ] Alertas (no operativos, servicio técnico, >30 días, MP del mes, atrasadas, ciclos, **correctivos estancados**, reprogramaciones, recordatorios, sin programación, borradores, conflictos).
- [ ] **Equipos caídos** (días en estado, última gestión, días sin gestión, exportar, **Registrar gestión**).
- [ ] **Equipos**: tabla filtrable (filtros tipo Excel), selección múltiple → MP en lote, columna MP del mes, **Exportar**.
- [ ] **Tablero** (3 modos arrastrar y soltar): por estado · pendientes · **correctivos por etapa (pipeline: tiempo en etapa, estancado, siguiente paso)**.
- [ ] **Pendientes**: filtros, **Exportar**, tareas, seguimientos.
- [ ] **Bitácora/Eventos**: editar evento, **columna Pendientes vinculados + crear pendiente del evento**, **Exportar**, ver importados.
- [ ] **Cumplimiento**: por servicio / por responsable / por mes, drill-down, **Exportar**.
- [ ] **Configuración**: conexión Sheet, **importar maestro .xlsx/.xlsm**, descargar/subir plantilla MP, mantenimiento de datos, **respaldo JSON condicional** (solo sin Sheet).
- [ ] **Ficha**: Matriz MP, bitácora, ciclos, pendientes, conflictos, notas, **gestión**, **adjuntos Drive**.
- [ ] Motor: estados/causales (C1–C8/FS/NU/Baja), ciclos abrir/cerrar, normalizadores, reversión por anulación.
- [ ] Exportes a Excel (respetan filtro) · **Adjuntos en Google Drive** · densidad/tema.

## 3. Cambios estructurales (UI)
- **Barra superior de navegación**: logo · items (Hoy · Equipos · Tablero · Pendientes · Cumplimiento) · buscador global · densidad/tema · Configuración. Se retira el rail; responsive (menú compacto en pantallas chicas).
- **Ficha del equipo → 3 pestañas + cabecera**:
  - Cabecera: estado + días + **última gestión** + barra de acciones (Nuevo evento · Registrar gestión · Pendiente · Adjuntar · Baja) + datos plegables.
  - **① Mantención**: **Matriz MP EDITABLE** (clic en celda con C6 → cambiar a C3/Si/… y recalcula) + responsable por mes + observaciones MP.
  - **② Historial**: **Bitácora como línea de tiempo** legible (fecha · tipo · resultado/estado · ejecutor · 📎 · pendientes vinculados; clic = editar) + **ciclos/correctivos** integrados en el mismo hilo.
  - **③ Archivos**: adjuntos en Drive + **Notas** del equipo.
  - **Auditoría**: se retira de la ficha (accesible discreto en Configuración).
  - **Conflictos**: deja de ser pestaña; se muestra como **aviso** solo si existen.
- **Matriz MP editable**: la celda de Resultado abre edición de la MP existente (o crea si no hay).
- **Sin scroll horizontal**: todas las tablas con celdas acotadas (patrón `capCell`).

## 4. Cambios en el Google Sheet
- **Nueva hoja `Registro`**: todos los eventos ordenados por **fecha y hora de creación** (`fechaReg`/`ts` desc) → ver lo último capturado. Columnas: Creado (fecha/hora) · N° Inv. · Equipo · Tipo · Resultado · Estado · Ejecutor · N° Informe/Folio · Observación.
- Se mantiene el modelo relacional (Inventario, Pendientes, Tareas, Tareas-Pendientes, Bitácora por fecha de evento, Equipos en servicio técnico, Equipos no operativos).
- Revisar columnas/redundancias; hojas de sistema (`_`) ocultas; limpieza de huérfanas.

## 5. Pasos de ejecución (ORDEN ESTRICTO)
- **Fase A — Baseline**: correr toda la batería; debe estar verde antes de empezar.
- **Fase B — Barra superior**: reestructurar el chrome (topbar de navegación), retirar rail, responsive. *Gate B*.
- **Fase C — Ficha 3 pestañas**: reorganizar a Mantención/Historial/Archivos + cabecera con acciones + Notas + Gestión; retirar Auditoría; Conflictos→aviso. *Gate C*.
- **Fase D — Matriz MP editable**: editar la MP existente desde la celda (C6→C3) con recálculo. *Gate D*.
- **Fase E — Bitácora línea de tiempo**: rediseño legible, sin amontonar, sin scroll. *Gate E*.
- **Fase F — Sheet `Registro`**: agregar la hoja por fecha/hora de creación. *Gate F*.
- **Fase G — Verificación final**: batería completa + crawler + visual. *Gate final*.
- Cada fase termina en: `npm run build` + pruebas de la fase + commit.

## 6. Validaciones y pruebas de humo (cada *gate*)
1. **Sintaxis/Build**: `node --check` de core/app + build reproducible (app.html == Index.html).
2. **Smoke test**: arranca con la semilla embebida y navega todas las secciones sin error.
3. **Click-crawler quirúrgico**: pulsa **TODOS** los botones/enlaces de cada vista (re-render entre clics) → **0 errores**.
4. **Auditoría de flujos (≥25 checks)**: MP por causal, anulación con reversión, ciclo abrir/cerrar, pendientes (crear/estado/cerrar/anular), baja, invariantes (estado=recalculado, IDs únicos, ciclos coherentes).
5. **Pruebas específicas nuevas**:
   - Ficha con **exactamente 3 pestañas** (sin Auditoría).
   - **Matriz editable**: cambiar C6→C3 en una celda actualiza el evento y recalcula el estado.
   - **Bitácora timeline** legible y **sin scroll horizontal**.
   - **Barra superior** presente con todos los accesos; rail retirado.
   - **Notas** y **Registrar gestión** disponibles por equipo.
   - **Sheet `Registro`** presente y ordenado por fecha/hora de creación (desc).
6. **Medición de ancho (anti-scroll)**: para cada tabla/lista, `scrollWidth ≤ clientWidth` a **1366 y 1900 px**.
7. **Juicio visual**: capturas de las pantallas clave (Hoy, Equipos, Ficha×3 pestañas, Bitácora-timeline, Matriz editable, Tablero, Configuración) y revisión de que se vea limpio y ordenado.

## 7. Criterios de aceptación ("definición de listo")
- [ ] Barra superior de navegación; sin rail lateral.
- [ ] Ficha en 3 pestañas (Mantención/Historial/Archivos) + Notas + Gestión.
- [ ] Matriz MP editable (C6→C3 funciona y recalcula).
- [ ] Bitácora legible (línea de tiempo), **sin scroll horizontal** en ninguna tabla.
- [ ] Hoja `Registro` por fecha/hora de creación en el Sheet.
- [ ] **Todos los botones funcionan** (crawler 0 errores).
- [ ] **Todas las funcionalidades del §2 siguen operativas**.
- [ ] Batería 100 % verde + capturas revisadas.
- [ ] Nuevo sello de versión (**v2.0**).

## 8. Entregables
- `apps-script/Index.html` (pegar en Apps Script) y `app.html` (navegador) — interfaz renovada.
- `apps-script/Code.gs` — backend con la hoja `Registro` (y Drive ya existente).
- Capturas de pantallas clave + resumen de cambios.

## 9. Seguridad / reversibilidad
- Un commit por fase con mensaje claro; rama de trabajo dedicada.
- Build reproducible (`npm run build`) y artefactos sincronizados.
- La lógica de negocio (núcleo `hhha-core.js`) se conserva; los cambios son de presentación + edición de MP + hoja Registro.
