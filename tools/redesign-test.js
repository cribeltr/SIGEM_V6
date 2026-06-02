#!/usr/bin/env node
/****************************************************************************
 * SIGEM · Test de aceptación del REDISEÑO v2 (jsdom).
 * --------------------------------------------------------------------------
 * Bloquea (anti-regresión) la estructura que define el PLAN-REDISENO v2, ya
 * implementada en esta base de código. Corresponde a las "pruebas específicas
 * nuevas" del §5 y a los criterios de aceptación del §7:
 *
 *   · Barra superior de navegación presente; rail lateral retirado.
 *   · Ficha con EXACTAMENTE 3 pestañas: Mantención · Historial · Archivos
 *     (sin Auditoría/Conflictos/Resumen/Matriz/Ciclos como pestaña).
 *   · Cabecera de la ficha con acciones (Nuevo evento · Pendiente · Baja) y
 *     "Registrar gestión" en equipos caídos.
 *   · Matriz MP editable: clic en una celda abre el formulario de MP.
 *   · Bitácora como línea de tiempo (tl-item), no como tabla ancha.
 *   · Notas del equipo en la pestaña Archivos.
 *   · Hoja "Registro" entre las hojas legibles del Google Sheet (Fase F).
 *
 * Nota: el gate "sin scroll horizontal" a 1366/1900px exige un navegador con
 * layout (Playwright) y queda fuera de jsdom; se documenta como pendiente.
 *
 * Uso:  node tools/redesign-test.js
 ****************************************************************************/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) { console.error('Falta jsdom. Instala con:  npm install --no-save jsdom'); process.exit(2); }

const html = fs.readFileSync(path.join(ROOT, 'app.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
const w = dom.window;
w.alert = () => {}; w.confirm = () => true; w.prompt = () => '';
try { w.URL.createObjectURL = () => 'blob:stub'; w.URL.revokeObjectURL = () => {}; } catch (e) {}
w.fetch = () => new Promise(() => {});

const checks = [];
const ok = (label, cond) => checks.push({ label, cond: !!cond });
const $ = s => w.document.querySelector(s);
const $$ = s => [...w.document.querySelectorAll(s)];
const txt = el => (el.textContent || '').replace(/\d+$/, '').trim();   // quita el badge numérico final

function navigate(target) {
  w.location.hash = '#' + target;
  for (let k = 0; k < 3; k++) {
    w.dispatchEvent(new w.Event('hashchange'));
    const v = $('#view'); if (v && v.children.length) break;
  }
}
function clickTab(label) {
  const b = $$('#view .tabs button').find(x => txt(x).toLowerCase().startsWith(label.toLowerCase()));
  if (b) b.click();
  return b;
}

setTimeout(() => {
  try {
    const H = w.HHHA;
    ok('app montada', !!(H && $('#view') && $('#view').children.length > 0));
    const S = H.getState();

    // ===== Fase B / §7 — Barra superior, sin rail =====
    ok('barra superior <nav.topnav> dentro de header.topbar', !!$('header.topbar nav.topnav'));
    const navLabels = $$('header.topbar nav.topnav .nav-item').map(txt);
    ['Hoy', 'Equipos', 'Tablero', 'Pendientes', 'Cumplimiento'].forEach(l =>
      ok(`acceso de navegación "${l}" presente`, navLabels.includes(l)));
    ok('rail lateral retirado (no hay .rail/.sidebar)', !$('.rail') && !$('.sidebar') && !$('aside.rail'));

    // ===== Fase C / §5 — Ficha de 3 pestañas =====
    const invDatos = (S.eventos.find(e => !e.anulado) || S.equipos[0] || {}).inv;
    navigate('equipo/' + encodeURIComponent(invDatos));
    ok('ficha renderiza (.view-narrow)', !!$('#view .view-narrow'));
    const tabLabels = $$('#view .tabs > button').map(txt);
    ok('ficha con EXACTAMENTE 3 pestañas', tabLabels.length === 3);
    ok('pestañas = Mantención · Historial · Archivos', JSON.stringify(tabLabels) === JSON.stringify(['Mantención', 'Historial', 'Archivos']));
    ['Auditoría', 'Conflictos', 'Resumen', 'Matriz MP', 'Ciclos'].forEach(l =>
      ok(`sin pestaña antigua "${l}"`, !tabLabels.includes(l)));

    // Cabecera con acciones.
    const headBtns = $$('#view .view-narrow button').map(txt);
    ok('cabecera: acción "Nuevo evento"', headBtns.some(t => /Nuevo evento/i.test(t)));
    ok('cabecera: acción "Pendiente"', headBtns.some(t => /^Pendiente$/i.test(t)));
    ok('cabecera: acción "Dar de baja"', headBtns.some(t => /Dar de baja/i.test(t)));

    // ===== Fase E / §5 — Bitácora como línea de tiempo (pestaña Historial por defecto) =====
    ok('historial muestra línea de tiempo (.tl-item / .tl-card)', $$('#view .tl-item').length > 0 && !!$('#view .tl-card'));

    // ===== Fase D / §5 — Matriz MP editable =====
    clickTab('Mantención');
    // Las celdas EDITABLES son las de la fila "Resultado (R)": llevan title + onclick→formMP
    // (las de "Programado (P)" comparten clase .mpcell pero no son accionables).
    const celdas = $$('#view td.mpcell[title]');
    ok('matriz MP con celdas de Resultado editables (.mpcell[title])', celdas.length >= 1);
    const drawer = $('aside.drawer');
    if (drawer) drawer.innerHTML = '';
    if (celdas[0]) celdas[0].click();
    ok('clic en celda de matriz abre el formulario de MP (drawer con campos)',
      !!drawer && drawer.children.length > 0 && !!drawer.querySelector('select'));
    try { w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); } catch (e) {}

    // ===== §5 — Notas del equipo en pestaña Archivos =====
    navigate('equipo/' + encodeURIComponent(invDatos));
    clickTab('Archivos');
    const notaInput = $$('#view input').some(i => /Agregar nota/i.test(i.getAttribute('placeholder') || ''));
    ok('pestaña Archivos con panel de Notas del equipo', notaInput);

    // ===== §5 — "Registrar gestión" en equipos caídos =====
    let invCaido = (S.equipos.find(e => ['no_operativo', 'en_servicio_tecnico'].includes(e.estado)) || {}).inv;
    if (!invCaido) {
      const fresh = S.equipos.find(e => e.estado === 'operativo') || S.equipos[0];
      H.registrarMP({ inv: fresh.inv, fecha: H.hoyLocal(), resultado: 'C3', ejecutor: 'Marco Ulloa', forzarSinProg: true });
      invCaido = fresh.inv;
    }
    navigate('equipo/' + encodeURIComponent(invCaido));
    ok('equipo caído ofrece "Registrar gestión"', $$('#view .view-narrow button').some(t => /Registrar gestión/i.test(txt(t))));

    // ===== Fase F / §5 — Hoja "Registro" (revisión a nivel de fuente; cuadernoSheets es interno) =====
    const appSrc = fs.readFileSync(path.join(ROOT, 'ui', 'app.js'), 'utf8');
    ok('hoja "Registro" construida en las hojas legibles (cuadernoSheets)', /name:\s*'Registro'/.test(appSrc));

  } catch (e) {
    ok('test sin excepción (' + e.message + ')', false);
    if (process.env.DEBUG) console.error(e);
  }

  const fail = checks.filter(c => !c.cond);
  checks.forEach(c => console.log((c.cond ? 'OK   ' : 'FAIL ') + c.label));
  console.log(`\n${checks.length} comprobaciones · ${checks.length - fail.length} OK · ${fail.length} fallo(s)`);
  console.log(fail.length ? '*** REDISEÑO v2: FALLÓ ***' : '*** REDISEÑO v2 OK ***');
  process.exit(fail.length ? 1 : 0);
}, 900);
