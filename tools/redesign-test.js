#!/usr/bin/env node
/****************************************************************************
 * SIGEM · Aceptación de la INTERFAZ SIMPLE (jsdom).
 * --------------------------------------------------------------------------
 * Bloquea (anti-regresión) la nueva interfaz orientada al trabajo diario:
 *
 *   · Chrome calmado: marca + buscador (⌘K) + menú "Más"; SIN barra densa.
 *   · Inicio = una sola pantalla con DOS bloques: "Registrar" y "Pendientes".
 *   · "Registrar": botones directos (Mantención, Solicitud, Envío, Recepción,
 *     Cargar maestro) que abren el formulario correcto.
 *   · "Pendientes": lista priorizada con la REGLA DE LOS 3 DÍAS — los que
 *     llevan ≥3 días sin avance suben al tope y muestran "Recuérdale a X".
 *   · Acción rápida "Resolver" cierra el pendiente (vía el motor).
 *   · Tarea de inicio de mes: aparece solo si hay equipos programados sin
 *     repartir (y desaparece al repartirlos).
 *   · El MOTOR no se tocó: la ficha del equipo sigue intacta (3 pestañas) y
 *     la API HHHA.* sigue disponible.
 *
 * El gate "sin scroll horizontal" (Playwright) es aparte (anti-scroll-test.js).
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
const txt = el => (el.textContent || '').replace(/\d+$/, '').trim();

function navigate(target) {
  w.location.hash = '#' + target;
  for (let k = 0; k < 3; k++) {
    w.dispatchEvent(new w.Event('hashchange'));
    const v = $('#view'); if (v && v.children.length) break;
  }
}

setTimeout(() => {
  try {
    const H = w.HHHA;
    ok('app montada', !!(H && $('#view') && $('#view').children.length > 0));
    const S = H.getState();
    const hoy = H.hoyLocal();

    // ===== Chrome calmado =====
    ok('marca "SIGEM" en la barra', !!$('.brand .brand-name') && /SIGEM/.test($('.brand .brand-name').textContent));
    ok('buscador prominente (⌘K) presente', !!$('header .search-pill'));
    ok('barra de navegación densa retirada (sin .topnav/.nav-item al frente)', !$('header .topnav') && !$('header .nav-item'));
    ok('menú "Más" presente', $$('header button').some(b => /Más/i.test(b.title || '')));

    // ===== Inicio: una pantalla, dos bloques =====
    ok('inicio usa el contenedor calmado (.home)', !!$('.home'));
    ok('encabezado "Hoy"', !!$('.home-hd h1') && /Hoy/i.test($('.home-hd h1').textContent));
    const bloques = $$('.home .card .card-hd h2').map(x => x.textContent.trim());
    ok('exactamente 2 bloques: Registrar y Pendientes', JSON.stringify(bloques) === JSON.stringify(['Registrar', 'Pendientes']));

    // ===== Bloque Registrar =====
    const regs = $$('.reg-btn').map(b => b.textContent.trim());
    ['Mantención', 'Solicitud de trabajo', 'Envío a servicio técnico', 'Recepción', 'Cargar maestro'].forEach(l =>
      ok(`Registrar incluye "${l}"`, regs.includes(l)));
    // Clic en "Mantención" abre el formulario de evento.
    const drawer = $('aside.drawer'); if (drawer) drawer.innerHTML = '';
    const btnMant = $$('.reg-btn').find(b => /Mantención/.test(b.textContent));
    if (btnMant) btnMant.click();
    ok('clic en "Mantención" abre el formulario de evento', !!drawer && drawer.children.length > 0 && (!!drawer.querySelector('.type-grid') || !!drawer.querySelector('select')));
    try { w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); } catch (e) {}

    // ===== Regla de los 3 días =====
    navigate('inicio');
    const UMBRAL = 3;
    const ultMov = p => { let d = p.fechaCrea || hoy; (p.seguimientos || []).forEach(s => { if (s.fecha && s.fecha > d) d = s.fecha; }); return d; };
    const activos = S.pendientes.filter(p => !p.anulado && p.estado !== 'cerrado');
    const urgEsperados = activos.filter(p => H.diasEntreFechas(ultMov(p), hoy) >= UMBRAL).length;
    const urgEnDOM = $$('.pend.urge').length;
    ok('pendientes activos listados en el inicio', $$('.pend').length === activos.length);
    ok('escalado de 3 días: nº de .urge coincide con lo calculado', urgEnDOM === Math.min(activos.length, urgEsperados));
    ok('los urgentes muestran "Recuérdale a…"', urgEsperados === 0 || $$('.pend-flag').some(f => /Recu[eé]rdale a/i.test(f.textContent)));
    ok('los urgentes van arriba (primer pendiente es .urge)', urgEsperados === 0 || ($$('.pend')[0] && $$('.pend')[0].classList.contains('urge')));

    // ===== Acción rápida "Resolver" cierra el pendiente (vía motor) =====
    const antes = S.pendientes.filter(p => !p.anulado && p.estado !== 'cerrado').length;
    const resolver = $('.pend .pend-acts button.ok');
    if (resolver) resolver.click();
    const despues = S.pendientes.filter(p => !p.anulado && p.estado !== 'cerrado').length;
    ok('"Resolver" cierra un pendiente (motor)', antes > 0 && despues === antes - 1);

    // ===== Tarea de inicio de mes (condicional) =====
    navigate('inicio');
    const km = `${new Date(hoy + 'T00:00:00').getFullYear()}-${String(new Date(hoy + 'T00:00:00').getMonth() + 1).padStart(2, '0')}`;
    const asign = (S.asignacionesMP || {})[km] || {};
    const sinRepartir = S.equipos.filter(e => e.estado !== 'baja' && H.mpProgramadaEnMes(e, H.MESES[new Date(hoy + 'T00:00:00').getMonth()]) && !asign[e.inv]).length;
    ok('tarea de inicio de mes aparece solo si corresponde', (sinRepartir > 0) === !!$('.task-card'));

    // ===== El motor NO se tocó: ficha intacta (3 pestañas) + API viva =====
    const inv = (S.eventos.find(e => !e.anulado) || S.equipos[0] || {}).inv;
    navigate('equipo/' + encodeURIComponent(inv));
    const tabs = $$('#view .tabs > button').map(b => txt(b));
    ok('la ficha del equipo sigue intacta (Mantención · Historial · Archivos)',
      JSON.stringify(tabs) === JSON.stringify(['Mantención', 'Historial', 'Archivos']));
    ok('API del motor disponible (HHHA.*)', typeof H.registrarMP === 'function' && typeof H.crearEvento === 'function' && typeof H.cerrarPendiente === 'function');

    // ===== Función propia de esta versión PRESERVADA: Contactos del servicio + actividad =====
    ok('motor con Contactos y registro de actividad', typeof H.getContactos === 'function' && typeof H.logActividad === 'function');
    navigate('equipo/' + encodeURIComponent(inv));
    const tabArch = $$('#view .tabs > button').find(b => /Archivos/.test(b.textContent));
    if (tabArch) tabArch.click();
    ok('Contactos del servicio visible en la ficha (pestaña Archivos)', /Contactos del servicio/.test(($('#view') || {}).textContent || ''));
    navigate('configuracion');
    ok('Configuración gestiona Contactos del servicio', /Contactos del servicio/.test(($('#view') || {}).textContent || ''));
    ok('Configuración ofrece "Registro de actividad"', $$('#view button').some(b => /Registro de actividad/.test(b.textContent)));

  } catch (e) {
    ok('test sin excepción (' + e.message + ')', false);
    if (process.env.DEBUG) console.error(e);
  }

  const fail = checks.filter(c => !c.cond);
  checks.forEach(c => console.log((c.cond ? 'OK   ' : 'FAIL ') + c.label));
  console.log(`\n${checks.length} comprobaciones · ${checks.length - fail.length} OK · ${fail.length} fallo(s)`);
  console.log(fail.length ? '*** INTERFAZ SIMPLE: FALLÓ ***' : '*** INTERFAZ SIMPLE OK ***');
  process.exit(fail.length ? 1 : 0);
}, 900);
