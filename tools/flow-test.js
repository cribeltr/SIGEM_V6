#!/usr/bin/env node
/****************************************************************************
 * SIGEM · Auditoría de flujos del NÚCLEO (sin DOM).
 * --------------------------------------------------------------------------
 * Ejercita la API HHHA.* directamente en Node (almacenamiento en memoria) y
 * verifica las REGLAS DE NEGOCIO e INVARIANTES con ≥25 comprobaciones:
 *
 *   · MP por causal (C2→ST, C3/FS/NU→no operativo, Baja→baja, Si→operativo,
 *     C1/C4–C8 = reprogramación sin falla + pendiente automático).
 *   · Guardas de registrarMP (equipo/fecha/ejecutor; aviso sin programación).
 *   · Anulación con reversión (limpia R, recalcula estado, anula ciclo y
 *     pendientes automáticos).
 *   · Ciclos correctivos: abrir (Solicitud) / cerrar (manual) / anular.
 *   · Pendientes: crear/actualizar/tareas/seguimientos/cerrar/anular.
 *   · Baja: evento de baja + cierre de pendientes del equipo.
 *   · corregirMP (C6→C3) con recálculo de estado.
 *   · Invariantes: IDs únicos, estado = recalculado, contadores monótonos.
 *
 * Es complementario al smoke test (que prueba el ARRANQUE en jsdom): aquí se
 * prueba la LÓGICA, de forma determinista y rápida.
 *
 * Uso:  node tools/flow-test.js
 ****************************************************************************/
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const HHHA = require(path.join(ROOT, 'src', 'hhha-core.js'));
const SEED = require(path.join(ROOT, 'src', 'seed-data.js'));

const checks = [];
const ok = (label, cond) => checks.push({ label, cond: !!cond });

try {
  HHHA.setSeed(SEED);
  HHHA.bootstrapDatos();
  const S = HHHA.getState();
  const today = HHHA.hoyLocal();
  const MONTH = new Date(today + 'T00:00:00').getMonth();
  const EJ = 'Marco Ulloa';

  // ---- Pool de equipos "limpios" (sin eventos y no dados de baja) para aislar pruebas.
  const cleanPool = S.equipos
    .filter(e => e.estado !== 'baja' && HHHA.eventosDeTodos(e.inv).length === 0)
    .map(e => e.inv);
  const used = new Set();
  let cursor = 0;
  function freshInv() {
    while (cursor < cleanPool.length) {
      const inv = cleanPool[cursor++];
      if (!used.has(inv)) { used.add(inv); return inv; }
    }
    throw new Error('Se agotaron los equipos limpios para las pruebas');
  }
  const mpResultado = (inv, resultado, extra) =>
    HHHA.registrarMP(Object.assign({ inv, fecha: today, resultado, ejecutor: EJ, forzarSinProg: true }, extra || {}));

  // ======================================================================
  // A) Arranque e invariantes estructurales
  // ======================================================================
  ok('HHHA expone getState()', typeof HHHA.getState === 'function');
  ok('estado con equipos (semilla)', Array.isArray(S.equipos) && S.equipos.length > 0);
  ok('estado con eventos/pendientes/tareas/ciclos', ['eventos', 'pendientes', 'tareas', 'ciclos'].every(k => Array.isArray(S[k])));
  ok('contadores numéricos', S.counters && ['evento', 'pend', 'tarea', 'ciclo'].every(k => typeof S.counters[k] === 'number'));
  ok('catálogo de 12 meses', Array.isArray(HHHA.MESES) && HHHA.MESES.length === 12);
  ok('hay equipos limpios para probar', cleanPool.length >= 20);

  const invUnicos = new Set(S.equipos.map(e => e.inv));
  ok('IDs de equipo (inv) únicos', invUnicos.size === S.equipos.length);
  const estadosValidos = new Set(HHHA.ESTADOS_PRIMARIOS);
  ok('todo equipo tiene estado primario válido', S.equipos.every(e => estadosValidos.has(e.estado)));

  const idsEvento = S.eventos.map(e => e.id);
  ok('IDs de evento únicos (semilla)', new Set(idsEvento).size === idsEvento.length);
  const idsPend = S.pendientes.map(p => p.id);
  ok('IDs de pendiente únicos (semilla)', new Set(idsPend).size === idsPend.length);

  const evInicial = S.counters.evento;
  const pendInicial = S.counters.pend;

  // ======================================================================
  // B) Guardas de registrarMP
  // ======================================================================
  ok('registrarMP rechaza equipo inexistente', mpResultado('__NO_EXISTE__', 'Si', { estadoSi: 'operativo' }).ok === false);
  ok('registrarMP exige fecha', HHHA.registrarMP({ inv: cleanPool[0], resultado: 'Si', ejecutor: EJ, forzarSinProg: true, fecha: '' }).ok === false);
  ok('registrarMP exige ejecutor', HHHA.registrarMP({ inv: cleanPool[0], resultado: 'Si', ejecutor: '', forzarSinProg: true, fecha: today }).ok === false);

  // Aviso de MP en mes sin programación: debe pedir confirmación si no se fuerza.
  const invSinProg = cleanPool.find(inv => !used.has(inv) && HHHA.avisoMPSinProgramacion(HHHA.findEquipo(inv), today));
  if (invSinProg) {
    used.add(invSinProg);
    const r = HHHA.registrarMP({ inv: invSinProg, fecha: today, resultado: 'Si', ejecutor: EJ, estadoSi: 'operativo' });
    ok('registrarMP sin programación pide confirmación', r.ok === false && r.requiereConfirmacion === true && !!r.aviso);
  } else {
    ok('registrarMP sin programación pide confirmación (no hubo equipo aplicable)', false);
  }

  // ======================================================================
  // C) Motor de estados: MP por causal
  // ======================================================================
  let inv, r, eq;

  inv = freshInv(); r = mpResultado(inv, 'C2'); eq = HHHA.findEquipo(inv);
  ok('C2 → en servicio técnico', r.ok && eq.estado === 'en_servicio_tecnico');

  inv = freshInv(); r = mpResultado(inv, 'C3'); eq = HHHA.findEquipo(inv);
  ok('C3 → no operativo', r.ok && eq.estado === 'no_operativo');

  inv = freshInv(); r = mpResultado(inv, 'FS'); eq = HHHA.findEquipo(inv);
  ok('FS → no operativo', r.ok && eq.estado === 'no_operativo');

  inv = freshInv(); r = mpResultado(inv, 'NU'); eq = HHHA.findEquipo(inv);
  const pendNU = HHHA.pendientesDe(inv).find(p => p.tipo === 'gestion_general' && /Localizar/i.test(p.desc));
  ok('NU → no operativo', r.ok && eq.estado === 'no_operativo');
  ok('NU crea pendiente automático "Localizar equipo"', !!pendNU);

  inv = freshInv(); r = mpResultado(inv, 'Si', { estadoSi: 'operativo' }); eq = HHHA.findEquipo(inv);
  ok('Si (operativo) → operativo', r.ok && eq.estado === 'operativo');

  inv = freshInv(); r = mpResultado(inv, 'Si', { estadoSi: 'no operativo' }); eq = HHHA.findEquipo(inv);
  ok('Si (no operativo elegido) → no operativo', r.ok && eq.estado === 'no_operativo');

  inv = freshInv(); r = mpResultado(inv, 'Baja'); eq = HHHA.findEquipo(inv);
  ok('Baja → baja', r.ok && eq.estado === 'baja');

  // C1 = reprogramación sin falla: no cambia a no operativo + pendiente de reprogramación a 30 días.
  inv = freshInv(); r = mpResultado(inv, 'C1'); eq = HHHA.findEquipo(inv);
  const pendC1 = HHHA.pendientesDe(inv).find(p => p.origen === 'auto_mp_causal' && p.tipo === 'reprogramacion');
  ok('C1 no marca falla (estado operativo)', r.ok && eq.estado === 'operativo');
  ok('C1 crea pendiente de reprogramación', !!pendC1);
  ok('C1 fija compromiso a 30 días (causal reprog30)', pendC1 && pendC1.fechaComp === HHHA.addDias(today, 30));
  if (MONTH < 11) {
    const mesSig = HHHA.MESES[MONTH + 1];
    ok('C1 marca "R" en la programación del mes siguiente', eq.registro && eq.registro[mesSig] && eq.registro[mesSig].P === 'R');
  } else {
    ok('C1 marca "R" en el mes siguiente (omitido en diciembre)', true);
  }

  // ======================================================================
  // D) Anulación con reversión
  // ======================================================================
  inv = freshInv(); r = mpResultado(inv, 'C3'); eq = HHHA.findEquipo(inv);
  const evC3 = r.evento;
  ok('preparación: equipo quedó no operativo', eq.estado === 'no_operativo');
  const ra = HHHA.anularEvento(evC3, 'Resultado equivocado');
  ok('anularEvento devuelve revertidos', ra.ok && Array.isArray(ra.revertidos) && ra.revertidos.length > 0);
  ok('anular MP recalcula estado (vuelve a operativo)', eq.estado === 'operativo');
  ok('evento anulado se excluye de eventosDe()', !HHHA.eventosDe(inv).some(e => e.id === evC3.id));

  // Anular una MP C1 anula su pendiente automático asociado.
  inv = freshInv(); r = mpResultado(inv, 'C1');
  const evC1 = r.evento;
  const pAuto = S.pendientes.find(p => p.eventoOrigen === evC1.id && p.origen === 'auto_mp_causal');
  ok('preparación: pendiente automático creado por C1', !!pAuto && !pAuto.anulado);
  HHHA.anularEvento(evC1, 'Mal ingresado');
  ok('anular MP C1 anula su pendiente automático', !!pAuto && pAuto.anulado === true);

  // ======================================================================
  // E) Ciclos correctivos
  // ======================================================================
  inv = freshInv();
  const abiertosAntes = HHHA.ciclosAbiertosDe(inv).length;
  const rs = HHHA.crearEvento({ inv, tipo: 'Solicitud de trabajo', fecha: today, ejecutor: EJ, obs: 'Falla' });
  eq = HHHA.findEquipo(inv);
  ok('Solicitud de trabajo abre un ciclo correctivo', rs.ok && HHHA.ciclosAbiertosDe(inv).length === abiertosAntes + 1);
  ok('Solicitud deja el equipo no operativo', eq.estado === 'no_operativo');
  const cicloAb = HHHA.ciclosAbiertosDe(inv)[0];
  const rc = HHHA.cerrarCicloManual(cicloAb, 'Reparado en pruebas');
  ok('cerrarCicloManual cierra el ciclo', rc.ok && cicloAb.estado === 'cerrado' && !!cicloAb.fechaCierre);

  // Anular la Solicitud anula su ciclo (no quedan más eventos del ciclo).
  inv = freshInv();
  const rs2 = HHHA.crearEvento({ inv, tipo: 'Solicitud de trabajo', fecha: today, ejecutor: EJ, obs: 'Falla 2' });
  const ciclo2 = HHHA.ciclosAbiertosDe(inv)[0];
  ok('preparación: 2º ciclo abierto', rs2.ok && ciclo2 && ciclo2.estado === 'abierto');
  HHHA.anularEvento(rs2.evento, 'Duplicado');
  ok('anular la Solicitud anula su ciclo', ciclo2.estado === 'anulado');

  // Abrir/cerrar ciclo por API directa.
  inv = freshInv();
  const cManual = HHHA.abrirCiclo('FOLIO-TEST-1', inv, today, EJ, 'ciclo de prueba');
  ok('abrirCiclo crea un ciclo abierto', cManual && cManual.estado === 'abierto');
  HHHA.cerrarCiclo('FOLIO-TEST-1', today, 'fin prueba');
  ok('cerrarCiclo lo cierra', cManual.estado === 'cerrado');

  // ======================================================================
  // F) Pendientes: ciclo de vida completo
  // ======================================================================
  inv = freshInv();
  const cp = HHHA.crearPendiente({ inv, tipo: 'gestion_general', desc: 'Pendiente de prueba', ejecutor: EJ });
  const P = cp.pendiente;
  ok('crearPendiente válido → no_iniciado', cp.ok && P.estado === 'no_iniciado');
  ok('crearPendiente exige descripción', HHHA.crearPendiente({ inv, tipo: 'gestion_general', desc: '   ' }).ok === false);

  const ct = HHHA.agregarTareaPendiente(P, 'Tarea 1');
  ok('agregarTareaPendiente crea la tarea', ct.ok && S.tareas.some(t => t.id === ct.tarea.id) && (P.tareas || []).includes(ct.tarea.id));
  const tt = HHHA.toggleTarea(ct.tarea, true);
  ok('toggleTarea cierra y reporta todasCerradas', ct.tarea.estado === 'cerrado' && tt.todasCerradas === true);

  const segAntes = (P.seguimientos || []).length;
  HHHA.agregarSeguimiento(P, 'Avance registrado');
  ok('agregarSeguimiento añade seguimiento', (P.seguimientos || []).length === segAntes + 1);

  HHHA.actualizarPendiente(P, { tipo: P.tipo, estado: 'en_proceso', ejecutor: EJ, desc: P.desc, fechaComp: null, proxRecord: null });
  ok('actualizarPendiente cambia a en_proceso', P.estado === 'en_proceso');

  HHHA.cerrarPendiente(P, 'Listo en pruebas');
  ok('cerrarPendiente cierra y fija fecha de cierre', P.estado === 'cerrado' && !!P.fechaCierre);

  const cp2 = HHHA.crearPendiente({ inv, tipo: 'gestion_general', desc: 'Pendiente a anular', ejecutor: EJ });
  HHHA.anularPendiente(cp2.pendiente);
  ok('anularPendiente lo excluye de pendientesDe()', cp2.pendiente.anulado === true && !HHHA.pendientesDe(inv).some(p => p.id === cp2.pendiente.id));

  // ======================================================================
  // G) Baja de equipo (cierra pendientes del equipo)
  // ======================================================================
  inv = freshInv(); eq = HHHA.findEquipo(inv);
  const pBaja = HHHA.crearPendiente({ inv, tipo: 'gestion_general', desc: 'Abierto antes de la baja', ejecutor: EJ }).pendiente;
  const rb = HHHA.darDeBaja(eq, 'Equipo obsoleto');
  ok('darDeBaja deja el equipo en baja', rb.ok && eq.estado === 'baja');
  ok('darDeBaja registra un evento de baja', S.eventos.some(e => e.inv === inv && e.resultado === 'Baja' && !e.anulado));
  ok('darDeBaja cierra los pendientes abiertos del equipo', pBaja.estado === 'cerrado');

  // ======================================================================
  // H) corregirMP: C6 → C3 con recálculo
  // ======================================================================
  inv = freshInv();
  const r6 = mpResultado(inv, 'C6'); eq = HHHA.findEquipo(inv);
  ok('C6 (reprogramación) no deja no operativo', r6.ok && eq.estado === 'operativo');
  const rcorr = HHHA.corregirMP(r6.evento, { resultado: 'C3' });
  ok('corregirMP C6→C3 recalcula a no operativo', rcorr.ok && eq.estado === 'no_operativo' && r6.evento.resultado === 'C3');

  // ======================================================================
  // I) Invariantes tras todas las operaciones
  // ======================================================================
  ok('contador de eventos es monótono', S.counters.evento > evInicial);
  ok('contador de pendientes es monótono', S.counters.pend > pendInicial);

  const idsEv2 = S.eventos.map(e => e.id);
  ok('IDs de evento siguen únicos', new Set(idsEv2).size === idsEv2.length);
  const idsP2 = S.pendientes.map(p => p.id);
  ok('IDs de pendiente siguen únicos', new Set(idsP2).size === idsP2.length);
  const idsT2 = S.tareas.map(t => t.id);
  ok('IDs de tarea únicos', new Set(idsT2).size === idsT2.length);

  // Estado almacenado == estado recalculado (motor determinista) en una muestra.
  let coherente = true;
  S.equipos.slice(0, 200).forEach(e => {
    const antes = e.estado;
    HHHA.recalcEstadoEquipo(e);
    if (e.estado !== antes) coherente = false;
  });
  ok('estado almacenado == recalculado (muestra de 200)', coherente);

  // Ciclos coherentes: todo ciclo tiene estado conocido y los cerrados/anulados llevan fecha de cierre coherente.
  const ciclosOk = S.ciclos.every(c =>
    ['abierto', 'cerrado', 'anulado'].includes(c.estado) &&
    (c.estado === 'abierto' ? c.fechaCierre == null : true));
  ok('ciclos en estado coherente', ciclosOk);

} catch (e) {
  ok('ejecución sin excepción no controlada (' + e.message + ')', false);
  if (process.env.DEBUG) console.error(e);
}

const fail = checks.filter(c => !c.cond);
checks.forEach(c => console.log((c.cond ? 'OK   ' : 'FAIL ') + c.label));
console.log(`\n${checks.length} comprobaciones · ${checks.length - fail.length} OK · ${fail.length} fallo(s)`);
console.log(fail.length ? '*** FLOW TEST: FALLÓ ***' : '*** FLOW TEST OK ***');
process.exit(fail.length ? 1 : 0);
