/* ============================================================================
 * HHHA · Gestión de Equipos Biomédicos Críticos — NÚCLEO LÓGICO
 * ----------------------------------------------------------------------------
 * Extracción del archivo monolítico original (app_28.html, v0.62) dejando
 * ÚNICAMENTE la lógica: modelo de dominio, estado, persistencia, reglas de
 * negocio, motor de estados, conciliación con el maestro Excel, operaciones
 * (MP / eventos / pendientes / baja) y export/import de datos.
 *
 * SE QUITÓ TODO lo visual:
 *   · CSS / diseño                       · helpers DOM ($, $$, el, modal, toast…)
 *   · marcado HTML / vistas (VIEWS.*)    · funciones render* / carta gantt / tablas
 *   · navegación y barra lateral         · grabador de sesión (session recorder)
 *
 * Cómo se desacopló de la UI:
 *   · Los formularios/modales se convirtieron en funciones con PARÁMETROS
 *     (antes leían `input.value`; ahora reciben un objeto de datos).
 *   · Los efectos de UI (toast, confirm, alert, prompt, navegar/refrescar)
 *     pasan por el adaptador inyectable `UI`. Por defecto son neutros.
 *   · El entorno (localStorage, LZString, XLSX) pasa por `ENV`, también
 *     inyectable, para poder correr en navegador o en Node.
 *
 * El algoritmo y las reglas de negocio se conservan VERBATIM.
 * ==========================================================================*/
(function (global) {
  'use strict';

  // ==========================================================================
  // ADAPTADORES INYECTABLES (únicos puntos de contacto con UI / entorno)
  // ==========================================================================

  // Capa de presentación. La app real la reemplaza con toasts/diálogos/navegación.
  const UI = {
    notify: function (/* msg, type, action */) {},   // antes: toast(...)
    confirm: function (/* msg */) { return true; },   // antes: window.confirm(...)
    alert: function (/* msg */) {},                   // antes: window.alert(...)
    prompt: function (/* msg */) { return null; },    // antes: window.prompt(...)
    onChange: function () {}                           // antes: navigate()/refreshNav()/refreshStateIndicator()
  };

  // Entorno. Permite correr fuera del navegador (Node) inyectando shims.
  const ENV = {
    storage: (typeof localStorage !== 'undefined') ? localStorage : memoryStorage(),
    compressor: (typeof LZString !== 'undefined') ? LZString : null, // {compressToUTF16, decompressFromUTF16}
    xlsx: (typeof XLSX !== 'undefined') ? XLSX : null                // SheetJS
  };

  function memoryStorage() {
    const m = {};
    return {
      getItem: k => (k in m ? m[k] : null),
      setItem: (k, v) => { m[k] = String(v); },
      removeItem: k => { delete m[k]; }
    };
  }

  function configure(opts) {
    opts = opts || {};
    if (opts.ui) Object.assign(UI, opts.ui);
    if (opts.env) Object.assign(ENV, opts.env);
  }

  // ==========================================================================
  // CONSTANTES & CATÁLOGOS
  // ==========================================================================
  const APP_VERSION = '0.62';
  const STORAGE_KEY = 'hhha_v1_data';
  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const MES_NUM = { Ene: 0, Feb: 1, Mar: 2, Abr: 3, May: 4, Jun: 5, Jul: 6, Ago: 7, Sep: 8, Oct: 9, Nov: 10, Dic: 11 };
  const NUM_MES = MESES;
  const MES_ESPANOL = { Ene: 'Enero', Feb: 'Febrero', Mar: 'Marzo', Abr: 'Abril', May: 'Mayo', Jun: 'Junio', Jul: 'Julio', Ago: 'Agosto', Sep: 'Septiembre', Oct: 'Octubre', Nov: 'Noviembre', Dic: 'Diciembre' };

  const EJECUTORES = [
    'Carlos Bahamondes Seguel', 'Cristián Beltrán Oviedo', 'Cristina Rozas Urrutia',
    'Daniel Díaz Neira', 'Ignacio Berner Bergara', 'Macarena Toledo', 'Marco Ulloa',
    'Matías Soazo Garrido', 'Ricardo Matus Aroca', 'Tito Millapán Riquelme', 'Personal externo'
  ];

  const TIPOS_EVENTO = [
    { k: 'solicitud', label: 'Solicitud de trabajo', desc: 'Abre ciclo correctivo' },
    { k: 'visita', label: 'Visita técnica', desc: 'Diagnóstica o correctiva' },
    { k: 'oc', label: 'Orden de Compra', desc: 'Gestión dentro del ciclo' },
    { k: 'envio', label: 'Envío a servicio técnico', desc: 'Equipo sale del hospital' },
    { k: 'recepcion', label: 'Recepción', desc: 'Equipo retorna' },
    { k: 'reparacion', label: 'Reparación', desc: 'Cierre típico del ciclo' },
    { k: 'mp', label: 'Mantención preventiva', desc: 'Programada / ejecutada' }
  ];

  const CAUSALES = {
    C1: { desc: 'Imposibilidad de desocupar el equipo del paciente', reprog30: true },
    C2: { desc: 'Equipo en servicio técnico', reprog30: false },
    C3: { desc: 'Equipo no operativo, espera de repuestos/accesorios', reprog30: false },
    C4: { desc: 'Equipo en préstamo a otro hospital', reprog30: false },
    C5: { desc: 'No disponibilidad de HH funcionario SEC (carga laboral)', reprog30: true },
    C6: { desc: 'No disponibilidad de HH servicio técnico externo', reprog30: true },
    C7: { desc: 'Ausencia funcionario SEC > 15 días', reprog30: true },
    C8: { desc: 'Contingencia hospitalaria', reprog30: true }
  };

  const ESTADOS_PRIMARIOS = ['desconocido', 'operativo', 'no_operativo', 'en_servicio_tecnico', 'baja'];
  const ESTADO_LABEL = { desconocido: 'Desconocido', operativo: 'Operativo', no_operativo: 'No operativo', en_servicio_tecnico: 'En servicio técnico', baja: 'Baja' };

  const SUBESTADOS_NOOP = ['esperando_visita_tecnica', 'esperando_cotizacion', 'esperando_OC', 'esperando_repuestos', 'en_reparacion_interna', 'otro'];
  const SUBESTADOS_ST = ['enviado', 'cotizacion_pendiente', 'OC_emitida', 'en_reparacion_externa', 'despachado_de_regreso'];

  const DOCS_CORRECTIVO = ['Solicitud SIGEM con tarea cerrada', 'Cotización', 'Informe técnico trato directo', 'Orden de compra', 'Guía de despacho de repuestos', 'Informe visita diagnóstica', 'Informe visita correctiva', 'Hoja de envío', 'Informe técnico ST externo', 'Guía de despacho de retorno'];
  const DOCS_PREVENTIVO = ['Protocolo / hoja de MP', 'Pauta de monitoreo diario (DEA)', 'Firma jefe equipo médico', 'Informe técnico de empresa externa'];

  const TIPO_PENDIENTE = { documento_faltante: 'Documento faltante', firma_faltante: 'Firma faltante', reprogramacion: 'Reprogramación MP', recomendacion_tecnica: 'Recomendación técnica', pauta_monitoreo: 'Pauta de Monitoreo Diario', gestion_general: 'Gestión general', seguimiento: 'Seguimiento de estado' };
  // Cargos de contacto del servicio (referencia organizacional, editable).
  const CARGOS_CONTACTO = ['Supervisor de Servicio Clínico', 'Encargado de Equipos', 'Jefe del Centro de Responsabilidad CCRR'];
  function contactosPorDefecto() { return CARGOS_CONTACTO.map((cargo, i) => ({ id: i + 1, servicio: '', nombre: '', apellido: '', anexo: '', correo: '', cargo })); }
  // Estados de pendiente orientados a la acción: No iniciado -> En proceso -> Resuelto.
  // 'cerrado' se conserva como estado final (= Resuelto) para no romper conteos (!== 'cerrado').
  const ESTADO_PEND_LABEL = { no_iniciado: 'No iniciado', en_proceso: 'En proceso', cerrado: 'Resuelto' };

  const MOTIVOS_ANULACION = ['Mal ingresado', 'Equipo equivocado', 'Fecha errónea', 'Resultado equivocado', 'Duplicado', 'Ejecutor equivocado', 'Documentación faltante'];

  // Mapeo causal de MP -> estado operativo del equipo.
  // C2 = en servicio técnico, C3 = no operativo (espera repuestos), FS/NU = no operativo, Baja = baja.
  // C1, C4-C8 y 'Si' NO indican falla del equipo -> se asume operativo.
  const MP_CAUSAL_ESTADO = { C2: 'en_servicio_tecnico', C3: 'no_operativo', FS: 'no_operativo', NU: 'no_operativo', Baja: 'baja' };

  // Catálogo de resultados válidos para crear evento MP sintético desde Conciliación.
  const RESULTADOS_MP = new Set(['Si', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'FS', 'NU', 'Baja', 'No']);

  // Campos de texto del equipo que el Excel a veces trae como número (ej. modelo "840",
  // ubicación "501"). Uniformarlos a string evita que localeCompare reviente al ordenar/filtrar.
  const CAMPOS_TEXTO_EQUIPO = ['fam', 'equipo', 'servicio', 'unidad', 'ubic', 'proc', 'marca', 'modelo', 'serie', 'clasif', 'freq'];

  const CONF_KEY = (inv, hoja, mes, campo) => `${inv}|${hoja}|${mes}|${campo || ''}`;

  // ==========================================================================
  // SEED (dataset inicial inyectable)
  // ==========================================================================
  // El SEED real (893 equipos) vive en seed-data.js (es DATO, no lógica). Aquí
  // hay un placeholder vacío; la app llama HHHA.setSeed(SEED) en el arranque.
  let SEED = { equipos: [], eventos: [], pendientes: [], tareas: [], meses: MESES.slice() };
  function setSeed(s) { if (s) SEED = s; }

  // ==========================================================================
  // STATE & PERSISTENCIA
  // ==========================================================================
  let state = null;
  function getState() { return state; }
  function setState(s) { state = s; }

  function load() {
    try {
      const raw = ENV.storage.getItem(STORAGE_KEY);
      if (!raw) return null;
      let json;
      if (raw.startsWith('LZv1:') && ENV.compressor) {
        json = ENV.compressor.decompressFromUTF16(raw.slice(5));
        if (!json) throw new Error('Decompresión falló');
      } else {
        json = raw;
      }
      const d = JSON.parse(json);
      if (d.__v !== APP_VERSION) return migrate(d);
      return d;
    } catch (e) { console.error('load', e); return null; }
  }

  function migrate(d) {
    // Migración no destructiva. Asegura estructuras nuevas sin perder datos.
    if (!d.conflictos) d.conflictos = [];
    if (!d.importaciones) d.importaciones = [];
    if (!d.prefs) d.prefs = {};
    if (!d.contactos) d.contactos = contactosPorDefecto();
    if (!d.actividad) d.actividad = [];
    d.counters = d.counters || {};
    if (d.counters.conflicto == null) d.counters.conflicto = (d.conflictos.length || 0) + 1;
    if (d.counters.importacion == null) d.counters.importacion = (d.importaciones.length || 0) + 1;
    if (d.counters.contacto == null) d.counters.contacto = d.contactos.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
    // Normalizar estados de pendientes de versiones previas (creado/abierto -> no_iniciado).
    (d.pendientes || []).forEach(p => { p.estado = normalizarEstadoPend(p.estado); });
    d.__v = APP_VERSION;
    return d;
  }

  function normalizarEstadoPend(e) {
    if (e === 'cerrado' || e === 'resuelto') return 'cerrado';
    if (e === 'en_proceso' || e === 'en proceso') return 'en_proceso';
    return 'no_iniciado'; // 'creado', 'abierto', vacío -> no iniciado
  }

  function normalizarEquipos() {
    (state.equipos || []).forEach(e => {
      CAMPOS_TEXTO_EQUIPO.forEach(k => {
        if (e[k] != null && typeof e[k] !== 'string') e[k] = String(e[k]);
      });
    });
  }

  // Limpia efectos huérfanos de eventos anulados que quedaron de versiones previas.
  // Idempotente: correr varias veces no rompe nada. Devuelve nº de cambios.
  function limpiarEfectosAnulados() {
    let cambios = 0;
    state.equipos.forEach(eq => {
      if (!eq.registro) return;
      Object.keys(eq.registro).forEach(mes => {
        const r = (eq.registro[mes] || {}).R;
        if (!r) return;
        const mIdx = MES_NUM[mes];
        const hayValido = state.eventos.some(ev =>
          ev.inv === eq.inv && !ev.anulado && ev.tipo === 'Mantención preventiva' &&
          ev.resultado && ev.fecha && new Date(ev.fecha + 'T00:00:00').getMonth() === mIdx
        );
        if (!hayValido) {
          delete eq.registro[mes].R;
          if (Object.keys(eq.registro[mes]).length === 0) delete eq.registro[mes];
          cambios++;
        }
      });
    });
    state.equipos.forEach(eq => {
      const antes = eq.estado;
      recalcEstadoEquipo(eq);
      if (antes !== eq.estado) cambios++;
    });
    state.ciclos.forEach(c => {
      if (c.estado === 'anulado') return;
      const eventosVivos = state.eventos.filter(e => !e.anulado && e.folio === c.folio);
      if (eventosVivos.length === 0) {
        c.estado = 'anulado';
        c.anulado = true;
        cambios++;
      }
    });
    state.pendientes.forEach(p => {
      if (p.anulado || !p.eventoOrigen) return;
      const ev = state.eventos.find(e => e.id === p.eventoOrigen);
      if (ev && ev.anulado && p.estado !== 'cerrado') {
        p.anulado = true;
        p.motivoAnulacion = 'Evento MP origen anulado (limpieza automática)';
        cambios++;
      }
    });
    return cambios;
  }

  function persistirState() {
    // Devuelve {ok, bytes, error}.
    try {
      const json = JSON.stringify(state);
      const payload = ENV.compressor
        ? ('LZv1:' + ENV.compressor.compressToUTF16(json))
        : json;
      ENV.storage.setItem(STORAGE_KEY, payload);
      return { ok: true, bytes: payload.length * 2 }; // UTF-16
    } catch (e) {
      return { ok: false, error: e };
    }
  }

  function save(opts) {
    state.__updated = new Date().toISOString();
    const isInternal = opts && opts.internal;
    if (!isInternal) {
      state.__userActions = (state.__userActions || 0) + 1;
    }
    let res = persistirState();
    if (!res.ok) {
      // Intento 1: podar conflictos resueltos antiguos para liberar almacenamiento
      const resCount = state.conflictos.filter(c => (c.estado || '').startsWith('resuelto')).length;
      if (resCount > 0) {
        state.conflictos = state.conflictos.filter(c => !(c.estado || '').startsWith('resuelto'));
        res = persistirState();
        if (res.ok) {
          UI.notify(`Almacenamiento liberado: ${resCount} conflictos resueltos podados del historial. Tu backup JSON los conserva.`, 'warn-backup',
            { label: 'Descargar backup', run: exportarBackupJSON });
        }
      }
    }
    if (!res.ok) {
      // Intento 2: avisar para exportar
      UI.notify('Almacenamiento del navegador lleno. Descarga el backup AHORA antes de seguir.', 'error',
        { label: 'Descargar', run: exportarBackupJSON });
      return;
    }
    // Recordatorio de backup cada N cambios reales del usuario
    if (!isInternal && state.__userActions > 0 && state.__userActions % 10 === 0) {
      UI.notify(`Llevas ${state.__userActions} cambios. Recuerda descargar backup.`, 'warn-backup',
        { label: 'Descargar', run: exportarBackupJSON });
    }
    UI.onChange();
  }

  // True si el state no tiene datos del usuario sobre el seed.
  function stateEsFresh() {
    return state.eventos.length <= SEED.eventos.length &&
      state.pendientes.length <= SEED.pendientes.length &&
      (state.conflictos || []).length === 0 &&
      Object.keys(state.asignacionesMP || {}).length === 0;
  }

  // Construye el state inicial desde SEED.
  function init() {
    const equipos = SEED.equipos.map(e => ({
      ...e,
      estado: 'desconocido',
      subestado: null,
      estadoDesde: null,
      notas: null
    }));
    const eventos = SEED.eventos.map(e => ({
      ...e,
      anulado: false,
      creadoPor: 'Cristian',
      actualizadoPor: 'Cristian',
      ts: e.fechaReg ? new Date(e.fechaReg).toISOString() : new Date().toISOString()
    }));
    const ciclos = []; // se reconstruyen en bootstrapDatos()
    const pendientes = SEED.pendientes.map(p => {
      // Si el seed ya trae 'tipo' se respeta; si no, se deriva del texto.
      let tipo = p.tipo;
      if (!tipo) {
        tipo = 'gestion_general';
        if ((p.desc || '').toLowerCase().includes('pauta de monitoreo') || (p.desc || '').toLowerCase().includes('firma')) tipo = 'documento_faltante';
        if ((p.desc || '').toLowerCase().includes('reprogram')) tipo = 'reprogramacion';
      }
      return { ...p, tipo, estado: normalizarEstadoPend(p.estado), origen: p.origen || 'manual', seguimientos: [], anulado: false };
    });
    const tareas = SEED.tareas.slice();
    // Expandir tareas inline de pendientes (string "[ ] ...")
    pendientes.forEach(p => {
      if (typeof p.tareas === 'string') {
        const ts = p.tareas.split('\n').filter(x => x.trim()).map((x, i) => ({
          id: 1000 + tareas.length + i, pendId: p.id, inv: p.inv, equipo: p.equipo,
          desc: x.replace(/^\[\s*\]\s*/, '').trim(), estado: 'abierto'
        }));
        tareas.push(...ts);
        p.tareas = ts.map(t => t.id);
      } else { p.tareas = []; }
    });
    return {
      __v: APP_VERSION,
      __created: new Date().toISOString(),
      __updated: new Date().toISOString(),
      equipos, eventos, ciclos, pendientes, tareas,
      counters: { evento: eventos.length + 1, pend: pendientes.length + 1, tarea: tareas.length + 1, ciclo: 1, audit: 1, conflicto: 1, importacion: 1, contacto: CARGOS_CONTACTO.length + 1 },
      audit: [],
      asignacionesMP: {},
      correos: [],
      contactos: contactosPorDefecto(),
      actividad: [],
      conflictos: [],
      importaciones: [],
      prefs: {}
    };
  }

  function resetState() {
    if (!UI.confirm('¿Resetear todo a datos iniciales? Se perderán los cambios.')) return;
    ENV.storage.removeItem(STORAGE_KEY);
    state = init();
    save();
    UI.onChange();
    UI.notify('Datos reseteados', 'success');
  }

  // ==========================================================================
  // AUDIT
  // ==========================================================================
  function audit(entidad, idEnt, campo, vOld, vNew) {
    state.audit.push({
      id: state.counters.audit++,
      entidad, idEnt, campo,
      valorAnterior: vOld, valorNuevo: vNew,
      usuario: 'Cristian', ts: new Date().toISOString()
    });
  }

  // ==========================================================================
  // UTILIDADES (fecha / preferencias / normalización)
  // ==========================================================================
  // FIX zona horaria: un YYYY-MM-DD se trata como fecha LOCAL (no UTC) para que
  // no aparezca corrida un día (Chile UTC-3/-4).
  function fmtFecha(v) {
    if (!v) return '—';
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y, m, d] = v.split('-').map(Number);
      return String(d).padStart(2, '0') + '-' + String(m).padStart(2, '0') + '-' + y;
    }
    const d = new Date(v);
    if (isNaN(d)) return v;
    return d.toLocaleDateString('es-CL');
  }
  function hoyLocal() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function addDias(fechaLocal, n) {
    if (!fechaLocal) fechaLocal = hoyLocal();
    const [y, m, d] = fechaLocal.split('-').map(Number);
    const dt = new Date(y, m - 1, d + n);
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }
  function diasEntreFechas(a, b) {
    // Recibe dos YYYY-MM-DD locales y devuelve días enteros (b - a).
    if (!a) return 0;
    const [ay, am, ad] = a.split('-').map(Number);
    const dA = new Date(ay, am - 1, ad);
    const dB = b ? (() => { const [y, m, d] = b.split('-').map(Number); return new Date(y, m - 1, d); })() : new Date();
    return Math.floor((dB - dA) / 86400000);
  }
  function getPref(k, def) { return (state.prefs && state.prefs[k]) || def; }
  function setPref(k, v) { state.prefs = state.prefs || {}; state.prefs[k] = v; }
  function valNorm(v) { if (v == null) return ''; return String(v).trim(); }

  // ==========================================================================
  // LÓGICA DE DOMINIO — consultas
  // ==========================================================================
  function findEquipo(inv) { return state.equipos.find(e => e.inv === inv); }
  function eventosDe(inv) { return state.eventos.filter(e => e.inv === inv && !e.anulado).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '')); }
  function eventosDeTodos(inv) { return state.eventos.filter(e => e.inv === inv).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '')); }
  function pendientesDe(inv) { return state.pendientes.filter(p => p.inv === inv && !p.anulado); }
  function conflictosDe(inv) { return (state.conflictos || []).filter(c => c.inv === inv && (c.estado === 'pendiente' || c.estado === 'pospuesto')); }
  function ciclosDe(inv) { return state.ciclos.filter(c => c.inv === inv); }
  function ciclosAbiertosDe(inv) { return state.ciclos.filter(c => c.inv === inv && c.estado === 'abierto'); }
  // Última gestión de un equipo: la acción más reciente entre eventos (no anulados) y la
  // actividad de pendientes (creación, seguimientos, cierre). Devuelve {fecha, texto} o null.
  function ultimaGestion(inv) {
    let best = null;
    const consider = (fecha, texto) => { if (fecha && (!best || fecha > best.fecha)) best = { fecha, texto }; };
    state.eventos.forEach(e => {
      if (e.inv !== inv || e.anulado) return;
      consider(e.fecha, etiquetaTipoEvento(e) + (e.resultado ? ' · ' + e.resultado : ''));
    });
    (state.pendientes || []).forEach(p => {
      if (p.inv !== inv || p.anulado) return;
      const tip = TIPO_PENDIENTE[p.tipo] || p.tipo;
      consider(p.fechaCrea, 'Pendiente creado · ' + tip);
      if (p.fechaCierre) consider(p.fechaCierre, 'Pendiente cerrado · ' + tip);
      (p.seguimientos || []).forEach(s => consider(s.fecha, 'Seguimiento · ' + (s.texto || tip)));
    });
    return best;
  }
  // Encargado actual: ingeniero del ciclo abierto o, si no, el último ejecutor.
  function encargadoDe(equipo) {
    if (equipo.encargado) return equipo.encargado;          // responsable asignado explícitamente
    const c = ciclosAbiertosDe(equipo.inv)[0];
    if (c && c.ingenieroAsignado) return c.ingenieroAsignado;
    const evs = eventosDe(equipo.inv);
    for (let i = evs.length - 1; i >= 0; i--) { if (evs[i].ejecutor) return evs[i].ejecutor; }
    return null;
  }
  // Asigna (o quita) el responsable explícito de un equipo. No guarda (el llamador lo hace).
  function asignarEncargado(equipo, persona) {
    const antes = equipo.encargado || null;
    equipo.encargado = persona || null;
    audit('equipo', equipo.inv, 'encargado', antes, equipo.encargado);
    return equipo;
  }
  // True si el equipo (no dado de baja) no tiene ningún mes con MP programada.
  function sinProgramacionMP(equipo) {
    return equipo.estado !== 'baja' && !MESES.some(m => mpProgramadaEnMes(equipo, m));
  }
  // Agrega una nota/observación libre al equipo (con timestamp y autor). No guarda.
  function agregarNotaEquipo(equipo, texto, autor) {
    if (!texto || !texto.trim()) return null;
    if (!Array.isArray(equipo.notas)) equipo.notas = [];
    const nota = { autor: autor || 'Cristian', fecha: hoyLocal(), ts: new Date().toISOString(), texto: texto.trim() };
    equipo.notas.push(nota);
    audit('equipo', equipo.inv, 'nota', null, nota.texto.slice(0, 80));
    return nota;
  }
  function notasDe(equipo) { return Array.isArray(equipo.notas) ? equipo.notas : []; }

  // ==========================================================================
  // LÓGICA DE DOMINIO — motor de estados del equipo
  // ==========================================================================
  // Estado resultante (texto del formulario) de una MP según su resultado/causal.
  // C2 = en servicio técnico; C3/FS/NU = no operativo; Baja = baja; Si = operativo.
  // C1 y C4–C8 son reprogramaciones sin falla: no declaran estado.
  function estadoMPDesdeResultado(resultado) {
    if (resultado === 'Si') return 'operativo';
    if (resultado === 'C2') return 'en servicio técnico';
    if (resultado === 'C3' || resultado === 'FS' || resultado === 'NU') return 'no operativo';
    if (resultado === 'Baja') return 'baja';
    return '';
  }
  // Estado FINAL de una MP. Con "Si" (MP realizada) lo decide quien registra
  // (operativo/no operativo). Con causal se deriva. C1/C4–C8: no cambia el estado.
  function estadoMPFinal(resultado, estadoManualSi) {
    if (resultado === 'Si') return estadoManualSi === 'no operativo' ? 'no operativo' : 'operativo';
    return estadoMPDesdeResultado(resultado);
  }
  // Nombre que se MUESTRA del evento. Una MP con causal de REPROGRAMACIÓN (C1–C8)
  // se muestra como "Reprogramación mantención preventiva". El dato interno ev.tipo
  // NO cambia, para no romper cálculos/filtros.
  function etiquetaTipoEvento(ev) {
    if (ev.tipo === 'Mantención preventiva' && /^C[1-8]$/.test(ev.resultado || '')) return 'Reprogramación mantención preventiva';
    return ev.tipo;
  }
  // Sin eventos que declaren estado, infiere desde la carta gantt usando el
  // resultado del último mes registrado del año vigente. Devuelve {estado,fecha} o null.
  function estadoDesdeMatriz(equipo) {
    let ultR = null, ultMesIdx = -1;
    MESES.forEach((m, idx) => { const r = ((equipo.registro || {})[m] || {}).R; if (r) { ultR = r; ultMesIdx = idx; } });
    const est = MP_CAUSAL_ESTADO[ultR];
    if (est) return { estado: est, fecha: `${new Date().getFullYear()}-${String(ultMesIdx + 1).padStart(2, '0')}-15` };
    return null;
  }
  function recalcEstadoEquipo(equipo) {
    // Deriva estado actual del último evento que declaró estado.
    const evs = eventosDe(equipo.inv);
    // Eventos MP con resultado 'Baja' tienen prioridad
    for (let i = evs.length - 1; i >= 0; i--) {
      const ev = evs[i];
      if (ev.tipo === 'Mantención preventiva' && ev.resultado === 'Baja') {
        equipo.estado = 'baja';
        equipo.estadoDesde = ev.fecha;
        return;
      }
    }
    // Último evento con estado declarado
    for (let i = evs.length - 1; i >= 0; i--) {
      const ev = evs[i];
      // Para una MP, el estado lo manda el RESULTADO/causal (no ev.estado).
      if (ev.tipo === 'Mantención preventiva' && ev.resultado) {
        if (ev.resultado === 'Si') { equipo.estado = ev.estado === 'no operativo' ? 'no_operativo' : 'operativo'; equipo.estadoDesde = ev.fecha; return; }
        const estMP = MP_CAUSAL_ESTADO[ev.resultado];
        if (estMP) { equipo.estado = estMP; equipo.estadoDesde = ev.fecha; return; }
        continue; // C1, C4–C8: reprogramación sin falla declarada
      }
      if (ev.estado) {
        const estado = ev.estado === 'operativo' ? 'operativo' :
          ev.estado === 'en servicio técnico' ? 'en_servicio_tecnico' :
            ev.estado === 'baja' ? 'baja' :
              'no_operativo';
        equipo.estado = estado;
        equipo.estadoDesde = ev.fecha;
        return;
      }
    }
    // Sin eventos que declaren estado: inferir de la carta gantt; si tampoco, operativo.
    const m = estadoDesdeMatriz(equipo);
    if (m) { equipo.estado = m.estado; equipo.estadoDesde = m.fecha; return; }
    equipo.estado = 'operativo';
    equipo.estadoDesde = null;
  }

  function diasEnEstado(equipo) {
    if (!equipo.estadoDesde) return 0;
    return Math.max(0, diasEntreFechas(equipo.estadoDesde, hoyLocal()));
  }

  // Resultado de la MP del mes considerando AMBAS fuentes: el evento MP del mes
  // y la matriz registro[mes].R (para el año vigente). Devuelve el código o null.
  function resultadoMPMes(equipo, year, month) {
    const ev = state.eventos.find(e => e.inv === equipo.inv && e.tipo === 'Mantención preventiva' && !e.anulado &&
      e.fecha && new Date(e.fecha + 'T00:00:00').getFullYear() === year && new Date(e.fecha + 'T00:00:00').getMonth() === month);
    if (ev) return ev.resultado || 'Si';
    if (year === new Date().getFullYear()) {
      const r = ((equipo.registro || {})[NUM_MES[month]] || {}).R;
      if (r) return r;
    }
    return null;
  }
  function eventoMPMes(inv, year, month) {
    return state.eventos.find(e => e.inv === inv && e.tipo === 'Mantención preventiva' && !e.anulado &&
      e.fecha && new Date(e.fecha + 'T00:00:00').getFullYear() === year && new Date(e.fecha + 'T00:00:00').getMonth() === month);
  }
  // Estado de la MP del mes: ejecutada (Si) / reprogramada (C1-C8) / otro (FS,NU,Baja,No) / pendiente.
  function mpEstadoMes(equipo, year, month) {
    const r = resultadoMPMes(equipo, year, month);
    if (r === 'Si') return 'ejecutada';
    if (/^C[1-8]$/.test(r || '')) return 'reprogramada';
    if (r) return 'otro';
    return 'pendiente';
  }
  function mpDelMesEjecutada(equipo, year, month) {
    return mpEstadoMes(equipo, year, month) === 'ejecutada';
  }
  function mpProgramadaEnMes(equipo, mes) {
    const p = (equipo.prog || {})[mes];
    return p && ['X', 'R', 'RA', 'PM'].includes(p);
  }
  // Clasifica la MP del mes de un equipo PROGRAMADO. Devuelve:
  //   'oficial'  → ejecutada (Si) y oficial (en el maestro)
  //   'borrador' → ejecutada (Si) pero en borrador (registrada, no oficial)
  //   'reprog'   → reprogramada (C1–C8)
  //   'otro'     → FS / NU / Baja / No
  //   'noreg'    → programada sin ningún registro
  //   null       → no estaba programada ese mes
  function claseMPMes(equipo, year, month) {
    if (!mpProgramadaEnMes(equipo, NUM_MES[month])) return null;
    const r = resultadoMPMes(equipo, year, month);
    if (r === 'Si') { const ev = eventoMPMes(equipo.inv, year, month); return (ev && ev.oficial !== 'Sí') ? 'borrador' : 'oficial'; }
    if (/^C[1-8]$/.test(r || '')) return 'reprog';
    if (r) return 'otro';
    return 'noreg';
  }

  // ==========================================================================
  // LÓGICA DE DOMINIO — ciclos correctivos, pendientes auto, efectos de evento
  // ==========================================================================
  function abrirCiclo(folio, inv, fecha, ingeniero, descripcion) {
    folio = folio || null;   // ya NO se genera folio automático: si no hay, queda vacío
    const yaAbierto = ciclosAbiertosDe(inv);
    if (yaAbierto.length > 0) {
      if (!UI.confirm(`El equipo ${inv} ya tiene un ciclo correctivo abierto (${yaAbierto[0].folio || 'sin folio'}). ¿Abrir otro de todos modos?`)) return null;
    }
    const ciclo = {
      folio, inv,
      fechaApertura: fecha,
      fechaCierre: null,
      estado: 'abierto',
      descripcionInicial: descripcion || '',
      ingenieroAsignado: ingeniero || null,
      id: state.counters.ciclo++
    };
    state.ciclos.push(ciclo);
    audit('ciclo', ciclo.folio || ('#' + ciclo.id), 'estado', null, 'abierto');
    return ciclo;
  }
  function cerrarCiclo(folio, fecha, motivo) {
    const c = state.ciclos.find(x => x.folio === folio);
    if (!c) return;
    c.estado = 'cerrado';
    c.fechaCierre = fecha || hoyLocal();
    if (motivo) c.motivoCierre = motivo;
    audit('ciclo', folio, 'estado', 'abierto', 'cerrado');
  }

  function crearPendienteAuto(inv, tipo, desc, ejecutor, eventoOrigenId, fechaCompromiso) {
    const equipo = findEquipo(inv);
    const p = {
      id: state.counters.pend++,
      inv, equipo: equipo ? equipo.equipo : '', servicio: equipo ? equipo.servicio : '',
      tipo, desc, ejecutor: ejecutor || null,
      fechaCrea: hoyLocal(),
      fechaComp: fechaCompromiso || null,
      proxRecord: fechaCompromiso || null,
      fechaCierre: null,
      estado: 'no_iniciado',
      origen: 'auto_mp_causal',
      seguimientos: [],
      tareas: [],
      eventoOrigen: eventoOrigenId || null,
      anulado: false
    };
    state.pendientes.push(p);
    audit('pendiente', p.id, 'creado_auto', null, tipo);
    return p;
  }

  // Aplica los efectos colaterales de un evento (estado del equipo, ciclos,
  // marca R en la carta gantt, pendientes automáticos por causal, etc.).
  function aplicarEfectosEvento(ev) {
    const eq = findEquipo(ev.inv);
    if (!eq) return;
    const tipo = ev.tipo;
    // Estado
    if (ev.estado) {
      const nuevo = ev.estado === 'operativo' ? 'operativo' :
        ev.estado === 'en servicio técnico' ? 'en_servicio_tecnico' :
          'no_operativo';
      if (eq.estado !== nuevo) {
        audit('equipo', eq.inv, 'estado', eq.estado, nuevo);
        eq.estado = nuevo;
        eq.estadoDesde = ev.fecha;
      }
      if (ev.subestado) { eq.subestado = ev.subestado; }
    }
    // Ciclo correctivo
    if (tipo === 'Solicitud de trabajo') {
      abrirCiclo(ev.folio, ev.inv, ev.fecha, ev.ejecutor, ev.obs); // si no hay folio, el ciclo queda con folio vacío
    } else if ((tipo === 'Reparación' || tipo === 'Recepción' || (tipo === 'Visita técnica' && ev.tipoVisita === 'correctiva')) && ev.estado === 'operativo') {
      // Cierra el ciclo correctivo: por folio si el evento lo trae; si no, el ciclo abierto del equipo.
      const c = state.ciclos.find(x => x.estado === 'abierto' && (ev.folio ? x.folio === ev.folio : x.inv === ev.inv));
      if (c) { c.estado = 'cerrado'; c.fechaCierre = ev.fecha || hoyLocal(); audit('ciclo', c.folio || ('#' + c.id), 'estado', 'abierto', 'cerrado'); }
    }
    // MP
    if (tipo === 'Mantención preventiva') {
      const r = ev.resultado;
      const mesIdx = new Date(ev.fecha + 'T00:00:00').getMonth();
      const mes = NUM_MES[mesIdx];
      eq.registro = eq.registro || {};
      eq.registro[mes] = eq.registro[mes] || {};
      eq.registro[mes].R = r;
      // Causal C1-C8 → pendiente de reprogramación
      if (r && /^C[1-8]$/.test(r)) {
        const c = CAUSALES[r];
        const fechaComp = c.reprog30 ? addDias(hoyLocal(), 30) : null;
        crearPendienteAuto(ev.inv, 'reprogramacion',
          `Reprogramar MP por causal ${r} — ${c.desc}. ${c.reprog30 ? 'Reprogramar dentro de 30 días.' : 'Esperar reintegro del equipo.'}`,
          ev.ejecutor, ev.id, fechaComp);
        // Marca "R" (reprogramado) en la programación del MES SIGUIENTE (solo si está vacío).
        if (mesIdx < 11) {
          const mesSig = NUM_MES[mesIdx + 1];
          eq.registro[mesSig] = eq.registro[mesSig] || {};
          if (!eq.registro[mesSig].P) eq.registro[mesSig].P = 'R';
        }
      }
      if (r === 'NU') {
        crearPendienteAuto(ev.inv, 'gestion_general', 'Localizar equipo (resultado MP = NU)', ev.ejecutor, ev.id, null);
      }
      if (r === 'Baja') {
        eq.estado = 'baja';
        eq.estadoDesde = ev.fecha;
        audit('equipo', eq.inv, 'estado', 'operativo', 'baja');
      }
    }
  }

  // Cambia el estado de un pendiente (No iniciado / En proceso / Resuelto).
  function cambiarEstadoPend(p, nuevo) {
    const antes = p.estado;
    p.estado = nuevo;
    if (nuevo === 'cerrado' && !p.fechaCierre) p.fechaCierre = hoyLocal();
    audit('pendiente', p.id, 'estado', antes, nuevo);
    save();
    UI.onChange();
  }

  // ==========================================================================
  // CONCILIACIÓN — importación y comparación con el archivo maestro Excel
  // ==========================================================================
  function conflictoPendiente(inv, hoja, mes, campo) {
    return (state.conflictos || []).find(c =>
      c.tipo === 'mp_diferencia' &&
      c.inv === inv && c.hoja === hoja && c.mes === mes && c.campo === campo &&
      (c.estado === 'pendiente' || c.estado === 'pospuesto')
    );
  }
  function celdaTieneConflicto(inv, mes, campo) {
    return (state.conflictos || []).find(c =>
      c.tipo === 'mp_diferencia' && c.inv === inv && c.mes === mes && c.campo === campo &&
      (c.estado === 'pendiente' || c.estado === 'pospuesto')
    ) || null;
  }

  async function parsearMaestro(file) {
    if (!ENV.xlsx) throw new Error('Parser XLSX no disponible. Inyecta ENV.xlsx (SheetJS).');
    const buf = await file.arrayBuffer();
    const wb = ENV.xlsx.read(buf, { type: 'array' });
    const sheetPMP = wb.SheetNames.find(n => /^PMP[_\s-]?\d{4}$/i.test(n));
    const sheetReg = wb.SheetNames.find(n => /^Registro[_\s-]?MP[_\s-]?\d{4}$/i.test(n));
    if (!sheetPMP) throw new Error('No se encontró hoja PMP_AAAA en el archivo.');
    if (!sheetReg) throw new Error('No se encontró hoja Registro_MP-AAAA en el archivo.');
    const pmp = parsearHojaPMP(wb.Sheets[sheetPMP]);
    const reg = parsearHojaRegistro(wb.Sheets[sheetReg]);
    return { sheetPMP, sheetReg, pmp, reg };
  }

  function parsearHojaPMP(ws) {
    const rows = ENV.xlsx.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false });
    const headerIdx = rows.findIndex(r => r && r.some(c => /N° Inventario/i.test(String(c || ''))));
    if (headerIdx < 0) throw new Error('Hoja PMP sin encabezados reconocibles.');
    const header = rows[headerIdx];
    const invIdx = header.findIndex(c => /N° Inventario/i.test(String(c || '')));
    const mesIdx = {};
    MESES.forEach(m => {
      const i = header.findIndex(c => String(c || '').trim() === m);
      if (i >= 0) mesIdx[m] = i;
    });
    const equipos = {};
    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const inv = valNorm(row[invIdx]);
      if (!inv || inv === 'N/A') continue;
      const prog = {};
      MESES.forEach(m => {
        const i = mesIdx[m];
        if (i != null) {
          const v = valNorm(row[i]);
          if (v) prog[m] = v;
        }
      });
      equipos[inv] = { inv, prog };
    }
    return equipos;
  }

  function parsearHojaRegistro(ws) {
    const rows = ENV.xlsx.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false });
    const headerIdx = rows.findIndex(r => r && r.some(c => /N° Inventario/i.test(String(c || ''))));
    if (headerIdx < 0) throw new Error('Hoja Registro sin encabezados reconocibles.');
    const header = rows[headerIdx];
    const invIdx = header.findIndex(c => /N° Inventario/i.test(String(c || '')));
    // Tras el header de campos hay 12 pares P/R consecutivos: buscar el primer 'P' seguido de 'R'.
    let firstP = -1;
    for (let i = invIdx + 1; i < header.length - 1; i++) {
      if (String(header[i] || '').trim() === 'P' && String(header[i + 1] || '').trim() === 'R') {
        firstP = i;
        break;
      }
    }
    if (firstP < 0) throw new Error('Hoja Registro: no encontré sub-encabezados P/R.');
    const equipos = {};
    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const inv = valNorm(row[invIdx]);
      if (!inv || inv === 'N/A') continue;
      const reg = {};
      for (let m = 0; m < 12; m++) {
        const pv = valNorm(row[firstP + m * 2]);
        const rv = valNorm(row[firstP + m * 2 + 1]);
        if (pv || rv) reg[MESES[m]] = { P: pv || null, R: rv || null };
      }
      equipos[inv] = { inv, reg };
    }
    return equipos;
  }

  // Compara el maestro parseado contra el state y genera conflictos / auto-completa.
  // Oficializa los eventos MP (no anulados, en borrador) de un equipo/mes cuyo
  // resultado COINCIDE con el del maestro. No sobrescribe nada: solo confirma
  // como oficial lo ya registrado en la app. Devuelve cuántos oficializó.
  function oficializarMPMesPorMaestro(inv, year, monthIdx, resultadoMaestro, importacionId) {
    let n = 0;
    state.eventos.forEach(ev => {
      if (ev.inv !== inv || ev.anulado || ev.tipo !== 'Mantención preventiva' || !ev.fecha) return;
      const d = new Date(ev.fecha + 'T00:00:00');
      if (d.getFullYear() !== year || d.getMonth() !== monthIdx) return;
      if ((ev.resultado || 'Si') !== resultadoMaestro) return; // solo si coincide
      if (ev.oficial === 'Sí') return;                          // ya oficial
      ev.oficial = 'Sí';
      ev.ts = new Date().toISOString();
      ev.confirmadoMaestro = importacionId || true;
      audit('evento', ev.id, 'oficial', 'No', 'Sí (coincide con maestro)');
      n++;
    });
    return n;
  }

  function compararMaestro(parsed, importacionId) {
    const conflictosNuevos = [];
    const todos = new Set([...Object.keys(parsed.pmp), ...Object.keys(parsed.reg)]);
    const invsProg = new Set(state.equipos.map(e => e.inv));
    const yearMatch = (parsed.sheetPMP || parsed.sheetReg || '').match(/(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
    let autoCompletados = 0;
    let eventosSinteticos = 0;
    let oficializados = 0;

    // 1. Equipos nuevos: en maestro pero no en programa
    todos.forEach(inv => {
      if (!invsProg.has(inv)) {
        const existente = state.conflictos.find(c => c.tipo === 'equipo_nuevo' && c.inv === inv && c.estado === 'pendiente');
        if (existente) {
          existente.importacionId = importacionId;
          existente.datosMaestro = { pmp: parsed.pmp[inv], reg: parsed.reg[inv] };
          return;
        }
        conflictosNuevos.push({
          id: state.counters.conflicto++,
          tipo: 'equipo_nuevo',
          inv,
          equipo: null,
          datosMaestro: { pmp: parsed.pmp[inv], reg: parsed.reg[inv] },
          estado: 'pendiente',
          fechaDeteccion: new Date().toISOString(),
          importacionId
        });
      }
    });

    // 2. Equipos faltantes en maestro
    invsProg.forEach(inv => {
      if (!todos.has(inv)) {
        const eq = findEquipo(inv);
        if (eq && eq.estado === 'baja') return; // los dados de baja se sacan del maestro
        const existente = state.conflictos.find(c => c.tipo === 'equipo_faltante' && c.inv === inv && c.estado === 'pendiente');
        if (existente) { existente.importacionId = importacionId; return; }
        conflictosNuevos.push({
          id: state.counters.conflicto++,
          tipo: 'equipo_faltante',
          inv,
          equipo: eq ? eq.equipo : null,
          estado: 'pendiente',
          fechaDeteccion: new Date().toISOString(),
          importacionId
        });
      }
    });

    // 3. Diferencias por celda
    state.equipos.forEach(eq => {
      if (eq.estado === 'baja') return;
      const inv = eq.inv;
      const fromPMP = parsed.pmp[inv];
      const fromReg = parsed.reg[inv];

      // PMP: solo P (programación)
      MESES.forEach(mes => {
        const valProg = valNorm(((eq.prog || {})[mes]) || '');
        const valMast = fromPMP ? valNorm(fromPMP.prog[mes] || '') : '';
        if (valProg === valMast) return;
        if (!fromPMP) return;
        // Auto-completar: vacío en programa + valor en maestro → escribir sin conflicto
        if (!valProg && valMast) {
          eq.prog = eq.prog || {};
          eq.prog[mes] = valMast;
          autoCompletados++;
          return;
        }
        registrarOActualizarConflicto({
          tipo: 'mp_diferencia', inv, equipo: eq.equipo,
          hoja: 'PMP', mes, campo: 'P', year,
          valorPrograma: valProg, valorMaestro: valMast,
          importacionId
        }, conflictosNuevos);
      });

      // Registro_MP: P y R
      MESES.forEach(mes => {
        const regProg = (eq.registro || {})[mes] || {};
        const regMast = (fromReg && fromReg.reg[mes]) || {};
        ['P', 'R'].forEach(campo => {
          const vp = valNorm(regProg[campo] || '');
          const vm = valNorm(regMast[campo] || '');
          if (vp === vm) {
            // Coincide con el maestro: si es una R con evento MP en borrador, se
            // OFICIALIZA (se mantiene lo de la app, solo se confirma).
            if (campo === 'R' && vm && RESULTADOS_MP.has(vm)) oficializados += oficializarMPMesPorMaestro(eq.inv, year, MES_NUM[mes], vm, importacionId);
            return;
          }
          if (!fromReg) return;
          // R sin dato en el maestro: no hay con qué verificar → se conserva lo de
          // la app sin generar conflicto (no se sobrescribe ni se marca diferencia).
          if (campo === 'R' && !vm) return;
          // Auto-completar: vacío en programa + valor en maestro
          if (!vp && vm) {
            eq.registro = eq.registro || {};
            eq.registro[mes] = eq.registro[mes] || {};
            eq.registro[mes][campo] = vm;
            autoCompletados++;
            // R con valor MP del catálogo y sin evento MP en ese mes → crear sintético
            if (campo === 'R' && RESULTADOS_MP.has(vm)) {
              const mIdx = MES_NUM[mes];
              const yaExiste = state.eventos.some(ev =>
                ev.inv === eq.inv && !ev.anulado && ev.tipo === 'Mantención preventiva' &&
                ev.fecha && new Date(ev.fecha + 'T00:00:00').getMonth() === mIdx &&
                ev.fecha.startsWith(String(year)));
              if (!yaExiste) {
                const fecha = `${year}-${String(mIdx + 1).padStart(2, '0')}-15`;
                const ev = {
                  id: state.counters.evento++,
                  inv: eq.inv, equipo: eq.equipo, servicio: eq.servicio, fam: eq.fam,
                  tipo: 'Mantención preventiva',
                  fecha, fechaReg: hoyLocal(),
                  resultado: vm,
                  ejecutor: getPref('ultimoEjecutor', null) || 'Personal externo',
                  estado: estadoMPDesdeResultado(vm),
                  obs: `[Conciliación auto] Importado desde maestro · Importación #${importacionId}`,
                  oficial: 'Sí', anulado: false,
                  origen: 'conciliacion_auto',
                  creadoPor: 'Cristian',
                  ts: new Date().toISOString()
                };
                state.eventos.push(ev);
                audit('evento', ev.id, 'creado_autocompletado', null, 'conciliacion');
                eventosSinteticos++;
              }
            }
            return;
          }
          registrarOActualizarConflicto({
            tipo: 'mp_diferencia', inv, equipo: eq.equipo,
            hoja: 'Registro', mes, campo, year,
            valorPrograma: vp, valorMaestro: vm,
            importacionId
          }, conflictosNuevos);
        });
      });
    });

    state.conflictos.push(...conflictosNuevos);
    return { conflictos: conflictosNuevos.length, autoCompletados, eventosSinteticos, oficializados };
  }

  function registrarOActualizarConflicto(data, buffer) {
    const existente = state.conflictos.find(c =>
      c.tipo === 'mp_diferencia' && c.inv === data.inv && c.hoja === data.hoja &&
      c.mes === data.mes && c.campo === data.campo &&
      (c.estado === 'pendiente' || c.estado === 'pospuesto')
    );
    if (existente) {
      existente.valorMaestro = data.valorMaestro;
      existente.valorPrograma = data.valorPrograma;
      existente.importacionId = data.importacionId;
      return;
    }
    buffer.push({
      id: state.counters.conflicto++,
      ...data,
      estado: 'pendiente',
      fechaDeteccion: new Date().toISOString()
    });
  }

  // Resuelve un conflicto. accion ∈ {aceptar_maestro, mantener_programa, manual, posponer}.
  function resolverConflicto(c, accion, valorManual, opts) {
    const skipSave = opts && opts.skipSave;
    const eq = findEquipo(c.inv);
    let eventoCreado = null;
    if (c.tipo === 'mp_diferencia') {
      if (accion === 'aceptar_maestro' || accion === 'manual') {
        const v = accion === 'manual' ? valorManual : c.valorMaestro;
        if (c.hoja === 'PMP') {
          eq.prog = eq.prog || {};
          if (v) eq.prog[c.mes] = v; else delete eq.prog[c.mes];
        } else {
          eq.registro = eq.registro || {};
          eq.registro[c.mes] = eq.registro[c.mes] || {};
          eq.registro[c.mes][c.campo] = v || null;
          if (!eq.registro[c.mes].P && !eq.registro[c.mes].R) delete eq.registro[c.mes];
        }
        c.resolucionValor = v;
        // Aceptar un R con valor válido del catálogo MP.
        if (c.hoja === 'Registro' && c.campo === 'R' && v && RESULTADOS_MP.has(v)) {
          const mIdx = MES_NUM[c.mes];
          const yearStr = (c.year || new Date().getFullYear()).toString();
          const mismos = state.eventos.filter(ev =>
            ev.inv === eq.inv && !ev.anulado && ev.tipo === 'Mantención preventiva' &&
            ev.fecha && new Date(ev.fecha + 'T00:00:00').getMonth() === mIdx && ev.fecha.startsWith(yearStr));
          const coinciden = mismos.filter(ev => (ev.resultado || 'Si') === v);
          // Los que difieren del maestro quedan reemplazados (anulados).
          mismos.filter(ev => (ev.resultado || 'Si') !== v).forEach(ev => {
            ev.anulado = true; ev.motivoAnulacion = 'Reemplazado por el maestro (conciliación)'; ev.fechaAnulacion = new Date().toISOString();
            audit('evento', ev.id, 'anulado', false, true);
          });
          if (coinciden.length) {
            // Ya existe un registro con el valor del maestro → solo se oficializa (sin duplicar).
            coinciden.forEach(ev => { if (ev.oficial !== 'Sí') { ev.oficial = 'Sí'; ev.ts = new Date().toISOString(); audit('evento', ev.id, 'oficial', 'No', 'Sí (conciliación)'); } });
            eventoCreado = coinciden[0];
          } else {
            const fecha = `${yearStr}-${String(mIdx + 1).padStart(2, '0')}-15`;
            const ev = {
              id: state.counters.evento++,
              inv: eq.inv, equipo: eq.equipo, servicio: eq.servicio, fam: eq.fam,
              tipo: 'Mantención preventiva',
              fecha, fechaReg: hoyLocal(),
              resultado: v,
              ejecutor: getPref('ultimoEjecutor', null) || 'Personal externo',
              estado: estadoMPDesdeResultado(v),
              obs: `[Conciliación] Importado desde maestro · Importación #${c.importacionId || '-'}`,
              oficial: 'Sí',
              anulado: false,
              origen: 'conciliacion',
              creadoPor: 'Cristian',
              ts: new Date().toISOString(),
              conflictoOrigen: c.id
            };
            state.eventos.push(ev);
            aplicarEfectosEvento(ev);
            audit('evento', ev.id, 'creado_sintetico', null, 'conciliacion');
            eventoCreado = ev;
          }
        }
      }
      if (accion === 'mantener_programa') {
        c.resolucionValor = c.valorPrograma;
        // Se conserva lo de la app; si es una R con evento MP en borrador, se oficializa.
        if (c.hoja === 'Registro' && c.campo === 'R' && c.valorPrograma && RESULTADOS_MP.has(c.valorPrograma)) {
          oficializarMPMesPorMaestro(eq.inv, (c.year || new Date().getFullYear()), MES_NUM[c.mes], c.valorPrograma, c.importacionId);
        }
      }
      c.estado = accion === 'posponer' ? 'pospuesto' :
        accion === 'aceptar_maestro' ? 'resuelto_maestro' :
          accion === 'manual' ? 'resuelto_manual' :
            'resuelto_programa';
    } else if (c.tipo === 'equipo_nuevo') {
      if (accion === 'aceptar_maestro') {
        const datos = c.datosMaestro || {};
        const nuevoEq = {
          inv: c.inv,
          equipo: '', // sin datos de identificación en el maestro; el usuario completa luego
          servicio: null, unidad: null, ubic: null, fam: null,
          marca: null, modelo: null, serie: null, ano: null, vur: null, clasif: null, freq: null,
          estado: 'operativo', subestado: null,
          estadoDesde: hoyLocal(),
          prog: (datos.pmp && datos.pmp.prog) || {},
          registro: (datos.reg && datos.reg.reg) || {}
        };
        state.equipos.push(nuevoEq);
        audit('equipo', c.inv, 'alta_por_conciliacion', null, 'creado');
        c.estado = 'resuelto_maestro';
      } else if (accion === 'mantener_programa') {
        c.estado = 'resuelto_programa';
      } else if (accion === 'posponer') {
        c.estado = 'pospuesto';
      }
    } else if (c.tipo === 'equipo_faltante') {
      if (accion === 'aceptar_maestro') {
        // El maestro no lo tiene → dar de baja en el programa
        if (eq) {
          eq.estado = 'baja';
          eq.estadoDesde = hoyLocal();
          audit('equipo', c.inv, 'baja_por_conciliacion', null, 'baja');
        }
        c.estado = 'resuelto_maestro';
      } else if (accion === 'mantener_programa') {
        c.estado = 'resuelto_programa';
      } else if (accion === 'posponer') {
        c.estado = 'pospuesto';
      }
    }
    c.fechaResolucion = new Date().toISOString();
    c.accionAplicada = accion;
    audit('conflicto', c.id, 'resolucion', 'pendiente', accion);

    const imp = state.importaciones.find(i => i.id === c.importacionId);
    if (imp) { imp.resueltos = (imp.resueltos || 0) + 1; }

    if (!skipSave) {
      save();
      UI.onChange();
    }
    return { eventoCreado };
  }

  function nombreCampoConflicto(c) {
    if (c.tipo === 'mp_diferencia') return `${c.hoja} · ${c.mes} · columna ${c.campo}`;
    if (c.tipo === 'equipo_nuevo') return 'Equipo nuevo en maestro';
    if (c.tipo === 'equipo_faltante') return 'Equipo no aparece en maestro';
    return c.tipo;
  }

  // ==========================================================================
  // OPERACIONES — Mantención Preventiva
  // ==========================================================================
  // Sugiere día 5 del mes seleccionado (patrón: se registran MPs del mes anterior).
  function fechaSugeridaMP(year, monthIdx) {
    return `${year}-${String(monthIdx + 1).padStart(2, '0')}-05`;
  }

  // Aviso (texto) si la fecha cae en un mes sin programación MP; null si está OK.
  // La capa de UI decide si pide confirmación (antes era un confirm()).
  function avisoMPSinProgramacion(eq, fechaISO) {
    const [yy, mm] = fechaISO.split('-').map(Number);
    const mesActual = MESES[mm - 1];
    const codigoP = (eq.prog || {})[mesActual];
    if (codigoP && ['X', 'R', 'RA', 'PM'].includes(codigoP)) return null;
    const mesesProg = MESES.filter(m => ['X', 'R', 'RA', 'PM'].includes((eq.prog || {})[m]));
    return `Este equipo NO tiene MP programada en ${mesActual} ${yy}.\n\n` +
      (mesesProg.length > 0
        ? `Meses programados (${eq.freq || 'sin frecuencia'}): ${mesesProg.join(', ')}.\n\n`
        : 'No tiene programación MP definida en la matriz.\n\n') +
      '¿Registrar igual?';
  }

  // Registra UNA Mantención Preventiva. (Núcleo de la antigua "mpRapida".)
  // d = {inv, fecha, resultado, ejecutor, obs, estadoSi, oficial='No', origen, forzarSinProg}
  function registrarMP(d) {
    const eq = findEquipo(d.inv);
    if (!eq) return { ok: false, error: 'Equipo no encontrado' };
    if (!d.fecha) return { ok: false, error: 'Fecha requerida' };
    if (!d.ejecutor) return { ok: false, error: 'Selecciona ejecutor' };
    // Guardia de programación: el llamador puede pedir el aviso y reintentar con forzarSinProg.
    if (!d.forzarSinProg) {
      const aviso = avisoMPSinProgramacion(eq, d.fecha);
      if (aviso) return { ok: false, requiereConfirmacion: true, aviso };
    }
    const ev = {
      id: state.counters.evento++,
      inv: eq.inv, equipo: eq.equipo, servicio: eq.servicio, fam: eq.fam,
      tipo: 'Mantención preventiva',
      fecha: d.fecha, fechaReg: hoyLocal(),
      resultado: d.resultado,
      ejecutor: d.ejecutor,
      estado: estadoMPFinal(d.resultado, d.estadoSi),
      obs: d.obs || null,
      oficial: d.oficial || 'No',
      anulado: false,
      creadoPor: 'Cristian',
      ts: new Date().toISOString()
    };
    if (d.origen) ev.origen = d.origen;
    state.eventos.push(ev);
    aplicarEfectosEvento(ev);
    audit('evento', ev.id, 'creado', null, 'MP rápida');
    setPref('ultimoEjecutor', d.ejecutor);
    setPref('ultimoResultadoMP', d.resultado);
    save();
    return { ok: true, evento: ev };
  }

  // Limpia MP duplicadas (más de una MP vigente del mismo equipo en el mismo mes,
  // típicas del bug anterior o de borradores importados sin consolidar): conserva
  // la "mejor" (oficial > fecha más reciente > id mayor) y ANULA el resto (con
  // reversión de efectos). Devuelve cuántas anuló.
  function consolidarMPDuplicadas() {
    const groups = {};
    state.eventos.filter(e => !e.anulado && e.tipo === 'Mantención preventiva' && e.fecha).forEach(e => {
      const d = new Date(e.fecha + 'T00:00:00'); if (isNaN(d)) return;
      const k = e.inv + '|' + d.getFullYear() + '-' + d.getMonth();
      (groups[k] = groups[k] || []).push(e);
    });
    let anulados = 0;
    Object.keys(groups).forEach(k => {
      const g = groups[k]; if (g.length < 2) return;
      g.sort((a, b) => ((b.oficial === 'Sí') - (a.oficial === 'Sí')) || (b.fecha || '').localeCompare(a.fecha || '') || (b.id - a.id));
      for (let i = 1; i < g.length; i++) { anularEvento(g[i], 'Consolidación de MP duplicada del mes'); anulados++; }
    });
    if (anulados) { state.equipos.forEach(recalcEstadoEquipo); save(); }
    return anulados;
  }

  // Corrige EN SITIO una MP ya registrada (p. ej. C6 → C3): revierte los efectos
  // del resultado/fecha anteriores, aplica los nuevos y recalcula el estado del
  // equipo. Mantiene un único evento (no duplica). d = {resultado, fecha?, ejecutor?, obs?, estadoSi?}.
  function corregirMP(ev, d) {
    if (!ev || ev.anulado) return { ok: false, error: 'Evento no editable' };
    if (ev.tipo !== 'Mantención preventiva') return { ok: false, error: 'No es una mantención preventiva' };
    const eq = findEquipo(ev.inv);
    if (!eq) return { ok: false, error: 'Equipo no encontrado' };
    if (!d.resultado) return { ok: false, error: 'Selecciona un resultado' };
    const nuevaFecha = d.fecha || ev.fecha;
    if (!nuevaFecha) return { ok: false, error: 'Fecha requerida' };

    // 1) Revertir los efectos del resultado/fecha anteriores.
    revertirEfectosMP(ev);
    // 2) Aplicar los nuevos valores al evento.
    if (d.resultado !== ev.resultado) audit('evento', ev.id, 'resultado', ev.resultado, d.resultado);
    if (nuevaFecha !== ev.fecha) audit('evento', ev.id, 'fecha', ev.fecha, nuevaFecha);
    ev.resultado = d.resultado;
    ev.fecha = nuevaFecha;
    if (d.ejecutor !== undefined && d.ejecutor !== '') ev.ejecutor = d.ejecutor;
    if (d.obs !== undefined) ev.obs = d.obs || null;
    ev.estado = estadoMPFinal(d.resultado, d.estadoSi);
    ev.ts = new Date().toISOString();
    // 3) Re-aplicar efectos (R del mes, pendientes por causal, marca R del mes siguiente) y recalcular estado.
    aplicarEfectosEvento(ev);
    recalcEstadoEquipo(eq);
    if (d.ejecutor) setPref('ultimoEjecutor', d.ejecutor);
    setPref('ultimoResultadoMP', d.resultado);
    save();
    return { ok: true, evento: ev };
  }

  // Revierte los efectos colaterales de una MP (R del mes, marca R del mes
  // siguiente por causal y pendientes automáticos derivados del evento).
  // NO toca el estado del equipo: el llamador recalcula con recalcEstadoEquipo.
  function revertirEfectosMP(ev) {
    const eq = findEquipo(ev.inv);
    if (!eq || !ev.fecha) return;
    const [y, m] = ev.fecha.split('-').map(Number);
    const mes = MESES[m - 1];
    // Pendientes automáticos creados por este evento (reprogramación / localizar): se anulan si siguen abiertos.
    state.pendientes.forEach(p => {
      if (p.eventoOrigen === ev.id && !p.anulado && p.origen === 'auto_mp_causal' && p.estado !== 'cerrado') {
        p.anulado = true; p.fechaAnulacion = new Date().toISOString(); p.motivoAnulacion = 'Corrección de la MP de origen';
        audit('pendiente', p.id, 'anulado', false, true);
      }
    });
    // Marca 'R' del mes siguiente, si la dejó un causal C1–C8 y sigue intacta.
    if (/^C[1-8]$/.test(ev.resultado || '') && m < 12) {
      const ms = MESES[m];
      if (eq.registro && eq.registro[ms] && eq.registro[ms].P === 'R') {
        delete eq.registro[ms].P;
        if (Object.keys(eq.registro[ms]).length === 0) delete eq.registro[ms];
      }
    }
    // R del mes: recomputar desde otras MP no anuladas del mismo mes (igual que en la anulación).
    if (eq.registro && eq.registro[mes]) {
      const otras = state.eventos.filter(x => x.id !== ev.id && !x.anulado && x.inv === ev.inv &&
        x.tipo === 'Mantención preventiva' && x.fecha && x.resultado &&
        x.fecha.startsWith(`${y}-${String(m).padStart(2, '0')}`)).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
      if (otras.length) eq.registro[mes].R = otras[0].resultado;
      else { delete eq.registro[mes].R; if (Object.keys(eq.registro[mes]).length === 0) delete eq.registro[mes]; }
    }
  }

  // Registro masivo de MPs. (Núcleo de la antigua "mpMasiva".)
  // d = {invs, fecha, resultado, ejecutor, obs, estadoSi, omitirDuplicados=true}
  function registrarMPMasiva(d) {
    if (!d.invs || d.invs.length === 0) return { ok: false, error: 'Sin equipos' };
    if (!d.fecha) return { ok: false, error: 'Fecha requerida' };
    if (!d.ejecutor) return { ok: false, error: 'Selecciona ejecutor' };
    const omitirDup = d.omitirDuplicados !== false;
    let creados = 0, omitidos = 0; const errores = [];
    const yy = parseInt(d.fecha.slice(0, 4));
    const mm = parseInt(d.fecha.slice(5, 7)) - 1;
    d.invs.forEach(inv => {
      const eq = findEquipo(inv);
      if (!eq) { errores.push(inv + ': no encontrado'); return; }
      if (omitirDup && state.eventos.some(e =>
        e.inv === inv && !e.anulado && e.tipo === 'Mantención preventiva' && e.fecha &&
        e.fecha.startsWith(`${yy}-${String(mm + 1).padStart(2, '0')}`))) {
        omitidos++;
        return;
      }
      const ev = {
        id: state.counters.evento++,
        inv, equipo: eq.equipo, servicio: eq.servicio, fam: eq.fam,
        tipo: 'Mantención preventiva',
        fecha: d.fecha, fechaReg: hoyLocal(),
        resultado: d.resultado,
        ejecutor: d.ejecutor,
        estado: estadoMPFinal(d.resultado, d.estadoSi),
        obs: d.obs || null,
        oficial: 'No',
        anulado: false,
        creadoPor: 'Cristian',
        origen: 'masivo',
        ts: new Date().toISOString()
      };
      state.eventos.push(ev);
      aplicarEfectosEvento(ev);
      audit('evento', ev.id, 'creado', null, 'MP masiva');
      creados++;
    });
    setPref('ultimoEjecutor', d.ejecutor);
    setPref('ultimoResultadoMP', d.resultado);
    save();
    return { ok: true, creados, omitidos, errores };
  }

  // ==========================================================================
  // OPERACIONES — Eventos (crear / oficializar / editar / anular)
  // ==========================================================================
  // Campos opcionales que un evento puede portar según su tipo.
  const CAMPOS_EXTRA_EVENTO = ['folio', 'estado', 'resultado', 'nEnvio', 'nOC', 'nCotiz',
    'empresa', 'tecnico', 'tipoVisita', 'folioGuia', 'ejecutor2', 'via', 'folioInformeTD', 'repuestos'];

  // Crea un evento de cualquier tipo. (Núcleo de la antigua "nuevoEvento".)
  // d = {inv, tipo, fecha, ejecutor, obs, oficial, mpEstadoSi, forzarSinProg, ...extra}
  function crearEvento(d) {
    if (!d.inv) return { ok: false, error: 'Selecciona un equipo' };
    const eq = findEquipo(d.inv);
    if (!eq) return { ok: false, error: 'Equipo no encontrado' };
    if (!d.fecha) return { ok: false, error: 'Fecha requerida' };
    // MP — antiduplicado: si el equipo YA tiene una MP en ese mes (p. ej. un
    // borrador importado del maestro), se ACTUALIZA ese evento en vez de crear
    // un segundo (que se marcaría "duplicada"). Conserva un único registro/mes.
    if (d.tipo === 'Mantención preventiva') {
      const dRef = new Date(d.fecha + 'T00:00:00');
      if (!isNaN(dRef)) {
        const ex = eventoMPMes(d.inv, dRef.getFullYear(), dRef.getMonth());
        if (ex) {
          const r = corregirMP(ex, { resultado: d.resultado, fecha: d.fecha, ejecutor: d.ejecutor, obs: d.obs, estadoSi: d.mpEstadoSi || 'operativo' });
          if (!r.ok) return r;
          if (d.oficial && ex.oficial !== d.oficial) { audit('evento', ex.id, 'oficial', ex.oficial, d.oficial); ex.oficial = d.oficial; }
          if (d.ejecutor2 != null) ex.ejecutor2 = d.ejecutor2 || null;
          // El registro pasa a ser propio del usuario (deja de tratarse como "importado").
          if (ex.origen === 'conciliacion_auto' || ex.origen === 'conciliacion') delete ex.origen;
          save();
          return { ok: true, evento: ex, consolidado: true };
        }
      }
    }
    // Aviso MP en mes sin programación (la UI decide si confirma y reintenta forzando)
    if (d.tipo === 'Mantención preventiva' && !d.forzarSinProg) {
      const aviso = avisoMPSinProgramacion(eq, d.fecha);
      if (aviso) return { ok: false, requiereConfirmacion: true, aviso };
    }
    const ev = {
      id: state.counters.evento++,
      inv: d.inv, equipo: eq.equipo, servicio: eq.servicio, fam: eq.fam,
      tipo: d.tipo, fecha: d.fecha, fechaReg: hoyLocal(),
      ejecutor: d.ejecutor || null,
      obs: d.obs || null,
      oficial: d.oficial || 'No',
      anulado: false,
      creadoPor: 'Cristian',
      ts: new Date().toISOString()
    };
    // Copiar los campos extra que vengan definidos
    CAMPOS_EXTRA_EVENTO.forEach(k => { if (d[k] != null && d[k] !== '') ev[k] = d[k]; });
    // ejecutor2 viene del campo "ejec2" en el formulario original
    if (d.ejecutor2 != null) ev.ejecutor2 = d.ejecutor2 || null;
    // MP: con "Si" el estado lo eligió el usuario; con causal se deriva.
    if (d.tipo === 'Mantención preventiva') ev.estado = estadoMPFinal(ev.resultado, d.mpEstadoSi || 'operativo');
    // Solicitud de trabajo: abre ciclo correctivo y deja el equipo "no operativo".
    else if (d.tipo === 'Solicitud de trabajo') ev.estado = 'no operativo';
    state.eventos.push(ev);
    aplicarEfectosEvento(ev);
    audit('evento', ev.id, 'creado', null, d.tipo);
    save();
    return { ok: true, evento: ev };
  }

  // Devuelve los documentos esperados al oficializar un evento, según su tipo.
  function docsEsperadosEvento(ev) {
    if (ev.tipo === 'Mantención preventiva') return DOCS_PREVENTIVO;
    if (['Solicitud de trabajo', 'Visita técnica', 'Orden de Compra', 'Envío a servicio técnico', 'Recepción', 'Reparación'].includes(ev.tipo)) return DOCS_CORRECTIVO;
    return [];
  }

  function oficializarEvento(ev) {
    ev.oficial = 'Sí';
    ev.ts = new Date().toISOString();
    audit('evento', ev.id, 'oficial', 'No', 'Sí');
    save();
    return { ok: true };
  }

  // Edita campos básicos de un evento. cambios = {fecha, obs, ejecutor, oficial}
  function editarEvento(ev, cambios) {
    audit('evento', ev.id, 'fecha', ev.fecha, cambios.fecha);
    ev.fecha = cambios.fecha;
    ev.obs = cambios.obs;
    ev.ejecutor = cambios.ejecutor;
    ev.oficial = cambios.oficial;
    // Campos extra informativos (N° cotización, OC, empresa, técnico, folio, etc.).
    // No se tocan 'estado'/'resultado' aquí: cambian el estado del equipo y se editan por su flujo.
    CAMPOS_EXTRA_EVENTO.forEach(k => { if (k !== 'estado' && k !== 'resultado' && (k in cambios)) ev[k] = cambios[k] || null; });
    ev.ts = new Date().toISOString();
    save();
    UI.onChange();
    return { ok: true };
  }

  // Anula un evento y REVIERTE sus efectos (motor de reversión).
  // Devuelve {ok, revertidos:[...]}. (Núcleo de "anularEventoAplicar".)
  function anularEvento(ev, motivo) {
    ev.anulado = true;
    ev.motivoAnulacion = motivo;
    ev.fechaAnulacion = new Date().toISOString();

    const eq = findEquipo(ev.inv);
    const revertidos = [];

    if (eq) {
      // 1. MP con resultado: limpiar el R del mes (o usar otra MP no anulada del mismo mes)
      if (ev.tipo === 'Mantención preventiva' && ev.fecha && ev.resultado) {
        const [y, m] = ev.fecha.split('-').map(Number);
        const mes = MESES[m - 1];
        if (eq.registro && eq.registro[mes]) {
          const otrasMP = state.eventos.filter(x =>
            x.id !== ev.id && !x.anulado && x.inv === ev.inv &&
            x.tipo === 'Mantención preventiva' && x.fecha && x.resultado &&
            x.fecha.startsWith(`${y}-${String(m).padStart(2, '0')}`)
          ).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
          if (otrasMP.length === 0) {
            delete eq.registro[mes].R;
            if (Object.keys(eq.registro[mes]).length === 0) delete eq.registro[mes];
            revertidos.push(`R de ${mes} eliminado`);
          } else {
            eq.registro[mes].R = otrasMP[0].resultado;
            revertidos.push(`R de ${mes} cambiado a ${otrasMP[0].resultado} (de otra MP)`);
          }
        }
      }
      // 2. Recalcular estado del equipo
      const estadoAntes = eq.estado;
      recalcEstadoEquipo(eq);
      if (eq.estado !== estadoAntes) revertidos.push(`estado: ${ESTADO_LABEL[estadoAntes]} → ${ESTADO_LABEL[eq.estado]}`);
    }

    // 3. Solicitud que abrió ciclo: anular ciclo si no quedan más eventos (por folio o, sin folio, por equipo+fecha).
    if (ev.tipo === 'Solicitud de trabajo') {
      const ciclo = state.ciclos.find(c => ev.folio ? c.folio === ev.folio : (c.inv === ev.inv && c.fechaApertura === ev.fecha));
      if (ciclo) {
        const correctivos = ['Visita técnica', 'Orden de Compra', 'Envío a servicio técnico', 'Recepción', 'Reparación'];
        const otros = state.eventos.filter(x => x.id !== ev.id && !x.anulado && (ev.folio ? x.folio === ev.folio : (x.inv === ev.inv && correctivos.indexOf(x.tipo) >= 0)));
        if (otros.length === 0) {
          ciclo.estado = 'anulado';
          ciclo.anulado = true;
          ciclo.fechaCierre = ev.fecha;
          revertidos.push(`ciclo ${ev.folio || '(sin folio)'} anulado`);
        }
      }
    }
    // 4. Cierre que cerró ciclo: reabrir si no hay otro cierre operativo
    if ((ev.tipo === 'Reparación' || ev.tipo === 'Recepción' || (ev.tipo === 'Visita técnica' && ev.tipoVisita === 'correctiva')) && ev.estado === 'operativo') {
      const ciclo = state.ciclos.find(c => ev.folio ? c.folio === ev.folio : (c.inv === ev.inv && c.estado === 'cerrado' && c.fechaCierre === ev.fecha));
      if (ciclo && ciclo.estado === 'cerrado') {
        const otraOp = state.eventos.find(x => x.id !== ev.id && !x.anulado && (ev.folio ? x.folio === ev.folio : x.inv === ev.inv) &&
          (x.tipo === 'Reparación' || x.tipo === 'Recepción' || (x.tipo === 'Visita técnica' && x.tipoVisita === 'correctiva')) &&
          x.estado === 'operativo');
        if (!otraOp) {
          ciclo.estado = 'abierto';
          ciclo.fechaCierre = null;
          revertidos.push(`ciclo ${ev.folio || '(sin folio)'} reabierto`);
        }
      }
    }
    // 5. MP con causal C1-C8: anular pendientes auto generados
    if (ev.tipo === 'Mantención preventiva' && ev.resultado && /^C[1-8]$/.test(ev.resultado)) {
      const pendsAuto = state.pendientes.filter(p => p.eventoOrigen === ev.id && !p.anulado && p.estado !== 'cerrado');
      pendsAuto.forEach(p => {
        p.anulado = true;
        p.motivoAnulacion = 'Evento MP origen anulado';
      });
      if (pendsAuto.length > 0) revertidos.push(`${pendsAuto.length} pendiente(s) automático(s) anulado(s)`);
    }

    audit('evento', ev.id, 'anulado', false, true);
    save();
    return { ok: true, revertidos };
  }

  // ==========================================================================
  // OPERACIONES — Pendientes / tareas / seguimientos / baja
  // ==========================================================================
  // Crea un pendiente manual. (Núcleo de "nuevoPendiente".)
  // d = {inv, tipo, desc, ejecutor, fechaComp, proxRecord, eventoOrigen}
  function crearPendiente(d) {
    const inv = (d.inv || '').trim();
    if (!inv || !findEquipo(inv)) return { ok: false, error: 'Equipo inválido' };
    if (!d.desc || !d.desc.trim()) return { ok: false, error: 'Descripción requerida' };
    const eq = findEquipo(inv);
    const p = {
      id: state.counters.pend++,
      inv, equipo: eq.equipo, servicio: eq.servicio,
      tipo: d.tipo, desc: d.desc.trim(),
      ejecutor: d.ejecutor || null,
      fechaCrea: hoyLocal(),
      fechaComp: d.fechaComp || null, proxRecord: d.proxRecord || null,
      fechaCierre: null, estado: 'no_iniciado', origen: 'manual',
      eventoOrigen: d.eventoOrigen != null ? d.eventoOrigen : null,
      seguimientos: [], tareas: [], anulado: false
    };
    state.pendientes.push(p);
    audit('pendiente', p.id, 'creado_manual', null, d.tipo);
    save();
    return { ok: true, pendiente: p };
  }

  // Registra una GESTIÓN de seguimiento sobre un equipo (típicamente caído): deja constancia
  // de a quién se contactó y el estado reportado, y fija el PRÓXIMO RECORDATORIO para que el
  // equipo vuelva a aparecer y no quede sin seguimiento. Reutiliza un pendiente abierto del
  // equipo o crea uno de tipo 'seguimiento'. Devuelve {ok, pendiente}.
  function registrarGestionEquipo(d) {
    const eq = findEquipo(d.inv);
    if (!eq) return { ok: false, error: 'Equipo no encontrado' };
    let p = state.pendientes.find(x => x.inv === d.inv && !x.anulado && x.estado !== 'cerrado');
    if (!p) {
      const r = crearPendiente({ inv: d.inv, tipo: 'seguimiento', desc: 'Seguimiento de estado del equipo', ejecutor: d.contacto || encargadoDe(eq) || null });
      if (!r.ok) return r;
      p = r.pendiente;
    }
    const partes = [];
    if (d.contacto) partes.push('Contacto: ' + d.contacto);
    if (d.estadoReportado) partes.push('Estado reportado: ' + d.estadoReportado);
    if (d.texto && d.texto.trim()) partes.push(d.texto.trim());
    agregarSeguimiento(p, partes.join(' · ') || 'Gestión registrada');
    if (p.estado === 'no_iniciado') p.estado = 'en_proceso';
    if (d.proxRecord) p.proxRecord = d.proxRecord;
    audit('pendiente', p.id, 'gestion', null, partes.join(' · '));
    save();
    UI.onChange();
    return { ok: true, pendiente: p };
  }

  // ---- Contactos del servicio (referencia organizacional) ------------------
  function getContactos() { return state.contactos || (state.contactos = contactosPorDefecto()); }
  // Contactos vinculados a un servicio: los de ese servicio + los generales (sin servicio).
  function contactosDeServicio(servicio) {
    const s = (servicio || '').trim().toLowerCase();
    return getContactos().filter(c => { const cs = (c.servicio || '').trim().toLowerCase(); return cs === '' || cs === s; });
  }
  function agregarContacto(c) {
    c = c || {};
    state.contactos = state.contactos || [];
    if (state.counters.contacto == null) state.counters.contacto = state.contactos.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
    const nuevo = { id: state.counters.contacto++, servicio: c.servicio || '', nombre: c.nombre || '', apellido: c.apellido || '', anexo: c.anexo || '', correo: c.correo || '', cargo: c.cargo || '' };
    state.contactos.push(nuevo);
    audit('contacto', nuevo.id, 'creado', null, [nuevo.servicio, nuevo.cargo].filter(Boolean).join(' · '));
    save();
    return { ok: true, contacto: nuevo };
  }
  function actualizarContacto(id, campos) {
    const c = (state.contactos || []).find(x => x.id === id);
    if (!c) return { ok: false, error: 'Contacto no encontrado' };
    ['servicio', 'nombre', 'apellido', 'anexo', 'correo', 'cargo'].forEach(k => {
      if (campos && (k in campos)) { const v = campos[k] == null ? '' : String(campos[k]); if (c[k] !== v) { audit('contacto', c.id, k, c[k], v); c[k] = v; } }
    });
    save();
    return { ok: true, contacto: c };
  }
  function eliminarContacto(id) {
    const i = (state.contactos || []).findIndex(x => x.id === id);
    if (i < 0) return { ok: false, error: 'Contacto no encontrado' };
    const c = state.contactos.splice(i, 1)[0];
    audit('contacto', id, 'eliminado', c ? c.cargo : '', null);
    save();
    return { ok: true };
  }

  // ---- Registro de actividad (todos los clics) -----------------------------
  // Bitácora de uso de la app. Se guarda localmente con debounce y viaja al
  // Sheet junto con el próximo guardado real (no genera una sincronización por
  // cada clic). Anillo acotado para no inflar el almacenamiento.
  const ACTIVIDAD_MAX = 1500;
  let _actTimer = null;
  function getActividad() { return state.actividad || (state.actividad = []); }
  // Une dos registros de actividad (telemetría append-only) sin duplicar, ordenado y acotado.
  function mergeActividad(a, b) {
    const seen = new Set(), res = [];
    (a || []).concat(b || []).forEach(e => {
      if (!e || !e.ts) return;
      const k = e.ts + '|' + (e.sesion || '') + '|' + (e.accion || '');
      if (seen.has(k)) return; seen.add(k); res.push(e);
    });
    res.sort((x, y) => (x.ts || '').localeCompare(y.ts || ''));
    if (res.length > ACTIVIDAD_MAX) res.splice(0, res.length - ACTIVIDAD_MAX);
    return res;
  }
  function logActividad(accion, extra) {
    if (!state || !accion) return;
    state.actividad = state.actividad || [];
    extra = extra || {};
    const ent = { ts: new Date().toISOString(), sesion: extra.sesion || '', vista: extra.vista || '', cat: extra.cat || 'acción', accion: String(accion).replace(/\s+/g, ' ').trim().slice(0, 140) };
    if (extra.inv) ent.inv = extra.inv;
    ent.usuario = extra.usuario || 'Cristian';
    if (!ent.accion) return;
    state.actividad.push(ent);
    if (state.actividad.length > ACTIVIDAD_MAX) state.actividad.splice(0, state.actividad.length - ACTIVIDAD_MAX);
    clearTimeout(_actTimer);
    _actTimer = setTimeout(function () { try { persistirState(); } catch (e) {} }, 1200);
  }

  // Actualiza campos editables de un pendiente. (Núcleo del "Guardar" de abrirPendiente.)
  // cambios = {tipo, estado, ejecutor, desc, fechaComp, proxRecord}
  function actualizarPendiente(p, cambios) {
    p.tipo = cambios.tipo;
    p.estado = cambios.estado;
    p.ejecutor = cambios.ejecutor || null;
    p.desc = cambios.desc;
    p.fechaComp = cambios.fechaComp || null;
    p.proxRecord = cambios.proxRecord || null;
    if (p.estado === 'cerrado' && !p.fechaCierre) p.fechaCierre = hoyLocal();
    save();
    UI.onChange();
    return { ok: true };
  }

  function anularPendiente(p) {
    p.anulado = true;
    save();
    return { ok: true };
  }

  // Agrega una tarea atómica a un pendiente.
  function agregarTareaPendiente(p, desc) {
    if (!desc || !desc.trim()) return { ok: false, error: 'Descripción vacía' };
    const t = { id: state.counters.tarea++, pendId: p.id, inv: p.inv, equipo: p.equipo, desc: desc.trim(), estado: 'abierto' };
    state.tareas.push(t);
    p.tareas = (p.tareas || []).concat(t.id);
    save();
    return { ok: true, tarea: t };
  }

  // Marca/desmarca una tarea. Devuelve {todasCerradas} para que la UI sugiera cerrar el pendiente.
  function toggleTarea(t, cerrada) {
    const antes = t.estado;
    t.estado = cerrada ? 'cerrado' : 'abierto';
    if (cerrada) t.fechaCierre = hoyLocal();
    audit('tarea', t.id, 'estado', antes, t.estado);
    save();
    const hermanas = state.tareas.filter(x => x.pendId === t.pendId);
    const todasCerradas = hermanas.length > 0 && hermanas.every(x => x.estado === 'cerrado');
    return { ok: true, todasCerradas };
  }

  function agregarSeguimiento(p, texto) {
    if (!texto || !texto.trim()) return { ok: false, error: 'Texto vacío' };
    p.seguimientos = p.seguimientos || [];
    p.seguimientos.push({ autor: 'Cristian', fecha: hoyLocal(), texto: texto.trim() });
    save();
    return { ok: true };
  }

  // Cierra un pendiente con comentario opcional. (Núcleo de "cerrarPendiente".)
  function cerrarPendiente(p, comentario) {
    const txt = comentario != null ? comentario : UI.prompt('Comentario de cierre (opcional):');
    p.estado = 'cerrado';
    p.fechaCierre = hoyLocal();
    if (txt) {
      p.seguimientos = p.seguimientos || [];
      p.seguimientos.push({ autor: 'Cristian', fecha: p.fechaCierre, texto: 'Cierre: ' + txt });
    }
    audit('pendiente', p.id, 'estado', 'abierto', 'cerrado');
    save();
    UI.onChange();
    return { ok: true };
  }

  // Cierre manual de un ciclo con justificación obligatoria.
  function cerrarCicloManual(c, motivo) {
    motivo = motivo != null ? motivo : UI.prompt('Justificación del cierre manual:');
    if (!motivo) return { ok: false, error: 'Justificación requerida' };
    cerrarCiclo(c.folio, hoyLocal(), motivo);
    save();
    UI.onChange();
    return { ok: true };
  }

  // Da de baja un equipo (evento informativo + marca registro + cierra pendientes).
  function darDeBaja(eq, motivo) {
    motivo = motivo != null ? motivo : UI.prompt('Motivo de la baja:');
    if (!motivo) return { ok: false, error: 'Motivo requerido' };
    const fecha = hoyLocal();
    const ev = {
      id: state.counters.evento++, inv: eq.inv, equipo: eq.equipo, servicio: eq.servicio,
      tipo: 'Mantención preventiva', fecha, fechaReg: fecha, resultado: 'Baja',
      ejecutor: 'Cristián Beltrán Oviedo', estado: 'baja', obs: 'Baja: ' + motivo,
      oficial: 'Sí', anulado: false, ts: new Date().toISOString()
    };
    state.eventos.push(ev);
    // Marcar en registro del mes actual y limpiar meses posteriores
    const mes = NUM_MES[new Date().getMonth()];
    eq.registro = eq.registro || {};
    eq.registro[mes] = { R: 'Baja' };
    for (let i = new Date().getMonth() + 1; i < 12; i++) {
      if (eq.registro[NUM_MES[i]]) delete eq.registro[NUM_MES[i]];
    }
    const old = eq.estado;
    eq.estado = 'baja'; eq.estadoDesde = fecha;
    audit('equipo', eq.inv, 'estado', old, 'baja');
    // Cerrar pendientes del equipo
    state.pendientes.filter(p => p.inv === eq.inv && p.estado !== 'cerrado').forEach(p => {
      p.estado = 'cerrado'; p.fechaCierre = fecha;
      p.seguimientos = p.seguimientos || [];
      p.seguimientos.push({ autor: 'Cristian', fecha, texto: 'Cerrado automáticamente: equipo dado de baja' });
    });
    save();
    UI.onChange();
    return { ok: true, evento: ev };
  }

  // ==========================================================================
  // EXPORT / IMPORT (datos puros, sin IO de navegador)
  // ==========================================================================
  // Devuelve el backup como string JSON. La descarga (Blob/anchor) es de la UI.
  function exportarBackupJSON() {
    return JSON.stringify(state, null, 2);
  }

  // Reemplaza el state con un backup ya parseado. (Núcleo de "importData".)
  function importarBackup(data) {
    if (!data || !data.__v) return { ok: false, error: 'Archivo no válido (falta __v).' };
    const prevAct = (state && state.actividad) ? state.actividad.slice() : [];
    state = migrate(data);
    // La actividad es telemetría append-only: conservar la local + la importada (no se pierde al sincronizar).
    state.actividad = mergeActividad(prevAct, state.actividad);
    normalizarEquipos();
    reconstruirCiclos();
    normalizarTiposEvento();
    normalizarEstadoEventos();
    asignarIdsEquipos();
    state.__userActions = state.__userActions || 0;
    save();
    UI.onChange();
    return { ok: true, eventos: state.eventos.length };
  }

  // Detecta {idx, year} de mes a partir del nombre de archivo (Ene/Enero, etc.) o null.
  function mesDelNombreArchivo(nombre) {
    const norm = (nombre || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const meses = [
      ['ene', 'enero'], ['feb', 'febrero'], ['mar', 'marzo'], ['abr', 'abril'],
      ['may', 'mayo'], ['jun', 'junio'], ['jul', 'julio'], ['ago', 'agosto'],
      ['sep', 'septiembre', 'set', 'sept'], ['oct', 'octubre'], ['nov', 'noviembre'], ['dic', 'diciembre']
    ];
    let foundIdx = null;
    for (let i = 0; i < meses.length; i++) {
      for (const alias of meses[i]) {
        const re = new RegExp(`(^|[_\\s\\-\\.])${alias}([_\\s\\-\\.]|$)`, 'i');
        if (re.test(norm)) { foundIdx = i; break; }
      }
      if (foundIdx != null) break;
    }
    if (foundIdx == null) return null;
    const yearMatch = norm.match(/(20\d{2})/);
    return { idx: foundIdx, year: yearMatch ? parseInt(yearMatch[1]) : null };
  }

  // Construye los datos de la "Plantilla de Asignación MP" de un mes. Devuelve
  // {header, rows, equipos}. La generación del .xlsx/descarga es de la UI/IO.
  function construirAsignacionMP(year, monthIdx) {
    const mes = NUM_MES[monthIdx];
    const keyMes = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
    const asignaciones = (state.asignacionesMP || {})[keyMes] || {};
    // Equipos programados en el mes (excluye baja y los con FS/Baja/NU en meses previos)
    const equipos = state.equipos.filter(eq => {
      if (eq.estado === 'baja') return false;
      if (!mpProgramadaEnMes(eq, mes)) return false;
      const prevR = Object.entries(eq.registro || {}).some(([m, obj]) => {
        const idx = MES_NUM[m];
        return idx < monthIdx && ['FS', 'Baja', 'NU'].includes(obj.R);
      });
      if (prevR) return false;
      return true;
    });
    const header = ['N° Carpeta', 'N° Inventario', 'Equipo', 'Servicio', 'Unidad', 'Ubicación', 'Marca', 'Modelo', 'Serie', 'Año', 'Frecuencia MP', 'Programado en mes', 'Responsable'];
    const rows = equipos.map(eq => [
      eq.carpeta || '', eq.inv || '', eq.equipo || '', eq.servicio || '', eq.unidad || '',
      eq.ubic || '', eq.marca || '', eq.modelo || '', eq.serie || '', eq.ano || '',
      eq.freq || '', (eq.prog || {})[mes] || '', asignaciones[eq.inv] || ''
    ]);
    return { header, rows, equipos, mes, year, conAsignacion: equipos.filter(eq => asignaciones[eq.inv]).length };
  }

  // Procesa filas (matriz AoA, fila 0 = encabezados) de una plantilla de asignación
  // y carga los responsables en state.asignacionesMP. (Núcleo de "subirPlantillaMP".)
  function procesarPlantillaMP(rows, year, monthIdx) {
    if (!rows || rows.length < 2) return { ok: false, error: 'La plantilla no tiene datos.' };
    const header = rows[0];
    const invIdx = header.findIndex(c => /N° Inventario/i.test(String(c || '')));
    const respIdx = header.findIndex(c => /Responsable/i.test(String(c || '')));
    if (invIdx < 0 || respIdx < 0) {
      return { ok: false, error: 'La plantilla debe tener columnas "N° Inventario" y "Responsable".' };
    }
    const keyMes = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
    state.asignacionesMP = state.asignacionesMP || {};
    state.asignacionesMP[keyMes] = state.asignacionesMP[keyMes] || {};
    const ejecutoresSet = new Set(EJECUTORES);

    let cargadas = 0, sobrescritas = 0;
    const ignoradas = { invNoExiste: [], respInvalido: [], sinResp: 0 };

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const inv = (row[invIdx] != null ? String(row[invIdx]).trim() : '');
      const resp = (row[respIdx] != null ? String(row[respIdx]).trim() : '');
      if (!inv) continue;
      if (!resp) { ignoradas.sinResp++; continue; }
      if (!findEquipo(inv)) { ignoradas.invNoExiste.push(inv); continue; }
      if (!ejecutoresSet.has(resp)) { ignoradas.respInvalido.push(`${inv}: ${resp}`); continue; }
      const prev = state.asignacionesMP[keyMes][inv];
      state.asignacionesMP[keyMes][inv] = resp;
      if (prev && prev !== resp) sobrescritas++;
      cargadas++;
    }
    save();
    return { ok: true, cargadas, sobrescritas, ignoradas, mes: NUM_MES[monthIdx], year };
  }

  // Mapea un evento a fila plana (para exportes a Excel/CSV).
  function mapearEventoFila(e) {
    return {
      'ID': e.id, 'Fecha del evento': fmtFecha(e.fecha), 'Fecha registro': fmtFecha(e.fechaReg),
      'N° Inv.': e.inv, 'Equipo': e.equipo || '', 'Servicio': e.servicio || '',
      'Tipo': e.tipo, 'Resultado': e.resultado || '', 'Estado equipo': e.estado || '',
      'Ejecutor': e.ejecutor || '', 'N° Informe / Folio': e.folio || '',
      'N° Envío': e.nEnvio || '', 'N° OC': e.nOC || '', 'N° Cotización': e.nCotiz || '',
      'Empresa': e.empresa || '', 'Técnico': e.tecnico || '',
      'Observación': e.obs || '', 'Oficial': e.oficial || 'No', 'Creado por': e.creadoPor || ''
    };
  }
  // Clasifica un evento como automático de conciliación (va a hoja oculta en el Excel).
  function eventoEsAuto(e) { return e.origen === 'conciliacion_auto' || e.origen === 'conciliacion'; }

  // ==========================================================================
  // ARRANQUE (capa de datos, sin DOM ni navegación)
  // ==========================================================================
  // Carga o inicializa el state, reconstruye ciclos desde los eventos seed,
  // cierra los que correspondan, recalcula estados y normaliza. Devuelve el state.
  // Reconstruye los ciclos correctivos desde los eventos (solicitud abre ciclo;
  // reparación/recepción/visita correctiva "operativo" lo cierran). Solo actúa si
  // NO hay ciclos — caso típico de un backup importado. Idempotente.
  function reconstruirCiclos() {
    if (!state.ciclos) state.ciclos = [];
    if (state.ciclos.length > 0) return 0;
    if (state.counters.ciclo == null) state.counters.ciclo = 1;
    let n = 0;
    state.eventos.forEach(ev => {
      if (ev.tipo !== 'Solicitud de trabajo' || ev.anulado) return;
      const existe = ev.folio
        ? state.ciclos.find(c => c.folio === ev.folio)
        : state.ciclos.find(c => c.inv === ev.inv && c.fechaApertura === ev.fecha);
      if (existe) return;
      state.ciclos.push({ folio: ev.folio || null, inv: ev.inv, fechaApertura: ev.fecha, fechaCierre: null, estado: 'abierto', descripcionInicial: ev.obs || '', ingenieroAsignado: ev.ejecutor || null, id: state.counters.ciclo++ });
      n++;
    });
    state.eventos.forEach(ev => {
      if ((ev.tipo === 'Reparación' || ev.tipo === 'Recepción' || (ev.tipo === 'Visita técnica' && ev.tipoVisita === 'correctiva')) && ev.estado === 'operativo' && !ev.anulado) {
        const c = state.ciclos.find(x => x.estado === 'abierto' && (ev.folio ? x.folio === ev.folio : x.inv === ev.inv));
        if (c) { c.estado = 'cerrado'; c.fechaCierre = ev.fecha; }
      }
    });
    return n;
  }

  // Normaliza etiquetas de tipo de evento de versiones previas (p. ej.
  // "Envío a Serv. Técnico" → "Envío a servicio técnico"). Idempotente.
  function normalizarTiposEvento() {
    const canon = TIPOS_EVENTO.map(t => t.label);
    const key = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/serv\./g, 'servicio').replace(/\s+/g, ' ').trim();
    const byKey = {}; canon.forEach(c => byKey[key(c)] = c);
    let n = 0;
    state.eventos.forEach(ev => {
      if (!ev.tipo || canon.indexOf(ev.tipo) >= 0) return;
      const c = byKey[key(ev.tipo)];
      if (c && c !== ev.tipo) { audit('evento', ev.id, 'tipo', ev.tipo, c); ev.tipo = c; n++; }
    });
    return n;
  }
  // Corrige el campo `estado` de eventos cuyo estado es DETERMINISTA por reglas de la app
  // (no lo elige el usuario) pero quedó guardado distinto (dato heredado de importaciones
  // antiguas). Casos deterministas:
  //   · MP con causal C2/C3/FS/NU/Baja → estado según MP_CAUSAL_ESTADO
  //   · Solicitud de trabajo           → 'no operativo'        (abre ciclo correctivo)
  //   · Envío a servicio técnico       → 'en servicio técnico' (equipo sale del hospital)
  // NO se tocan: MP 'Si' (admite override manual a no operativo), MP C1/C4–C8 (reprogramación
  // sin cambio de estado), ni Visita/Recepción/Reparación/OC (estado lo elige el usuario).
  // Recalcula el estado de los equipos afectados (en correctivos el estado del equipo deriva
  // del estado del evento). Idempotente.
  function normalizarEstadoEventos() {
    let n = 0; const tocados = new Set();
    state.eventos.forEach(ev => {
      if (ev.anulado) return;
      let esperado = null;
      if (ev.tipo === 'Mantención preventiva' && MP_CAUSAL_ESTADO[ev.resultado]) esperado = estadoMPDesdeResultado(ev.resultado);
      else if (ev.tipo === 'Solicitud de trabajo') esperado = 'no operativo';
      else if (ev.tipo === 'Envío a servicio técnico') esperado = 'en servicio técnico';
      if (esperado && ev.estado !== esperado) { audit('evento', ev.id, 'estado', ev.estado, esperado + ' (normalización determinista)'); ev.estado = esperado; n++; tocados.add(ev.inv); }
    });
    tocados.forEach(inv => { const eq = findEquipo(inv); if (eq) recalcEstadoEquipo(eq); });
    return n;
  }
  // Devuelve un Set con los IDs de eventos MP DUPLICADOS (el 2º+ del mismo equipo y mes).
  function idsMPDuplicadas() {
    const seen = {}, dup = new Set();
    state.eventos.filter(e => !e.anulado && e.tipo === 'Mantención preventiva' && e.fecha)
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.id - b.id))
      .forEach(e => { const k = e.inv + '|' + e.fecha.slice(0, 7); if (seen[k]) dup.add(e.id); else seen[k] = e.id; });
    return dup;
  }
  // Oficializa en bloque todos los eventos en borrador (no anulados). Devuelve cuántos.
  function oficializarTodosBorradores() {
    let n = 0;
    state.eventos.forEach(ev => { if (!ev.anulado && ev.oficial !== 'Sí') { ev.oficial = 'Sí'; ev.ts = new Date().toISOString(); audit('evento', ev.id, 'oficial', 'No', 'Sí (oficialización masiva)'); n++; } });
    return n;
  }

  // Asigna un ID correlativo PERSISTENTE a cada equipo (clave surrogada estable para el
  // export relacional). Una vez asignado no cambia; los equipos nuevos toman el siguiente.
  function asignarIdsEquipos() {
    if (state.counters.equipo == null) {
      const maxId = (state.equipos || []).reduce((m, e) => Math.max(m, typeof e.id === 'number' ? e.id : 0), 0);
      state.counters.equipo = maxId + 1;
    }
    let n = 0;
    (state.equipos || []).forEach(e => { if (typeof e.id !== 'number') { e.id = state.counters.equipo++; n++; } });
    return n;
  }
  function bootstrapDatos() {
    state = load();
    if (state) {
      let cambios = limpiarEfectosAnulados();
      cambios += reconstruirCiclos();          // reconstruye ciclos si el backup no los trae
      cambios += normalizarTiposEvento();      // normaliza etiquetas antiguas de tipo
      cambios += normalizarEstadoEventos();    // corrige estado determinista (MP causal, Solicitud, Envío)
      cambios += asignarIdsEquipos();          // ID_EQUIPO correlativo persistente
      if (cambios > 0) {
        save({ internal: true });
        UI.notify(`Migración: ${cambios} ajuste${cambios > 1 ? 's' : ''} de consistencia aplicado${cambios > 1 ? 's' : ''}.`, 'success');
      }
    }
    if (!state) {
      state = init();
      reconstruirCiclos();
      asignarIdsEquipos();
      state.equipos.forEach(recalcEstadoEquipo);
      save({ internal: true });
    }
    normalizarEquipos();
    return state;
  }

  // ==========================================================================
  // API PÚBLICA
  // ==========================================================================
  const HHHA = {
    // configuración / inyección
    configure, setSeed, getState, setState,
    // catálogos / constantes
    APP_VERSION, STORAGE_KEY, MESES, MES_NUM, NUM_MES, MES_ESPANOL, EJECUTORES,
    TIPOS_EVENTO, CAUSALES, ESTADOS_PRIMARIOS, ESTADO_LABEL, SUBESTADOS_NOOP,
    SUBESTADOS_ST, DOCS_CORRECTIVO, DOCS_PREVENTIVO, TIPO_PENDIENTE, ESTADO_PEND_LABEL,
    MOTIVOS_ANULACION, MP_CAUSAL_ESTADO, RESULTADOS_MP, CARGOS_CONTACTO,
    // contactos del servicio
    getContactos, contactosDeServicio, agregarContacto, actualizarContacto, eliminarContacto,
    // registro de actividad (clics)
    logActividad, getActividad,
    // estado / persistencia
    load, migrate, save, init, resetState, persistirState, stateEsFresh,
    normalizarEquipos, normalizarEstadoPend, limpiarEfectosAnulados, reconstruirCiclos, normalizarTiposEvento, normalizarEstadoEventos, asignarIdsEquipos, idsMPDuplicadas, oficializarTodosBorradores, bootstrapDatos,
    // utilidades
    fmtFecha, hoyLocal, addDias, diasEntreFechas, getPref, setPref, valNorm, audit,
    // dominio (consultas)
    findEquipo, eventosDe, eventosDeTodos, pendientesDe, conflictosDe, ciclosDe,
    ciclosAbiertosDe, encargadoDe, asignarEncargado, sinProgramacionMP, agregarNotaEquipo, notasDe, ultimaGestion,
    // dominio (motor de estados)
    estadoMPDesdeResultado, estadoMPFinal, etiquetaTipoEvento, estadoDesdeMatriz,
    recalcEstadoEquipo, diasEnEstado, resultadoMPMes, eventoMPMes, mpEstadoMes,
    mpDelMesEjecutada, mpProgramadaEnMes, claseMPMes,
    // dominio (ciclos / pendientes auto / efectos)
    abrirCiclo, cerrarCiclo, crearPendienteAuto, aplicarEfectosEvento, cambiarEstadoPend,
    // conciliación
    conflictoPendiente, celdaTieneConflicto, parsearMaestro, parsearHojaPMP,
    parsearHojaRegistro, compararMaestro, registrarOActualizarConflicto,
    resolverConflicto, nombreCampoConflicto,
    // operaciones MP
    fechaSugeridaMP, avisoMPSinProgramacion, registrarMP, corregirMP, consolidarMPDuplicadas, registrarMPMasiva,
    // operaciones eventos
    crearEvento, docsEsperadosEvento, oficializarEvento, editarEvento, anularEvento,
    // operaciones pendientes / baja
    crearPendiente, registrarGestionEquipo, actualizarPendiente, anularPendiente, agregarTareaPendiente,
    toggleTarea, agregarSeguimiento, cerrarPendiente, cerrarCicloManual, darDeBaja,
    // export / import
    exportarBackupJSON, importarBackup, mesDelNombreArchivo, construirAsignacionMP,
    procesarPlantillaMP, mapearEventoFila, eventoEsAuto
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = HHHA;
  if (global) global.HHHA = HHHA;

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
