#!/usr/bin/env node
/****************************************************************************
 * SIGEM · Build de archivo único (autocontenible, offline).
 * --------------------------------------------------------------------------
 * Ensambla los módulos editables del repo en UN solo HTML, inline:
 *
 *   ui/styles.css · ui/vendor/lz-string.min.js · src/seed-data.js
 *   src/hhha-core.js · ui/vendor/xlsx.full.min.js · ui/app.js
 *
 * La FUENTE editable vive en esos archivos; el HTML resultante es derivado.
 * Se escriben DOS copias idénticas (para que nunca se desincronicen):
 *
 *   · app.html                 → abrir directo en el navegador (file://)
 *   · apps-script/Index.html   → pegar en el proyecto de Apps Script (Web App)
 *
 * Uso:  node tools/build.js     (o)     npm run build
 ****************************************************************************/
'use strict';
const fs = require('fs');
const path = require('path');

// Raíz del repo = carpeta padre de /tools (rutas relativas → reproducible en cualquier clon).
const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const css  = read('ui/styles.css');
const lz   = read('ui/vendor/lz-string.min.js');
const seed = read('src/seed-data.js');
const core = read('src/hhha-core.js');
const xlsx = read('ui/vendor/xlsx.full.min.js');
const app  = read('ui/app.js');

// Seguridad: ningún fragmento inline puede contener </script> o </style> (rompería el HTML).
function guard(name, code, tag) {
  if (new RegExp('</\\s*' + tag, 'i').test(code)) {
    throw new Error(`${name} contiene </${tag}> y rompería el HTML inline`);
  }
}
guard('styles.css', css, 'style');
[['lz-string', lz], ['seed-data', seed], ['hhha-core', core], ['xlsx', xlsx], ['app', app]]
  .forEach(([n, c]) => guard(n, c, 'script'));

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Gestión Equipos Críticos HHHA</title>
<!-- =========================================================================
  SIGEM · build de archivo único (autocontenible, offline).
  ARCHIVO GENERADO por tools/build.js — no editar a mano.
  Ensamblado a partir de los módulos del repo (sin reescribir lógica):
    ui/styles.css · ui/vendor/lz-string.min.js · src/seed-data.js
    src/hhha-core.js · ui/vendor/xlsx.full.min.js · ui/app.js
  La fuente editable vive en esos archivos; este HTML es el resultado.
========================================================================== -->
<style>
${css}
</style>
<script>try{document.documentElement.setAttribute('data-theme',localStorage.getItem('sigem_theme')||'light')}catch(e){}</script>
</head>
<body>
<div id="root"></div>

<!-- Compresión de persistencia (engine ENV.compressor) -->
<script>${lz}</script>
<!-- Datos semilla (window.SEED) -->
<script>${seed}</script>
<!-- Núcleo lógico SIN vistas (window.HHHA) -->
<script>${core}</script>
<!-- SheetJS: conciliación + export Excel (offline) -->
<script>${xlsx}</script>
<!-- Capa de vistas "densa pro" -->
<script>${app}</script>
</body>
</html>
`;

// Escribe los dos artefactos en una sola pasada → imposible que diverjan.
const OUTPUTS = ['app.html', 'apps-script/Index.html'];
OUTPUTS.forEach(rel => fs.writeFileSync(path.join(ROOT, rel), html));

const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`Build OK · ${kb} KB · ${html.split('\n').length} líneas → ${OUTPUTS.join(' , ')}`);
