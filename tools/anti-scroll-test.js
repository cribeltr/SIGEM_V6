#!/usr/bin/env node
/****************************************************************************
 * SIGEM · Gate ANTI-SCROLL + capturas (Playwright / Chromium).
 * --------------------------------------------------------------------------
 * Cierra el gate §6.6/§6.7 del PLAN-REDISENO que jsdom NO puede cubrir (no
 * calcula layout): mide en un navegador real que NINGUNA tabla/lista deje
 * barra de desplazamiento horizontal (`scrollWidth ≤ clientWidth`) a 1366 y
 * 1900 px, en todas las vistas (incluida la ficha y sus 3 pestañas). Además
 * guarda capturas de las pantallas clave en `screenshots/` para juicio visual.
 *
 * Sirve el archivo único por HTTP (evita rarezas de `file://`) y mide el DOM.
 *
 * Entorno: necesita el navegador de Playwright.
 *   npm install --no-save playwright && npx playwright install --with-deps chromium
 * Si el navegador NO está disponible (p. ej. sandbox sin acceso a su CDN), el
 * script SALE con código 2 (omitido) en lugar de fallar: el gate corre en CI.
 *
 * Uso:  node tools/anti-scroll-test.js
 ****************************************************************************/
'use strict';
const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(ROOT, 'screenshots');
const WIDTHS = [1366, 1900];
const TOL = 2; // px de tolerancia por redondeo de layout

let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) { console.error('Falta playwright. Instala con:  npm install --no-save playwright'); process.exit(2); }

// Servidor estático mínimo (el HTML es autocontenido, no necesita más recursos).
function startServer() {
  const server = http.createServer((req, res) => {
    let f = (req.url || '/').split('?')[0];
    if (f === '/') f = '/app.html';
    fs.readFile(path.join(ROOT, decodeURIComponent(f)), (err, data) => {
      if (err) { res.statusCode = 404; res.end('not found'); return; }
      res.setHeader('Content-Type', f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream');
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(0, () => resolve(server)));
}

// Re-render robusto por hash (el go() interno puede dejar suppressHash=true).
async function goRoute(page, route) {
  await page.evaluate(r => {
    location.hash = '#' + r;
    for (let k = 0; k < 3; k++) {
      window.dispatchEvent(new Event('hashchange'));
      const v = document.querySelector('#view');
      if (v && v.children.length) break;
    }
  }, route);
  await page.waitForTimeout(150);
}
async function clickTab(page, label) {
  await page.evaluate(lbl => {
    const b = [...document.querySelectorAll('#view .tabs > button')]
      .find(x => (x.textContent || '').trim().toLowerCase().startsWith(lbl.toLowerCase()));
    if (b) b.click();
  }, label);
  await page.waitForTimeout(150);
}

// Mide overflow horizontal en la página y en cada tabla/lista de la vista.
async function measure(page, label, width) {
  return await page.evaluate(({ label, width, TOL }) => {
    const out = [];
    const de = document.documentElement;
    if (de.scrollWidth > de.clientWidth + TOL) out.push({ label, width, sel: 'html (página)', sw: de.scrollWidth, cw: de.clientWidth });
    const els = new Set([document.querySelector('#view')]);
    document.querySelectorAll('#view table, #view .tbl-wrap, #view .lane, #view .row-list, #view .kpi-row').forEach(e => els.add(e));
    els.forEach(e => {
      if (!e) return;
      if (e.scrollWidth > e.clientWidth + TOL) {
        const cls = (typeof e.className === 'string' ? e.className : '').trim().split(/\s+/).join('.');
        out.push({ label, width, sel: e.tagName.toLowerCase() + (cls ? '.' + cls : ''), sw: e.scrollWidth, cw: e.clientWidth });
      }
    });
    return out;
  }, { label, width, TOL });
}

(async () => {
  let browser;
  try { browser = await chromium.launch({ args: ['--no-sandbox'] }); }
  catch (e) {
    console.error('Navegador de Playwright no disponible (' + (e.message || e).toString().split('\n')[0] + ').');
    console.error('Instala con:  npx playwright install --with-deps chromium');
    console.error('OMITIDO localmente — este gate se ejecuta en CI.');
    process.exit(2);
  }

  fs.mkdirSync(SHOTS, { recursive: true });
  const server = await startServer();
  const base = `http://localhost:${server.address().port}/app.html`;
  const violations = [];
  const checks = [];
  const ok = (label, cond) => checks.push({ label, cond: !!cond });

  // Pantallas clave para captura (a 1366): [routeLabel, route, tabOpcional]
  const SHOTSCREENS = [
    ['hoy', 'inicio'], ['equipos', 'equipos'], ['tablero', 'tablero'],
    ['pendientes', 'pendientes'], ['cumplimiento', 'cumplimiento'], ['configuracion', 'configuracion'],
    ['ficha-mantencion', 'EQUIPO', 'Mantención'], ['ficha-historial', 'EQUIPO', 'Historial'], ['ficha-archivos', 'EQUIPO', 'Archivos']
  ];

  try {
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(base, { waitUntil: 'load' });
      await page.waitForFunction(() => { const v = document.querySelector('#view'); return v && v.children.length > 0; }, { timeout: 10000 });
      const inv = await page.evaluate(() => { const S = window.HHHA.getState(); return (S.eventos.find(e => !e.anulado) || S.equipos[0] || {}).inv; });

      const routes = [
        ['inicio', 'inicio'], ['equipos', 'equipos'], ['tablero', 'tablero'], ['pendientes', 'pendientes'],
        ['eventos', 'eventos'], ['ciclos', 'ciclos'], ['asignaciones', 'asignaciones'], ['cumplimiento', 'cumplimiento'],
        ['configuracion', 'configuracion']
      ];
      for (const [lbl, r] of routes) {
        await goRoute(page, r);
        (await measure(page, lbl, width)).forEach(v => violations.push(v));
      }
      // Ficha: medir las 3 pestañas (la matriz MP es el caso más ancho).
      await goRoute(page, 'equipo/' + encodeURIComponent(inv));
      for (const tab of ['Mantención', 'Historial', 'Archivos']) {
        await clickTab(page, tab);
        (await measure(page, 'ficha:' + tab, width)).forEach(v => violations.push(v));
      }

      // Capturas (solo a 1366, full page) para revisión visual.
      if (width === 1366) {
        for (const [name, route, tab] of SHOTSCREENS) {
          await goRoute(page, route === 'EQUIPO' ? 'equipo/' + encodeURIComponent(inv) : route);
          if (tab) await clickTab(page, tab);
          await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true });
        }
      }
      await page.close();
    }

    ok('sin scroll horizontal en ninguna tabla/lista (1366 y 1900px)', violations.length === 0);
  } catch (e) {
    ok('gate sin excepción (' + e.message + ')', false);
    if (process.env.DEBUG) console.error(e);
  } finally {
    await browser.close();
    server.close();
  }

  const fail = checks.filter(c => !c.cond);
  checks.forEach(c => console.log((c.cond ? 'OK   ' : 'FAIL ') + c.label));
  if (violations.length) {
    console.log('\nOverflow horizontal detectado:');
    violations.slice(0, 40).forEach(v => console.log(`  · [${v.width}px] ${v.label} → ${v.sel}  (scrollWidth ${v.sw} > clientWidth ${v.cw})`));
  }
  console.log(`\nCapturas en: ${path.relative(ROOT, SHOTS)}/`);
  console.log(fail.length ? '\n*** ANTI-SCROLL: FALLÓ ***' : '\n*** ANTI-SCROLL OK ***');
  process.exit(fail.length ? 1 : 0);
})();
