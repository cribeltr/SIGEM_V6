#!/usr/bin/env node
/****************************************************************************
 * SIGEM · Smoke test (humo) del artefacto construido.
 * --------------------------------------------------------------------------
 * Carga app.html en un DOM headless (jsdom), arranca con la SEMILLA embebida
 * (sin archivos externos) y verifica que la app levanta y navega sin errores.
 * No prueba lógica de negocio a fondo: detecta regresiones de "no arranca".
 *
 * Requisitos:  npm install --no-save jsdom
 * Uso:         npm test     (o)     node tools/smoke-test.js
 ****************************************************************************/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('Falta jsdom. Instala con:  npm install --no-save jsdom');
  process.exit(2);
}

const html = fs.readFileSync(path.join(ROOT, 'app.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
const w = dom.window;
w.alert = () => {}; w.confirm = () => true; w.prompt = () => '';

const errs = [];
w.addEventListener('error', e => errs.push(e.message || String(e.error)));

const checks = [];
const ok = (label, cond) => checks.push({ label, cond: !!cond });

setTimeout(() => {
  try {
    if (!w.HHHA || !w.HHHA.getState()) w.document.dispatchEvent(new w.Event('DOMContentLoaded'));

    // 1) El núcleo lógico expone su API y arranca el estado desde la semilla.
    ok('HHHA disponible', w.HHHA && typeof w.HHHA.getState === 'function');
    const S = w.HHHA.getState();
    ok('estado inicial con equipos (semilla)', S && Array.isArray(S.equipos) && S.equipos.length > 0);
    ok('estado con eventos y pendientes (semilla)', S && Array.isArray(S.eventos) && Array.isArray(S.pendientes));
    ok('catálogo de 12 meses (HHHA.MESES)', Array.isArray(w.HHHA.MESES) && w.HHHA.MESES.length === 12);

    // 2) La UI montó la vista inicial.
    const view = w.document.querySelector('#view');
    ok('vista montada (#view con contenido)', view && view.children.length > 0);

    // 3) Cada sección del menú navega sin lanzar errores.
    const RUTAS = ['inicio', 'equipos', 'pendientes', 'eventos', 'ciclos', 'asignaciones', 'cumplimiento', 'configuracion'];
    RUTAS.forEach(r => {
      const antes = errs.length;
      w.location.hash = '#' + r;
      w.dispatchEvent(new w.Event('hashchange'));
      const pintó = w.document.querySelector('#view') && w.document.querySelector('#view').children.length > 0;
      ok(`navega #${r} sin error`, pintó && errs.length === antes);
    });

    // 4) Sin errores de runtime capturados en window.
    ok('sin errores de runtime', errs.length === 0);
  } catch (e) {
    errs.push('Excepción en el test: ' + e.message);
    ok('test sin excepción', false);
  }

  const fail = checks.filter(c => !c.cond);
  checks.forEach(c => console.log((c.cond ? 'OK   ' : 'FAIL ') + c.label));
  if (errs.length) { console.log('\nErrores capturados:'); errs.slice(0, 8).forEach(m => console.log('  · ' + m)); }
  console.log(fail.length ? `\n*** SMOKE TEST: ${fail.length} fallo(s) ***` : '\n*** SMOKE TEST OK ***');
  process.exit(fail.length ? 1 : 0);
}, 800);
