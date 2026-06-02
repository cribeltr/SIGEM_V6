# HHHA · Núcleo lógico (sin vistas, diseño ni arquitectura visual)

Extracción de la lógica del archivo monolítico original **`app_28.html`** (HHHA ·
Gestión de Equipos Biomédicos Críticos, v0.62), dejando **solo el código** y
quitando **todo lo visual**.

## Qué hay aquí

| Archivo | Contenido |
|---|---|
| `hhha-core.js` | **Núcleo lógico completo**: modelo de dominio, estado, persistencia, reglas de negocio, motor de estados, conciliación con el maestro Excel, operaciones (MP / eventos / pendientes / baja) y export/import de datos. **Sin DOM.** |
| `seed-data.js` | **Dataset semilla** (893 equipos, 85 eventos, 34 pendientes). Es DATO, no lógica; extraído _verbatim_ del original. |

## Qué se quitó (lo visual)

- **CSS / diseño** (`<style>`, ~560 líneas).
- **Marcado HTML / vistas** (`<body>`, sidebar, topbar, modales).
- **Helpers DOM**: `$`, `$$`, `el`, `modal`, `closeModal`, `toast`, `badge*`, `seccionColapsable`, `formField`, `eqInfoCell`.
- **Vistas y render**: `VIEWS.*` (dashboard, equipos, equipo, asignaciones, ciclos, pendientes, eventos, conciliación), `render*`, carta gantt, tablas, KPIs, filtros estilo Excel.
- **Navegación / chrome**: `navigate`, `navBack`, `buildNav`, `refreshNav`, `quickSearch`, temas, barra lateral.
- **Grabador de sesión** (session recorder) — herramienta de UI/debug.

## Cómo se desacopló de la UI

La lógica era inseparable del DOM (cada operación construía un modal y leía
`input.value` dentro de un `guardar()`). En la extracción:

1. **Los formularios/modales se volvieron funciones con parámetros.** Antes
   `mpRapida()` abría un modal; ahora `registrarMP({inv, fecha, resultado,
   ejecutor, obs, estadoSi})` recibe los datos y devuelve `{ok, evento}`.
2. **Los efectos de UI pasan por un adaptador inyectable `UI`**
   (`notify`, `confirm`, `alert`, `prompt`, `onChange`). Por defecto son neutros.
3. **El entorno pasa por `ENV`** (`storage`, `compressor`=LZString,
   `xlsx`=SheetJS), para correr en navegador o en Node.

Las **reglas de negocio y algoritmos se conservan _verbatim_** (motor de estados,
reversión de anulaciones, conciliación, auto-completado, pendientes automáticos
por causal C1–C8, etc.).

## Uso

### En el navegador
```html
<script src="lz-string.js"></script>   <!-- opcional: compresión -->
<script src="xlsx.full.min.js"></script> <!-- opcional: import/export Excel -->
<script src="seed-data.js"></script>
<script src="hhha-core.js"></script>
<script>
  HHHA.setSeed(SEED);
  HHHA.configure({ ui: {
    notify: (msg, type, action) => {/* tu toast */},
    confirm: (msg) => window.confirm(msg),
    prompt:  (msg) => window.prompt(msg),
    onChange: () => {/* re-render de tu vista */}
  }});
  HHHA.bootstrapDatos();      // carga o inicializa el state
  // ... tu capa de vistas usa la API de HHHA ...
</script>
```

### En Node
```js
const HHHA = require('./hhha-core.js');
const SEED = require('./seed-data.js');
HHHA.setSeed(SEED);
HHHA.bootstrapDatos();
HHHA.registrarMP({ inv:'2-115361', fecha:HHHA.hoyLocal(),
                   resultado:'Si', ejecutor:'Marco Ulloa',
                   estadoSi:'operativo', forzarSinProg:true });
```

## Mapa de la API (`HHHA.*`)

- **Arranque/estado**: `setSeed`, `configure`, `bootstrapDatos`, `init`, `load`,
  `save`, `migrate`, `resetState`, `getState`, `stateEsFresh`.
- **Dominio (consultas)**: `findEquipo`, `eventosDe`, `pendientesDe`,
  `conflictosDe`, `ciclosDe`, `ciclosAbiertosDe`, `encargadoDe`.
- **Motor de estados**: `recalcEstadoEquipo`, `estadoMPDesdeResultado`,
  `estadoMPFinal`, `estadoDesdeMatriz`, `resultadoMPMes`, `mpEstadoMes`,
  `mpProgramadaEnMes`, `diasEnEstado`.
- **Ciclos / efectos**: `abrirCiclo`, `cerrarCiclo`, `crearPendienteAuto`,
  `aplicarEfectosEvento`.
- **Conciliación maestro**: `parsearMaestro`, `compararMaestro`,
  `resolverConflicto`, `registrarOActualizarConflicto`, `nombreCampoConflicto`.
- **Operaciones MP**: `registrarMP`, `registrarMPMasiva`, `fechaSugeridaMP`,
  `avisoMPSinProgramacion`.
- **Operaciones eventos**: `crearEvento`, `oficializarEvento`, `editarEvento`,
  `anularEvento`, `docsEsperadosEvento`.
- **Pendientes / baja**: `crearPendiente`, `actualizarPendiente`,
  `anularPendiente`, `agregarTareaPendiente`, `toggleTarea`, `agregarSeguimiento`,
  `cerrarPendiente`, `cerrarCicloManual`, `darDeBaja`.
- **Export/Import**: `exportarBackupJSON`, `importarBackup`,
  `construirAsignacionMP`, `procesarPlantillaMP`, `mesDelNombreArchivo`,
  `mapearEventoFila`.

## Modelo de datos (`state`)

```
{
  __v, __created, __updated, __userActions,
  equipos[]      // {inv, equipo, servicio, unidad, ubic, marca, modelo, serie,
                 //  ano, freq, prog{Mes:cod}, registro{Mes:{P,R}}, estado, estadoDesde}
  eventos[]      // {id, inv, tipo, fecha, resultado, estado, ejecutor, folio, oficial, anulado, ...}
  ciclos[]       // {id, folio, inv, fechaApertura, fechaCierre, estado, ingenieroAsignado}
  pendientes[]   // {id, inv, tipo, desc, estado, ejecutor, eventoOrigen, seguimientos[], tareas[]}
  tareas[]       // {id, pendId, inv, desc, estado}
  conflictos[]   // diferencias detectadas contra el maestro Excel
  importaciones[], asignacionesMP{}, audit[], counters{}, prefs{}
}
```

## Reglas de negocio clave (conservadas)

- **Estado del equipo** se deriva del último evento que lo declara; una MP lo fija
  por su **resultado/causal** (`C2`→servicio técnico, `C3/FS/NU`→no operativo,
  `Baja`→baja, `Si`→operativo; `C1`/`C4–C8` son reprogramación sin falla).
- **Causal C1–C8** genera automáticamente un **pendiente de reprogramación**
  (a 30 días si la causal es reprogramable) y marca `R` en el mes siguiente.
- **Anular un evento revierte sus efectos**: limpia `R`, recalcula estado,
  anula/reabre ciclos y anula pendientes automáticos asociados.
- **Conciliación**: auto-completa celdas vacías desde el maestro, crea eventos MP
  sintéticos para resultados del catálogo y registra conflictos para diferencias.
- **Persistencia** en `localStorage` con compresión LZString (`LZv1:` + UTF-16).
