# Gestión Equipos Críticos HHHA

Aplicación de gestión y control diario de equipos biomédicos críticos. **Archivo único, 100 % offline**, para el seguimiento de
mantenimiento preventivo (MP), eventos correctivos, pendientes y estado
operativo de equipos biomédicos. La lógica de negocio está desacoplada de la
interfaz y el almacenamiento es opcional en un **Google Sheet** (vía Apps Script).

```
SIGEM_V1/
├── src/                     FUENTE · núcleo lógico (sin DOM)
│   ├── hhha-core.js           Modelo, estado, persistencia, reglas de negocio, conciliación
│   ├── seed-data.js           Dataset semilla (window.SEED) — DATO, no lógica
│   └── README.md              Detalle del núcleo y mapa de la API HHHA.*
├── ui/                      FUENTE · capa de vistas (presentación)
│   ├── index.html             Shell de desarrollo (orden de carga de módulos)
│   ├── app.js                 Router, tablas, drawer, command palette, vistas
│   ├── styles.css             Sistema de diseño (tokens, claro/oscuro, densidad alta)
│   ├── vendor/                Dependencias vendorizadas (lz-string, SheetJS)
│   └── README.md              Detalle de la UI, vistas y atajos
├── tools/
│   └── build.js             Ensambla las fuentes en el archivo único (genera los .html)
├── apps-script/             DESPLIEGUE · backend opcional en Google Sheets
│   ├── Code.gs                Web App: guarda el estado y las hojas legibles
│   └── Index.html             GENERADO — pegar en el proyecto de Apps Script
├── app.html                 GENERADO — abrir directo en el navegador
└── package.json             npm run build
```

## Desarrollo

Edita siempre las **fuentes** en `src/` y `ui/` (nunca los `.html` generados).

- **Probar rápido:** abre `ui/index.html` en el navegador (`file://`, sin servidor).
  Carga los módulos por separado, ideal para iterar.

## Build

`app.html` y `apps-script/Index.html` son **artefactos generados** que inlinean
todas las fuentes en un solo HTML autocontenible. Para regenerarlos:

```bash
npm run build      # o: node tools/build.js
```

El build escribe **las dos copias idénticas** en una sola pasada (así nunca se
desincronizan) y aborta si algún fragmento contiene `</script>`/`</style>`.

## Despliegue (Google Sheets · opcional)

La app funciona sola en el navegador. Para guardar los datos en un Google Sheet
y poder verla desde la URL `.../exec`:

1. En el Google Sheet: **Extensiones → Apps Script**.
2. Pega `apps-script/Code.gs` en el archivo de código.
3. Crea un archivo HTML llamado **`Index`** y pega el contenido de
   `apps-script/Index.html` (ejecuta antes `npm run build`).
4. **Implementar → Nueva implementación → Aplicación web** (ejecutar como *Yo*,
   acceso *Cualquiera*). Copia la URL `.../exec` y pégala en **SIGEM → Configuración**.
5. Tras cada cambio de código: **Gestionar implementaciones → editar → Nueva versión**.

El estado se guarda comprimido en hojas ocultas (`_SIGEM_DATA`/`_SIGEM_META`) y,
en paralelo, en **hojas de trabajo legibles** (Inventario, Plan anual MP,
Pendientes, Bitácora, Correctivos…) para usar el archivo aunque no se tenga la app.

## Datos y respaldo

- **Respaldo principal:** el propio Google Sheet (se guarda en cada cambio).
- **Respaldo de emergencia:** export/import JSON desde **Configuración**.
- Sin backend, los datos persisten en `localStorage` (comprimidos con LZString).

Más detalle: [`src/README.md`](src/README.md) (núcleo y API) · [`ui/README.md`](ui/README.md) (vistas y atajos).
