# Gestión Equipos Críticos HHHA · UI (densa "pro")

Interfaz **rediseñada desde cero** sobre el núcleo lógico `../src/hhha-core.js`.
No reutiliza nada del diseño del archivo original: se generó **a partir de la
lógica** (entidades, estados, operaciones) con una estética _power-user_ de alta
densidad (estilo Linear / consolas de datos), inicio en **cola de trabajo** y
**100% funcional** (crea/edita/anula y persiste en `localStorage`).

## Cómo abrir
Abre `ui/index.html` en el navegador (doble click o `file://`). No requiere
servidor ni conexión: SheetJS y LZString están **vendorizados** en `ui/vendor/`.

```
ui/
├── index.html          Shell + orden de carga
├── styles.css          Sistema de diseño (tokens, light/dark, densidad alta)
├── app.js              Capa de vistas: router, tablas, drawer, command palette
└── vendor/
    ├── lz-string.min.js   Compresión de persistencia (engine ENV.compressor)
    └── xlsx.full.min.js   SheetJS: conciliación + export Excel (offline)
```
Carga: `lz-string` → `../src/seed-data.js` → `../src/hhha-core.js` → `xlsx` → `app.js`.

## Principios de diseño
- **Densidad alta**: filas compactas, tipografía 12–13px, números/IDs en monoespaciada,
  tablas con header pegajoso y orden por columna.
- **Cola de trabajo primero**: el inicio muestra lo accionable (alertas de equipos
  caídos/ST, pendientes vencidos, **MP del mes** pendientes, conflictos).
- **Sin modales centrales**: las acciones abren un **drawer** lateral derecho.
- **Estados como color**: operativo·verde, no operativo·rojo, servicio técnico·ámbar,
  baja·gris, desconocido·slate. Consistente en pills, badges y matriz MP.
- **Teclado**: command palette central + atajos (abajo).
- **Tema** claro/oscuro con un toque (persistente).
- **Densidad** compacta/cómoda con un toque (persistente): "cómoda" agranda filas, tarjetas
  y controles para mejor lectura; "compacta" es la vista densa de alta información.

## Atajos de teclado
| Tecla | Acción |
|---|---|
| `⌘K` / `Ctrl K` | Command palette (buscar equipos + acciones) |
| `/` | Abrir el buscador rápido |
| `j` / `k` | Mover selección en tablas (Equipos, Pendientes) |
| `Enter` | Abrir la fila seleccionada |
| `Esc` | Cerrar palette / drawer / popover |

## Vistas
- **Cola de trabajo** (ancho completo) — alertas + **Mi día** (pendientes **priorizados para
  hoy**: vencidos, vence hoy, recordatorios, en proceso, por vencer, sin asignar, con botón
  *Iniciar/Resolver* para avanzar en un clic) + MP del mes (con "MP masiva") + panel
  **Equipos caídos** (no operativos / en servicio técnico, con la última gestión y los días
  sin gestión, ordenable por **días en estado** o **días sin gestión**).
- **Equipos** — tabla densa filtrable (estado/servicio/familia/búsqueda), selección
  múltiple → **registrar MP** en lote, columna "MP del mes".
- **Tablero** — Kanban con tres modos conmutables (**arrastrar y soltar** con mouse):
  - **Por estado** (No operativo · En servicio técnico · Operativo): soltar una tarjeta en
    otra columna abre el evento que produce ese estado (Solicitud → no operativo, Envío →
    servicio técnico, Reparación → operativo; si el equipo no tiene ciclo abierto, "Operativo"
    abre una Visita técnica operativa en vez de Reparación). Filtro por búsqueda/servicio,
    orden por días en estado o "más abandonado" (última gestión), y toggle para ocultar
    operativos. Los filtros se conservan al re-renderizar (p. ej. tras guardar desde un drop).
  - **Pendientes** (No iniciado · En proceso · Resuelto): arrastrar **cambia el estado** del
    pendiente directo. Botón "Nuevo".
  - **Correctivos por etapa** (Solicitud → Visita → O. Compra → Envío → Recepción →
    Reparación): cada tarjeta es un ciclo abierto en su fase actual; arrastrarla a una etapa
    abre ese evento. Ves el pipeline de reparaciones de un vistazo.
- **Equipo (ficha)** — cabecera con estado + datos; pestañas **Resumen · Matriz MP ·
  Bitácora · Ciclos · Pendientes · Conflictos**. Acciones: MP rápida, nuevo evento,
  pendiente, dar de baja. La **Matriz MP** es editable por celda (click → registra MP)
  e incluye una fila **Responsable** para asignar quién hace la MP de cada mes.
- **Pendientes** — tabla por estado (activos/no iniciado/en proceso/resueltos), drawer
  con tareas atómicas y seguimientos.
- **Eventos** — bitácora global con selector **Bitácora · Correctivos**: la
  bitácora permite oficializar / editar / anular (con reversión de efectos);
  **Correctivos** lista los ciclos abiertos/cerrados/anulados. (Los ciclos de un
  equipo también están en su ficha, pestaña *Ciclos*.)
- **MP del mes** (sin ítem de menú) — detalle por mes de los equipos con MP programada
  y su responsable; se abre como **drill-down desde Cumplimiento** (y la alerta de MP del
  mes en la Cola de trabajo). El responsable de cada mes también se asigna desde la
  **Matriz MP** de la ficha del equipo.
- **Conciliación** — importar maestro Excel, auto-completar y resolver diferencias
  (aceptar maestro / mantener / manual / posponer, individual y en lote).

## Conexión con la lógica
Toda operación llama a la API `HHHA.*` (no hay lógica de negocio en la UI). El motor
se conecta al entorno mediante adaptadores inyectables:

```js
HHHA.configure({
  ui:  { notify, confirm, prompt, onChange },  // toasts, diálogos, re-render
  env: { xlsx: window.XLSX }                   // storage/compressor se autodetectan
});
HHHA.setSeed(SEED);
HHHA.bootstrapDatos();
```
`UI.onChange` re-renderiza la vista actual tras cada `save()`, manteniendo la
interfaz sincronizada con el estado.

## Almacenamiento en Google Sheets (opcional)

SIGEM puede guardar los datos en un **Google Sheet** mediante un **Apps Script
Web App**, manteniendo además hojas de trabajo legibles para usar el archivo sin
la app.

**Instalar** (una vez):
1. Crea/abre un Google Sheet → menú **Extensiones → Apps Script**.
2. Pega el contenido de `apps-script/Code.gs`. (Opcional: define `SHARED_TOKEN`.)
3. **Implementar → Nueva implementación → Aplicación web**: ejecutar como *Yo*,
   acceso *Cualquiera*. Copia la URL que termina en `/exec`.
4. En SIGEM → **Configuración**: pega la URL (+ token si lo usaste), **Probar
   conexión**, activa *Sincronización automática* y **Guardar configuración**.

**Cómo funciona** (el Google Sheet es el almacén/respaldo, no un backup aparte):
- El estado completo se guarda **comprimido en una hoja oculta** `_SIGEM_DATA`
  (las hojas de sistema empiezan con `_` y se ocultan automáticamente).
- En la **misma** sincronización se escriben además hojas **legibles** (Inicio/leyenda,
  Inventario, Plan anual MP, Hoja de ruta del mes, Pendientes, Bitácora) → así ves
  y trabajas los datos en el Sheet aunque no tengas la app.
- Con *Sincronización automática*: al abrir **trae** los datos; al cambiar algo
  **sube todo** (datos + hojas) con un pequeño retardo. También está *Guardar ahora*
  y *Traer datos* en **Configuración**.
- El **maestro** (importar Excel), la **plantilla de asignación** (descargar/subir) y
  la **resolución de conflictos** están en **Configuración** (ya no hay vista
  "Conciliación"; los conflictos por equipo también se ven en la ficha del equipo).
- El respaldo JSON queda como copia de emergencia opcional.
### Verlo desde cualquier parte (servido por el propio Apps Script) — recomendado

Para abrir SIGEM desde cualquier dispositivo con solo una URL y **sin problemas de
CORS**, sirve el HTML desde el mismo Apps Script:

1. En el proyecto de Apps Script, crea un archivo **HTML** llamado **`Index`**
   (➕ → HTML) y pega **todo el contenido de `app.html`** (o usa
   `apps-script/Index.html`, que ya es una copia lista).
2. Asegúrate de tener también `Code.gs` (ya incluye `doGet` que sirve `Index`).
3. **Implementar → Nueva implementación → Aplicación web** (acceso *Cualquiera*).
4. Abre la URL `…/exec`: verás la app. Detecta que corre dentro de Apps Script y
   usa el puente `google.script.run` para leer/guardar en la hoja (sin `fetch`,
   sin CORS). No hay que configurar URL ni token.

Si en cambio abres `app.html` localmente (`file://`) o lo hospedas aparte, la app
usa `fetch` contra la URL `…/exec` que pegues en Configuración (modo HTTP).

## Gestión (no solo registro)

Funciones para gestionar, no solo registrar:

- **Tendencia mensual de cumplimiento MP**: mini-gráfico de barras (% MP por mes
  del año) en *Cumplimiento*; clic en un mes lo selecciona.
- **Indicadores por responsable** (en *Cumplimiento*, modo *Por responsable*):
  pendientes abiertos, vencidos, MP ejecutadas (mes/año), eventos del año y
  equipos a cargo; clic → pendientes del responsable. Exportable.
- **Notas / observaciones por equipo**: panel en la ficha (Resumen) para agregar
  notas libres con autor y fecha (historial), auditadas.
- **Filtro por rango de fechas** (Desde / Hasta) en **Bitácora** (+ Exportar) y en
  la pestaña **Auditoría** de la ficha.

- **Recordatorios automáticos al abrir**: al cargar la app avisa (toast con acceso
  directo) de *pendientes vencidos* y *recordatorios para hoy* (`proxRecord`).
- **Auditoría por equipo**: pestaña *Auditoría* en la ficha con el **historial de
  cambios** (equipo, eventos, pendientes, tareas y ciclos): fecha/hora, campo,
  antes → después y usuario.
- **Cumplimiento por servicio** (vista nueva en el menú): tabla por servicio con
  equipos, estado (op/no-op/ST), **% operativo**, **MP del mes (ej/prog)**,
  **% cumplimiento MP** con barra, **MP atrasadas** y pendientes, con fila TOTAL,
  selector de mes/año, clic al detalle y *Exportar*.

- **Encargado del equipo**: ahora se puede **asignar explícitamente** (en la ficha,
  botón *Encargado*, o **en lote** seleccionando equipos en la lista). El motor lo
  prioriza sobre el derivado (ciclo/último ejecutor).
- **Equipos sin programación MP**: filtro *"Sin prog. MP"* + indicador en el inicio.
- **Reprogramaciones (C1–C8)**: bandeja propia (inicio → *Reprogramaciones*, abre
  Pendientes filtrado por ese tipo).
- **Vencimientos**: columna **Atraso** (días) y **Recordatorio** en Pendientes,
  orden por compromiso (más atrasados primero) y filtro *"Recordatorio ≤ hoy"*
  (+ indicador *Recordatorios hoy* en el inicio).
- **Exportar vista filtrada** a Excel: botón *Exportar* en **Equipos** y
  **Pendientes** (y *Exportar selección* en Equipos) — saca a `.xlsx` lo que estás
  viendo (p. ej. los pendientes de un responsable).


- **Pendientes**: filtro por **responsable** (incluye **"Sin asignar"**), filtro
  **"Solo vencidos"**, panel **"Carga por responsable"** (cuántos pendientes lleva
  cada uno, clic para filtrar) y **acciones en lote** sobre la selección —
  *asignar/quitar responsable*, *marcar en proceso* y *resolver*.
- **Equipos**: filtro **"Sin encargado"** y la columna *Encargado* resalta los
  equipos sin responsable.
- **Eventos**: filtro por **ejecutor** (incluye "Sin ejecutor").
- **Asignaciones MP**: selección múltiple para **asignar ejecutor** en lote.
- **Inicio**: la tarjeta *Pendientes* muestra *vencidos* y *sin asignar*.

> El registro de MP **en lote** (botones "MP masiva"/"Registrar MP" por selección)
> fue retirado de la UI; la MP se registra de forma individual (botón **MP** en
> línea, celda de la Matriz MP o **Nuevo evento**).

## Información incorporada desde SIGEM v1.0

Verificado contra el build `index_69.html` (SIGEM v1.0). La lógica de negocio y el
SEED son idénticos a los de este núcleo; se incorporó la **información/visión que
faltaba** en la UI, sin cambiar el diseño:

- **Cola de trabajo**: métricas *Alertas >30 días*, *MP atrasadas* (meses previos),
  *Borradores* (sin oficializar) y *MP del mes como % cumplido* con barra de progreso
  (9 indicadores accionables en total).
- **Asignaciones MP**: columnas *Resultado* y *Estado MP*, selección múltiple con
  *Registrar MP masiva* y *Asignar ejecutor* en lote, y filtros *Pendientes/Ejecutadas*
  y *Sin asignar*.
- **Equipos**: columna *Pend.* (pendientes abiertos) y filtros enlazados desde el inicio
  (*Alerta >30 días*, *MP atrasadas*).
- **Ficha de equipo**: campos *Familia* y *Clasificación*, y aviso de estado
  ("hace N días · encargado", en rojo si >30 días).
- **Formulario de evento**: campos faltantes — OC (*Empresa, Vía, Folio informe TD*),
  Recepción (*N° envío original, Folio guía*), MP (*Ejecutor 2*), Envío (*Ejecutor*).
- **Exportar Excel** → "Cuaderno de operaciones" autónomo, pensado para usarse **sin
  la aplicación**:
  - **Inicio** — leyenda de códigos (MP/causales/estados) y mapa de relaciones entre hojas.
  - **Inventario** — un registro por equipo: **ID_EQUIPO** (correlativo estable, clave
    surrogada), N° Carpeta, N° Inventario, equipo, servicio/unidad/ubicación, procedencia,
    marca/modelo/serie, año, VUR, clasificación y ENU/Baja. La unión con las demás hojas se
    hace por **N° Inv.** (= N° Inventario).
  - **Pendientes** — **ID_PENDIENTE**, N° Inv., equipo, tipo, descripción, responsable,
    estado y compromiso.
  - **Tareas** — **ID_Tareas**, N° Inv., equipo, tipo, descripción, responsable, estado y
    compromiso (tipo/responsable/compromiso derivados del pendiente padre).
  - **Tareas-Pendientes** — tabla puente **ID_PENDIENTE ↔ ID_TAREAS**.
  - **Bitácora** — todos los eventos vigentes con **ID_BITACORA**: fechas, equipo, tipo,
    resultado, estado, ejecutor y el detalle correctivo (folio, N° envío/OC/cotización,
    empresa, técnico), observación y oficial.
  - **Equipos en servicio técnico** / **Equipos no operativos** — equipos en ese estado, con
    días en estado, **última gestión** y **días sin gestión**, encargado, pendientes abiertos
    y el N° de informe/folio y apertura del ciclo correctivo abierto.

  (La planificación MP — plan anual, hoja de ruta, cumplimiento por mes — se trabaja en la app;
  el libro mantiene sólo el set de datos relacional.)

## Notas
- Mismo `STORAGE_KEY` que el núcleo (`hhha_v1_data`): comparte datos con cualquier
  app que use este motor.
- Sin dependencias de build: HTML/CSS/JS plano. Verificado headless (jsdom): arranque,
  las 8 vistas, las 6 pestañas de ficha, command palette, drawers que escriben en el
  estado, export Excel y conciliación con SheetJS — 23/23 sin errores.
