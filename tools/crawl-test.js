#!/usr/bin/env node
/****************************************************************************
 * SIGEM · Click-crawler quirúrgico (jsdom).
 * --------------------------------------------------------------------------
 * Carga app.html en un DOM headless, recorre TODAS las vistas y PULSA cada
 * control accionable (botones, enlaces, filas, pestañas, chips...) con
 * re-render entre clics. Abre los drawers que aparezcan y también pulsa sus
 * botones. El criterio de aceptación es DURO: 0 errores de runtime.
 *
 * Deduplica por firma (tipo+clase+texto) para no pulsar 893 filas iguales, y
 * neutraliza APIs que jsdom no implementa (descargas Blob, fetch) para no
 * generar falsos positivos: lo que se mide es que ningún handler LANCE.
 *
 * Requisitos:  npm install --no-save jsdom
 * Uso:         node tools/crawl-test.js
 ****************************************************************************/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch (e) { console.error('Falta jsdom. Instala con:  npm install --no-save jsdom'); process.exit(2); }

const html = fs.readFileSync(path.join(ROOT, 'app.html'), 'utf8');

// Patrones de mensajes que NO son fallos de la app (limitaciones de jsdom o
// resultados esperados sin backend configurado).
const BENIGN = /Not implemented|Sin URL configurada|fetch|Google Sheets|createObjectURL|navigation|Could not parse CSS|getContext/i;
const errors = [];
let curRoute = '(boot)';
const record = msg => { const m = (curRoute ? '[' + curRoute + '] ' : '') + msg; if (!BENIGN.test(m)) errors.push(m); };

const vc = new VirtualConsole();
vc.on('jsdomError', e => record(e && e.message ? e.message : String(e)));

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/', virtualConsole: vc });
const w = dom.window;
// Neutralizar diálogos y APIs de navegador ausentes en jsdom.
w.alert = () => {}; w.confirm = () => true; w.prompt = () => '';
try { w.URL.createObjectURL = () => 'blob:stub'; w.URL.revokeObjectURL = () => {}; } catch (e) {}
w.fetch = () => new Promise(() => {});   // nunca resuelve: evita red y rechazos no controlados
w.addEventListener('error', e => record(e.message || String(e.error)));
w.addEventListener('unhandledrejection', e => record('unhandledrejection: ' + ((e.reason && e.reason.message) || String(e.reason))));

const SEL = 'button, a, [role="button"], .link, .chip, .x, tr, td.link, .tab, .seg, .cmdk-item';

function sig(el) {
  const tag = el.tagName.toLowerCase();
  const cls = (typeof el.className === 'string' ? el.className : '') || '';
  // Filas/celdas/opciones: colapsar por tipo+clase (no por texto) para no explotar tablas.
  if (tag === 'tr' || tag === 'td' || tag === 'option' || tag === 'label') return tag + '|' + cls;
  return tag + '|' + cls + '|' + (el.textContent || '').trim().slice(0, 28);
}

function navigate(target) {
  curRoute = target.split('/')[0];
  w.location.hash = '#' + target;
  // Doble (o triple) dispatch: el go() interno de la app puede dejar suppressHash=true;
  // reintentar hasta que #view quede renderizado.
  for (let k = 0; k < 3; k++) {
    w.dispatchEvent(new w.Event('hashchange'));
    const v = w.document.querySelector('#view');
    if (v && v.children.length) break;
  }
}

function escape() {
  try { w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); } catch (e) {}
}

function clickSafe(el) {
  try { el.click(); } catch (e) { record('click lanzó excepción: ' + e.message); }
}

// Tras un clic: si se abrió un drawer (tiene contenido), pulsa sus botones y
// lo cierra. Reinicia su contenido para detectar limpio la próxima apertura.
function handleOverlays() {
  const drawer = w.document.querySelector('.drawer');
  if (drawer && drawer.children.length) {
    const seen = new Set();
    const btns = [...drawer.querySelectorAll('button, .link, [role="button"]')]
      .filter(el => { const s = sig(el); if (seen.has(s)) return false; seen.add(s); return true; })
      .slice(0, 12);
    btns.forEach(clickSafe);
    escape();
    drawer.innerHTML = '';
  }
  escape();               // cierra command palette / popovers
  const pal = w.document.querySelector('.cmdk-modal');
  if (pal) pal.remove();
}

let totalClicks = 0;
function crawl(route, cap) {
  const clicked = new Set();   // firmas ya pulsadas (persisten entre re-renders)
  const seen = new Set();      // firmas vistas (para reportar cobertura)
  let clicks = 0;
  for (let iter = 0; iter < cap; iter++) {
    navigate(route);                                   // re-render limpio antes de cada clic
    const v = w.document.querySelector('#view');
    if (!v) { record('la vista no renderizó'); break; }
    const els = [...v.querySelectorAll(SEL)];
    els.forEach(el => seen.add(sig(el)));
    // Primer control de la vista actual que aún no se ha pulsado.
    let target = null;
    for (const el of els) { const s = sig(el); if (!clicked.has(s)) { clicked.add(s); target = el; break; } }
    if (!target) break;                                // no queda nada nuevo por pulsar
    clickSafe(target);
    clicks++; totalClicks++;
    handleOverlays();
  }
  return { route, controles: seen.size, clicks };
}

const checks = [];
const ok = (label, cond) => checks.push({ label, cond: !!cond });

setTimeout(() => {
  try {
    const H = w.HHHA;
    ok('HHHA disponible y vista inicial montada', !!(H && w.document.querySelector('#view') && w.document.querySelector('#view').children.length > 0));

    const S = H.getState();
    const someInv = (S.eventos.find(e => !e.anulado) || S.equipos[0] || {}).inv;
    ok('hay un equipo con datos para la ficha', !!someInv);

    // Chrome (barra superior): tema, densidad, exportar, configuración, buscador.
    curRoute = 'chrome';
    const header = w.document.querySelector('header.topbar');
    if (header) {
      const seen = new Set();
      [...header.querySelectorAll('button, .search-pill, .link')]
        .filter(el => { const s = sig(el); if (seen.has(s)) return false; seen.add(s); return true; })
        .forEach(el => { clickSafe(el); totalClicks++; handleOverlays(); });
    }
    ok('chrome (barra superior) sin errores', errors.length === 0);

    // Vistas (configuración al final porque puede resetear datos vía confirm()).
    const ROUTES = ['inicio', 'equipos', 'tablero', 'pendientes', 'eventos', 'ciclos',
      'asignaciones', 'cumplimiento', 'equipo/' + encodeURIComponent(someInv || ''), 'configuracion'];
    const resumen = [];
    ROUTES.forEach(r => {
      const before = errors.length;
      const info = crawl(r, 60);
      if (info) resumen.push(info);
      ok(`#${r.split('/')[0]} · pulsado sin errores`, errors.length === before);
    });

    // La app sigue viva tras el barrido.
    navigate('inicio');
    ok('la app sigue operativa tras el barrido (vuelve a inicio)',
      w.document.querySelector('#view') && w.document.querySelector('#view').children.length > 0);

    ok('0 errores de runtime en todo el crawler', errors.length === 0);

    console.log('Recorrido por vista (controles únicos · clics):');
    resumen.forEach(x => console.log(`  · ${x.route}: ${x.controles} · ${x.clicks}`));
    console.log(`Total de clics: ${totalClicks}`);
  } catch (e) {
    record('excepción en el crawler: ' + e.message);
    ok('crawler sin excepción', false);
    if (process.env.DEBUG) console.error(e);
  }

  const fail = checks.filter(c => !c.cond);
  console.log('');
  checks.forEach(c => console.log((c.cond ? 'OK   ' : 'FAIL ') + c.label));
  if (errors.length) {
    console.log('\nErrores capturados:');
    [...new Set(errors)].slice(0, 20).forEach(m => console.log('  · ' + m));
  }
  console.log(fail.length ? `\n*** CRAWLER: ${fail.length} fallo(s) ***` : '\n*** CRAWLER OK ***');
  process.exit(fail.length ? 1 : 0);
}, 900);
