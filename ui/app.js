/* ============================================================================
 * SIGEM · Capa de vistas NUEVA (densa "pro"). Sólo presentación: toda la
 * lógica vive en HHHA (hhha-core.js). Inicio = cola de trabajo accionable.
 * ==========================================================================*/
(function () {
  'use strict';
  const H = window.HHHA;
  if (!H) { document.body.innerHTML = '<p style="padding:20px">Falta hhha-core.js</p>'; return; }

  // ----------------------------- mini DOM -----------------------------------
  function h(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
      else if (k === 'dataset') Object.assign(n.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) { if (c == null || c === false) continue; n.appendChild(c.nodeType ? c : document.createTextNode(String(c))); }
    return n;
  }
  const $ = (s, e = document) => e.querySelector(s);
  const clear = n => { while (n.firstChild) n.removeChild(n.firstChild); return n; };
  const mount = (n, ...k) => { clear(n); k.flat().forEach(c => c != null && c !== false && n.appendChild(c.nodeType ? c : document.createTextNode(String(c)))); return n; };

  // ----------------------------- icons (inline svg) -------------------------
  const ic = {
    check: 'M20 6L9 17l-5-5',
    inicio: 'M3 11h18M5 11V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v6m-6 0v3a2 2 0 0 1-4 0v-3',
    equipos: 'M4 5h16v12H4zM2 21h20M9 9h6',
    tablero: 'M4 5h4v14h-4z M10 5h4v9h-4z M16 5h4v12h-4z',
    density: 'M4 5h16v5H4z M4 14h16v5H4z',
    pendientes: 'M9 11l3 3 8-8M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0',
    ciclos: 'M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5',
    eventos: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    asignaciones: 'M7 3v4M17 3v4M3 9h18M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
    conciliacion: 'M18 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 24a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 18V9a3 3 0 0 1 3-3h6',
    cumplimiento: 'M3 3v18h18M7 16l4-5 3 3 5-7',
    audit: 'M3 5h13M3 10h13M3 15h7M19 13l2 2-4 4-2-1 1-3z',
    config: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    cloud: 'M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 1 0 6 18.5h11.5z',
    search: 'M21 21l-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
    plus: 'M12 5v14M5 12h14', sun: 'M12 3v2M12 19v2M5 5l1.4 1.4M17.6 17.6L19 19M3 12h2M19 12h2M5 19l1.4-1.4M17.6 6.4L19 5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z', menu: 'M3 6h18M3 12h18M3 18h18',
    dl: 'M12 3v12m0 0l4-4m-4 4l-4-4M4 21h16', up: 'M12 21V9m0 0l4 4m-4-4l-4 4M4 3h16',
    x: 'M6 6l12 12M18 6L6 18', chev: 'M9 6l6 6-6 6', dots: 'M12 5h.01M12 12h.01M12 19h.01',
    funnel: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z'
  };
  function svg(d, w) { return h('span', { class: 'ico', html: `<svg width="${w || 17}" height="${w || 17}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d.split('M').filter(Boolean).map(p => `<path d="M${p}"/>`).join('')}</svg>` }); }

  // ----------------------------- catálogos / helpers ------------------------
  const { MESES, EJECUTORES, TIPOS_EVENTO, CAUSALES, ESTADO_LABEL, TIPO_PENDIENTE, ESTADO_PEND_LABEL, MOTIVOS_ANULACION } = H;
  const fmtFecha = H.fmtFecha;
  const NOW = new Date(); const YEAR = NOW.getFullYear(); const MONTH = NOW.getMonth();
  const APP_VERSION = '2026-06-02 · v2.0';   // sello de build visible (barra superior y Configuración) para confirmar despliegue
  const ESTADO_CLS = { operativo: 'op', no_operativo: 'noop', en_servicio_tecnico: 'st', baja: 'baja', desconocido: 'desc' };

  function estadoPill(estado) {
    return h('span', { class: 'pill ' + (ESTADO_CLS[estado] || 'desc') }, h('span', { class: 'dot' }), ESTADO_LABEL[estado] || estado);
  }
  function pendPill(estado) {
    const c = estado === 'cerrado' ? 'op' : estado === 'en_proceso' ? 'st' : 'noop';
    return h('span', { class: 'pill ' + c }, ESTADO_PEND_LABEL[estado] || estado);
  }
  function mpResultClass(r) {
    if (!r) return '';
    if (r === 'Si') return 'ok';
    if (/^C[1-8]$/.test(r)) return 're';
    if (r === 'Baja') return 'bad';
    return 'bad';
  }
  function norm(s) { return (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  // ----------------------------- toast --------------------------------------
  const toastRoot = h('div', { class: 'toast-root' }); document.body.appendChild(toastRoot);
  function toast(msg, type, action) {
    const t = h('div', { class: 'toast ' + (type || '') },
      h('span', {}, msg),
      action ? h('span', { class: 't-act', onclick: () => { (action.run || action.fn) && (action.run || action.fn)(); t.remove(); } }, action.label) : null
    );
    toastRoot.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, action ? 7000 : 3600);
  }

  // ----------------------------- drawer -------------------------------------
  const scrim = h('div', { class: 'scrim', onclick: () => closeDrawer() }); document.body.appendChild(scrim);
  const drawer = h('aside', { class: 'drawer' }); document.body.appendChild(drawer);
  let drawerOpen = false;
  function openDrawer(opts) {
    mount(drawer,
      h('div', { class: 'd-hd' }, h('h2', {}, opts.title), h('button', { class: 'btn icon ghost', onclick: () => closeDrawer() }, svg(ic.x, 16))),
      h('div', { class: 'd-bd' }, opts.body),
      opts.footer ? h('div', { class: 'd-ft' }, opts.footer) : null
    );
    drawer.classList.toggle('wide', !!opts.wide);
    requestAnimationFrame(() => { drawer.classList.add('on'); scrim.classList.add('on'); });
    drawerOpen = true;
    if (opts.focus) setTimeout(() => { const f = drawer.querySelector(opts.focus); f && f.focus(); }, 90);
  }
  function closeDrawer() { drawer.classList.remove('on'); scrim.classList.remove('on'); drawerOpen = false; }

  function field(label, ctrl) { return h('div', { class: 'field' }, label ? h('label', {}, label) : null, ctrl); }
  function selectEl(options, value, attrs) {
    return h('select', attrs || {}, ...options.map(o => {
      const val = Array.isArray(o) ? o[0] : o, lbl = Array.isArray(o) ? o[1] : o;
      return h('option', { value: val, selected: String(val) === String(value) ? true : false }, lbl);
    }));
  }
  // Acota el ancho real de una celda envolviendo el contenido en un <div> con max-width
  // (el max-width en <td> no es fiable en tablas auto). Evita el scroll horizontal.
  function capCell(maxW, ...kids) { return h('div', { style: { maxWidth: maxW + 'px', whiteSpace: 'normal', overflowWrap: 'anywhere' } }, ...kids.filter(Boolean)); }

  // ----------------------------- engine UI/env wiring -----------------------
  H.configure({
    ui: {
      notify: (m, t, a) => toast(m, t, a),
      confirm: (m) => window.confirm(m),
      prompt: (m) => window.prompt(m),
      onChange: () => { scheduleRefresh(); scheduleCloudPush(); }
    },
    env: { xlsx: window.XLSX || null }
  });
  let refreshT = null;
  function scheduleRefresh() { clearTimeout(refreshT); refreshT = setTimeout(() => { renderView(); refreshChrome(); }, 30); }

  // ============================ ROUTER ======================================
  const NAV = [
    { id: 'inicio', label: 'Hoy', icon: 'inicio' },
    { id: 'equipos', label: 'Equipos', icon: 'equipos' },
    { id: 'tablero', label: 'Tablero', icon: 'tablero' },
    { id: 'pendientes', label: 'Pendientes', icon: 'pendientes' },
    { id: 'eventos', label: 'Eventos', icon: 'eventos' },
    { id: 'cumplimiento', label: 'Cumplimiento', icon: 'cumplimiento' }
  ];
  let view = 'inicio', params = {};
  let kbList = null; // {rows, open, idx} para navegación j/k
  let suppressHash = false; // ignora el hashchange que dispara el propio go() (preserva params en memoria)
  function go(v, p) {
    view = v; params = p || {}; kbList = null;
    const newHash = '#' + v + (p && p.inv ? '/' + encodeURIComponent(p.inv) : '');
    if (location.hash !== newHash) { suppressHash = true; location.hash = newHash; }
    renderView(); syncNav(); window.scrollTo && $('#view') && ($('#view').scrollTop = 0);
  }
  function fromHash() {
    const m = (location.hash || '').replace(/^#/, '').split('/');
    const v = m[0] || 'inicio';
    // Cualquier vista registrada es navegable por hash, esté o no en el menú
    // (p. ej. equipo, ciclos, asignaciones, configuración).
    if (VIEWS[v]) { view = v; params = m[1] ? { inv: decodeURIComponent(m[1]) } : {}; }
  }

  // ============================ VIEWS =======================================
  const VIEWS = {};

  // ---- INICIO: cola de trabajo --------------------------------------------
  VIEWS.inicio = function () {
    const S = H.getState();
    const noop = S.equipos.filter(e => e.estado === 'no_operativo');
    const st = S.equipos.filter(e => e.estado === 'en_servicio_tecnico');
    const alerta30 = S.equipos.filter(e => ['no_operativo', 'en_servicio_tecnico'].includes(e.estado) && H.diasEnEstado(e) > 30);
    const pendAct = S.pendientes.filter(p => !p.anulado && p.estado !== 'cerrado');
    const vencidos = pendAct.filter(p => p.fechaComp && p.fechaComp < H.hoyLocal());
    const conf = (S.conflictos || []).filter(c => c.estado === 'pendiente' || c.estado === 'pospuesto');
    const ciclosAb = S.ciclos.filter(c => c.estado === 'abierto');
    const borradores = S.eventos.filter(e => e.oficial !== 'Sí' && !e.anulado);
    const pendSinAsig = pendAct.filter(p => !p.ejecutor).length;

    // MP del mes (programadas / ejecutadas / pendientes) + atrasadas de meses previos
    const mpProg = S.equipos.filter(e => e.estado !== 'baja' && H.mpProgramadaEnMes(e, MESES[MONTH]));
    const mpEjec = mpProg.filter(e => H.mpDelMesEjecutada(e, YEAR, MONTH));
    const mpPend = mpProg.filter(e => H.mpEstadoMes(e, YEAR, MONTH) === 'pendiente');
    const pct = mpProg.length ? Math.round(mpEjec.length / mpProg.length * 100) : 0;
    const mpAtras = S.equipos.filter(e => e.estado !== 'baja' && [...Array(MONTH).keys()].some(m => H.mpProgramadaEnMes(e, MESES[m]) && H.mpEstadoMes(e, YEAR, m) === 'pendiente'));
    const sinProgMP = S.equipos.filter(e => H.sinProgramacionMP(e));
    const reprogPend = pendAct.filter(p => p.tipo === 'reprogramacion');
    const recordHoy = pendAct.filter(p => p.proxRecord && p.proxRecord <= H.hoyLocal());

    const alert = (cls, n, label, onclick, sub) => h('div', { class: 'alert-card ' + cls, onclick },
      h('div', { class: 'a-n' }, n), h('div', {}, h('div', { class: 'a-l' }, label), sub ? h('div', { class: 'a-l faint', style: { marginTop: '1px' } }, sub) : null));

    const root = h('div', { class: 'dash' });
    root.appendChild(h('div', { class: 'alert-strip' },
      alert('hi', noop.length, 'No operativos', () => go('equipos', { estado: 'no_operativo' }), 'fuera de servicio'),
      alert('med', st.length, 'En servicio técnico', () => go('equipos', { estado: 'en_servicio_tecnico' }), 'fuera del hospital'),
      alert('hi', alerta30.length, 'Alertas >30 días', () => go('equipos', { alerta30: 1 }), 'sin avance +30d'),
      alert(vencidos.length ? 'hi' : 'med', pendAct.length, 'Pendientes', () => go('pendientes'), vencidos.length + ' vencidos · ' + pendSinAsig + ' sin asignar'),
      alert(pct >= 100 ? 'lo' : pct >= 50 ? 'med' : 'hi', pct + '%', 'MP del mes', () => go('asignaciones'), mpEjec.length + '/' + mpProg.length + ' ejecutadas'),
      alert('hi', mpAtras.length, 'MP atrasadas', () => go('equipos', { mpAtras: 1 }), 'meses previos'),
      alert('lo', ciclosAb.length, 'Ciclos abiertos', () => go('ciclos', { estado: 'abierto' }), 'correctivos en curso'),
      alert(ciclosAb.filter(cicloEstancado).length ? 'hi' : 'lo', ciclosAb.filter(cicloEstancado).length, 'Correctivos estancados', () => go('tablero', { board: 'correctivos' }), 'mucho tiempo en una etapa'),
      alert(reprogPend.length ? 'med' : 'lo', reprogPend.length, 'Reprogramaciones', () => go('pendientes', { tipo: 'reprogramacion' }), 'MP por reprogramar'),
      alert(recordHoy.length ? 'med' : 'lo', recordHoy.length, 'Recordatorios hoy', () => go('pendientes', { record: 1 }), 'seguimientos para hoy'),
      alert('lo', sinProgMP.length, 'Sin programación MP', () => go('equipos', { sinProg: 1 }), 'equipos sin MP anual'),
      alert('lo', borradores.length, 'Borradores', () => go('eventos', { oficial: 'No' }), 'sin oficializar'),
      alert('lo', conf.length, 'Conflictos', () => go('configuracion'), 'con el maestro')
    ));

    // ===== MI DÍA · pendientes priorizados para resolver hoy =====
    const hoy = H.hoyLocal();
    const fechaLarga = d => { try { return new Date(d + 'T00:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { return d; } };
    const prio = p => {
      const venc = p.fechaComp && p.fechaComp < hoy;
      const dOver = venc ? H.diasEntreFechas(p.fechaComp, hoy) : 0;
      const venceHoy = p.fechaComp === hoy;
      const record = p.proxRecord && p.proxRecord <= hoy;
      const dHasta = p.fechaComp && p.fechaComp > hoy ? H.diasEntreFechas(hoy, p.fechaComp) : null;
      if (venc) return { score: 2000 + dOver, razon: `Vencido ${dOver}d`, cls: 'hi' };
      if (venceHoy) return { score: 1900, razon: 'Vence hoy', cls: 'hi' };
      if (record) return { score: 1800, razon: 'Recordatorio hoy', cls: 'med' };
      if (p.estado === 'en_proceso') return { score: 1000, razon: 'En proceso', cls: 'med' };
      if (dHasta != null && dHasta <= 7) return { score: 800 - dHasta, razon: `Vence en ${dHasta}d`, cls: 'med' };
      return { score: p.ejecutor ? 200 : 150, razon: p.ejecutor ? 'Por iniciar' : 'Sin asignar', cls: '' };
    };
    const miDia = pendAct.map(p => ({ p, ...prio(p) })).sort((a, b) => b.score - a.score);
    const urgentes = miDia.filter(x => x.cls === 'hi').length;
    const miDiaCard = ({ p, razon, cls }) => {
      const nxt = p.estado === 'no_iniciado' ? ['en_proceso', 'Iniciar'] : ['cerrado', 'Resolver'];
      return h('div', { class: 'wl-item ' + (cls === 'hi' ? 'sev-hi' : cls === 'med' ? 'sev-med' : ''), onclick: () => formPendiente(p) },
        h('div', { class: 'wl-acc' }),
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', { style: { display: 'flex', gap: '7px', alignItems: 'center', flexWrap: 'wrap' } },
            h('span', { class: 'pill ' + (cls === 'hi' ? 'noop' : cls === 'med' ? 'st' : 'baja') }, razon),
            h('span', { class: 'mono', style: { fontSize: '11.5px' } }, p.inv),
            h('b', { style: { fontSize: '12px' } }, TIPO_PENDIENTE[p.tipo] || p.tipo)),
          h('div', { class: 'm-txt', style: { fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' } }, (p.desc || '').slice(0, 90) || '—'),
          h('div', { class: 'faint', style: { fontSize: '11px', marginTop: '2px' } }, [p.equipo, p.ejecutor || 'sin asignar'].filter(Boolean).join(' · '))),
        h('button', { class: 'btn sm', title: 'Avanzar este pendiente', onclick: ev => { ev.stopPropagation(); H.cambiarEstadoPend(p, nxt[0]); toast('Pendiente: ' + nxt[1].toLowerCase() + 'do', 'success'); } }, nxt[1]));
    };
    root.appendChild(h('div', { class: 'section' },
      h('div', { class: 's-hd' },
        h('h3', {}, 'Mi día'),
        h('span', { class: 's-sub', style: { textTransform: 'capitalize' } }, fechaLarga(hoy)),
        urgentes ? h('span', { class: 'pill noop' }, `${urgentes} urgente${urgentes > 1 ? 's' : ''}`) : h('span', { class: 'pill op' }, 'al día'),
        h('div', { class: 'tb-spacer' }),
        h('button', { class: 'btn sm', onclick: () => go('pendientes') }, 'Ver todos'),
        h('button', { class: 'btn sm', onclick: () => go('tablero', { board: 'pendientes' }) }, 'Tablero'),
        h('button', { class: 'btn sm primary', onclick: () => formNuevoPendiente({}) }, svg(ic.plus, 14), 'Nuevo')),
      h('div', { class: 's-bd' }, miDia.length
        ? h('div', { class: 'lane' }, ...miDia.slice(0, 12).map(miDiaCard))
        : h('div', { class: 'empty' }, 'Sin pendientes activos — ¡día libre! 🎉')),
      miDia.length > 12 ? h('div', { class: 's-bd', style: { paddingTop: 0 } }, h('span', { class: 'link', onclick: () => go('pendientes') }, `Ver los ${miDia.length - 12} pendientes restantes →`)) : null));

    // MP del mes — barra de cumplimiento
    const mpSec = h('div', { class: 'section' },
      h('div', { class: 's-hd' },
        h('h3', {}, `MP de ${MES_ESP(MONTH)} ${YEAR}`),
        h('span', { class: 'pill ' + (pct >= 100 ? 'op' : pct >= 50 ? 'st' : 'noop') }, pct + '% cumplido'),
        h('div', { class: 'tb-spacer' })
      ),
      h('div', { class: 's-bd' },
        h('div', { class: 'progress' }, h('i', { style: { width: pct + '%', background: pct >= 100 ? 'var(--op)' : pct >= 50 ? 'var(--st)' : 'var(--noop)' } })),
        h('div', { class: 'btn-row', style: { marginTop: '8px', fontSize: '11.5px', color: 'var(--muted)' } },
          h('span', {}, '✔ ' + mpEjec.length + ' ejecutadas'), h('span', {}, '◷ ' + mpPend.length + ' pendientes'), h('span', {}, '⚑ ' + mpAtras.length + ' atrasadas'))
      ),
      h('div', { class: 's-bd flush' }, mpPend.length ? mpMesTable(mpPend.slice(0, 12)) : h('div', { class: 'empty' }, '✓ Todas las MP del mes registradas'))
    );
    root.appendChild(mpSec);

    // Equipos caídos (no operativos / en servicio técnico): días en estado + última gestión.
    const caidos = S.equipos.filter(e => e.estado === 'no_operativo' || e.estado === 'en_servicio_tecnico')
      .map(e => { const g = H.ultimaGestion(e.inv); return { e, dias: H.diasEnEstado(e), g, sinG: g ? H.diasEntreFechas(g.fecha, H.hoyLocal()) : null }; });
    const rojo = v => v != null && v > 30 ? { color: 'var(--noop)', fontWeight: '600' } : null;
    const sgVal = x => x.sinG == null ? Infinity : x.sinG;   // sin gestión = el más abandonado (arriba)
    let ordenCaidos = 'estado';   // 'estado' = días en estado · 'gestion' = días sin gestión
    const caidosWrap = h('div', { class: 'tbl-wrap' });
    function renderCaidos() {
      const list = caidos.slice().sort(ordenCaidos === 'gestion' ? (a, b) => sgVal(b) - sgVal(a) : (a, b) => b.dias - a.dias);
      mount(caidosWrap, h('table', { class: 'dense' },
        h('thead', {}, h('tr', {},
          h('th', {}, 'N° Inv.'), h('th', {}, 'Equipo'), h('th', {}, 'Servicio'), h('th', {}, 'Estado'),
          h('th', { class: 'num' }, 'Días en estado'), h('th', {}, 'Última gestión'), h('th', { class: 'num' }, 'Días s/gestión'), h('th', {}, 'Detalle'), h('th', { class: 'shrink' }, ''))),
        h('tbody', {}, ...list.map(({ e, dias, g, sinG }) => h('tr', { style: { cursor: 'pointer' }, onclick: () => go('equipo', { inv: e.inv }) },
          h('td', { class: 'mono' }, e.inv), h('td', {}, e.equipo || '—'), h('td', { class: 'muted' }, e.servicio || '—'),
          h('td', {}, estadoPill(e.estado)),
          h('td', { class: 'num', style: rojo(dias) }, dias),
          h('td', {}, g ? fmtFecha(g.fecha) : h('span', { class: 'faint' }, 'sin gestión')),
          h('td', { class: 'num', style: rojo(sinG) }, sinG == null ? '—' : sinG),
          h('td', { class: 'muted', title: g ? g.texto : '' }, g ? g.texto : '—'),
          h('td', {}, h('button', { class: 'btn sm', title: 'Registrar gestión y recordatorio', onclick: ev => { ev.stopPropagation(); formRegistrarGestion(e); } }, 'Gestión')))))));
    }
    const segCaidos = h('div', { class: 'seg', title: 'Ordenar la tabla' }, ...[['estado', 'Días en estado'], ['gestion', 'Días sin gestión']].map(([v, l]) =>
      h('button', { class: ordenCaidos === v ? 'on' : '', onclick: e => { ordenCaidos = v; [...segCaidos.children].forEach(b => b.classList.remove('on')); e.target.classList.add('on'); renderCaidos(); } }, l)));
    if (caidos.length) renderCaidos();
    const expCaidos = h('button', { class: 'btn sm', title: 'Exportar a Excel', onclick: () => { const list = caidos.slice().sort(ordenCaidos === 'gestion' ? (a, b) => sgVal(b) - sgVal(a) : (a, b) => b.dias - a.dias); exportTablaExcel('Equipos caídos', 'Equipos caídos (no operativos y en servicio técnico) · ' + H.hoyLocal(), ['N° Inv.', 'Equipo', 'Servicio', 'Estado', 'Días en estado', 'Última gestión', 'Días s/gestión', 'Detalle gestión', 'Encargado'], list.map(({ e, dias, g, sinG }) => [e.inv, e.equipo || '', e.servicio || '', ESTADO_LABEL[e.estado] || e.estado, dias, g ? fmtFecha(g.fecha) : '', sinG == null ? '' : sinG, g ? g.texto : 'sin gestión', H.encargadoDe(e) || '']), `HHHA_equipos_caidos_${H.hoyLocal()}.xlsx`); } }, svg(ic.dl, 14), 'Exportar');
    root.appendChild(h('div', { class: 'section' },
      h('div', { class: 's-hd' }, h('h3', {}, 'Equipos caídos'),
        h('span', { class: 's-sub' }, `${noop.length} no operativos · ${st.length} en servicio técnico`),
        h('div', { class: 'tb-spacer' }),
        caidos.length ? segCaidos : null,
        caidos.length ? expCaidos : null,
        caidos.length ? h('button', { class: 'btn sm', onclick: () => go('equipos', { alerta30: 1 }) }, 'Ver +30 días') : null),
      h('div', { class: 's-bd flush' }, caidos.length ? caidosWrap : h('div', { class: 'empty' }, '✓ Sin equipos caídos'))));

    return root;
  };

  // ---- TABLERO (Kanban con 3 modos: por estado · pendientes · correctivos) -
  const TB_COLOR = { operativo: 'var(--op)', no_operativo: 'var(--noop)', en_servicio_tecnico: 'var(--st)', baja: 'var(--baja)' };
  // Filtros del Tablero que sobreviven al re-render (p. ej. tras guardar desde un drop).
  const tbEstadoF = { q: '', servicio: '', orden: 'dias', verOp: true };
  const tbPendF = { q: '' };
  // Tarjeta arrastrable genérica. inner=nodos hijos · dragId=id para el drop · onClick · color de borde.
  function kbCard(inner, dragId, onClick, borderColor) {
    const c = h('div', { class: 'kb-card', draggable: 'true', style: borderColor ? { borderLeftColor: borderColor } : null }, ...inner.filter(Boolean));
    c.addEventListener('dragstart', ev => { ev.dataTransfer.setData('text/plain', String(dragId)); ev.dataTransfer.effectAllowed = 'move'; c.classList.add('dragging'); });
    c.addEventListener('dragend', () => c.classList.remove('dragging'));
    if (onClick) c.addEventListener('click', onClick);
    return c;
  }
  // Columna con cabecera (punto+label+conteo), lista de tarjetas y zona de drop.
  function kbCol(label, color, count, cards, onDrop, extra) {
    const col = h('div', { class: 'kb-col' },
      h('div', { class: 'kb-hd' }, h('span', { class: 'dot', style: { background: color } }), label, h('span', { class: 'cnt' }, count)),
      h('div', { class: 'kb-list' }, ...(cards.length ? cards : [h('div', { class: 'kb-empty' }, 'Sin tarjetas')]), extra || null));
    if (onDrop) {
      col.addEventListener('dragover', ev => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; col.classList.add('drop-ok'); });
      col.addEventListener('dragleave', ev => { if (!col.contains(ev.relatedTarget)) col.classList.remove('drop-ok'); });
      col.addEventListener('drop', ev => { ev.preventDefault(); col.classList.remove('drop-ok'); onDrop(ev.dataTransfer.getData('text/plain')); });
    }
    return col;
  }

  VIEWS.tablero = function () {
    let modo = params.board || 'estado';
    const content = h('div', {});
    const paint = () => mount(content, modo === 'pendientes' ? boardPendientes() : modo === 'correctivos' ? boardCorrectivos() : boardEstado());
    const seg = h('div', { class: 'seg' }, ...[['estado', 'Por estado'], ['pendientes', 'Pendientes'], ['correctivos', 'Correctivos']].map(([v, l]) =>
      h('button', { class: modo === v ? 'on' : '', onclick: e => { if (modo === v) return; modo = params.board = v; [...seg.children].forEach(b => b.classList.remove('on')); e.target.classList.add('on'); paint(); } }, l)));
    paint();
    return h('div', {}, h('div', { class: 'filterbar', style: { paddingBottom: '4px' } }, h('span', { class: 'faint', style: { fontSize: '11px', fontWeight: '700', letterSpacing: '.3px' } }, 'TABLERO'), seg), content);
  };

  // Board 1 · Equipos por estado (arrastrar abre el evento que produce ese estado).
  function boardEstado() {
    const S = H.getState();
    const F = tbEstadoF;   // estado persistente (búsqueda, servicio, orden, ver operativos)
    const COLS = [
      { estado: 'no_operativo', label: 'No operativo', tipo: 'Solicitud de trabajo' },
      { estado: 'en_servicio_tecnico', label: 'En servicio técnico', tipo: 'Envío a servicio técnico' },
      { estado: 'operativo', label: 'Operativo', tipo: 'Reparación' }
    ];
    const CAP = 80;
    const servicios = [...new Set(S.equipos.map(e => e.servicio).filter(Boolean))].sort();
    const board = h('div', { class: 'kb-board' });
    const gf = e => { const g = H.ultimaGestion(e.inv); return g ? g.fecha : ''; };
    const match = e => (!F.servicio || e.servicio === F.servicio) && (!F.q || (e.inv || '').toLowerCase().includes(F.q) || (e.equipo || '').toLowerCase().includes(F.q) || (e.servicio || '').toLowerCase().includes(F.q));
    const card = e => kbCard([
      h('div', { class: 'kb-inv' }, e.inv),
      h('div', { class: 'kb-eq' }, e.equipo || '—'),
      h('div', { class: 'kb-meta' }, h('span', {}, e.servicio || '—'),
        e.estado !== 'operativo' ? h('span', {}, h('b', {}, H.diasEnEstado(e)), ' d') : null,
        H.encargadoDe(e) ? h('span', {}, H.encargadoDe(e)) : null)
    ], e.inv, () => go('equipo', { inv: e.inv }), TB_COLOR[e.estado]);
    // Drop: abre el evento que lleva a ese estado. A "Operativo" sin ciclo abierto → Visita
    // técnica operativa (más fiel que una "Reparación" sin reparación de por medio).
    const onDrop = col => inv => {
      const eq = H.findEquipo(inv);
      if (!eq || eq.estado === col.estado) return;
      if (col.estado === 'operativo' && H.ciclosAbiertosDe(inv).length === 0) formNuevoEvento({ inv, tipo: 'Visita técnica', estado: 'operativo', tipoVisita: 'correctiva' });
      else formNuevoEvento({ inv, tipo: col.tipo });
    };
    function render() {
      board.innerHTML = '';
      COLS.forEach(col => {
        if (col.estado === 'operativo' && !F.verOp) return;
        const list = S.equipos.filter(e => e.estado === col.estado && match(e));
        list.sort(col.estado !== 'operativo' && F.orden === 'gestion' ? (a, b) => gf(a).localeCompare(gf(b))
          : col.estado === 'operativo' ? (a, b) => (a.inv || '').localeCompare(b.inv || '') : (a, b) => H.diasEnEstado(b) - H.diasEnEstado(a));
        const total = list.length;
        const cards = list.slice(0, CAP).map(card);
        const more = total > CAP ? h('div', { class: 'kb-more' }, `+${total - CAP} más · filtra para acotar`) : null;
        board.appendChild(kbCol(col.label, TB_COLOR[col.estado], total, cards, onDrop(col), more));
      });
    }
    render();
    return h('div', {},
      h('div', { class: 'filterbar' },
        h('input', { type: 'search', value: F.q, placeholder: 'Buscar inv, equipo, servicio…', oninput: e => { F.q = e.target.value.toLowerCase(); render(); } }),
        selectEl([['', 'Todos los servicios'], ...servicios.map(s => [s, s])], F.servicio, { onchange: e => { F.servicio = e.target.value; render(); } }),
        selectEl([['dias', 'Orden: días en estado'], ['gestion', 'Orden: más abandonado']], F.orden, { onchange: e => { F.orden = e.target.value; render(); } }),
        h('label', { class: 'checkbox' }, h('input', { type: 'checkbox', checked: F.verOp ? true : false, onchange: e => { F.verOp = e.target.checked; render(); } }), 'Ver operativos'),
        h('div', { class: 'tb-spacer' }),
        h('span', { class: 'faint', style: { fontSize: '11px' } }, 'Arrastra a otra columna para registrar el cambio')),
      board);
  }

  // Board 2 · Pendientes por estado (arrastrar cambia el estado directo).
  function boardPendientes() {
    const S = H.getState();
    const F = tbPendF;
    const COLS = [['no_iniciado', 'No iniciado', 'var(--noop)'], ['en_proceso', 'En proceso', 'var(--st)'], ['cerrado', 'Resuelto', 'var(--op)']];
    const board = h('div', { class: 'kb-board' });
    const match = p => !F.q || (p.inv || '').toLowerCase().includes(F.q) || (p.equipo || '').toLowerCase().includes(F.q) || (p.desc || '').toLowerCase().includes(F.q) || (p.ejecutor || '').toLowerCase().includes(F.q);
    const card = p => {
      const venc = p.fechaComp && p.estado !== 'cerrado' && p.fechaComp < H.hoyLocal();
      return kbCard([
        h('div', { class: 'kb-inv' }, p.inv + ' · ' + (TIPO_PENDIENTE[p.tipo] || p.tipo)),
        p.desc ? h('div', { class: 'kb-eq' }, p.desc.slice(0, 70)) : null,
        h('div', { class: 'kb-meta', style: venc ? { color: 'var(--noop)' } : null },
          p.ejecutor ? h('span', {}, p.ejecutor) : h('span', { class: 'faint' }, 'sin asignar'),
          p.fechaComp ? h('span', {}, (venc ? '⚠ ' : '') + fmtFecha(p.fechaComp)) : null)
      ], p.id, () => formPendiente(p), venc ? 'var(--noop)' : (COLS.find(c => c[0] === p.estado) || [, , 'var(--border-2)'])[2]);
    };
    function render() {
      board.innerHTML = '';
      COLS.forEach(([est, label, color]) => {
        const list = S.pendientes.filter(p => !p.anulado && p.estado === est && match(p)).sort((a, b) => (a.fechaComp || '9999').localeCompare(b.fechaComp || '9999'));
        board.appendChild(kbCol(label, color, list.length, list.map(card), id => {
          const p = S.pendientes.find(x => String(x.id) === String(id));
          if (p && p.estado !== est) { H.cambiarEstadoPend(p, est); toast(`Pendiente → ${label}`, 'success'); }
        }));
      });
    }
    render();
    return h('div', {},
      h('div', { class: 'filterbar' },
        h('input', { type: 'search', value: F.q, placeholder: 'Buscar inv, responsable, descripción…', oninput: e => { F.q = e.target.value.toLowerCase(); render(); } }),
        h('div', { class: 'tb-spacer' }),
        h('button', { class: 'btn sm primary', onclick: () => formNuevoPendiente({}) }, svg(ic.plus, 14), 'Nuevo'),
        h('span', { class: 'faint', style: { fontSize: '11px' } }, 'Arrastra para cambiar el estado del pendiente')),
      board);
  }

  // Board 3 · Correctivos por etapa (cada tarjeta = ciclo abierto; arrastrar abre el evento de esa etapa).
  // --- Pipeline correctivo: fases, umbrales de estancamiento y siguiente paso ---
  const FASES_CORR = [['Solicitud de trabajo', 'Solicitud'], ['Visita técnica', 'Visita'], ['Orden de Compra', 'O. Compra'], ['Envío a servicio técnico', 'Envío'], ['Recepción', 'Recepción'], ['Reparación', 'Reparación']];
  const FASE_UMBRAL = { 'Solicitud de trabajo': 3, 'Visita técnica': 5, 'Orden de Compra': 10, 'Envío a servicio técnico': 15, 'Recepción': 3, 'Reparación': 5 };
  const FASE_SIGUIENTE = { 'Solicitud de trabajo': 'Visita técnica', 'Visita técnica': 'Orden de Compra', 'Orden de Compra': 'Envío a servicio técnico', 'Envío a servicio técnico': 'Recepción', 'Recepción': 'Reparación', 'Reparación': null };
  function faseDeCiclo(c) {
    const evs = H.getState().eventos.filter(e => !e.anulado && FASE_UMBRAL[e.tipo] !== undefined && (c.folio ? e.folio === c.folio : e.inv === c.inv));
    if (!evs.length) return { tipo: 'Solicitud de trabajo', fecha: c.fechaApertura };
    evs.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.id - b.id));
    const last = evs[evs.length - 1];
    return { tipo: last.tipo, fecha: last.fecha || c.fechaApertura };
  }
  function diasEtapaCiclo(c) { return H.diasEntreFechas(faseDeCiclo(c).fecha, H.hoyLocal()); }
  function cicloEstancado(c) { return diasEtapaCiclo(c) > (FASE_UMBRAL[faseDeCiclo(c).tipo] || 7); }

  function boardCorrectivos() {
    const S = H.getState();
    const board = h('div', { class: 'kb-board' });
    const abiertos = S.ciclos.filter(c => c.estado === 'abierto');
    const card = c => {
      const eq = H.findEquipo(c.inv) || {};
      const f = faseDeCiclo(c), dEtapa = H.diasEntreFechas(f.fecha, H.hoyLocal()), est = dEtapa > (FASE_UMBRAL[f.tipo] || 7);
      const sig = FASE_SIGUIENTE[f.tipo];
      return kbCard([
        h('div', { class: 'kb-inv' }, (est ? '⚠ ' : '') + (c.folio || ('#' + c.id))),
        h('div', { class: 'kb-eq' }, c.inv + ' · ' + (eq.equipo || '—')),
        h('div', { class: 'kb-meta' }, h('span', {}, eq.servicio || '—'),
          h('span', {}, h('b', {}, H.diasEntreFechas(c.fechaApertura, H.hoyLocal())), ' d abierto')),
        h('div', { class: 'kb-meta' },
          h('span', { style: est ? { color: 'var(--noop)', fontWeight: '650' } : null }, h('b', {}, dEtapa), ' d en esta etapa' + (est ? ' · estancado' : '')),
          c.ingenieroAsignado ? h('span', {}, c.ingenieroAsignado) : null),
        sig
          ? h('button', { class: 'btn sm', style: { marginTop: '5px' }, title: 'Registrar el siguiente evento del ciclo', onclick: ev => { ev.stopPropagation(); formNuevoEvento({ inv: c.inv, tipo: sig }); } }, '→ ' + sig)
          : h('button', { class: 'btn sm', style: { marginTop: '5px' }, title: 'Cerrar el ciclo (equipo operativo)', onclick: ev => { ev.stopPropagation(); formNuevoEvento({ inv: c.inv, tipo: 'Reparación', estado: 'operativo' }); } }, '✓ Cerrar (operativo)')
      ], c.folio || ('#' + c.id), () => go('equipo', { inv: c.inv, tab: 'ciclos' }), est ? 'var(--noop)' : 'var(--st)');
    };
    function render() {
      board.innerHTML = '';
      const byFase = {}; FASES_CORR.forEach(f => byFase[f[0]] = []);
      abiertos.forEach(c => { const t = faseDeCiclo(c).tipo; (byFase[t] || byFase['Solicitud de trabajo']).push(c); });
      FASES_CORR.forEach(([tipo, label]) => {
        const list = byFase[tipo].sort((a, b) => diasEtapaCiclo(b) - diasEtapaCiclo(a));   // más estancado arriba
        board.appendChild(kbCol(label, 'var(--st)', list.length, list.map(card), id => {
          const c = abiertos.find(x => (x.folio || ('#' + x.id)) === id);
          if (c) formNuevoEvento({ inv: c.inv, tipo });
        }));
      });
    }
    render();
    const nEst = abiertos.filter(cicloEstancado).length;
    return h('div', {},
      h('div', { class: 'filterbar' },
        h('span', { class: 'faint', style: { fontSize: '11px' } }, `${abiertos.length} ciclo(s) abierto(s)`),
        nEst ? h('span', { class: 'pill noop', title: 'Demasiado tiempo en una etapa' }, `${nEst} estancado${nEst > 1 ? 's' : ''}`) : h('span', { class: 'pill op' }, 'al día'),
        h('div', { class: 'tb-spacer' }),
        h('span', { class: 'faint', style: { fontSize: '11px' } }, '"→" registra el siguiente paso · arrastra para mover de etapa')),
      board);
  }
  function mpMesTable(list) {
    return h('div', { class: 'tbl-wrap' }, h('table', { class: 'dense' },
      h('thead', {}, h('tr', {}, h('th', {}, 'N° Inv.'), h('th', {}, 'Equipo'), h('th', {}, 'Servicio'), h('th', {}, 'Estado'), h('th', {}, 'Freq'), h('th', {}, 'Encargado'), h('th', { class: 'shrink' }, ''))),
      h('tbody', {}, ...list.map(e => h('tr', {},
        h('td', { class: 'mono', onclick: () => go('equipo', { inv: e.inv }) }, e.inv),
        h('td', { onclick: () => go('equipo', { inv: e.inv }) }, e.equipo || '—'),
        h('td', { class: 'muted' }, e.servicio || '—'),
        h('td', {}, estadoPill(e.estado)),
        h('td', { class: 'muted' }, e.freq || '—'),
        h('td', { class: 'muted' }, H.encargadoDe(e) || '—'),
        h('td', {}, h('button', { class: 'btn sm', onclick: (ev) => { ev.stopPropagation(); formMP(e.inv); } }, 'MP'))
      )))));
  }

  // ---- EQUIPOS ------------------------------------------------------------
  VIEWS.equipos = function () {
    const S = H.getState();
    let f = { q: params.q || '', estado: params.estado || 'todos', servicio: params.servicio || '', fam: params.fam || '', sinEnc: false, sinProg: !!params.sinProg };
    let sortKey = 'inv', sortDir = 1;
    const cf = colFilters(render);
    const mpMesLabel = e => { if (e.estado === 'baja') return '—'; const st = H.mpEstadoMes(e, YEAR, MONTH); if (st === 'ejecutada') return 'Hecha'; if (st === 'reprogramada') return 'Reprog.'; if (st === 'otro') return 'Falla'; return H.mpProgramadaEnMes(e, MESES[MONTH]) ? 'Pendiente' : 'No prog.'; };
    const eqSel = new Set();
    const servicios = [...new Set(S.equipos.map(e => e.servicio).filter(Boolean))].sort();
    const familias = [...new Set(S.equipos.map(e => e.fam).filter(Boolean))].sort();

    const tblWrap = h('div', { class: 'tbl-wrap' });
    const countNote = h('span', { class: 'count-note' });
    const bulkBar = h('div', { class: 'filterbar', style: { display: 'none', background: 'var(--accent-bg)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' } });
    function updBulk() {
      const n = eqSel.size; bulkBar.style.display = n ? '' : 'none'; if (!n) return;
      mount(bulkBar,
        h('b', {}, `${n} equipo${n !== 1 ? 's' : ''}`),
        selectEl([['', 'Asignar encargado…'], ...EJECUTORES.map(x => [x, x]), ['__none', '— quitar encargado —']], '', { onchange: e => { const v = e.target.value; if (!v) return; const val = v === '__none' ? null : v; [...eqSel].forEach(inv => { const eq = H.findEquipo(inv); if (eq) H.asignarEncargado(eq, val); }); H.save(); toast(`Encargado actualizado · ${n}`, 'success'); eqSel.clear(); render(); } }),
        h('button', { class: 'btn sm', onclick: () => exportarEquipos(data().filter(e => eqSel.has(e.inv))) }, svg(ic.dl, 14), 'Exportar selección'),
        h('div', { class: 'tb-spacer' }),
        h('button', { class: 'btn sm ghost', onclick: () => { eqSel.clear(); render(); } }, 'Limpiar'));
    }

    function data() {
      let list = S.equipos.slice();
      if (f.estado !== 'todos') list = list.filter(e => e.estado === f.estado);
      if (f.servicio) list = list.filter(e => e.servicio === f.servicio);
      if (f.fam) list = list.filter(e => e.fam === f.fam);
      if (f.sinEnc) list = list.filter(e => e.estado !== 'baja' && !H.encargadoDe(e));
      if (f.sinProg) list = list.filter(e => H.sinProgramacionMP(e));
      if (params.alerta30) list = list.filter(e => ['no_operativo', 'en_servicio_tecnico'].includes(e.estado) && H.diasEnEstado(e) > 30);
      if (params.mpAtras) list = list.filter(e => e.estado !== 'baja' && [...Array(MONTH).keys()].some(m => H.mpProgramadaEnMes(e, MESES[m]) && H.mpEstadoMes(e, YEAR, m) === 'pendiente'));
      if (f.q) { const q = norm(f.q); list = list.filter(e => norm(`${e.inv} ${e.equipo} ${e.serie} ${e.marca} ${e.modelo} ${e.servicio}`).includes(q)); }
      list = cf.apply(list);
      list.sort((a, b) => {
        let va, vb;
        if (sortKey === 'mp') { va = H.mpEstadoMes(a, YEAR, MONTH); vb = H.mpEstadoMes(b, YEAR, MONTH); }
        else if (sortKey === 'pend') { va = H.pendientesDe(a.inv).filter(p => p.estado !== 'cerrado').length; vb = H.pendientesDe(b.inv).filter(p => p.estado !== 'cerrado').length; }
        else { va = (a[sortKey] || ''); vb = (b[sortKey] || ''); }
        return (typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es', { numeric: true })) * sortDir;
      });
      return list;
    }
    function render() {
      const list = data();
      countNote.textContent = `${list.length} equipo${list.length !== 1 ? 's' : ''}`;
      const th = (key, lbl, cls, getter) => h('th', { class: (cls || '') + ' sortable', onclick: () => { if (sortKey === key) sortDir *= -1; else { sortKey = key; sortDir = 1; } render(); } },
        h('span', { class: 'th-lbl' }, lbl), sortKey === key ? h('span', { class: 'arr' }, sortDir > 0 ? '↑' : '↓') : null, getter ? cf.btn(key, lbl, getter) : null);
      const allChk = h('input', { type: 'checkbox', onchange: e => { if (e.target.checked) list.forEach(x => eqSel.add(x.inv)); else eqSel.clear(); render(); } });
      mount(tblWrap, h('table', { class: 'dense' },
        h('thead', {}, h('tr', {},
          h('th', { class: 'shrink' }, allChk),
          th('inv', 'N° Inv.', '', e => e.inv), th('equipo', 'Equipo', '', e => e.equipo), th('servicio', 'Servicio', '', e => e.servicio),
          th('estado', 'Estado', '', e => ESTADO_LABEL[e.estado] || e.estado), th('fam', 'Familia', '', e => e.fam), th('freq', 'Freq', '', e => e.freq),
          th('mp', `MP ${MES_ESP(MONTH)}`, '', mpMesLabel),
          h('th', {}, h('span', { class: 'th-lbl' }, 'Encargado'), cf.btn('encargado', 'Encargado', e => H.encargadoDe(e) || 'sin asignar')),
          th('pend', 'Pend.', 'num', e => String(H.pendientesDe(e.inv).filter(p => p.estado !== 'cerrado').length)))),
        h('tbody', {}, ...list.map(e => {
          const chk = h('input', { type: 'checkbox', checked: eqSel.has(e.inv) ? true : false, onclick: ev => ev.stopPropagation(), onchange: ev => { ev.target.checked ? eqSel.add(e.inv) : eqSel.delete(e.inv); tr.classList.toggle('sel', ev.target.checked); updBulk(); } });
          const tr = h('tr', { class: eqSel.has(e.inv) ? 'sel' : '', onclick: () => go('equipo', { inv: e.inv }) },
            h('td', { onclick: ev => ev.stopPropagation() }, chk),
            h('td', { class: 'mono' }, e.inv), h('td', {}, capCell(200, e.equipo || '—')), h('td', { class: 'muted' }, capCell(160, e.servicio || '—')),
            h('td', {}, estadoPill(e.estado)), h('td', { class: 'muted' }, capCell(130, e.fam || '—')), h('td', { class: 'muted' }, e.freq || '—'),
            h('td', {}, mpMesBadge(e)),
            h('td', { class: H.encargadoDe(e) ? 'muted' : '', style: H.encargadoDe(e) ? null : { color: 'var(--st)' } }, capCell(140, H.encargadoDe(e) || 'sin asignar')),
            h('td', { class: 'num' }, (() => { const n = H.pendientesDe(e.inv).filter(p => p.estado !== 'cerrado').length; return n ? h('span', { class: 'pill st' }, n) : h('span', { class: 'faint' }, '0'); })()));
          return tr;
        }))
      ));
      kbList = { rows: list.map(e => e.inv), open: inv => go('equipo', { inv }), idx: -1 };
      updBulk();
    }

    const qInput = h('input', { type: 'search', placeholder: 'Buscar inv, equipo, serie, marca…', value: f.q, oninput: e => { f.q = e.target.value; render(); } });
    const seg = h('div', { class: 'seg' }, ...[['todos', 'Todos'], ['operativo', 'Operativos'], ['no_operativo', 'No oper.'], ['en_servicio_tecnico', 'Serv. téc.'], ['baja', 'Baja']].map(([v, l]) =>
      h('button', { class: f.estado === v ? 'on' : '', onclick: e => { f.estado = v; [...seg.children].forEach(b => b.classList.remove('on')); e.target.classList.add('on'); render(); } }, l)));

    const chips = [];
    if (params.alerta30) chips.push('Alerta >30 días');
    if (params.mpAtras) chips.push('MP atrasadas');
    if (params.sinProg) chips.push('Sin programación MP');
    const incomingChip = chips.length ? h('span', { class: 'chip', style: { color: 'var(--noop)' } }, h('b', {}, chips.join(' · ')), h('span', { class: 'x', onclick: () => go('equipos', {}) }, '×')) : null;
    const root = h('div', {},
      h('div', { class: 'filterbar' }, qInput, seg,
        field(null, selectEl([['', 'Todo servicio'], ...servicios.map(s => [s, s])], f.servicio, { onchange: e => { f.servicio = e.target.value; render(); } })),
        field(null, selectEl([['', 'Toda familia'], ...familias.map(s => [s, s])], f.fam, { onchange: e => { f.fam = e.target.value; render(); } })),
        h('label', { class: 'checkbox' }, h('input', { type: 'checkbox', onchange: e => { f.sinEnc = e.target.checked; render(); } }), 'Sin encargado'),
        h('label', { class: 'checkbox' }, h('input', { type: 'checkbox', checked: f.sinProg ? true : false, onchange: e => { f.sinProg = e.target.checked; render(); } }), 'Sin prog. MP'),
        h('div', { class: 'tb-spacer' }),
        h('button', { class: 'btn sm', onclick: () => exportarEquipos(data()) }, svg(ic.dl, 14), 'Exportar'),
        incomingChip, countNote),
      bulkBar, tblWrap);
    render();
    return root;
  };
  function exportarEquipos(list) {
    const estLbl = { ejecutada: 'Ejecutada', reprogramada: 'Reprogramada', otro: 'Otro', pendiente: 'Pendiente' };
    const header = ['N° Inv.', 'Equipo', 'Servicio', 'Unidad', 'Familia', 'Marca', 'Modelo', 'Serie', 'Freq MP', 'Estado', 'Días', 'Encargado', 'Pend. abiertos', `MP ${MES_ESP(MONTH)}`];
    const rows = list.map(e => [e.inv, e.equipo || '', e.servicio || '', e.unidad || '', e.fam || '', e.marca || '', e.modelo || '', e.serie || '', e.freq || '', ESTADO_LABEL[e.estado] || e.estado, H.diasEnEstado(e), H.encargadoDe(e) || '', H.pendientesDe(e.inv).filter(p => p.estado !== 'cerrado').length, estLbl[H.mpEstadoMes(e, YEAR, MONTH)] || '']);
    exportTablaExcel('Equipos', 'Equipos (vista filtrada) · ' + H.hoyLocal(), header, rows, `HHHA_equipos_${H.hoyLocal()}.xlsx`);
  }
  function mpMesBadge(e) {
    if (e.estado === 'baja') return h('span', { class: 'faint' }, '—');
    const prog = H.mpProgramadaEnMes(e, MESES[MONTH]);
    const st = H.mpEstadoMes(e, YEAR, MONTH);
    if (st === 'ejecutada') return h('span', { class: 'pill op' }, '✓ Hecha');
    if (st === 'reprogramada') return h('span', { class: 'pill st' }, 'Reprog.');
    if (st === 'otro') return h('span', { class: 'pill noop' }, 'Falla');
    return prog ? h('span', { class: 'pill noop' }, 'Pendiente') : h('span', { class: 'faint' }, 'No prog.');
  }

  // ---- EQUIPO (detalle) ---------------------------------------------------
  VIEWS.equipo = function () {
    const eq = H.findEquipo(params.inv);
    if (!eq) return h('div', { class: 'empty' }, 'Equipo no encontrado · ', h('span', { class: 'link', onclick: () => go('equipos') }, 'volver'));
    // Normaliza nombres de pestaña antiguos al nuevo esquema de 3 pestañas.
    const TAB_MAP = { resumen: 'historial', bitacora: 'historial', ciclos: 'historial', pendientes: 'historial', conflictos: 'historial', auditoria: 'historial', matriz: 'mantencion', mantencion: 'mantencion', historial: 'historial', archivos: 'archivos' };
    const tab = TAB_MAP[params.tab] || 'historial';
    const confs = H.conflictosDe(eq.inv);
    const pends = H.pendientesDe(eq.inv).filter(p => p.estado !== 'cerrado');
    const dias = H.diasEnEstado(eq);
    const ug = H.ultimaGestion(eq.inv);
    const diasSinG = ug ? H.diasEntreFechas(ug.fecha, H.hoyLocal()) : null;

    // Datos técnicos plegables (no distraen del trabajo del día a día).
    const datos = h('details', { class: 'eq-datos' },
      h('summary', {}, 'Datos del equipo'),
      h('div', { class: 'kv-grid', style: { marginTop: '10px' } }, ...[
        ['N° Carpeta', eq.carpeta], ['Serie', eq.serie], ['Familia', eq.fam], ['Marca', eq.marca], ['Modelo', eq.modelo],
        ['Servicio', eq.servicio], ['Unidad', eq.unidad], ['Ubicación', eq.ubic], ['Frecuencia MP', eq.freq],
        ['Procedencia', eq.proc], ['Año', eq.ano], ['VUR', eq.vur], ['Clasificación', eq.clasif], ['Encargado', H.encargadoDe(eq)]
      ].map(([k, v]) => h('div', { class: 'kv' }, h('div', { class: 'k' }, k), h('div', { class: 'v' }, v == null || v === '' ? '—' : String(v))))));

    const head = h('div', { class: 'eq-head' },
      h('div', { style: { flex: 1, minWidth: 0 } },
        h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' } },
          h('span', { class: 'eq-id mono' }, eq.inv), h('span', { class: 'eq-name' }, eq.equipo || '—'), estadoPill(eq.estado),
          eq.estadoDesde ? h('span', { class: 'faint', style: { fontSize: '11.5px' } }, `· ${dias} día(s) en estado`) : null,
          ug ? h('span', { class: 'faint', style: { fontSize: '11.5px' }, title: ug.texto || '' }, `· última gestión hace ${diasSinG} día(s)`) : null),
        datos),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn primary sm', onclick: () => formNuevoEvento({ inv: eq.inv }) }, svg(ic.plus, 14), 'Nuevo evento'),
        (eq.estado === 'no_operativo' || eq.estado === 'en_servicio_tecnico') ? h('button', { class: 'btn sm', title: 'Registrar seguimiento y fijar recordatorio', onclick: () => formRegistrarGestion(eq) }, svg(ic.cloud, 14), 'Registrar gestión') : null,
        h('button', { class: 'btn sm', onclick: () => formNuevoPendiente({ inv: eq.inv }) }, 'Pendiente'),
        eq.estado !== 'baja' ? h('button', { class: 'btn sm danger', onclick: () => formBaja(eq) }, 'Dar de baja') : null));

    const tabsDef = [['mantencion', 'Mantención'], ['historial', 'Historial', pends.length], ['archivos', 'Archivos', (eq.adjuntos || []).length]];
    const tabs = h('div', { class: 'tabs' }, ...tabsDef.map(([id, lbl, n]) =>
      h('button', { class: tab === id ? 'on' : '', onclick: () => go('equipo', { inv: eq.inv, tab: id }) }, lbl, n ? h('span', { class: 'badge-count' }, n) : null)));

    const body = h('div', {});
    if (tab === 'mantencion') mount(body, tabMatriz(eq));
    else if (tab === 'archivos') mount(body, tabArchivos(eq));
    else mount(body, tabHistorial(eq));

    const banner = (eq.estado !== 'operativo' && eq.estado !== 'baja' && eq.estado !== 'desconocido')
      ? h('div', { class: 'notice ' + (dias > 30 ? 'warn' : 'info'), style: { marginBottom: '12px' } },
        `Estado: ${ESTADO_LABEL[eq.estado]} hace ${dias} día(s). Encargado: ${H.encargadoDe(eq) || '—'}.`
        + (ug ? ` Última gestión: ${fmtFecha(ug.fecha)} (hace ${diasSinG} día(s)) · ${ug.texto}.` : ' Sin gestiones registradas.')
        + (dias > 30 ? ' ⚠ Sin avance hace más de 30 días.' : ''))
      : null;
    // Conflictos con el maestro: ya no son una pestaña, se muestran como aviso resoluble.
    const avisoConf = confs.length ? h('div', { class: 'notice warn', style: { marginBottom: '12px' } },
      h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' } },
        h('b', {}, `${confs.length} conflicto(s) con el maestro`),
        h('span', { class: 'faint', style: { fontSize: '11.5px' } }, 'Diferencias entre lo registrado y el maestro importado.')),
      h('div', { class: 'row-list', style: { marginTop: '8px' } }, ...confs.map(c => conflictoRow(c)))) : null;

    return h('div', { class: 'view-narrow' },
      h('div', { style: { marginBottom: '10px', fontSize: '12px' } },
        h('span', { class: 'link', onclick: () => go('equipos') }, '← Equipos')),
      head, banner, avisoConf, tabs, body);
  };
  // === Pestaña HISTORIAL: ciclo correctivo + pendientes + bitácora (línea de tiempo) ===
  function tabHistorial(eq) {
    const out = h('div', {});
    const ciclosAb = H.ciclosAbiertosDe(eq.inv);
    // 1) Ciclo correctivo abierto, con etapa actual y siguiente paso (pipeline).
    const ciclosCard = ciclosAb.length ? h('div', { class: 'section' },
      h('div', { class: 's-hd' }, h('h3', {}, 'Ciclo correctivo'), h('span', { class: 's-sub' }, ciclosAb.length + ' abierto(s)')),
      h('div', { class: 's-bd' }, h('div', { class: 'row-list' }, ...ciclosAb.map(c => {
        const f = faseDeCiclo(c), dEt = diasEtapaCiclo(c), est = cicloEstancado(c), sig = FASE_SIGUIENTE[f.tipo];
        const lblFase = t => (FASES_CORR.find(x => x[0] === t) || [, t])[1];
        return h('div', { class: 'mini-row', style: { alignItems: 'center', gap: '8px' } },
          h('div', { style: { flex: 1, minWidth: 0 } },
            h('div', {}, h('span', { class: 'mono' }, c.folio || ('#' + c.id)), ' · ', h('b', {}, 'Etapa: ' + lblFase(f.tipo))),
            h('div', { class: 'faint', style: { fontSize: '11px' } }, `${H.diasEntreFechas(c.fechaApertura, H.hoyLocal())} d abierto · ${dEt} d en esta etapa` + (est ? ' · ⚠ estancado' : ''))),
          sig ? h('button', { class: 'btn sm', title: 'Registrar el siguiente evento del ciclo', onclick: () => formNuevoEvento({ inv: c.inv, tipo: sig }) }, '→ ' + lblFase(sig))
            : h('button', { class: 'btn sm', title: 'Cerrar el ciclo (equipo operativo)', onclick: () => formNuevoEvento({ inv: c.inv, tipo: 'Reparación', estado: 'operativo' }) }, '✓ Cerrar'),
          h('button', { class: 'btn sm ghost', title: 'Cerrar ciclo manualmente', onclick: () => { const m = window.prompt('Justificación del cierre manual:'); if (m) { H.cerrarCicloManual(c, m); scheduleRefresh(); } } }, 'Cierre manual'));
      })))) : null;
    // 2) Pendientes del equipo (activos/resueltos/todos).
    const pendSection = (function () {
      const all = H.pendientesDe(eq.inv).slice().sort((a, b) => (a.estado === 'cerrado') - (b.estado === 'cerrado') || (a.fechaComp || '9999').localeCompare(b.fechaComp || '9999'));
      const nAct = all.filter(p => p.estado !== 'cerrado').length, nRes = all.filter(p => p.estado === 'cerrado').length;
      let filtro = 'activos';
      const pbody = h('div', { class: 's-bd' });
      const lista = () => filtro === 'resueltos' ? all.filter(p => p.estado === 'cerrado') : filtro === 'todos' ? all : all.filter(p => p.estado !== 'cerrado');
      const pr = () => { const ps = lista(); mount(pbody, ps.length ? h('div', { class: 'p-list' }, ...ps.map(pendienteCard)) : h('div', { class: 'empty' }, 'Sin pendientes' + (filtro === 'activos' ? ' activos' : filtro === 'resueltos' ? ' resueltos' : ''))); };
      const seg = h('div', { class: 'seg' }, ...[['activos', `Activos${nAct ? ' · ' + nAct : ''}`], ['resueltos', `Resueltos${nRes ? ' · ' + nRes : ''}`], ['todos', 'Todos']].map(([v, l]) =>
        h('button', { class: filtro === v ? 'on' : '', onclick: e => { filtro = v;[...seg.children].forEach(b => b.classList.remove('on')); e.target.classList.add('on'); pr(); } }, l)));
      pr();
      return h('div', { class: 'section' }, h('div', { class: 's-hd' }, h('h3', {}, 'Pendientes'), h('span', { class: 's-sub' }, `${nAct} activo(s) · ${nRes} resuelto(s)`), h('div', { class: 'tb-spacer' }), seg,
        h('button', { class: 'btn sm primary', onclick: () => formNuevoPendiente({ inv: eq.inv }) }, svg(ic.plus, 14), 'Nuevo')), pbody);
    })();
    mount(out, ciclosCard, pendSection, eventoTimeline(eq));
    return out;
  }
  // Bitácora como línea de tiempo legible (fecha · tipo · resultado/estado · ejecutor · 📎 · pendientes; clic = editar).
  function eventoTimeline(eq) {
    const all = H.eventosDeTodos(eq.inv).slice().reverse();   // más reciente primero
    const dup = H.idsMPDuplicadas();
    const pendsDe = e => H.pendientesDe(e.inv).filter(p => !p.anulado && p.eventoOrigen === e.id);
    let verAuto = false;
    const body = h('div', { class: 's-bd' });
    const sub = h('span', { class: 's-sub' });
    function fila(e) {
      const estadoNorm = e.estado ? e.estado.replace(/ /g, '_').replace('en_servicio_técnico', 'en_servicio_tecnico') : '';
      const cierra = (e.tipo === 'Reparación' || e.tipo === 'Recepción' || (e.tipo === 'Visita técnica' && e.tipoVisita === 'correctiva')) && e.estado === 'operativo';
      const ciclo = e.tipo === 'Solicitud de trabajo' ? 'abre ciclo' : (cierra ? 'cierra ciclo' : null);
      const extras = []; if (e.nCotiz) extras.push('Cotización ' + e.nCotiz); if (e.nOC) extras.push('OC ' + e.nOC); if (e.empresa) extras.push(e.empresa); if (e.tecnico) extras.push('Téc. ' + e.tecnico); if (e.nEnvio) extras.push('Envío ' + e.nEnvio); if (e.folio) extras.push('Folio ' + e.folio);
      const ps = pendsDe(e);
      return h('div', { class: 'tl-item' + (e.anulado ? ' anulado' : '') },
        h('div', { class: 'tl-rail' }, h('span', { class: 'tl-dot tl-' + (estadoNorm || 'n') })),
        h('div', { class: 'tl-card', style: e.anulado ? null : { cursor: 'pointer' }, title: e.anulado ? '' : 'Clic para editar el evento', onclick: e.anulado ? null : () => formEditarEvento(e) },
          h('div', { class: 'tl-hd' },
            h('span', { class: 'tl-fecha mono' }, fmtFecha(e.fecha)),
            h('b', {}, H.etiquetaTipoEvento(e)),
            e.resultado ? h('span', { class: 'mono', style: { fontSize: '11px', color: 'var(--muted)' } }, e.resultado) : null,
            estadoNorm ? estadoPill(estadoNorm) : null,
            ciclo ? h('span', { class: 'tag' }, ciclo) : null,
            e.anulado ? h('span', { class: 'tag' }, 'anulado') : (e.oficial === 'Sí' ? h('span', { class: 'tag oficial' }, 'Oficial') : h('span', { class: 'tag' }, 'Borrador')),
            dup.has(e.id) ? h('span', { class: 'tag', style: { color: 'var(--noop)', borderColor: 'color-mix(in srgb, var(--noop) 35%, var(--border))' }, title: 'Hay otra MP del mismo equipo en este mes' }, 'duplicada') : null,
            (e.adjuntos && e.adjuntos.length) ? h('span', { class: 'tag', title: e.adjuntos.length + ' archivo(s) adjunto(s)' }, '📎' + e.adjuntos.length) : null,
            h('div', { class: 'tb-spacer' }),
            e.anulado ? null : h('button', { class: 'btn icon ghost sm', title: 'Acciones', onclick: ev => { ev.stopPropagation(); evActions(e, ev.currentTarget); } }, svg(ic.dots, 15))),
          h('div', { class: 'tl-meta' }, (e.ejecutor || '—') + (extras.length ? ' · ' + extras.join(' · ') : '')),
          e.obs ? h('div', { class: 'tl-obs' }, e.obs) : null,
          h('div', { class: 'tl-pends', onclick: ev => ev.stopPropagation() },
            ...ps.map(p => h('span', { class: 'tag', style: { cursor: 'pointer', borderColor: p.estado === 'cerrado' ? 'var(--border)' : 'color-mix(in srgb, var(--st) 45%, var(--border))' }, title: (TIPO_PENDIENTE[p.tipo] || p.tipo) + (p.desc ? ' · ' + p.desc : ''), onclick: () => formPendiente(p) }, (p.estado === 'cerrado' ? '✓ ' : '') + (TIPO_PENDIENTE[p.tipo] || p.tipo))),
            h('button', { class: 'btn icon ghost sm', title: 'Crear pendiente de este evento', onclick: () => formNuevoPendiente({ inv: e.inv, eventoOrigen: e.id, desc: 'Derivado de: ' + H.etiquetaTipoEvento(e) + (e.folio ? ' (folio ' + e.folio + ')' : '') }) }, svg(ic.plus, 13)))));
    }
    function render() {
      const evs = verAuto ? all : all.filter(e => !H.eventoEsAuto(e));
      const ocultos = all.length - evs.length;
      sub.textContent = `${evs.length} eventos` + (!verAuto && ocultos ? ` · ${ocultos} importados ocultos` : '');
      mount(body, evs.length ? h('div', { class: 'timeline' }, ...evs.map(fila)) : h('div', { class: 'empty' }, verAuto ? 'Sin eventos' : 'Sin registros manuales'));
    }
    const chk = h('label', { class: 'checkbox', style: { fontSize: '12px' }, title: 'Mostrar también los eventos importados desde el maestro' },
      h('input', { type: 'checkbox', onchange: e => { verAuto = e.target.checked; render(); } }), 'Ver importados');
    render();
    return h('div', { class: 'section' }, h('div', { class: 's-hd' }, h('h3', {}, 'Bitácora'), sub, h('div', { class: 'tb-spacer' }), chk), body);
  }
  // === Pestaña ARCHIVOS: adjuntos en Drive + notas del equipo ===
  function tabArchivos(eq) {
    return h('div', { class: 'hsplit', style: { flexWrap: 'wrap', alignItems: 'flex-start' } },
      h('div', { class: 'section', style: { flex: '1', minWidth: '300px' } },
        h('div', { class: 's-hd' }, svg(ic.dl, 15), h('h3', {}, 'Archivos del equipo'), h('span', { class: 's-sub' }, (eq.adjuntos || []).length || '')),
        h('div', { class: 's-bd' }, adjuntosBox(eq, eq.inv))),
      h('div', { style: { flex: '1', minWidth: '300px' } }, notasPanel(eq)));
  }
  function notasPanel(eq) {
    const box = h('div', {});
    const render = () => {
      const ns = H.notasDe(eq).slice().reverse();
      mount(box, ns.length ? h('div', { class: 'row-list' }, ...ns.map(n => h('div', { class: 'mini-row', style: { display: 'block' } },
        h('div', { class: 'm-meta' }, h('b', {}, n.autor), ' · ', fmtFecha(n.fecha)), h('div', { class: 'm-txt' }, n.texto)))) : h('div', { class: 'faint', style: { fontSize: '11.5px' } }, 'Sin notas.'));
    };
    render();
    const input = h('input', { type: 'text', placeholder: 'Agregar nota + Enter', onkeydown: e => { if (e.key === 'Enter' && e.target.value.trim()) { H.agregarNotaEquipo(eq, e.target.value); H.save(); e.target.value = ''; render(); } } });
    return h('div', { class: 'section' }, h('div', { class: 's-hd' }, h('h3', {}, 'Notas del equipo'), h('span', { class: 's-sub' }, H.notasDe(eq).length || '')),
      h('div', { class: 's-bd' }, box, h('div', { style: { marginTop: '7px' } }, input)));
  }
  function tabMatriz(eq) {
    const yearSel = selectEl([YEAR + 1, YEAR, YEAR - 1, YEAR - 2].map(y => [y, y]), params.year || YEAR, { onchange: e => { params.year = +e.target.value; mount($('#view'), VIEWS.equipo()); } });
    const yr = params.year || YEAR;
    const S = H.getState();
    const obsList = S.eventos.filter(e => e.inv === eq.inv && !e.anulado && e.tipo === 'Mantención preventiva' && (e.obs || '').trim() && e.fecha && e.fecha.startsWith(String(yr))).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
    return h('div', {},
      h('div', { class: 'section' },
        h('div', { class: 's-hd' }, h('h3', {}, 'Matriz de mantención preventiva'), h('div', { class: 'tb-spacer' }), field(null, yearSel)),
        h('div', { class: 's-bd flush' }, h('div', { class: 'tbl-wrap' }, h('table', { class: 'dense' },
          h('thead', {}, h('tr', {}, h('th', {}, ''), ...MESES.map(m => h('th', { class: 'num' }, m)))),
          h('tbody', {},
            h('tr', {}, h('td', { class: 'muted' }, 'Programado (P)'), ...MESES.map(m => { const p = (eq.prog || {})[m]; return h('td', { class: 'num mpcell ' + (p ? 'x' : '') }, p || '·'); })),
            h('tr', {}, h('td', { class: 'muted' }, 'Resultado (R)'), ...MESES.map((m, i) => {
              const r = H.resultadoMPMes(eq, yr, i);
              const ev = H.eventoMPMes(eq.inv, yr, i);
              const tieneObs = ev && (ev.obs || '').trim();
              const tip = ev ? (`${m} ${yr} · ${ev.resultado || 'Si'} · ${ev.ejecutor || 'sin ejecutor'}` + (tieneObs ? `\nObs: ${ev.obs}` : '')) : (r ? `${m}: ${r}` : `${m}: sin registro`);
              return h('td', { class: 'num mpcell ' + mpResultClass(r), title: tip, onclick: () => formMP(eq.inv, `${yr}-${String(i + 1).padStart(2, '0')}-05`) }, r || '·', tieneObs ? h('sup', { style: { color: 'var(--accent)' } }, '✎') : null);
            })),
            h('tr', {}, h('td', { class: 'muted' }, 'Responsable'), ...MESES.map((mm, i) => {
              const km = `${yr}-${String(i + 1).padStart(2, '0')}`;
              const asig = (S.asignacionesMP || {})[km] || {};
              return h('td', { class: 'num', style: { padding: '3px' } }, selectEl([['', '—'], ...EJECUTORES.map(x => [x, x])], asig[eq.inv] || '',
                { class: 'mp-resp', title: `Responsable de MP · ${mm} ${yr}`, onchange: ev => { const st = H.getState(); st.asignacionesMP = st.asignacionesMP || {}; st.asignacionesMP[km] = st.asignacionesMP[km] || {}; if (ev.target.value) st.asignacionesMP[km][eq.inv] = ev.target.value; else delete st.asignacionesMP[km][eq.inv]; H.save(); } }));
            }))
        )))),
        h('div', { class: 's-bd' }, h('div', { class: 'faint', style: { fontSize: '11.5px' } }, 'Click en una celda de Resultado para registrar/editar la MP de ese mes (✎ = tiene observación). En la fila Responsable eliges quién hace la MP de cada mes. Códigos: Si=hecha · C1–C8=reprogramación · FS/NU/No=falla · Baja.'))),
      h('div', { class: 'section' },
        h('div', { class: 's-hd' }, h('h3', {}, `Observaciones de MP · ${yr}`), h('span', { class: 's-sub' }, obsList.length + ' con nota')),
        h('div', { class: 's-bd flush' }, obsList.length ? h('div', { class: 'tbl-wrap' }, h('table', { class: 'dense' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Fecha'), h('th', {}, 'Resultado'), h('th', {}, 'Ejecutor'), h('th', {}, 'Observación'))),
          h('tbody', {}, ...obsList.map(e => h('tr', { title: 'Clic para editar el evento', onclick: () => editarEvento(e) },
            h('td', {}, fmtFecha(e.fecha)), h('td', { class: 'mono' }, e.resultado || '—'), h('td', { class: 'muted' }, e.ejecutor || '—'), h('td', { class: 'wrap' }, e.obs))))))
          : h('div', { class: 'empty' }, 'Sin observaciones registradas en las MP de este año'))));
  }
  function pendienteCard(p) {
    const resuelto = p.estado === 'cerrado';
    const venc = p.fechaComp && p.fechaComp < H.hoyLocal() && !resuelto;
    const atraso = venc ? H.diasEntreFechas(p.fechaComp, H.hoyLocal()) : null;
    return h('div', { class: 'p-card' + (resuelto ? ' done' : ''), onclick: () => formPendiente(p) },
      h('div', { class: 'p-card-hd' },
        pendPill(p.estado), h('b', {}, TIPO_PENDIENTE[p.tipo] || p.tipo),
        venc ? h('span', { class: 'tag', style: { color: 'var(--noop)', borderColor: 'color-mix(in srgb, var(--noop) 35%, var(--border))' } }, '+' + atraso + ' d atraso') : null),
      p.desc ? h('div', { class: 'p-card-desc' }, p.desc) : null,
      h('div', { class: 'p-card-meta' },
        h('span', { class: p.ejecutor ? '' : 'faint' }, 'Resp.: ' + (p.ejecutor || 'sin asignar')),
        p.fechaComp ? h('span', {}, 'Compromiso ' + fmtFecha(p.fechaComp)) : null,
        resuelto && p.fechaCierre ? h('span', {}, 'Resuelto ' + fmtFecha(p.fechaCierre)) : null));
  }
  // Historial de cambios global (auditoría). Acceso discreto desde Configuración.
  function formHistorialCambios() {
    const S = H.getState();
    const all = (S.audit || []).slice().sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));
    const ENT = { equipo: 'Equipo', evento: 'Evento', pendiente: 'Pendiente', tarea: 'Tarea', ciclo: 'Ciclo' };
    const fhora = ts => { if (!ts) return '—'; const d = new Date(ts); return isNaN(d) ? ts : d.toLocaleString('es-CL'); };
    const v = x => (x === null || x === undefined || x === '') ? '—' : (x === false ? 'No' : x === true ? 'Sí' : String(x));
    let q = '', desde = '', hasta = '';
    const body = h('div', {}); const cnt = h('span', { class: 's-sub' });
    function render() {
      const ql = q.trim().toLowerCase();
      const list = all.filter(a => {
        const d = (a.ts || '').slice(0, 10);
        if (desde && d < desde) return false; if (hasta && d > hasta) return false;
        if (ql) { const blob = [a.entidad, a.idEnt, a.campo, a.valorAnterior, a.valorNuevo, a.usuario].map(x => String(x == null ? '' : x)).join(' ').toLowerCase(); if (!blob.includes(ql)) return false; }
        return true;
      });
      cnt.textContent = `${list.length} registro(s)`;
      mount(body, list.length ? h('div', { class: 'tbl-wrap' }, h('table', { class: 'dense' },
        h('thead', {}, h('tr', {}, h('th', {}, 'Fecha / hora'), h('th', {}, 'Entidad'), h('th', {}, 'ID'), h('th', {}, 'Campo'), h('th', {}, 'Antes'), h('th', {}, 'Después'), h('th', {}, 'Usuario'))),
        h('tbody', {}, ...list.slice(0, 800).map(a => h('tr', {},
          h('td', { class: 'muted nowrap' }, fhora(a.ts)), h('td', {}, h('span', { class: 'tag' }, ENT[a.entidad] || a.entidad)),
          h('td', { class: 'mono' }, capCell(120, String(a.idEnt == null ? '—' : a.idEnt))),
          h('td', {}, capCell(150, a.campo || '—')), h('td', { class: 'muted' }, capCell(160, v(a.valorAnterior))), h('td', {}, capCell(160, v(a.valorNuevo))), h('td', { class: 'muted' }, a.usuario || '—')))))) : h('div', { class: 'empty' }, 'Sin cambios en el rango'));
    }
    render();
    openDrawer({
      title: 'Historial de cambios', wide: true,
      body: h('div', {},
        h('div', { class: 'filterbar' },
          h('input', { type: 'search', placeholder: 'Buscar…', oninput: e => { q = e.target.value; render(); } }),
          h('span', { class: 'faint', style: { fontSize: '11px' } }, 'Desde'), h('input', { type: 'date', style: { width: 'auto' }, onchange: e => { desde = e.target.value; render(); } }),
          h('span', { class: 'faint', style: { fontSize: '11px' } }, 'Hasta'), h('input', { type: 'date', style: { width: 'auto' }, onchange: e => { hasta = e.target.value; render(); } }),
          h('div', { class: 'tb-spacer' }), cnt),
        body),
      footer: [h('button', { class: 'btn', onclick: closeDrawer }, 'Cerrar')]
    });
  }

  // ---- PENDIENTES ---------------------------------------------------------
  let pendSel = new Set();
  VIEWS.pendientes = function () {
    const S = H.getState();
    let f = { estado: params.vencidos ? 'activos' : (params.estado || 'activos'), tipo: params.tipo || '', q: '', serv: params.serv || '', ejec: params.ejec || '', record: !!params.record };
    pendSel = new Set();
    const cf = colFilters(render);
    const servicios = [...new Set(S.pendientes.map(p => p.servicio).filter(Boolean))].sort();
    const wrap = h('div', { class: 'tbl-wrap' }); const note = h('span', { class: 'count-note' });
    const cargaBox = h('div', {}); const bulkBar = h('div', { class: 'filterbar', style: { display: 'none', background: 'var(--accent-bg)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' } });

    // Conjunto base (estado/vencidos/tipo/servicio) sin el filtro de responsable — para la carga.
    function base() {
      let list = S.pendientes.filter(p => !p.anulado);
      if (f.estado === 'activos') list = list.filter(p => p.estado !== 'cerrado');
      else if (f.estado !== 'todos') list = list.filter(p => p.estado === f.estado);
      if (params.vencidos) list = list.filter(p => p.fechaComp && p.fechaComp < H.hoyLocal() && p.estado !== 'cerrado');
      if (f.tipo) list = list.filter(p => p.tipo === f.tipo);
      if (f.serv) list = list.filter(p => p.servicio === f.serv);
      return list;
    }
    function data() {
      let list = base();
      if (f.ejec === '__none') list = list.filter(p => !p.ejecutor);
      else if (f.ejec) list = list.filter(p => p.ejecutor === f.ejec);
      if (f.record) list = list.filter(p => p.proxRecord && p.proxRecord <= H.hoyLocal() && p.estado !== 'cerrado');
      if (f.q) { const q = norm(f.q); list = list.filter(p => norm(`${p.inv} ${p.equipo} ${p.desc} ${p.ejecutor}`).includes(q)); }
      list = cf.apply(list);
      // Orden: más atrasados primero (compromiso ascendente; sin fecha al final).
      return list.sort((a, b) => (a.fechaComp || '9999').localeCompare(b.fechaComp || '9999'));
    }
    function renderCarga() {
      const set = base(); const counts = {}; let sin = 0;
      set.forEach(p => { if (p.ejecutor) counts[p.ejecutor] = (counts[p.ejecutor] || 0) + 1; else sin++; });
      const chip = (lbl, n, key, alarm) => h('span', { class: 'chip', style: { cursor: 'pointer', ...(f.ejec === key ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}) }, onclick: () => { f.ejec = f.ejec === key ? '' : key; render(); } }, lbl, ' ', h('b', { style: alarm ? { color: 'var(--st)' } : null }, n));
      const items = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([ej, n]) => chip(ej, n, ej));
      mount(cargaBox, h('div', { class: 'section', style: { marginBottom: '10px' } },
        h('div', { class: 's-hd' }, h('h3', {}, 'Carga por responsable'), h('span', { class: 's-sub' }, set.length + ' pendiente(s)')),
        h('div', { class: 's-bd', style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
          sin ? chip('Sin asignar', sin, '__none', true) : null, ...items, (items.length || sin) ? null : h('span', { class: 'faint' }, 'Sin pendientes'))));
    }
    function updBulk() {
      const n = pendSel.size; bulkBar.style.display = n ? '' : 'none'; if (!n) return;
      const sel = () => [...pendSel].map(id => S.pendientes.find(p => p.id === id)).filter(Boolean);
      mount(bulkBar,
        h('b', {}, `${n} seleccionado${n !== 1 ? 's' : ''}`),
        selectEl([['', 'Asignar responsable…'], ...EJECUTORES.map(x => [x, x]), ['__none', '— quitar responsable —']], '', { onchange: e => { const v = e.target.value; if (!v) return; const val = v === '__none' ? null : v; sel().forEach(p => { const o = p.ejecutor || null; p.ejecutor = val; H.audit('pendiente', p.id, 'ejecutor', o, val); }); H.save(); toast(`Responsable actualizado · ${n}`, 'success'); pendSel.clear(); render(); } }),
        h('button', { class: 'btn sm', onclick: () => { sel().forEach(p => { if (p.estado === 'no_iniciado') { p.estado = 'en_proceso'; H.audit('pendiente', p.id, 'estado', 'no_iniciado', 'en_proceso'); } }); H.save(); toast('Marcados en proceso', 'success'); pendSel.clear(); render(); } }, 'Marcar en proceso'),
        h('button', { class: 'btn sm', onclick: () => { if (!window.confirm(`¿Resolver ${n} pendiente(s)?`)) return; sel().forEach(p => { if (p.estado !== 'cerrado') { p.estado = 'cerrado'; if (!p.fechaCierre) p.fechaCierre = H.hoyLocal(); H.audit('pendiente', p.id, 'estado', 'abierto', 'cerrado'); } }); H.save(); toast('Resueltos', 'success'); pendSel.clear(); render(); } }, 'Resolver'),
        h('div', { class: 'tb-spacer' }),
        h('button', { class: 'btn sm ghost', onclick: () => { pendSel.clear(); render(); } }, 'Limpiar selección'));
    }
    function render() {
      renderCarga();
      const list = data();
      note.textContent = `${list.length} pendiente${list.length !== 1 ? 's' : ''}`;
      mount(wrap, (list.length || cf.anyActive()) ? pendientesTable(list, { sel: pendSel, onToggle: updBulk, onAll: render, colf: cf }) : h('div', { class: 'empty' }, 'Sin resultados'));
      kbList = { rows: list.map(p => p.id), open: id => formPendiente(S.pendientes.find(p => p.id === id)), idx: -1 };
      updBulk();
    }
    const seg = h('div', { class: 'seg' }, ...[['activos', 'Activos'], ['no_iniciado', 'No iniciado'], ['en_proceso', 'En proceso'], ['cerrado', 'Resueltos'], ['todos', 'Todos']].map(([v, l]) =>
      h('button', { class: f.estado === v ? 'on' : '', onclick: e => { f.estado = v; params.vencidos = 0; [...seg.children].forEach(b => b.classList.remove('on')); e.target.classList.add('on'); render(); } }, l)));
    const presetChip = (params.tipo === 'reprogramacion' || params.record)
      ? h('span', { class: 'chip', style: { color: 'var(--accent)', borderColor: 'var(--accent)' } }, h('b', {}, params.record ? 'Recordatorios para hoy' : 'Reprogramaciones MP'), h('span', { class: 'x', onclick: () => go('pendientes', {}) }, '×')) : null;
    const root = h('div', {},
      h('div', { class: 'filterbar' },
        h('input', { type: 'search', placeholder: 'Buscar…', oninput: e => { f.q = e.target.value; render(); } }), seg,
        selectEl([['', 'Todo tipo'], ...Object.entries(TIPO_PENDIENTE)], f.tipo, { onchange: e => { f.tipo = e.target.value; render(); } }),
        selectEl([['', 'Todo servicio'], ...servicios.map(s => [s, s])], f.serv, { onchange: e => { f.serv = e.target.value; render(); } }),
        selectEl([['', 'Todo responsable'], ['__none', 'Sin asignar'], ...EJECUTORES.map(x => [x, x])], f.ejec, { onchange: e => { f.ejec = e.target.value; render(); } }),
        h('label', { class: 'checkbox' }, h('input', { type: 'checkbox', checked: params.vencidos ? true : false, onchange: e => { params.vencidos = e.target.checked ? 1 : 0; render(); } }), 'Solo vencidos'),
        h('label', { class: 'checkbox' }, h('input', { type: 'checkbox', checked: f.record ? true : false, onchange: e => { f.record = e.target.checked; render(); } }), 'Recordatorio ≤ hoy'),
        presetChip,
        h('div', { class: 'tb-spacer' }),
        h('button', { class: 'btn sm', onclick: () => exportarPendientes(data()) }, svg(ic.dl, 14), 'Exportar'),
        h('button', { class: 'btn sm primary', onclick: () => formNuevoPendiente({}) }, svg(ic.plus, 14), 'Nuevo'), note),
      cargaBox, bulkBar, wrap);
    render(); return root;
  };
  function exportarPendientes(list) {
    const header = ['ID', 'N° Inv.', 'Equipo', 'Servicio', 'Tipo', 'Descripción', 'Responsable', 'Estado', 'Creado', 'Compromiso', 'Atraso (días)', 'Próx. recordatorio'];
    const rows = list.map(p => { const at = p.fechaComp && p.estado !== 'cerrado' ? H.diasEntreFechas(p.fechaComp, H.hoyLocal()) : ''; return [p.id, p.inv, p.equipo || '', p.servicio || '', TIPO_PENDIENTE[p.tipo] || p.tipo, p.desc || '', p.ejecutor || '', ESTADO_PEND_LABEL[p.estado] || p.estado, fmtFecha(p.fechaCrea), fmtFecha(p.fechaComp), (at !== '' && at > 0 ? at : ''), fmtFecha(p.proxRecord)]; });
    exportTablaExcel('Pendientes', 'Pendientes (vista filtrada) · ' + H.hoyLocal(), header, rows, `HHHA_pendientes_${H.hoyLocal()}.xlsx`);
  }
  function pendientesTable(list, opts) {
    opts = opts || {}; const sel = opts.sel; const colf = opts.colf;
    const TH = (key, lbl, getter, cls) => colf ? colf.thF(key, lbl, getter, { cls }) : h('th', { class: cls || '' }, lbl);
    const headChk = sel ? h('th', { class: 'shrink' }, h('input', { type: 'checkbox', onchange: e => { if (e.target.checked) list.forEach(p => sel.add(p.id)); else list.forEach(p => sel.delete(p.id)); opts.onAll && opts.onAll(); } })) : null;
    return h('div', { class: 'tbl-wrap' }, h('table', { class: 'dense' },
      h('thead', {}, h('tr', {}, headChk,
        TH('inv', 'N° Inv.', p => p.inv), TH('equipo', 'Equipo', p => p.equipo || '—'),
        TH('tipo', 'Tipo', p => TIPO_PENDIENTE[p.tipo] || p.tipo), TH('desc', 'Descripción', p => p.desc || '—'),
        TH('estadoP', 'Estado', p => ESTADO_PEND_LABEL[p.estado] || p.estado), TH('resp', 'Responsable', p => p.ejecutor || 'sin asignar'),
        TH('comp', 'Compromiso', p => p.fechaComp ? fmtFecha(p.fechaComp) : '—'),
        TH('atraso', 'Atraso', p => { const a = p.fechaComp && p.estado !== 'cerrado' ? H.diasEntreFechas(p.fechaComp, H.hoyLocal()) : null; return a != null ? (a > 0 ? '+' + a + ' d' : a + ' d') : '—'; }, 'num'),
        TH('record', 'Recordatorio', p => p.proxRecord ? fmtFecha(p.proxRecord) : '—'))),
      h('tbody', {}, ...list.map(p => {
        const venc = p.fechaComp && p.fechaComp < H.hoyLocal() && p.estado !== 'cerrado';
        const atraso = p.fechaComp && p.estado !== 'cerrado' ? H.diasEntreFechas(p.fechaComp, H.hoyLocal()) : null;
        const recVenc = p.proxRecord && p.proxRecord <= H.hoyLocal() && p.estado !== 'cerrado';
        const chk = sel ? h('td', { onclick: ev => ev.stopPropagation() }, h('input', { type: 'checkbox', checked: sel.has(p.id) ? true : false, onchange: ev => { ev.target.checked ? sel.add(p.id) : sel.delete(p.id); tr.classList.toggle('sel', ev.target.checked); opts.onToggle && opts.onToggle(); } })) : null;
        const tr = h('tr', { class: sel && sel.has(p.id) ? 'sel' : '', onclick: () => formPendiente(p) },
          chk,
          h('td', { class: 'mono' }, p.inv), h('td', {}, p.equipo || '—'), h('td', { class: 'muted' }, TIPO_PENDIENTE[p.tipo] || p.tipo),
          h('td', { class: 'wrap' }, (p.desc || '—')), h('td', {}, pendPill(p.estado)),
          h('td', { class: p.ejecutor ? 'muted' : '', style: p.ejecutor ? null : { color: 'var(--st)' } }, p.ejecutor || 'sin asignar'),
          h('td', { class: venc ? '' : 'muted', style: venc ? { color: 'var(--noop)', fontWeight: 600 } : null }, p.fechaComp ? fmtFecha(p.fechaComp) : '—'),
          h('td', { class: 'num' }, atraso != null && atraso > 0 ? h('span', { class: 'pill noop' }, '+' + atraso + ' d') : (atraso != null ? h('span', { class: 'faint' }, atraso + ' d') : h('span', { class: 'faint' }, '—'))),
          h('td', { class: recVenc ? '' : 'muted', style: recVenc ? { color: 'var(--st)', fontWeight: 600 } : null }, p.proxRecord ? fmtFecha(p.proxRecord) : '—'));
        return tr;
      }))));
  }

  // ---- CICLOS -------------------------------------------------------------
  // Selector compartido Bitácora / Correctivos (Ciclos vive dentro de Eventos).
  function segEventos(activo) {
    return h('div', { class: 'seg' },
      h('button', { class: activo === 'bitacora' ? 'on' : '', onclick: () => go('eventos') }, 'Bitácora'),
      h('button', { class: activo === 'correctivos' ? 'on' : '', onclick: () => go('ciclos') }, 'Correctivos'));
  }
  VIEWS.ciclos = function () {
    const S = H.getState();
    let estado = params.estado || 'abierto';
    const wrap = h('div', { class: 'tbl-wrap' });
    const cf = colFilters(render);
    const eqName = c => (H.findEquipo(c.inv) || {}).equipo || '—';
    let lastList = [];
    function render() {
      let list = S.ciclos.slice().reverse();
      if (estado !== 'todos') list = list.filter(c => c.estado === estado);
      list = cf.apply(list); lastList = list;
      mount(wrap, S.ciclos.length ? h('table', { class: 'dense' },
        h('thead', {}, h('tr', {},
          cf.thF('folio', 'N° Informe / Folio', c => c.folio || '—'), cf.thF('inv', 'N° Inv.', c => c.inv), cf.thF('equipo', 'Equipo', eqName),
          cf.thF('apertura', 'Apertura', c => fmtFecha(c.fechaApertura)), cf.thF('cierre', 'Cierre', c => c.fechaCierre ? fmtFecha(c.fechaCierre) : '—'),
          cf.thF('estadoC', 'Estado', c => c.estado), cf.thF('ing', 'Ingeniero', c => c.ingenieroAsignado || '—'))),
        h('tbody', {}, ...list.map(c => { const eq = H.findEquipo(c.inv) || {}; return h('tr', { onclick: () => go('equipo', { inv: c.inv, tab: 'ciclos' }) },
          h('td', { class: 'mono' }, c.folio || '—'), h('td', { class: 'mono' }, c.inv), h('td', {}, eq.equipo || '—'), h('td', {}, fmtFecha(c.fechaApertura)),
          h('td', {}, c.fechaCierre ? fmtFecha(c.fechaCierre) : '—'), h('td', {}, h('span', { class: 'pill ' + (c.estado === 'abierto' ? 'st' : c.estado === 'anulado' ? 'baja' : 'op') }, c.estado)), h('td', { class: 'muted' }, c.ingenieroAsignado || '—')); }))
      ) : h('div', { class: 'empty' }, 'Sin ciclos'));
    }
    const seg = h('div', { class: 'seg' }, ...[['abierto', 'Abiertos'], ['cerrado', 'Cerrados'], ['anulado', 'Anulados'], ['todos', 'Todos']].map(([v, l]) =>
      h('button', { class: estado === v ? 'on' : '', onclick: e => { estado = v; [...seg.children].forEach(b => b.classList.remove('on')); e.target.classList.add('on'); render(); } }, l)));
    const expC = h('button', { class: 'btn sm', title: 'Exportar a Excel (respeta el filtro)', onclick: () => exportTablaExcel('Correctivos', 'Ciclos correctivos (filtrado) · ' + H.hoyLocal(), ['N° Informe / Folio', 'N° Inv.', 'Equipo', 'Apertura', 'Cierre', 'Estado', 'Ingeniero'], lastList.map(c => [c.folio || '', c.inv, eqName(c), fmtFecha(c.fechaApertura), c.fechaCierre ? fmtFecha(c.fechaCierre) : '', c.estado, c.ingenieroAsignado || '']), `HHHA_correctivos_${H.hoyLocal()}.xlsx`) }, svg(ic.dl, 14), 'Exportar');
    render(); return h('div', {}, h('div', { class: 'filterbar' }, segEventos('correctivos'), seg, h('div', { class: 'tb-spacer' }), expC), wrap);
  };

  // ---- EVENTOS (bitácora global) ------------------------------------------
  VIEWS.eventos = function () {
    const S = H.getState();
    let f = { tipo: '', oficial: params.oficial === 'No' ? 'no' : params.oficial === 'Sí' ? 'si' : '', q: '', anulados: false, ejec: params.ejec || '', desde: '', hasta: '', dup: !!params.dup, auto: false };
    const wrap = h('div', { class: 'tbl-wrap' }); const note = h('span', { class: 'count-note' });
    const tipos = [...new Set(S.eventos.map(e => e.tipo))];
    const dupSet = H.idsMPDuplicadas();
    const nAuto = S.eventos.filter(e => !e.anulado && H.eventoEsAuto(e)).length;
    const cf = colFilters(render);
    function data() {
      let list = S.eventos.slice();
      if (!f.anulados) list = list.filter(e => !e.anulado);
      if (!f.auto) list = list.filter(e => !H.eventoEsAuto(e));
      if (f.dup) list = list.filter(e => dupSet.has(e.id));
      if (f.tipo) list = list.filter(e => e.tipo === f.tipo);
      if (f.oficial) list = list.filter(e => (e.oficial === 'Sí') === (f.oficial === 'si'));
      if (f.ejec) list = list.filter(e => (f.ejec === '__none' ? !e.ejecutor : e.ejecutor === f.ejec));
      if (f.desde) list = list.filter(e => e.fecha && e.fecha >= f.desde);
      if (f.hasta) list = list.filter(e => e.fecha && e.fecha <= f.hasta);
      if (f.q) { const q = norm(f.q); list = list.filter(e => norm(`${e.inv} ${e.equipo} ${e.ejecutor} ${e.folio} ${e.obs}`).includes(q)); }
      list = cf.apply(list);
      return list.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).slice(0, 600);
    }
    function render() { const list = data(); note.textContent = `${list.length}`; mount(wrap, eventosTable(list, false, cf)); }
    const root = h('div', {},
      h('div', { class: 'filterbar' },
        segEventos('bitacora'),
        h('input', { type: 'search', placeholder: 'Buscar inv, ejecutor, folio…', oninput: e => { f.q = e.target.value; render(); } }),
        selectEl([['', 'Todo tipo'], ...tipos.map(t => [t, t])], '', { onchange: e => { f.tipo = e.target.value; render(); } }),
        selectEl([['', 'Oficial: todos'], ['si', 'Sólo oficiales'], ['no', 'Sólo borradores']], f.oficial, { onchange: e => { f.oficial = e.target.value; render(); } }),
        selectEl([['', 'Todo ejecutor'], ['__none', 'Sin ejecutor'], ...EJECUTORES.map(x => [x, x])], f.ejec, { onchange: e => { f.ejec = e.target.value; render(); } }),
        h('span', { class: 'faint', style: { fontSize: '11px' } }, 'Desde'), h('input', { type: 'date', style: { width: 'auto' }, onchange: e => { f.desde = e.target.value; render(); } }),
        h('span', { class: 'faint', style: { fontSize: '11px' } }, 'Hasta'), h('input', { type: 'date', style: { width: 'auto' }, onchange: e => { f.hasta = e.target.value; render(); } }),
        h('label', { class: 'checkbox', title: `${nAuto} eventos fueron importados desde el maestro. Por defecto se ocultan para ver sólo el registro manual.` }, h('input', { type: 'checkbox', checked: f.auto ? true : false, onchange: e => { f.auto = e.target.checked; render(); } }), `Ver importados${nAuto ? ` (${nAuto})` : ''}`),
        h('label', { class: 'checkbox' }, h('input', { type: 'checkbox', onchange: e => { f.anulados = e.target.checked; render(); } }), 'Ver anulados'),
        h('label', { class: 'checkbox' }, h('input', { type: 'checkbox', checked: f.dup ? true : false, onchange: e => { f.dup = e.target.checked; render(); } }), 'Solo duplicadas'),
        h('div', { class: 'tb-spacer' }),
        h('button', { class: 'btn sm', onclick: () => { const list = data(); exportTablaExcel('Bitácora', 'Bitácora (vista filtrada) · ' + H.hoyLocal(), ['Fecha', 'N° Inv.', 'Equipo', 'Tipo', 'Resultado', 'Estado', 'Ejecutor', 'N° Informe / Folio', 'Oficial', 'Observación'], list.map(e => [fmtFecha(e.fecha), e.inv, e.equipo || '', H.etiquetaTipoEvento(e), e.resultado || '', e.estado || '', e.ejecutor || '', e.folio || '', e.oficial || 'No', e.obs || '']), `HHHA_bitacora_${H.hoyLocal()}.xlsx`); } }, svg(ic.dl, 14), 'Exportar'),
        h('button', { class: 'btn sm primary', onclick: () => formNuevoEvento({}) }, svg(ic.plus, 14), 'Nuevo evento'), note),
      wrap);
    render(); return root;
  };
  function eventosTable(list, compact, colf) {
    const dup = H.idsMPDuplicadas();
    const TH = (key, lbl, getter, cls) => colf ? colf.thF(key, lbl, getter, { cls }) : h('th', { class: cls || '' }, lbl);
    const stop = ev => ev.stopPropagation();
    const cap = capCell;
    const pendsDe = e => H.pendientesDe(e.inv).filter(p => !p.anulado && p.eventoOrigen === e.id);
    const pendCell = e => {
      const ps = pendsDe(e);
      return h('td', { class: 'nowrap', onclick: stop },
        ...ps.slice(0, 2).map(p => h('span', { class: 'tag', style: { cursor: 'pointer', marginRight: '3px', borderColor: p.estado === 'cerrado' ? 'var(--border)' : 'color-mix(in srgb, var(--st) 45%, var(--border))' }, title: (TIPO_PENDIENTE[p.tipo] || p.tipo) + (p.desc ? ' · ' + p.desc : ''), onclick: () => formPendiente(p) }, (p.estado === 'cerrado' ? '✓ ' : '') + (TIPO_PENDIENTE[p.tipo] || p.tipo).slice(0, 14))),
        ps.length > 2 ? h('span', { class: 'faint', style: { fontSize: '10.5px', marginRight: '3px' } }, '+' + (ps.length - 2)) : null,
        h('button', { class: 'btn icon ghost sm', title: 'Crear pendiente de este evento', onclick: () => formNuevoPendiente({ inv: e.inv, eventoOrigen: e.id, desc: 'Derivado de: ' + H.etiquetaTipoEvento(e) + (e.folio ? ' (folio ' + e.folio + ')' : '') }) }, svg(ic.plus, 13)));
    };
    return h('div', { class: 'tbl-wrap' }, h('table', { class: 'dense' },
      h('thead', {}, h('tr', {},
        TH('fecha', 'Fecha', e => fmtFecha(e.fecha)), !compact ? TH('inv', 'N° Inv.', e => e.inv) : null,
        TH('tipo', 'Tipo', e => H.etiquetaTipoEvento(e)), TH('res', 'Resultado', e => e.resultado || '—'),
        TH('estadoE', 'Estado', e => e.estado || '—'), TH('ejec', 'Ejecutor', e => e.ejecutor || '—'),
        TH('folio', 'N° Informe / Folio', e => e.folio || '—'),
        h('th', {}, 'Pendientes'),
        TH('obs', 'Observación', e => e.obs || '—'),
        !compact ? TH('oficial', 'Oficial', e => e.oficial === 'Sí' ? 'Oficial' : 'Borrador') : null,
        h('th', { class: 'shrink' }, ''))),
      h('tbody', {}, ...list.map(e => h('tr', { style: e.anulado ? { opacity: .5 } : { cursor: 'pointer' }, title: e.anulado ? '' : 'Clic para editar el evento', onclick: e.anulado ? null : () => formEditarEvento(e) },
        h('td', { class: 'nowrap' }, fmtFecha(e.fecha)),
        !compact ? h('td', { class: 'mono link', onclick: ev => { stop(ev); go('equipo', { inv: e.inv }); } }, e.inv) : null,
        h('td', {}, cap(compact ? 132 : 210, H.etiquetaTipoEvento(e),
          dup.has(e.id) ? h('span', { class: 'tag', style: { marginLeft: '5px', color: 'var(--noop)', borderColor: 'color-mix(in srgb, var(--noop) 35%, var(--border))' }, title: 'Hay otra MP del mismo equipo en este mes' }, 'duplicada') : null,
          (e.adjuntos && e.adjuntos.length) ? h('span', { class: 'tag', style: { marginLeft: '5px' }, title: e.adjuntos.length + ' archivo(s) adjunto(s)' }, '📎' + e.adjuntos.length) : null,
          (compact && !e.anulado && e.oficial !== 'Sí') ? h('span', { class: 'tag', style: { marginLeft: '5px' } }, 'borrador') : null)),
        h('td', { class: 'mono' }, e.resultado || '—'),
        h('td', {}, e.estado ? estadoPill(e.estado.replace(/ /g, '_').replace('en_servicio_técnico', 'en_servicio_tecnico')) : '—'),
        h('td', { class: 'muted' }, cap(compact ? 116 : 150, e.ejecutor || '—')), h('td', { class: 'mono faint' }, e.folio || '—'),
        pendCell(e),
        h('td', { title: e.obs || '' }, e.obs ? cap(compact ? 150 : 320, e.obs) : h('span', { class: 'faint' }, '—')),
        !compact ? h('td', {}, e.oficial === 'Sí' ? h('span', { class: 'tag oficial' }, 'Oficial') : h('span', { class: 'tag' }, 'Borrador')) : null,
        h('td', { onclick: stop }, e.anulado ? h('span', { class: 'faint', title: e.motivoAnulacion }, 'anulado') : eventMenu(e))
      )))));
  }
  function eventMenu(e) {
    return h('button', { class: 'btn icon ghost sm', title: 'Acciones', onclick: ev => { ev.stopPropagation(); evActions(e, ev.currentTarget); } }, svg(ic.dots, 15));
  }
  function evActions(e, anchor) {
    const items = [];
    if (e.oficial !== 'Sí') items.push(['Oficializar', () => { H.oficializarEvento(e); toast('Evento oficializado', 'success'); }]);
    items.push(['Editar', () => formEditarEvento(e)]);
    items.push(['Crear pendiente de este evento', () => formNuevoPendiente({ inv: e.inv, eventoOrigen: e.id, desc: 'Derivado de: ' + H.etiquetaTipoEvento(e) + (e.folio ? ' (folio ' + e.folio + ')' : '') })]);
    items.push(['Anular', () => formAnularEvento(e), 'danger']);
    popover(anchor, items);
  }

  // ---- ASIGNACIONES MP ----------------------------------------------------
  let mpSel = new Set();
  VIEWS.asignaciones = function () {
    const S = H.getState();
    let y = params.year || YEAR, m = params.month != null ? params.month : MONTH;
    let estadoMP = params.estadoMP || 'todas';   // todas | pend | ejec
    let sinAsig = !!params.sinAsignar;
    let mpf = params.mpf || '';   // drill-down desde Cumplimiento (categoría de ejecución)
    mpSel = new Set();
    const keyMes = () => `${y}-${String(m + 1).padStart(2, '0')}`;
    const wrap = h('div', { class: 'tbl-wrap' }); const note = h('span', { class: 'count-note' });
    const cf = colFilters(render);
    const estLblMP = s => ({ ejecutada: 'Ejecutada', reprogramada: 'Reprogramada', otro: 'Otro', pendiente: 'Pendiente' }[s] || s);
    const progDe = e => (e.registro && e.registro[MESES[m]] && e.registro[MESES[m]].P) || (e.prog || {})[MESES[m]] || '—';
    const MPF_LBL = { prog: 'Programadas', oficial: 'Ejecutadas oficiales', borrador: 'Ejecutadas borrador', realiz: 'Ejecutadas', reprog: 'Reprogramadas', noejec: 'No registradas', sinreg: 'Sin registro', asig: 'Con responsable', sinasig: 'Sin asignar', fs: 'FS', nu: 'NU', baja: 'Baja' };
    function mpfPred(asig) {
      if (!mpf || mpf === 'prog') return null;
      if (mpf === 'asig') return e => !!asig[e.inv];
      if (mpf === 'sinasig') return e => !asig[e.inv];
      return e => {
        const c = H.claseMPMes(e, y, m);
        if (mpf === 'oficial') return c === 'oficial';
        if (mpf === 'borrador') return c === 'borrador';
        if (mpf === 'realiz') return c === 'oficial' || c === 'borrador';
        if (mpf === 'reprog') return c === 'reprog';
        if (mpf === 'noejec') return c === 'otro' || c === 'noreg';
        if (mpf === 'sinreg') return c === 'noreg';
        const r = H.resultadoMPMes(e, y, m);
        if (mpf === 'fs') return r === 'FS';
        if (mpf === 'nu') return r === 'NU';
        if (mpf === 'baja') return r === 'Baja';
        return true;
      };
    }
    const bulkAsig = h('button', { class: 'btn sm primary', style: { display: 'none' }, onclick: () => formAsignarEjecutor([...mpSel], keyMes()) }, 'Asignar ejecutor');
    function updBulk() { const on = mpSel.size; bulkAsig.style.display = on ? '' : 'none'; if (on) { bulkAsig.textContent = `Asignar ejecutor (${on})`; } }
    function data() {
      const asig = (S.asignacionesMP || {})[keyMes()] || {};
      let list = S.equipos.filter(e => e.estado !== 'baja' && H.mpProgramadaEnMes(e, MESES[m]));
      if (estadoMP === 'ejec') list = list.filter(e => H.mpDelMesEjecutada(e, y, m));
      if (estadoMP === 'pend') list = list.filter(e => H.mpEstadoMes(e, y, m) === 'pendiente');
      if (sinAsig) list = list.filter(e => !asig[e.inv]);
      const pred = mpfPred(asig); if (pred) list = list.filter(pred);
      list = cf.apply(list);
      return { list, asig };
    }
    function render() {
      const { list, asig } = data(); const km = keyMes();
      note.textContent = `${list.length} programados · ${list.filter(e => asig[e.inv]).length} con responsable`;
      const allChk = h('input', { type: 'checkbox', onchange: e => { if (e.target.checked) list.forEach(x => mpSel.add(x.inv)); else mpSel.clear(); render(); } });
      mount(wrap, (list.length || cf.anyActive()) ? h('table', { class: 'dense' },
        h('thead', {}, h('tr', {}, h('th', { class: 'shrink' }, allChk),
          cf.thF('inv', 'N° Inv.', e => e.inv), cf.thF('equipo', 'Equipo', e => e.equipo || '—'), cf.thF('servicio', 'Servicio', e => e.servicio || '—'),
          cf.thF('freq', 'Freq', e => e.freq || '—'), cf.thF('prog', 'Prog.', progDe),
          cf.thF('resultado', 'Resultado', e => H.resultadoMPMes(e, y, m) || '—'), cf.thF('estadoMP', 'Estado MP', e => estLblMP(H.mpEstadoMes(e, y, m))),
          cf.thF('encargado', 'Encargado', e => H.encargadoDe(e) || '—'),
          cf.thF('resp', 'Responsable MP', e => { const a = (S.asignacionesMP || {})[keyMes()] || {}; return a[e.inv] || 'sin asignar'; }), h('th', { class: 'shrink' }, ''))),
        h('tbody', {}, ...list.map(e => {
          const chk = h('input', { type: 'checkbox', checked: mpSel.has(e.inv) ? true : false, onclick: ev => ev.stopPropagation(), onchange: ev => { ev.target.checked ? mpSel.add(e.inv) : mpSel.delete(e.inv); updBulk(); tr.classList.toggle('sel', ev.target.checked); } });
          const r = H.resultadoMPMes(e, y, m);
          const tr = h('tr', { class: mpSel.has(e.inv) ? 'sel' : '' },
            h('td', { onclick: ev => ev.stopPropagation() }, chk),
            h('td', { class: 'mono link', onclick: () => go('equipo', { inv: e.inv }) }, e.inv),
            h('td', {}, capCell(190, e.equipo || '—')), h('td', { class: 'muted' }, capCell(150, e.servicio || '—')), h('td', { class: 'muted' }, e.freq || '—'),
            h('td', { class: 'mono' }, (e.registro && e.registro[MESES[m]] && e.registro[MESES[m]].P) || (e.prog || {})[MESES[m]] || '—'),
            h('td', {}, r ? h('span', { class: 'pill ' + mpResPillCls(r) }, r) : h('span', { class: 'faint' }, '—')),
            h('td', {}, mpEstadoBadge(e, y, m)),
            h('td', { class: 'muted' }, H.encargadoDe(e) || h('span', { class: 'faint' }, '—')),
            h('td', {}, selectEl([['', '— sin asignar —'], ...EJECUTORES.map(x => [x, x])], asig[e.inv] || '', { onclick: ev => ev.stopPropagation(), onchange: ev => { S.asignacionesMP = S.asignacionesMP || {}; S.asignacionesMP[km] = S.asignacionesMP[km] || {}; if (ev.target.value) S.asignacionesMP[km][e.inv] = ev.target.value; else delete S.asignacionesMP[km][e.inv]; H.save(); } })),
            h('td', {}, h('button', { class: 'btn sm primary', onclick: ev => { ev.stopPropagation(); formMP(e.inv, H.fechaSugeridaMP(y, m)); } }, 'MP')));
          return tr;
        }))
      ) : h('div', { class: 'empty' }, `Sin equipos con MP programada en ${MES_ESP(m)} ${y}`));
      kbList = { rows: list.map(e => e.inv), open: inv => go('equipo', { inv }), idx: -1 };
      updBulk();
    }
    const seg = h('div', { class: 'seg' }, ...[['todas', 'Todas'], ['pend', 'Pendientes'], ['ejec', 'Ejecutadas']].map(([v, l]) =>
      h('button', { class: estadoMP === v ? 'on' : '', onclick: e => { estadoMP = v; [...seg.children].forEach(b => b.classList.remove('on')); e.target.classList.add('on'); render(); } }, l)));
    const expA = h('button', { class: 'btn sm', title: 'Exportar a Excel (respeta el filtro)', onclick: () => { const d = data(); exportTablaExcel('MP del mes', `MP de ${MES_ESP(m)} ${y} (filtrado)`, ['N° Inv.', 'Equipo', 'Servicio', 'Freq', 'Programado', 'Resultado', 'Estado MP', 'Encargado', 'Responsable MP'], d.list.map(e => [e.inv, e.equipo || '', e.servicio || '', e.freq || '', progDe(e), H.resultadoMPMes(e, y, m) || '', estLblMP(H.mpEstadoMes(e, y, m)), H.encargadoDe(e) || '', d.asig[e.inv] || 'sin asignar']), `HHHA_mp_${y}-${String(m + 1).padStart(2, '0')}.xlsx`); } }, svg(ic.dl, 14), 'Exportar');
    const root = h('div', {},
      h('div', { class: 'filterbar' },
        field(null, selectEl(MESES.map((mm, i) => [i, MES_ESP(i)]), m, { onchange: e => { m = +e.target.value; mpSel.clear(); render(); } })),
        field(null, selectEl([YEAR + 1, YEAR, YEAR - 1].map(yy => [yy, yy]), y, { onchange: e => { y = +e.target.value; mpSel.clear(); render(); } })),
        seg,
        h('label', { class: 'checkbox' }, h('input', { type: 'checkbox', checked: sinAsig ? true : false, onchange: e => { sinAsig = e.target.checked; mpSel.clear(); render(); } }), 'Sin asignar'),
        mpf ? h('span', { class: 'chip', style: { color: 'var(--accent)', borderColor: 'var(--accent)' } }, h('b', {}, 'Filtro: ' + (MPF_LBL[mpf] || mpf)), h('span', { class: 'x', title: 'Quitar filtro', onclick: () => go('asignaciones', { year: y, month: m }) }, '×')) : null,
        h('div', { class: 'tb-spacer' }),
        expA, bulkAsig, note),
      wrap);
    render(); return root;
  };
  function mpResPillCls(r) { if (r === 'Si') return 'op'; if (/^C[1-8]$/.test(r)) return 'st'; if (r === 'Baja') return 'baja'; return 'noop'; }
  function mpEstadoBadge(e, y, m) { const s = H.mpEstadoMes(e, y, m); const map = { ejecutada: ['op', 'Ejecutada'], reprogramada: ['st', 'Reprogramada'], otro: ['noop', 'Otro'], pendiente: ['noop', 'Pendiente'] }[s]; return h('span', { class: 'pill ' + map[0] }, map[1]); }
  function formAsignarEjecutor(invs, km) {
    if (!invs.length) return;
    const ejec = selectEl([['', '— sin asignar —'], ...EJECUTORES.map(x => [x, x])], '');
    openDrawer({
      title: `Asignar ejecutor · ${invs.length} equipos`,
      body: h('div', {}, h('div', { class: 'notice info' }, `Se asignará el responsable de MP a los ${invs.length} equipos seleccionados (${km}).`), field('Responsable', ejec)),
      footer: [h('button', { class: 'btn', onclick: closeDrawer }, 'Cancelar'),
      h('button', { class: 'btn primary', onclick: () => { const S = H.getState(); S.asignacionesMP = S.asignacionesMP || {}; S.asignacionesMP[km] = S.asignacionesMP[km] || {}; invs.forEach(inv => { if (ejec.value) S.asignacionesMP[km][inv] = ejec.value; else delete S.asignacionesMP[km][inv]; }); H.save(); toast(`Responsable asignado a ${invs.length} equipos`, 'success'); closeDrawer(); } }, `Asignar a ${invs.length}`)]
    });
  }

  // ---- CUMPLIMIENTO POR SERVICIO -----------------------------------------
  VIEWS.cumplimiento = function () {
    const S = H.getState();
    let y = params.year || YEAR, m = params.month != null ? +params.month : MONTH;
    let modo = params.modo || 'mes';
    const wrap = h('div', {}); const trendBox = h('div', {});
    const cfSv = colFilters(render);     // embudo de la tabla Por servicio
    const cfResp = colFilters(render);   // embudo de la tabla Por responsable
    function filasPorResponsable() {
      const cargo = {};
      S.equipos.forEach(e => { const en = H.encargadoDe(e); if (en) cargo[en] = (cargo[en] || 0) + 1; });
      const esMP = (e, periodoAno, mes) => !e.anulado && e.tipo === 'Mantención preventiva' && e.resultado === 'Si' && e.fecha && new Date(e.fecha + 'T00:00:00').getFullYear() === y && (mes == null || new Date(e.fecha + 'T00:00:00').getMonth() === mes);
      return EJECUTORES.map(ej => {
        const pend = S.pendientes.filter(p => !p.anulado && p.estado !== 'cerrado' && p.ejecutor === ej);
        const venc = pend.filter(p => p.fechaComp && p.fechaComp < H.hoyLocal()).length;
        const mpMes = S.eventos.filter(e => e.ejecutor === ej && esMP(e, y, m)).length;
        const mpAno = S.eventos.filter(e => e.ejecutor === ej && esMP(e, y, null)).length;
        const evAno = S.eventos.filter(e => !e.anulado && e.ejecutor === ej && e.fecha && e.fecha.startsWith(String(y))).length;
        return { ej, pend: pend.length, venc, mpMes, mpAno, evAno, cargo: cargo[ej] || 0 };
      }).sort((a, b) => b.pend - a.pend || b.mpAno - a.mpAno);
    }
    function filasPorServicio() {
      const servicios = [...new Set(S.equipos.map(e => e.servicio || '(sin servicio)'))].sort();
      return servicios.map(sv => {
        const es = S.equipos.filter(e => (e.servicio || '(sin servicio)') === sv);
        const vivos = es.filter(e => e.estado !== 'baja');
        const op = es.filter(e => e.estado === 'operativo').length;
        const no = es.filter(e => e.estado === 'no_operativo').length;
        const stc = es.filter(e => e.estado === 'en_servicio_tecnico').length;
        const prog = vivos.filter(e => H.mpProgramadaEnMes(e, MESES[m]));
        const ejec = prog.filter(e => H.mpDelMesEjecutada(e, y, m)).length;
        const atr = vivos.filter(e => [...Array(m).keys()].some(mm => H.mpProgramadaEnMes(e, MESES[mm]) && H.mpEstadoMes(e, y, mm) === 'pendiente')).length;
        const pend = es.reduce((a, e) => a + H.pendientesDe(e.inv).filter(p => p.estado !== 'cerrado').length, 0);
        const pctMP = prog.length ? Math.round(ejec / prog.length * 100) : null;
        const pctOp = vivos.length ? Math.round(op / vivos.length * 100) : null;
        return { sv, total: es.length, vivos: vivos.length, op, no, stc, prog: prog.length, ejec, atr, pend, pctMP, pctOp };
      });
    }
    // Desglose mensual de MP del año (programadas, resultado, asignación y cumplimiento).
    function filasPorMes() {
      const vivos = S.equipos.filter(e => e.estado !== 'baja');
      return MESES.map((mm, i) => {
        const asig = (S.asignacionesMP || {})[`${y}-${String(i + 1).padStart(2, '0')}`] || {};
        let prog = 0, asignadas = 0, oficial = 0, borrador = 0, reprog = 0, fs = 0, nu = 0, baja = 0, sinReg = 0;
        vivos.forEach(e => {
          const c = H.claseMPMes(e, y, i);
          if (!c) return;            // no programada ese mes
          prog++;
          if (asig[e.inv]) asignadas++;
          if (c === 'oficial') oficial++;
          else if (c === 'borrador') borrador++;
          else if (c === 'reprog') reprog++;
          else if (c === 'noreg') sinReg++;
          else { const r = H.resultadoMPMes(e, y, i); if (r === 'FS') fs++; else if (r === 'NU') nu++; else if (r === 'Baja') baja++; else sinReg++; }
        });
        const realiz = oficial + borrador;
        const noReg = prog - oficial - borrador - reprog;   // sin ejecutar ni reprogramar
        return { mm, i, prog, asignadas, sinAsig: prog - asignadas, oficial, borrador, realiz, reprog, fs, nu, baja, sinReg, noReg, pct: prog ? Math.round(realiz / prog * 100) : null };
      });
    }
    function pctPill(v) { if (v == null) return h('span', { class: 'faint' }, '—'); return h('span', { class: 'pill ' + (v >= 90 ? 'op' : v >= 60 ? 'st' : 'noop') }, v + '%'); }
    function bar(v) { return h('div', { class: 'progress', style: { minWidth: '70px' } }, h('i', { style: { width: (v || 0) + '%', background: v == null ? 'var(--surface-3)' : v >= 90 ? 'var(--op)' : v >= 60 ? 'var(--st)' : 'var(--noop)' } })); }
    function renderTrend() {
      const meses = MESES.map((mm, i) => {
        const prog = S.equipos.filter(e => e.estado !== 'baja' && H.mpProgramadaEnMes(e, mm));
        const ejec = prog.filter(e => H.mpDelMesEjecutada(e, y, i)).length;
        return { mm, i, prog: prog.length, ejec, pct: prog.length ? Math.round(ejec / prog.length * 100) : null };
      });
      mount(trendBox, h('div', { class: 'section', style: { marginBottom: '12px' } },
        h('div', { class: 's-hd' }, h('h3', {}, `Tendencia mensual de cumplimiento MP · ${y}`), h('span', { class: 's-sub' }, 'Clic en un mes')),
        h('div', { class: 's-bd' }, h('div', { class: 'trend' }, ...meses.map(mo => {
          const cls = mo.pct == null ? '' : mo.pct >= 90 ? 'op' : mo.pct >= 60 ? 'st' : 'noop';
          return h('div', { class: 'trend-col' + (mo.i === m ? ' on' : ''), title: `${mo.mm} ${y}: ${mo.pct == null ? 'sin programación' : mo.pct + '% · ' + mo.ejec + '/' + mo.prog}`, onclick: () => { m = mo.i; render(); } },
            h('div', { class: 'trend-val' }, mo.pct == null ? '—' : mo.pct + '%'),
            h('div', { class: 'trend-bar-wrap' }, h('div', { class: 'trend-bar ' + cls, style: { height: (mo.pct || 0) + '%' } })),
            h('div', { class: 'trend-lbl' }, mo.mm));
        })))));
    }
    function renderServicio() {
      const rows = cfSv.apply(filasPorServicio());
      const tot = rows.reduce((a, r) => ({ total: a.total + r.total, vivos: a.vivos + r.vivos, op: a.op + r.op, no: a.no + r.no, stc: a.stc + r.stc, prog: a.prog + r.prog, ejec: a.ejec + r.ejec, atr: a.atr + r.atr, pend: a.pend + r.pend }), { total: 0, vivos: 0, op: 0, no: 0, stc: 0, prog: 0, ejec: 0, atr: 0, pend: 0 });
      const totPctMP = tot.prog ? Math.round(tot.ejec / tot.prog * 100) : null;
      const totPctOp = tot.vivos ? Math.round(tot.op / tot.vivos * 100) : null;
      // celda numérica cliqueable hacia una vista filtrada
      const nc = (v, go2, color) => h('td', { class: 'num' + (v ? ' link' : ''), style: (color && v) ? { color } : null, onclick: v ? go2 : null }, v || '—');
      const fila = (r, isTot) => h('tr', { style: isTot ? { fontWeight: 700, background: 'var(--surface-2)' } : null },
        isTot ? h('td', {}, 'TOTAL') : h('td', { class: 'link', onclick: () => go('equipos', { servicio: r.sv }) }, r.sv),
        isTot ? h('td', { class: 'num' }, r.total) : nc(r.total, () => go('equipos', { servicio: r.sv })),
        isTot ? h('td', { class: 'num' }, r.op) : nc(r.op, () => go('equipos', { servicio: r.sv, estado: 'operativo' })),
        isTot ? h('td', { class: 'num' }, r.no) : nc(r.no, () => go('equipos', { servicio: r.sv, estado: 'no_operativo' }), 'var(--noop)'),
        isTot ? h('td', { class: 'num' }, r.stc) : nc(r.stc, () => go('equipos', { servicio: r.sv, estado: 'en_servicio_tecnico' }), 'var(--st)'),
        h('td', {}, pctPill(isTot ? totPctOp : r.pctOp)),
        h('td', { class: 'num' }, r.prog ? (r.ejec + '/' + r.prog) : '—'),
        h('td', { style: { minWidth: '130px' } }, h('div', { style: { display: 'flex', alignItems: 'center', gap: '7px' } }, bar(isTot ? totPctMP : r.pctMP), pctPill(isTot ? totPctMP : r.pctMP))),
        isTot ? h('td', { class: 'num' }, r.atr) : nc(r.atr, () => go('equipos', { servicio: r.sv, mpAtras: 1 }), 'var(--noop)'),
        isTot ? h('td', { class: 'num' }, r.pend) : nc(r.pend, () => go('pendientes', { serv: r.sv })));
      mount(wrap, h('div', { class: 'tbl-wrap' }, h('table', { class: 'dense' },
        h('thead', {}, h('tr', {}, cfSv.thF('sv', 'Servicio', r => r.sv), h('th', { class: 'num' }, 'Equipos'), h('th', { class: 'num' }, 'Oper.'), h('th', { class: 'num' }, 'No op.'), h('th', { class: 'num' }, 'ST'), h('th', {}, '% Operativo'), h('th', {}, `MP ${MES_ESP(m)}`), h('th', {}, '% Cumplimiento MP'), h('th', { class: 'num' }, 'Atrasadas'), h('th', { class: 'num' }, 'Pend.'))),
        h('tbody', {}, ...rows.map(r => fila(r)), fila(tot, true)))));
    }
    function renderResponsable() {
      const rows = cfResp.apply(filasPorResponsable());
      const nc = (v, go2, color) => h('td', { class: 'num' + (v ? ' link' : ''), style: (color && v) ? { color } : null, onclick: v ? go2 : null }, v || '—');
      mount(wrap, h('div', { class: 'tbl-wrap' }, h('table', { class: 'dense' },
        h('thead', {}, h('tr', {}, cfResp.thF('ej', 'Responsable', r => r.ej), h('th', { class: 'num' }, 'Pend. abiertos'), h('th', { class: 'num' }, 'Vencidos'), h('th', { class: 'num' }, `MP ${MES_ESP(m)}`), h('th', { class: 'num' }, `MP ${y}`), h('th', { class: 'num' }, `Eventos ${y}`), h('th', { class: 'num' }, 'Equipos a cargo'))),
        h('tbody', {}, ...rows.map(r => h('tr', {},
          h('td', { class: 'link', onclick: () => go('pendientes', { ejec: r.ej }) }, r.ej),
          nc(r.pend, () => go('pendientes', { ejec: r.ej })),
          nc(r.venc, () => go('pendientes', { ejec: r.ej, vencidos: 1 }), 'var(--noop)'),
          h('td', { class: 'num' }, r.mpMes || '—'), h('td', { class: 'num' }, r.mpAno || '—'), h('td', { class: 'num' }, r.evAno || '—'), h('td', { class: 'num' }, r.cargo || '—')))))));
    }
    function renderMes() {
      const rows = filasPorMes();
      const T = rows.reduce((a, r) => ({ prog: a.prog + r.prog, asignadas: a.asignadas + r.asignadas, sinAsig: a.sinAsig + r.sinAsig, oficial: a.oficial + r.oficial, borrador: a.borrador + r.borrador, realiz: a.realiz + r.realiz, reprog: a.reprog + r.reprog, fs: a.fs + r.fs, nu: a.nu + r.nu, baja: a.baja + r.baja, sinReg: a.sinReg + r.sinReg, noReg: a.noReg + r.noReg }), { prog: 0, asignadas: 0, sinAsig: 0, oficial: 0, borrador: 0, realiz: 0, reprog: 0, fs: 0, nu: 0, baja: 0, sinReg: 0, noReg: 0 });
      const Tpct = T.prog ? Math.round(T.realiz / T.prog * 100) : null;
      // Celda numérica cliqueable → Asignaciones del mes, filtrada por categoría (mpf).
      const cell = (v, r, mpf, color) => h('td', { class: 'num' + (v ? ' link' : ''), style: (color && v) ? { color } : null, title: v ? 'Ver estos equipos' : null, onclick: v ? () => go('asignaciones', { year: y, month: r.i, mpf }) : null }, v || '—');
      const mesCell = r => h('td', { class: 'link', title: 'Abrir la programación MP de este mes', onclick: () => go('asignaciones', { year: y, month: r.i }) }, MES_ESP(r.i));
      const totCell = (v, color) => h('td', { class: 'num', style: (color && v) ? { color } : null }, v);
      const totRow = (...tds) => h('tr', { style: { fontWeight: 700, background: 'var(--surface-2)' } }, h('td', {}, 'Total año'), ...tds);
      const t1 = h('div', { class: 'section', style: { marginBottom: '12px' } },
        h('div', { class: 's-hd' }, h('h3', {}, `MP ${y} · ejecución por mes`), h('span', { class: 's-sub' }, 'Clic en cualquier número para ver esos equipos')),
        h('div', { class: 's-bd flush' }, h('div', { class: 'tbl-wrap' }, h('table', { class: 'dense' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Mes'), h('th', { class: 'num' }, 'Programadas'), h('th', { class: 'num' }, 'Ejec. oficiales'), h('th', { class: 'num' }, 'Ejec. borrador'), h('th', { class: 'num' }, 'Reprogramadas'), h('th', { class: 'num', title: 'Programadas sin ejecutar ni reprogramar (incluye FS/NU/Baja y sin dato)' }, 'No registradas'), h('th', {}, 'Cumplimiento'))),
          h('tbody', {},
            ...rows.map(r => h('tr', {}, mesCell(r), cell(r.prog, r, 'prog'), cell(r.oficial, r, 'oficial', 'var(--op)'), cell(r.borrador, r, 'borrador', 'var(--st)'), cell(r.reprog, r, 'reprog', 'var(--st)'), cell(r.noReg, r, 'noejec', 'var(--noop)'),
              h('td', { style: { minWidth: '150px' } }, h('div', { style: { display: 'flex', alignItems: 'center', gap: '7px' } }, bar(r.pct), pctPill(r.pct))))),
            totRow(totCell(T.prog), totCell(T.oficial), totCell(T.borrador), totCell(T.reprog), totCell(T.noReg), h('td', {}, h('div', { style: { display: 'flex', alignItems: 'center', gap: '7px' } }, bar(Tpct), pctPill(Tpct))))))) ));
      const t2 = h('div', { class: 'section' },
        h('div', { class: 's-hd' }, h('h3', {}, `MP ${y} · por resultado (detalle)`), h('span', { class: 's-sub' }, 'Asignación y resultados — clic en un número para filtrar')),
        h('div', { class: 's-bd flush' }, h('div', { class: 'tbl-wrap' }, h('table', { class: 'dense' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Mes'), h('th', { class: 'num' }, 'Programadas'), h('th', { class: 'num' }, 'Asignadas'), h('th', { class: 'num' }, 'Sin asignar'), h('th', { class: 'num' }, 'Realizadas'), h('th', { class: 'num' }, 'Reprog.'), h('th', { class: 'num' }, 'FS'), h('th', { class: 'num' }, 'NU'), h('th', { class: 'num' }, 'Baja'), h('th', { class: 'num' }, 'Sin registro'))),
          h('tbody', {},
            ...rows.map(r => h('tr', {}, mesCell(r), cell(r.prog, r, 'prog'), cell(r.asignadas, r, 'asig'), cell(r.sinAsig, r, 'sinasig', 'var(--st)'), cell(r.realiz, r, 'realiz', 'var(--op)'), cell(r.reprog, r, 'reprog', 'var(--st)'), cell(r.fs, r, 'fs', 'var(--noop)'), cell(r.nu, r, 'nu', 'var(--noop)'), cell(r.baja, r, 'baja', 'var(--noop)'), cell(r.sinReg, r, 'sinreg', 'var(--noop)'))),
            totRow(totCell(T.prog), totCell(T.asignadas), totCell(T.sinAsig), totCell(T.realiz), totCell(T.reprog), totCell(T.fs), totCell(T.nu), totCell(T.baja), totCell(T.sinReg))))) ));
      mount(wrap, h('div', {}, t1, t2));
    }
    function render() { renderTrend(); if (modo === 'servicio') renderServicio(); else if (modo === 'responsable') renderResponsable(); else renderMes(); }
    function exportar() {
      if (modo === 'mes') {
        const rows = filasPorMes().map(r => [MES_ESP(r.i), r.prog, r.oficial, r.borrador, r.reprog, r.noReg, r.realiz, r.fs, r.nu, r.baja, r.sinReg, r.asignadas, r.sinAsig, r.pct == null ? '' : r.pct + '%']);
        return exportTablaExcel('MP por mes', `MP por mes · ${y}`, ['Mes', 'Programadas', 'Ejec. oficiales', 'Ejec. borrador', 'Reprogramadas', 'No registradas', 'Realizadas', 'FS', 'NU', 'Baja', 'Sin registro', 'Asignadas', 'Sin asignar', 'Cumplimiento'], rows, `HHHA_mp_por_mes_${y}.xlsx`);
      }
      if (modo === 'responsable') {
        const rows = filasPorResponsable().map(r => [r.ej, r.pend, r.venc, r.mpMes, r.mpAno, r.evAno, r.cargo]);
        return exportTablaExcel('Responsables', `Indicadores por responsable · ${MES_ESP(m)} ${y}`, ['Responsable', 'Pend. abiertos', 'Vencidos', `MP ${MES_ESP(m)}`, `MP ${y}`, `Eventos ${y}`, 'Equipos a cargo'], rows, `HHHA_responsables_${y}-${String(m + 1).padStart(2, '0')}.xlsx`);
      }
      const rows = filasPorServicio().map(r => [r.sv, r.total, r.op, r.no, r.stc, r.pctOp == null ? '' : r.pctOp + '%', r.prog ? (r.ejec + '/' + r.prog) : '', r.pctMP == null ? '' : r.pctMP + '%', r.atr, r.pend]);
      exportTablaExcel('Cumplimiento', `Cumplimiento por servicio · ${MES_ESP(m)} ${y}`, ['Servicio', 'Equipos', 'Operativos', 'No operativos', 'Serv. técnico', '% Operativo', `MP ${MES_ESP(m)} (ej/prog)`, '% Cumplimiento MP', 'MP atrasadas', 'Pendientes'], rows, `HHHA_cumplimiento_${y}-${String(m + 1).padStart(2, '0')}.xlsx`);
    }
    const seg = h('div', { class: 'seg' }, ...[['mes', 'Por mes'], ['servicio', 'Por servicio'], ['responsable', 'Por responsable']].map(([v, l]) =>
      h('button', { class: modo === v ? 'on' : '', onclick: e => { modo = v; [...seg.children].forEach(b => b.classList.remove('on')); e.target.classList.add('on'); render(); } }, l)));
    const root = h('div', {},
      h('div', { class: 'filterbar' }, seg,
        field(null, selectEl(MESES.map((mm, i) => [i, MES_ESP(i)]), m, { onchange: e => { m = +e.target.value; render(); } })),
        field(null, selectEl([YEAR + 1, YEAR, YEAR - 1].map(yy => [yy, yy]), y, { onchange: e => { y = +e.target.value; render(); } })),
        h('div', { class: 'tb-spacer' }),
        h('button', { class: 'btn sm', onclick: exportar }, svg(ic.dl, 14), 'Exportar')),
      trendBox, wrap);
    render(); return root;
  };

  // (La vista Conciliación se retiró: el maestro se importa desde Configuración y
  // los conflictos se resuelven allí o en la pestaña "Conflictos" de cada equipo.)
  function conflictoRow(c, after) {
    const act = (accion, valor) => { H.resolverConflicto(c, accion, valor); toast('Conflicto resuelto', 'success'); after ? after() : scheduleRefresh(); };
    let body;
    if (c.tipo === 'mp_diferencia') {
      body = h('div', { style: { flex: 1 } },
        h('div', {}, h('span', { class: 'mono' }, c.inv), ' · ', c.equipo || '', ' · ', h('b', {}, H.nombreCampoConflicto(c))),
        h('div', { class: 'btn-row', style: { marginTop: '6px' } },
          h('span', { class: 'chip' }, 'Programa: ', h('b', {}, c.valorPrograma || '∅')),
          h('span', { class: 'chip' }, 'Maestro: ', h('b', {}, c.valorMaestro || '∅'))));
    } else {
      body = h('div', { style: { flex: 1 } }, h('span', { class: 'mono' }, c.inv), ' · ', h('b', {}, H.nombreCampoConflicto(c)));
    }
    return h('div', { class: 'mini-row', style: { alignItems: 'flex-start' } }, body,
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn sm primary', onclick: () => act('aceptar_maestro') }, 'Maestro'),
        h('button', { class: 'btn sm', onclick: () => act('mantener_programa') }, 'Programa'),
        c.tipo === 'mp_diferencia' ? h('button', { class: 'btn sm', onclick: () => { const v = window.prompt('Valor manual:', c.valorMaestro || ''); if (v != null) act('manual', v); } }, 'Manual') : null,
        h('button', { class: 'btn sm ghost', onclick: () => act('posponer') }, 'Posponer')));
  }

  // ============================ FORMS (drawer) ==============================
  function formMP(inv, fechaDefault) {
    const eq = H.findEquipo(inv); if (!eq) return;
    // Si ya existe una MP en ese mes, se EDITA (corrige) en vez de crear una nueva (evita duplicar).
    const fechaDef = fechaDefault || H.hoyLocal();
    const dRef = new Date(fechaDef + 'T00:00:00');
    const evExist = (!isNaN(dRef)) ? H.eventoMPMes(inv, dRef.getFullYear(), dRef.getMonth()) : null;
    const editar = !!evExist;
    const fecha = h('input', { type: 'date', value: editar ? (evExist.fecha || fechaDef) : fechaDef });
    const resultado = selectEl(['Si', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'FS', 'Baja', 'NU', 'No'], editar ? (evExist.resultado || 'Si') : H.getPref('ultimoResultadoMP', 'Si'));
    const ejecutor = selectEl([['', '—'], ...EJECUTORES.map(x => [x, x])], editar ? (evExist.ejecutor || '') : H.getPref('ultimoEjecutor', ''));
    const obs = h('textarea', { placeholder: 'Observación (opcional)' }, editar ? (evExist.obs || '') : '');
    const estadoSi = selectEl([['operativo', 'Operativo'], ['no operativo', 'No operativo']], editar && evExist.estado === 'no operativo' ? 'no operativo' : 'operativo');
    const estadoAuto = h('input', { type: 'text', readonly: true });
    const estadoWrap = h('div', {}, estadoSi, estadoAuto);
    const sync = () => { const si = resultado.value === 'Si'; estadoSi.style.display = si ? '' : 'none'; estadoAuto.style.display = si ? 'none' : ''; if (!si) estadoAuto.value = H.estadoMPDesdeResultado(resultado.value) || '(sin cambio de estado)'; };
    resultado.onchange = sync; sync();
    const save = () => {
      const d = { inv, fecha: fecha.value, resultado: resultado.value, ejecutor: ejecutor.value, obs: obs.value, estadoSi: estadoSi.value };
      if (editar) {
        const r = H.corregirMP(evExist, d);
        if (!r.ok) return toast(r.error, 'error');
        toast(`MP actualizada · ${inv} · ${r.evento.resultado}`, 'success'); closeDrawer(); return;
      }
      let r = H.registrarMP(d);
      if (!r.ok && r.requiereConfirmacion) { if (window.confirm(r.aviso)) r = H.registrarMP({ ...d, forzarSinProg: true }); else return; }
      if (!r.ok) return toast(r.error, 'error');
      toast(`MP registrada · ${inv} · ${r.evento.resultado}`, 'success'); closeDrawer();
    };
    openDrawer({
      title: (editar ? 'Editar MP · ' : 'MP rápida · ') + eq.inv, focus: 'select',
      body: h('div', {}, eqMini(eq),
        h('div', { class: 'grid-3' }, field('Fecha', fecha), field('Resultado', resultado), field('Estado resultante', estadoWrap)),
        field('Ejecutor', ejecutor), field('Observación', obs),
        h('div', { class: 'notice' + (editar ? ' info' : '') }, editar
          ? 'Editas la MP ya registrada de este mes: cambia el resultado (p. ej. C6 → C3) y se recalcula el estado del equipo.'
          : 'Se guarda como borrador. Recuerda el último ejecutor/resultado para los próximos registros.')),
      footer: [h('button', { class: 'btn', onclick: closeDrawer }, 'Cancelar'), h('button', { class: 'btn primary', onclick: save }, editar ? 'Guardar cambios' : 'Guardar MP')]
    });
  }
  // Sube un archivo a Drive (carpeta del equipo) vía Apps Script. Devuelve {id,name,url,...}.
  async function subirArchivoDrive(inv, file) {
    const dataB64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = () => rej(new Error('No se pudo leer el archivo')); r.readAsDataURL(file); });
    const r = await gasCall('apiSubirArchivo', { inv, nombre: file.name, mime: file.type || 'application/octet-stream', dataB64 });
    if (!r.ok) throw new Error(r.error || 'Error al subir');
    return r.archivo;
  }
  // UI reutilizable de adjuntos. `owner` (evento o equipo) guarda owner.adjuntos[].
  function adjuntosBox(owner, inv) {
    owner.adjuntos = owner.adjuntos || [];
    const box = h('div', {});
    const render = () => mount(box, owner.adjuntos.length
      ? h('div', { class: 'row-list' }, ...owner.adjuntos.map((a, i) => h('div', { class: 'mini-row', style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        svg(ic.dl, 13),
        h('a', { href: a.url || '#', target: '_blank', rel: 'noopener', style: { flex: '1', color: 'var(--accent)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, onclick: ev => ev.stopPropagation() }, a.name),
        h('button', { class: 'btn icon ghost sm', title: 'Quitar archivo', onclick: () => { if (!window.confirm('¿Quitar "' + a.name + '" de Drive?')) return; gasCall('apiEliminarArchivo', { id: a.id }).catch(() => {}); owner.adjuntos.splice(i, 1); H.save(); render(); } }, svg(ic.x, 13)))))
      : h('div', { class: 'faint', style: { fontSize: '11.5px' } }, 'Sin archivos adjuntos.'));
    render();
    if (!isGAS()) return h('div', {}, box, h('div', { class: 'faint', style: { fontSize: '11px', marginTop: '5px' } }, '📎 Para adjuntar archivos a Google Drive, abre la app servida desde Apps Script (URL …/exec).'));
    const inp = h('input', { type: 'file', style: { display: 'none' }, onchange: async ev => { const f = ev.target.files[0]; if (!f) return; const b = ev.target; toast('Subiendo ' + f.name + '…', ''); try { const a = await subirArchivoDrive(inv, f); owner.adjuntos.push(a); H.save(); toast('Archivo adjuntado a Drive', 'success'); render(); } catch (e) { toast('Error: ' + e.message, 'error'); } b.value = ''; } });
    return h('div', {}, box, h('div', { style: { marginTop: '7px' } }, inp, h('button', { class: 'btn sm', onclick: () => inp.click() }, svg(ic.up, 14), 'Adjuntar archivo')));
  }
  function formNuevoEvento(opts) {
    let invSel = opts.inv || ''; let tipo = opts.tipo || null;
    const body = h('div', {});
    function build() {
      const eq = invSel ? H.findEquipo(invSel) : null;
      const ciclosAb = invSel ? H.ciclosAbiertosDe(invSel) : [];
      // Último "Envío a servicio técnico" del equipo (para precargar el N° de envío en la Recepción).
      const ultimoEnvio = invSel ? H.eventosDe(invSel).filter(e => e.tipo === 'Envío a servicio técnico' && e.nEnvio).slice(-1)[0] : null;
      const invInput = h('input', { type: 'text', list: 'eqlist', value: invSel, placeholder: 'N° Inventario', oninput: e => { invSel = e.target.value.trim(); if (H.findEquipo(invSel)) build(); } });
      const dl = h('datalist', { id: 'eqlist' }, ...H.getState().equipos.slice(0, 300).map(e => h('option', { value: e.inv }, `${e.inv} — ${e.equipo}`)));
      const typeGrid = h('div', { class: 'type-grid' }, ...TIPOS_EVENTO.map(t => h('button', { class: 'type-card ' + (tipo === t.label ? 'on' : ''), onclick: () => { tipo = t.label; build(); } }, h('b', {}, t.label), h('small', {}, t.desc))));
      const campos = h('div', {}); let ctrls = {};
      const fecha = h('input', { type: 'date', value: opts.fecha || H.hoyLocal() });
      const ejecutor = selectEl([['', '—'], ...EJECUTORES.map(x => [x, x])], '');
      const oficial = selectEl([['No', 'Borrador'], ['Sí', 'Oficial']], 'No');
      const obs = h('textarea', { placeholder: 'Observación / informe…' });
      function folioCtrl() { return ciclosAb.length ? selectEl([...ciclosAb.map(c => [c.folio || '', c.folio || '(sin folio)']), ['', '— sin vincular —']], ciclosAb[0].folio || '') : h('input', { type: 'text', placeholder: 'N° Informe / Folio' }); }
      if (tipo === 'Solicitud de trabajo') { const folio = h('input', { type: 'text', placeholder: 'N° Informe / Folio (opcional)' }); ctrls = { folio }; campos.append(h('div', { class: 'grid-2' }, field('Fecha', fecha), field('Ejecutor', ejecutor), field('N° Informe / Folio', folio), field('Oficial', oficial)), field('Descripción de la falla', obs), h('div', { class: 'notice info' }, 'Abre un ciclo correctivo y deja el equipo "no operativo".')); }
      else if (tipo === 'Visita técnica') { const empresa = h('input', { type: 'text' }), tecnico = h('input', { type: 'text' }), tipoVisita = selectEl([['diagnóstica', 'Diagnóstica'], ['correctiva', 'Correctiva']], opts.tipoVisita || 'diagnóstica'), folio = folioCtrl(), estado = selectEl([['no operativo', 'No operativo'], ['operativo', 'Operativo'], ['en servicio técnico', 'En servicio técnico']], opts.estado || 'no operativo'); ctrls = { empresa, tecnico, tipoVisita, folio, estado }; campos.append(h('div', { class: 'grid-3' }, field('Fecha', fecha), field('Empresa', empresa), field('Técnico', tecnico)), h('div', { class: 'grid-3' }, field('Tipo visita', tipoVisita), field('N° Informe / Folio', folio), field('Estado', estado)), field('Informe', obs), field('Oficial', oficial)); }
      else if (tipo === 'Orden de Compra') { const nCotiz = h('input', { type: 'text' }), nOC = h('input', { type: 'text' }), empresa = h('input', { type: 'text' }), via = selectEl([['trato_directo', 'Trato directo'], ['compra_agil', 'Compra ágil']], 'trato_directo'), folioInformeTD = h('input', { type: 'text', placeholder: 'Solo si trato directo' }), folio = folioCtrl(); ctrls = { nCotiz, nOC, empresa, via, folioInformeTD, folio }; campos.append(h('div', { class: 'grid-3' }, field('Fecha', fecha), field('N° Cotización', nCotiz), field('N° OC', nOC)), h('div', { class: 'grid-3' }, field('Empresa', empresa), field('Vía', via), field('Folio informe (TD)', folioInformeTD)), h('div', { class: 'grid-2' }, field('N° Informe / Folio', folio), field('Oficial', oficial)), field('Observación', obs)); }
      else if (tipo === 'Envío a servicio técnico') { const empresa = h('input', { type: 'text' }), nEnvio = h('input', { type: 'text' }), folio = folioCtrl(); ctrls = { empresa, nEnvio, folio, estado: { value: 'en servicio técnico' } }; campos.append(h('div', { class: 'grid-3' }, field('Fecha', fecha), field('Empresa ST', empresa), field('N° Envío', nEnvio)), h('div', { class: 'grid-2' }, field('Ejecutor', ejecutor), field('N° Informe / Folio', folio)), field('Oficial', oficial), field('Observación', obs), h('div', { class: 'notice' }, 'El equipo queda "en servicio técnico".')); }
      else if (tipo === 'Recepción') { const nEnvio = h('input', { type: 'text', value: ultimoEnvio ? (ultimoEnvio.nEnvio || '') : '', placeholder: 'N° envío original' }), folioGuia = h('input', { type: 'text' }), folio = folioCtrl(), estado = selectEl([['operativo', 'Operativo (cierra ciclo)'], ['no operativo', 'No operativo'], ['en servicio técnico', 'En servicio técnico']], 'operativo'); ctrls = { nEnvio, folioGuia, folio, estado }; campos.append(h('div', { class: 'grid-3' }, field('Fecha', fecha), field('N° envío original', nEnvio), field('Folio guía despacho', folioGuia)), h('div', { class: 'grid-2' }, field('N° Informe / Folio', folio), field('Estado', estado)), ultimoEnvio ? h('div', { class: 'notice info' }, `N° de envío tomado del envío a servicio técnico del ${fmtFecha(ultimoEnvio.fecha)}.`) : null, field('Observación', obs), field('Oficial', oficial)); }
      else if (tipo === 'Reparación') { const folio = folioCtrl(), estado = selectEl([['operativo', 'Operativo (cierra ciclo)'], ['no operativo', 'No operativo'], ['en servicio técnico', 'En servicio técnico']], 'operativo'), repuestos = h('input', { type: 'text', placeholder: 'Repuestos' }); ctrls = { folio, estado, repuestos }; campos.append(h('div', { class: 'grid-3' }, field('Fecha', fecha), field('N° Informe / Folio', folio), field('Estado', estado)), field('Repuestos', repuestos), field('Descripción', obs), field('Oficial', oficial)); }
      else if (tipo === 'Mantención preventiva') { const resultado = selectEl(['Si', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'FS', 'Baja', 'NU', 'No'], 'Si'), mpEstado = selectEl([['operativo', 'Operativo'], ['no operativo', 'No operativo']], 'operativo'), ejec2 = selectEl([['', '—'], ...EJECUTORES.map(x => [x, x])], ''); ctrls = { resultado, _mpEstado: mpEstado, ejecutor2: ejec2 }; campos.append(h('div', { class: 'grid-3' }, field('Fecha', fecha), field('Resultado', resultado), field('Estado (si "Si")', mpEstado)), h('div', { class: 'grid-2' }, field('Ejecutor', ejecutor), field('Ejecutor 2', ejec2)), field('Observación', obs), field('Oficial', oficial), h('div', { class: 'notice' }, 'C1–C8 → pendiente de reprogramación · NU → "Localizar equipo" · Baja → equipo a baja.')); }

      const guardar = () => {
        const d = { inv: invSel, tipo, fecha: fecha.value, ejecutor: ejecutor.value, obs: obs.value, oficial: oficial.value };
        for (const k in ctrls) { if (k === '_mpEstado') d.mpEstadoSi = ctrls[k].value; else d[k] = ctrls[k].value; }
        let r = H.crearEvento(d);
        if (!r.ok && r.requiereConfirmacion) { if (window.confirm(r.aviso)) { d.forzarSinProg = true; r = H.crearEvento(d); } else return; }
        if (!r.ok) return toast(r.error, 'error');
        toast(r.consolidado ? `MP de ${eq ? eq.inv : invSel} actualizada (ya había un registro de ese mes)` : `Evento "${tipo}" registrado`, 'success'); closeDrawer();
      };
      mount(body,
        field('N° Inventario', h('div', {}, invInput, dl)), eq ? eqMini(eq) : null,
        h('div', { class: 'field' }, h('label', {}, 'Tipo de evento'), typeGrid),
        tipo ? h('div', {}, h('hr', { class: 'sep' }), campos) : h('div', { class: 'empty' }, 'Selecciona un tipo de evento'));
      // footer guardar
      mount(drawer.querySelector('.d-ft') || h('div', {}));
      const ft = drawer.querySelector('.d-ft');
      if (ft) mount(ft, h('button', { class: 'btn', onclick: closeDrawer }, 'Cancelar'), tipo ? h('button', { class: 'btn primary', onclick: guardar }, 'Guardar evento') : null);
    }
    openDrawer({ title: 'Nuevo evento', wide: true, body, footer: [h('span', {})] });
    build();
  }
  // Campos extra (editables) según el tipo de evento — para ver/registrar N° cotización, OC, empresa, etc.
  const EXTRA_FIELDS_BY_TIPO = {
    'Solicitud de trabajo': [['folio', 'N° Informe / Folio']],
    'Visita técnica': [['empresa', 'Empresa'], ['tecnico', 'Técnico'], ['folio', 'N° Informe / Folio']],
    'Orden de Compra': [['nCotiz', 'N° Cotización'], ['nOC', 'N° OC'], ['empresa', 'Empresa'], ['folioInformeTD', 'Folio informe (TD)'], ['folio', 'N° Informe / Folio']],
    'Envío a servicio técnico': [['empresa', 'Empresa ST'], ['nEnvio', 'N° Envío'], ['folio', 'N° Informe / Folio']],
    'Recepción': [['nEnvio', 'N° envío original'], ['folioGuia', 'Folio guía despacho'], ['folio', 'N° Informe / Folio']],
    'Reparación': [['repuestos', 'Repuestos'], ['folio', 'N° Informe / Folio']]
  };
  function formEditarEvento(e) {
    const eq = H.findEquipo(e.inv) || {};
    const fecha = h('input', { type: 'date', value: e.fecha || '' });
    const ejecutor = selectEl([['', '—'], ...EJECUTORES.map(x => [x, x])], e.ejecutor || '');
    const oficial = selectEl([['No', 'Borrador'], ['Sí', 'Oficial']], e.oficial || 'No');
    const obs = h('textarea', {}, e.obs || '');
    const extraInputs = {};
    const extraFields = (EXTRA_FIELDS_BY_TIPO[e.tipo] || []).map(([k, lbl]) => { const inp = h('input', { type: 'text', value: e[k] || '' }); extraInputs[k] = inp; return field(lbl, inp); });
    const estadoNota = e.estado ? h('div', { class: 'faint', style: { fontSize: '11.5px', marginTop: '4px' } }, `Estado del equipo por este evento: ${e.estado}. (El estado se cambia registrando un nuevo evento.)`) : null;
    openDrawer({
      title: 'Editar evento · ' + e.tipo, wide: true,
      body: h('div', {}, eqMini(eq),
        h('div', { class: 'grid-2' }, field('Fecha', fecha), field('Ejecutor', ejecutor), field('Oficial', oficial)),
        extraFields.length ? h('div', { class: 'grid-2' }, ...extraFields) : null,
        field('Observación / informe', obs), estadoNota,
        field('Adjuntos (Google Drive)', adjuntosBox(e, e.inv))),
      footer: [h('button', { class: 'btn', onclick: closeDrawer }, 'Cancelar'), h('button', { class: 'btn primary', onclick: () => { const cambios = { fecha: fecha.value, obs: obs.value, ejecutor: ejecutor.value, oficial: oficial.value }; for (const k in extraInputs) cambios[k] = extraInputs[k].value; H.editarEvento(e, cambios); toast('Evento actualizado', 'success'); closeDrawer(); } }, 'Guardar')]
    });
  }
  function formAnularEvento(e) {
    const motivo = selectEl([['', '— motivo —'], ...MOTIVOS_ANULACION.map(m => [m, m]), ['__otro', 'Otro…']], '');
    const otro = h('textarea', { placeholder: 'Detalle' });
    openDrawer({
      title: 'Anular evento · ' + e.tipo, body: h('div', {}, h('div', { class: 'notice danger' }, 'Anular revierte efectos: limpia R del mes, recalcula estado y anula ciclos/pendientes asociados.'), field('Motivo', motivo), field('Detalle (opcional)', otro)),
      footer: [h('button', { class: 'btn', onclick: closeDrawer }, 'Cancelar'), h('button', { class: 'btn danger', onclick: () => { const s = motivo.value; const x = otro.value.trim(); let m; if (s === '__otro') { if (!x) return toast('Especifica el motivo', 'error'); m = x; } else if (!s) return toast('Selecciona un motivo', 'error'); else m = s + (x ? ' — ' + x : ''); const r = H.anularEvento(e, m); toast('Evento anulado' + (r.revertidos.length ? ' (' + r.revertidos.join('; ') + ')' : ''), 'success'); closeDrawer(); } }, 'Anular')]
    });
  }
  // Registrar gestión de seguimiento sobre un equipo caído: a quién contactaste, qué te
  // informó y el próximo recordatorio (para que el equipo no quede sin seguimiento).
  function formRegistrarGestion(eq) {
    const enc = H.encargadoDe(eq) || '';
    const contacto = selectEl([['', '— a quién contactaste —'], ...EJECUTORES.map(x => [x, x])], EJECUTORES.indexOf(enc) >= 0 ? enc : '');
    const estadoRep = selectEl([['', '— estado reportado —'], 'Sigue no operativo', 'En servicio técnico', 'En reparación', 'Esperando repuesto/OC', 'Listo para retiro', 'Operativo (resuelto)', 'Sin novedad'].map(o => Array.isArray(o) ? o : [o, o]), '');
    const nota = h('textarea', { placeholder: 'Detalle / respuesta del técnico…' });
    const prox = h('input', { type: 'date', value: H.addDias(H.hoyLocal(), 7) });
    openDrawer({
      title: 'Registrar gestión · ' + eq.inv,
      body: h('div', {},
        h('div', { class: 'notice info' }, `${eq.equipo || ''} — estado actual: ${ESTADO_LABEL[eq.estado] || eq.estado}. Anota la gestión y se fijará un recordatorio para no perderle el seguimiento.`),
        h('div', { class: 'grid-2' }, field('Contacté a', contacto), field('Estado reportado', estadoRep)),
        field('Nota', nota),
        field('Próximo recordatorio', prox)),
      footer: [h('button', { class: 'btn', onclick: closeDrawer }, 'Cancelar'),
      h('button', { class: 'btn primary', onclick: () => {
        const r = H.registrarGestionEquipo({ inv: eq.inv, contacto: contacto.value, estadoReportado: estadoRep.value, texto: nota.value, proxRecord: prox.value || null });
        if (!r.ok) return toast(r.error, 'error');
        toast('Gestión registrada' + (prox.value ? ' · recordatorio ' + fmtFecha(prox.value) : ''), 'success'); closeDrawer();
      } }, 'Registrar gestión')]
    });
  }
  function formNuevoPendiente(opts) {
    const inv = h('input', { type: 'text', list: 'eqlistp', value: opts.inv || '', placeholder: 'N° Inventario' });
    const dl = h('datalist', { id: 'eqlistp' }, ...H.getState().equipos.slice(0, 300).map(e => h('option', { value: e.inv }, e.equipo || '')));
    const tipo = selectEl(Object.entries(TIPO_PENDIENTE), opts.tipo || 'gestion_general');
    const desc = h('textarea', { placeholder: 'Descripción del pendiente' }, opts.desc || '');
    const ejec = selectEl([['', '—'], ...EJECUTORES.map(x => [x, x])], '');
    const fComp = h('input', { type: 'date' }); const fRec = h('input', { type: 'date' });
    openDrawer({
      title: 'Nuevo pendiente', focus: 'input', body: h('div', {}, h('div', { class: 'grid-2' }, field('N° Inventario', h('div', {}, inv, dl)), field('Tipo', tipo)), field('Descripción', desc), h('div', { class: 'grid-3' }, field('Ejecutor', ejec), field('Compromiso', fComp), field('Recordatorio', fRec))),
      footer: [h('button', { class: 'btn', onclick: closeDrawer }, 'Cancelar'), h('button', { class: 'btn primary', onclick: () => { const r = H.crearPendiente({ inv: inv.value, tipo: tipo.value, desc: desc.value, ejecutor: ejec.value, fechaComp: fComp.value, proxRecord: fRec.value, eventoOrigen: opts.eventoOrigen }); if (!r.ok) return toast(r.error, 'error'); toast('Pendiente creado', 'success'); closeDrawer(); } }, 'Crear')]
    });
  }
  function formPendiente(p) {
    const eq = H.findEquipo(p.inv) || {};
    const tipo = selectEl(Object.entries(TIPO_PENDIENTE), p.tipo);
    const estado = selectEl([['no_iniciado', 'No iniciado'], ['en_proceso', 'En proceso'], ['cerrado', 'Resuelto']], p.estado);
    const ejec = selectEl([['', '—'], ...EJECUTORES.map(x => [x, x])], p.ejecutor || '');
    const desc = h('textarea', {}, p.desc || '');
    const fComp = h('input', { type: 'date', value: p.fechaComp || '' }); const fRec = h('input', { type: 'date', value: p.proxRecord || '' });
    // tareas
    const tareasBox = h('div', { class: 'row-list' });
    const renderTareas = () => { const ts = H.getState().tareas.filter(t => t.pendId === p.id || (p.tareas || []).includes(t.id)); mount(tareasBox, ts.length ? ts.map(t => h('label', { class: 'mini-row ' + (t.estado === 'cerrado' ? 'done' : '') }, h('input', { type: 'checkbox', checked: t.estado === 'cerrado' ? true : false, onchange: e => { const r = H.toggleTarea(t, e.target.checked); renderTareas(); if (r.todasCerradas && p.estado !== 'cerrado' && window.confirm('Todas las tareas cerradas. ¿Cerrar el pendiente?')) { H.cerrarPendiente(p, ''); closeDrawer(); } } }), h('span', { class: 'm-txt' }, t.desc))) : h('div', { class: 'faint', style: { fontSize: '11.5px' } }, 'Sin tareas')); };
    renderTareas();
    const nuevaTarea = h('input', { type: 'text', placeholder: 'Nueva tarea + Enter', onkeydown: e => { if (e.key === 'Enter' && e.target.value.trim()) { H.agregarTareaPendiente(p, e.target.value); e.target.value = ''; renderTareas(); } } });
    // seguimientos
    const segBox = h('div', { class: 'row-list' });
    const renderSeg = () => mount(segBox, (p.seguimientos || []).length ? p.seguimientos.map(s => h('div', { class: 'mini-row', style: { display: 'block' } }, h('div', { class: 'm-meta' }, h('b', {}, s.autor), ' · ', fmtFecha(s.fecha)), h('div', { class: 'm-txt' }, s.texto))) : h('div', { class: 'faint', style: { fontSize: '11.5px' } }, 'Sin seguimientos'));
    renderSeg();
    const nuevoSeg = h('input', { type: 'text', placeholder: 'Agregar seguimiento + Enter', onkeydown: e => { if (e.key === 'Enter' && e.target.value.trim()) { H.agregarSeguimiento(p, e.target.value); e.target.value = ''; renderSeg(); } } });
    openDrawer({
      title: 'Pendiente · ' + p.inv, wide: true,
      body: h('div', {}, eqMini(eq, p),
        h('div', { class: 'grid-2' }, field('Tipo', tipo), field('Estado', estado), field('Ejecutor', ejec), field('Equipo', h('div', { class: 'muted', style: { padding: '7px 0' } }, `${p.inv} · ${eq.equipo || '—'}`))),
        field('Descripción', desc), h('div', { class: 'grid-2' }, field('Compromiso', fComp), field('Recordatorio', fRec)),
        h('div', { class: 'field' }, h('label', {}, 'Tareas atómicas'), tareasBox, nuevaTarea),
        h('div', { class: 'field' }, h('label', {}, 'Seguimientos'), segBox, nuevoSeg)),
      footer: [
        h('button', { class: 'btn danger left', onclick: () => { if (window.confirm('¿Anular pendiente?')) { H.anularPendiente(p); closeDrawer(); } } }, 'Anular'),
        p.estado === 'cerrado'
          ? h('button', { class: 'btn', title: 'Volver a abrir este pendiente', onclick: () => { H.actualizarPendiente(p, { tipo: tipo.value, estado: 'en_proceso', ejecutor: ejec.value, desc: desc.value, fechaComp: fComp.value, proxRecord: fRec.value }); toast('Pendiente reabierto', 'success'); closeDrawer(); } }, 'Reabrir')
          : h('button', { class: 'btn ok', title: 'Marcar como resuelto y guardar', onclick: () => { H.actualizarPendiente(p, { tipo: tipo.value, estado: 'cerrado', ejecutor: ejec.value, desc: desc.value, fechaComp: fComp.value, proxRecord: fRec.value }); toast('Pendiente resuelto', 'success'); closeDrawer(); } }, svg(ic.check, 15), 'Resolver'),
        h('button', { class: 'btn', onclick: closeDrawer }, 'Cerrar'),
        h('button', { class: 'btn primary', onclick: () => { H.actualizarPendiente(p, { tipo: tipo.value, estado: estado.value, ejecutor: ejec.value, desc: desc.value, fechaComp: fComp.value, proxRecord: fRec.value }); toast('Pendiente actualizado', 'success'); closeDrawer(); } }, 'Guardar')]
    });
  }
  function formBaja(eq) {
    const motivo = h('textarea', { placeholder: 'Motivo de la baja' });
    openDrawer({
      title: 'Dar de baja · ' + eq.inv, body: h('div', {}, eqMini(eq), h('div', { class: 'notice danger' }, 'El equipo pasa a "baja", se marca la matriz y se cierran sus pendientes activos.'), field('Motivo', motivo)),
      footer: [h('button', { class: 'btn', onclick: closeDrawer }, 'Cancelar'), h('button', { class: 'btn danger', onclick: () => { if (!motivo.value.trim()) return toast('Motivo requerido', 'error'); H.darDeBaja(eq, motivo.value.trim()); toast('Equipo dado de baja', 'success'); closeDrawer(); go('equipo', { inv: eq.inv }); } }, 'Confirmar baja')]
    });
  }
  function eqMini(eq, p) {
    return h('div', { class: 'mini-row', style: { display: 'block' } },
      h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' } }, h('b', {}, eq.equipo || (p && p.equipo) || '—'), h('span', { class: 'mono faint' }, eq.inv || (p && p.inv)), eq.estado ? estadoPill(eq.estado) : null),
      h('div', { class: 'faint', style: { fontSize: '11px', marginTop: '3px' } }, [eq.servicio, eq.marca, eq.modelo, eq.serie ? 'S/N ' + eq.serie : null].filter(Boolean).join(' · ')));
  }

  // ============================ popover ====================================
  let pop = null;
  function popover(anchor, items) {
    pop && pop.remove();
    const r = anchor.getBoundingClientRect();
    pop = h('div', { class: 'cmdk', style: { position: 'fixed', top: (r.bottom + 4) + 'px', left: 'auto', right: (window.innerWidth - r.right) + 'px', transform: 'none', width: '180px' } },
      h('div', { class: 'cmdk-list' }, ...items.map(([lbl, fn, cls]) => h('div', { class: 'cmdk-item', onclick: () => { pop.remove(); pop = null; fn(); } }, h('span', { class: 'c-main' }, h('span', { class: 'c-title', style: cls === 'danger' ? { color: 'var(--noop)' } : null }, lbl))))));
    document.body.appendChild(pop);
    setTimeout(() => document.addEventListener('click', closePop), 0);
  }
  function closePop() { pop && pop.remove(); pop = null; document.removeEventListener('click', closePop); document.removeEventListener('mousedown', closePop); }

  // ===== Filtros de columna estilo Excel (AutoFilter, multi-selección) =====
  // Uso:  const cf = colFilters(render);
  //       header:  cf.thF('servicio', 'Servicio', e => e.servicio)   // <th> con embudo
  //       o bien:  cf.btn('inv', 'N° Inv.', e => e.inv)              // sólo el botón (th propio)
  //       data():  list = cf.apply(list);   // registra el universo y filtra por columnas
  function colFilters(onApply) {
    const sets = {};        // key -> Set<string> seleccionados (ausente = sin filtro)
    const getters = {};     // key -> (row)=>valor
    let universe = [];      // filas previas a los filtros de columna (para poblar valores)
    const keyOf = v => (v == null || v === '') ? '—' : String(v);
    function pass(row, exceptKey) {
      for (const k in sets) {
        if (k === exceptKey) continue;
        const s = sets[k]; if (!s || !s.size) continue;
        const g = getters[k]; if (!g) continue;
        if (!s.has(keyOf(g(row)))) return false;
      }
      return true;
    }
    function apply(rows) { universe = rows.slice(); return rows.filter(r => pass(r)); }
    function anyActive() { return Object.keys(sets).some(k => sets[k] && sets[k].size); }
    function resetAll() { for (const k in sets) delete sets[k]; }
    function btn(key, label, getter) {
      getters[key] = getter;
      const on = sets[key] && sets[key].size;
      return h('button', { class: 'funnel' + (on ? ' on' : ''), title: on ? 'Filtrado · clic para cambiar' : 'Filtrar', onclick: ev => { ev.stopPropagation(); openPanel(key, label, getter, ev.currentTarget); } }, svg(ic.funnel, 12));
    }
    function thF(key, label, getter, opts) {
      opts = opts || {};
      return h('th', { class: opts.cls || '' }, h('span', { class: 'th-lbl' }, label), btn(key, label, getter));
    }
    function openPanel(key, label, getter, anchor) {
      closePop();
      const avail = universe.filter(r => pass(r, key));           // valores disponibles (cross-filter)
      const counts = new Map();
      avail.forEach(r => { const v = keyOf(getter(r)); counts.set(v, (counts.get(v) || 0) + 1); });
      const allKeys = [...counts.keys()].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
      const work = new Set(sets[key] ? [...sets[key]] : allKeys);  // sin filtro previo = todo marcado
      let q = '';
      const MAXSHOW = 400;
      const listEl = h('div', { class: 'xf-list' });
      const selAll = h('input', { type: 'checkbox' });
      const visKeys = () => { const nq = norm(q); return nq ? allKeys.filter(k => norm(k).includes(nq)) : allKeys; };
      function renderList() {
        clear(listEl);
        const vis = visKeys();
        selAll.checked = vis.length > 0 && vis.every(k => work.has(k));
        selAll.indeterminate = !selAll.checked && vis.some(k => work.has(k));
        vis.slice(0, MAXSHOW).forEach(k => {
          const cb = h('input', { type: 'checkbox', checked: work.has(k) ? true : false, onchange: () => { cb.checked ? work.add(k) : work.delete(k); renderList(); } });
          listEl.appendChild(h('label', { class: 'xf-row' }, cb, h('span', { class: 'xf-v', title: k }, k), h('span', { class: 'xf-n' }, counts.get(k))));
        });
        if (vis.length > MAXSHOW) listEl.appendChild(h('div', { class: 'xf-more' }, `+${vis.length - MAXSHOW} más · usa la búsqueda`));
        if (!vis.length) listEl.appendChild(h('div', { class: 'xf-more' }, 'Sin coincidencias'));
      }
      const search = h('input', { type: 'search', placeholder: 'Buscar valor…', oninput: e => { q = e.target.value; renderList(); } });
      selAll.onchange = () => { const vis = visKeys(); if (selAll.checked) vis.forEach(k => work.add(k)); else vis.forEach(k => work.delete(k)); renderList(); };
      function aceptar() {
        if (allKeys.length && allKeys.every(k => work.has(k))) delete sets[key];   // todo = sin filtro
        else if (!work.size) sets[key] = new Set([' __none__']);              // nada = ninguna fila
        else sets[key] = new Set(work);
        closePop(); onApply && onApply();
      }
      const panel = h('div', { class: 'xfilter' },
        h('div', { class: 'xf-hd' }, h('span', { class: 'xf-ttl' }, label), allKeys.length ? h('span', { class: 'xf-cnt' }, allKeys.length + ' valores') : null),
        h('div', { class: 'xf-search' }, svg(ic.search, 13), search),
        h('label', { class: 'xf-all' }, selAll, h('span', {}, '(Seleccionar todo)')),
        listEl,
        h('div', { class: 'xf-foot' },
          h('button', { class: 'btn sm ghost', onclick: () => { delete sets[key]; closePop(); onApply && onApply(); } }, 'Limpiar'),
          h('div', { class: 'tb-spacer' }),
          h('button', { class: 'btn sm', onclick: () => closePop() }, 'Cancelar'),
          h('button', { class: 'btn sm primary', onclick: aceptar }, 'Aceptar')));
      placePanel(panel, anchor);
      renderList(); setTimeout(() => search.focus(), 20);
    }
    return { btn, thF, apply, anyActive, resetAll, sets };
  }
  // Posiciona un panel flotante bajo el ancla; cierra al hacer clic fuera (no dentro).
  function placePanel(panel, anchor) {
    const r = anchor.getBoundingClientRect();
    panel.style.position = 'fixed';
    panel.style.top = (r.bottom + 4) + 'px';
    panel.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
    pop = panel; document.body.appendChild(panel);
    panel.addEventListener('mousedown', e => e.stopPropagation());
    setTimeout(() => document.addEventListener('mousedown', closePop), 0);
  }

  // ============================ command palette =============================
  const cmdkScrim = h('div', { class: 'cmdk-scrim', onclick: () => closeCmdk() }); document.body.appendChild(cmdkScrim);
  let cmdkEl = null, cmdkIdx = 0, cmdkItems = [];
  function openCmdk() {
    const input = h('input', { type: 'text', placeholder: 'Buscar equipo o acción…  (Esc para cerrar)' });
    const listEl = h('div', { class: 'cmdk-list' });
    cmdkEl = h('div', { class: 'cmdk cmdk-modal' }, input, listEl); document.body.appendChild(cmdkEl); cmdkScrim.classList.add('on');
    const actions = [
      ['Ir: Cola de trabajo', () => go('inicio'), '⌂'], ['Ir: Equipos', () => go('equipos'), '▦'], ['Ir: Pendientes', () => go('pendientes'), '✓'],
      ['Ir: Ciclos', () => go('ciclos'), '↻'], ['Ir: Eventos', () => go('eventos'), '≡'], ['Ir: MP del mes (detalle)', () => go('asignaciones'), '▤'], ['Ir: Configuración', () => go('configuracion'), '⚙'],
      ['Nuevo evento', () => { closeCmdk(); formNuevoEvento({}); }, '+'], ['Nuevo pendiente', () => { closeCmdk(); formNuevoPendiente({}); }, '+'],
      ['Exportar Excel', () => { closeCmdk(); excelExport(); }, '⭳']
    ];
    function render(q) {
      cmdkItems = []; clear(listEl); cmdkIdx = 0;
      const nq = norm(q);
      const acts = actions.filter(a => !nq || norm(a[0]).includes(nq));
      if (acts.length) { listEl.appendChild(h('div', { class: 'cmdk-sec' }, 'Acciones')); acts.forEach(a => addItem(a[2], a[0], '', a[1])); }
      if (nq.length >= 1) {
        const eqs = H.getState().equipos.filter(e => norm(`${e.inv} ${e.equipo} ${e.serie} ${e.marca}`).includes(nq)).slice(0, 8);
        if (eqs.length) { listEl.appendChild(h('div', { class: 'cmdk-sec' }, 'Equipos')); eqs.forEach(e => addItem('▦', e.inv, `${e.equipo || ''} · ${e.servicio || ''}`, () => { closeCmdk(); go('equipo', { inv: e.inv }); })); }
      }
      hi();
    }
    function addItem(icon, title, sub, fn) { const el = h('div', { class: 'cmdk-item', onclick: fn, onmouseenter: () => { cmdkIdx = cmdkItems.indexOf(el); hi(); } }, h('span', { class: 'c-ico' }, icon), h('div', { class: 'c-main' }, h('div', { class: 'c-title' }, title), sub ? h('div', { class: 'c-sub' }, sub) : null)); el._fn = fn; cmdkItems.push(el); listEl.appendChild(el); }
    function hi() { cmdkItems.forEach((el, i) => el.classList.toggle('on', i === cmdkIdx)); const on = cmdkItems[cmdkIdx]; on && on.scrollIntoView && on.scrollIntoView({ block: 'nearest' }); }
    input.addEventListener('input', () => render(input.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); cmdkIdx = Math.min(cmdkIdx + 1, cmdkItems.length - 1); hi(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); cmdkIdx = Math.max(cmdkIdx - 1, 0); hi(); }
      else if (e.key === 'Enter') { e.preventDefault(); cmdkItems[cmdkIdx] && cmdkItems[cmdkIdx]._fn(); }
      else if (e.key === 'Escape') closeCmdk();
    });
    render(''); setTimeout(() => input.focus(), 30);
  }
  function closeCmdk() { cmdkEl && cmdkEl.remove(); cmdkEl = null; cmdkScrim.classList.remove('on'); }

  // ============================ backup / excel / plantilla ==================
  function dl(blob, name) { const url = URL.createObjectURL(blob); const a = h('a', { href: url, download: name }); document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
  // Exporta una lista (la vista ACTUAL ya filtrada) a un .xlsx de una hoja, con autofiltro.
  function exportTablaExcel(hoja, titulo, header, rows, filename) {
    if (!window.XLSX) return toast('XLSX no disponible (sin conexión)', 'error');
    const aoa = [[titulo], [], header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(header.length - 1, 1) } }];
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 2, c: 0 }, e: { r: 2 + rows.length, c: header.length - 1 } }) };
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, hoja.slice(0, 31));
    dl(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' }), filename);
    toast(`Exportadas ${rows.length} fila(s)`, 'success');
  }

  // ============================ GOOGLE SHEETS (Cloud) =======================
  let cloudApplying = false, cloudTimer = null;
  // ¿La app está siendo servida POR el Apps Script? Entonces usamos el puente
  // google.script.run (mismo origen, sin CORS) en lugar de fetch.
  function isGAS() { try { return !!(typeof google !== 'undefined' && google.script && google.script.run); } catch (e) { return false; } }
  function gasCall(fn) {
    const args = Array.prototype.slice.call(arguments, 1);
    return new Promise((resolve, reject) => {
      const r = google.script.run.withSuccessHandler(resolve).withFailureHandler(e => reject(new Error((e && e.message) || String(e))));
      r[fn].apply(r, args);
    });
  }
  const Cloud = {
    get url() { return localStorage.getItem('sigem_gs_url') || ''; },
    get token() { return localStorage.getItem('sigem_gs_token') || ''; },
    get gas() { return isGAS(); },
    get connected() { return isGAS() || !!this.url; },
    // En modo Apps Script la sync está activa por defecto (la hoja ES el almacén).
    get auto() { return isGAS() ? localStorage.getItem('sigem_gs_auto') !== '0' : localStorage.getItem('sigem_gs_auto') === '1'; },
    get lastSync() { return localStorage.getItem('sigem_gs_last') || ''; },
    set(url, token, auto) {
      localStorage.setItem('sigem_gs_url', (url || '').trim());
      localStorage.setItem('sigem_gs_token', (token || '').trim());
      localStorage.setItem('sigem_gs_auto', auto ? '1' : '0');
    },
    _markSync() { localStorage.setItem('sigem_gs_last', new Date().toISOString()); },
    _getUrl() { return this.url + (this.url.includes('?') ? '&' : '?') + 'api=read&token=' + encodeURIComponent(this.token); },
    async pull() {
      if (!window.LZString) throw new Error('LZString no disponible');
      let j;
      if (isGAS()) j = await gasCall('apiRead');
      else { if (!this.url) throw new Error('Sin URL configurada'); j = await (await fetch(this._getUrl(), { redirect: 'follow' })).json(); }
      if (!j.ok) throw new Error(j.error || 'respuesta inválida');
      if (!j.dataB64) return { empty: true };
      const obj = JSON.parse(LZString.decompressFromBase64(j.dataB64));
      cloudApplying = true;
      try { const r = H.importarBackup(obj); if (!r.ok) throw new Error(r.error); } finally { cloudApplying = false; }
      this._markSync();
      return { ok: true, eventos: (obj.eventos || []).length, equipos: (obj.equipos || []).length };
    },
    // Guarda TODO en el Google Sheet: estado del sistema (oculto, comprimido) +
    // hojas legibles visibles. Cada registro queda almacenado y visible en la hoja.
    async push() {
      if (!window.LZString) return;
      const dataB64 = LZString.compressToBase64(H.exportarBackupJSON());
      const sheets = cuadernoSheets();
      let j;
      if (isGAS()) j = await gasCall('apiSave', { dataB64, sheets });
      else { if (!this.url) return; j = await (await fetch(this.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ token: this.token, dataB64, sheets }), redirect: 'follow' })).json().catch(() => ({ ok: true })); }
      if (j && j.ok === false) throw new Error(j.error || 'error al guardar');
      this._markSync();
      return { ok: true, hojas: sheets.length };
    },
    async test() {
      let j;
      if (isGAS()) j = await gasCall('apiRead');
      else { j = await (await fetch(this._getUrl(), { redirect: 'follow' })).json(); }
      if (!j.ok) throw new Error(j.error || 'sin ok');
      return j;
    }
  };
  function scheduleCloudPush() {
    if (!Cloud.auto || !Cloud.connected || cloudApplying) return;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(() => { Cloud.push().then(() => refreshChrome()).catch(e => toast('Google Sheets: ' + e.message, 'error')); }, 5000);
  }

  // Hojas de trabajo legibles que se escriben en el Google Sheet (para usar el
  // archivo sin la app). Devuelve [{name, rows(AOA), hidden, headerRow}].
  function cuadernoSheets() {
    const S = H.getState(); const hoy = H.hoyLocal();
    const estLbl = e => ESTADO_LABEL[e] || e;
    const fF = v => fmtFecha(v) === '—' ? '' : fmtFecha(v);
    const sheets = [];
    const pendVivos = S.pendientes.filter(p => !p.anulado);
    const pendById = {}; pendVivos.forEach(p => pendById[p.id] = p);
    const eqNom = inv => (H.findEquipo(inv) || {}).equipo || '';
    const eqSrv = inv => (H.findEquipo(inv) || {}).servicio || '';

    // Inicio (portada + leyenda de códigos)
    sheets.push({
      name: 'Inicio', hidden: false, headerRow: 0, rows: [
        ['Gestión Equipos Críticos HHHA · Datos sincronizados desde la aplicación'], ['Actualizado', hoy], [],
        ['Hojas de datos: Inventario · Pendientes · Tareas · Tareas-Pendientes (relación) · Bitácora · Registro (por fecha/hora de creación) · Equipos en servicio técnico · Equipos no operativos.'],
        ['ID_EQUIPO es un correlativo estable de Inventario. La unión entre hojas se hace por "N° Inv." (= "N° Inventario" de Inventario).'],
        ['Tareas-Pendientes une ID_PENDIENTE con ID_TAREAS.'],
        ['Las hojas de sistema (empiezan con "_") están ocultas: guardan el estado. No las borres ni edites.'], [],
        ['LEYENDA · RESULTADO MP'], ['Si', 'MP realizada'],
        ...Object.keys(CAUSALES).map(k => [k, CAUSALES[k].desc]), ['FS', 'Fuera de servicio'], ['NU', 'No ubicado'], ['Baja', 'Dado de baja'], ['No', 'No realizada'],
        [], ['LEYENDA · ESTADOS'], ...['operativo', 'no_operativo', 'en_servicio_tecnico', 'baja', 'desconocido'].map(e => [estLbl(e), e])
      ]
    });

    // INVENTARIO (ID_EQUIPO = N° Inventario: clave de unión con "N° Inv." de las demás hojas)
    sheets.push({
      name: 'Inventario', hidden: false, rows: [
        ['ID_EQUIPO', 'N° Carpeta', 'N° Inventario', 'Equipo', 'Servicio', 'Unidad', 'Ubicación', 'Procedencia', 'Marca', 'Modelo', 'Serie', 'Año Instalación', 'Vida Útil Residual', 'Clasificación', 'ENU / Baja'],
        ...S.equipos.map(e => [e.id, e.carpeta || '', e.inv, e.equipo || '', e.servicio || '', e.unidad || '', e.ubic || '', e.proc || '', e.marca || '', e.modelo || '', e.serie || '', e.ano || '', e.vur || '', e.clasif || '', e.estado === 'baja' ? 'Baja' : 'En uso'])
      ]
    });

    // PENDIENTES
    sheets.push({
      name: 'Pendientes', hidden: false, rows: [
        ['ID_PENDIENTE', 'N° Inv.', 'Equipo', 'Tipo', 'Descripción', 'Responsable', 'Estado', 'Compromiso'],
        ...pendVivos.map(p => [p.id, p.inv, p.equipo || eqNom(p.inv), TIPO_PENDIENTE[p.tipo] || p.tipo, p.desc || '', p.ejecutor || '', ESTADO_PEND_LABEL[p.estado] || p.estado, fF(p.fechaComp)])
      ]
    });

    // TAREAS (Tipo / Responsable / Compromiso se derivan del pendiente padre)
    const tareasVivas = (S.tareas || []).filter(t => pendById[t.pendId]);
    sheets.push({
      name: 'Tareas', hidden: false, rows: [
        ['ID_Tareas', 'N° Inv.', 'Equipo', 'Tipo', 'Descripción', 'Responsable', 'Estado', 'Compromiso'],
        ...tareasVivas.map(t => { const p = pendById[t.pendId] || {}; return [t.id, t.inv, t.equipo || eqNom(t.inv), TIPO_PENDIENTE[p.tipo] || p.tipo || '', t.desc || '', p.ejecutor || '', t.estado === 'cerrado' ? 'Hecha' : 'Pendiente', fF(p.fechaComp)]; })
      ]
    });

    // RELACIÓN Tareas ↔ Pendientes (tabla puente)
    sheets.push({
      name: 'Tareas-Pendientes', hidden: false, rows: [
        ['ID_PENDIENTE', 'ID_TAREAS'],
        ...tareasVivas.map(t => [t.pendId, t.id])
      ]
    });

    // BITÁCORA (todos los eventos vigentes + su detalle correctivo)
    sheets.push({
      name: 'Bitácora', hidden: false, rows: [
        ['ID_BITACORA', 'Fecha del evento', 'Fecha registro', 'N° Inv.', 'Equipo', 'Servicio', 'Tipo', 'Resultado', 'Estado equipo', 'Ejecutor', 'N° Informe Folio Solicitud de trabajo', 'N° Envío', 'N° OC', 'N° Cotización', 'Empresa', 'Técnico', 'Observación', 'Oficial'],
        ...S.eventos.filter(e => !e.anulado).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || (b.id - a.id)).map(e => [e.id, fF(e.fecha), fF(e.fechaReg), e.inv, e.equipo || eqNom(e.inv), e.servicio || eqSrv(e.inv), H.etiquetaTipoEvento(e), e.resultado || '', e.estado || '', e.ejecutor || '', e.folio || '', e.nEnvio || '', e.nOC || '', e.nCotiz || '', e.empresa || '', e.tecnico || '', e.obs || '', e.oficial || 'No'])
      ]
    });

    // REGISTRO — todos los eventos por FECHA Y HORA DE CREACIÓN (lo último capturado arriba).
    const tsKey = e => e.ts || (e.fechaReg ? e.fechaReg + 'T00:00:00' : (e.fecha ? e.fecha + 'T00:00:00' : ''));
    const creado = e => { if (e.ts) { const d = new Date(e.ts); if (!isNaN(d)) return d.toLocaleString('es-CL'); } return fF(e.fechaReg) || fF(e.fecha) || ''; };
    sheets.push({
      name: 'Registro', hidden: false, rows: [
        ['Creado', 'ID_BITACORA', 'N° Inv.', 'Equipo', 'Tipo', 'Resultado', 'Estado equipo', 'Ejecutor', 'N° Informe / Folio', 'Observación'],
        ...S.eventos.filter(e => !e.anulado)
          .slice().sort((a, b) => (tsKey(b)).localeCompare(tsKey(a)) || (b.id - a.id))
          .map(e => [creado(e), e.id, e.inv, e.equipo || eqNom(e.inv), H.etiquetaTipoEvento(e), e.resultado || '', e.estado || '', e.ejecutor || '', e.folio || '', e.obs || ''])
      ]
    });

    // EQUIPOS por estado de atención (seguimiento de caídos)
    const colsEstado = ['N° Inv.', 'Equipo', 'Servicio', 'Unidad', 'Ubicación', 'Marca', 'Modelo', 'Días en estado', 'Desde', 'Última gestión', 'Días s/gestión', 'Detalle gestión', 'Encargado', 'Pend. abiertos', 'N° Informe / Folio', 'Apertura ciclo'];
    const filasEstado = est => S.equipos.filter(e => e.estado === est).map(e => {
      const ciclo = H.ciclosAbiertosDe(e.inv)[0];
      const g = H.ultimaGestion(e.inv);
      return [e.inv, e.equipo || '', e.servicio || '', e.unidad || '', e.ubic || '', e.marca || '', e.modelo || '', H.diasEnEstado(e), fF(e.estadoDesde), g ? fF(g.fecha) : '', g ? H.diasEntreFechas(g.fecha, hoy) : '', g ? g.texto : '', H.encargadoDe(e) || '', H.pendientesDe(e.inv).filter(p => p.estado !== 'cerrado').length, ciclo ? (ciclo.folio || '') : '', ciclo ? fF(ciclo.fechaApertura) : ''];
    });
    sheets.push({ name: 'Equipos en servicio técnico', hidden: false, rows: [colsEstado, ...filasEstado('en_servicio_tecnico')] });
    sheets.push({ name: 'Equipos no operativos', hidden: false, rows: [colsEstado, ...filasEstado('no_operativo')] });
    return sheets;
  }

  // ---- CONFIGURACIÓN ------------------------------------------------------
  VIEWS.configuracion = function () {
    const root = h('div', { class: 'view-narrow' });
    const urlIn = h('input', { type: 'text', value: Cloud.url, placeholder: 'https://script.google.com/macros/s/.../exec' });
    const tokIn = h('input', { type: 'text', value: Cloud.token, placeholder: '(opcional) token compartido' });
    const autoIn = h('input', { type: 'checkbox', checked: Cloud.auto ? true : false });
    const status = h('div', { style: { fontSize: '12px' } });
    const setStatus = (msg, cls) => mount(status, h('span', { style: cls === 'err' ? { color: 'var(--noop)' } : cls === 'ok' ? { color: 'var(--op)' } : { color: 'var(--muted)' } }, msg));
    const syncStatus = () => setStatus(Cloud.connected ? ('Almacén activo · última sincronización: ' + (Cloud.lastSync ? new Date(Cloud.lastSync).toLocaleString('es-CL') : 'nunca')) : 'Sin conectar — los datos se guardan solo en este navegador.');
    syncStatus();
    const guardar = () => { Cloud.set(urlIn.value, tokIn.value, autoIn.checked); toast('Configuración guardada', 'success'); syncStatus(); refreshChrome(); };

    // 1) Almacenamiento (Google Sheets) — el Sheet ES el respaldo
    root.appendChild(h('div', { class: 'section' },
      h('div', { class: 's-hd' }, svg(ic.cloud, 16), h('h3', {}, 'Almacenamiento (Google Sheets)')),
      h('div', { class: 's-bd' },
        Cloud.gas
          ? h('div', { class: 'notice', style: { borderColor: 'color-mix(in srgb, var(--op) 35%, var(--border))', background: 'var(--op-bg)', color: 'color-mix(in srgb, var(--op) 80%, var(--text))' } }, '✓ Servido desde Apps Script. Cada cambio se guarda automáticamente en este Google Sheet (es tu respaldo) y se escriben hojas legibles. Accesible desde cualquier parte con la URL.')
          : h('div', { class: 'notice info' }, 'Conecta con un Google Sheet (Apps Script). El estado se guarda en una hoja oculta y, además, se escriben hojas legibles (Equipos, Pendientes, Bitácora, Plan anual…) para ver y trabajar los datos. Lo ideal: pega app.html en un archivo "Index" del Apps Script y abre la URL /exec.'),
        Cloud.gas ? null : field('URL del Apps Script (termina en /exec)', urlIn),
        Cloud.gas ? null : field('Token (opcional, igual a SHARED_TOKEN del script)', tokIn),
        h('label', { class: 'checkbox', style: { marginTop: '8px' } }, autoIn, 'Sincronización automática: guardar cada cambio en el Sheet'),
        h('div', { class: 'btn-row', style: { marginTop: '12px' } },
          Cloud.gas ? null : h('button', { class: 'btn primary', onclick: guardar }, 'Guardar configuración'),
          Cloud.gas ? null : h('button', { class: 'btn', onclick: async () => { guardar(); setStatus('Probando conexión…'); try { await Cloud.test(); setStatus('Conexión correcta ✓', 'ok'); toast('Conexión correcta', 'success'); } catch (e) { setStatus('Error: ' + e.message, 'err'); toast('Falló la conexión: ' + e.message, 'error'); } } }, 'Probar conexión'),
          h('button', { class: 'btn ' + (Cloud.gas ? 'primary' : ''), onclick: async () => { if (!Cloud.connected) return toast('Conecta el Sheet primero', 'error'); setStatus('Guardando en el Sheet…'); try { const r = await Cloud.push(); toast(`Guardado en Google Sheets (${r.hojas} hojas)`, 'success'); syncStatus(); } catch (e) { setStatus('Error: ' + e.message, 'err'); toast('Error al guardar: ' + e.message, 'error'); } } }, svg(ic.up, 14), 'Guardar ahora'),
          h('button', { class: 'btn', onclick: async () => { if (!Cloud.connected) return toast('Conecta el Sheet primero', 'error'); if (!window.confirm('Traer datos desde Google Sheets reemplaza lo de este navegador. ¿Continuar?')) return; try { const r = await Cloud.pull(); toast(r.empty ? 'La hoja aún no tiene datos' : `Traído · ${r.equipos} equipos · ${r.eventos} eventos`, 'success'); go('inicio'); } catch (e) { toast('Error al traer: ' + e.message, 'error'); } } }, svg(ic.dl, 14), 'Traer datos')),
        h('div', { style: { marginTop: '12px' } }, status))));

    // 2) Maestro y asignaciones MP (lo que antes estaba en Conciliación + plantillas)
    let my = YEAR, mm = MONTH;
    const confBox = h('div', {});
    const renderConf = () => {
      const cs = (H.getState().conflictos || []).filter(c => c.estado === 'pendiente' || c.estado === 'pospuesto');
      if (!cs.length) { mount(confBox, h('div', { class: 'faint', style: { fontSize: '12px' } }, 'Sin conflictos pendientes con el maestro.')); refreshChrome(); return; }
      mount(confBox,
        h('div', { class: 'btn-row', style: { margin: '0 0 8px' } },
          h('b', {}, cs.length + ' conflicto(s)'), h('div', { class: 'tb-spacer' }),
          h('button', { class: 'btn sm', onclick: () => { if (!window.confirm(`¿Aceptar el maestro en ${cs.length} conflicto(s)?`)) return; cs.forEach(c => H.resolverConflicto(c, 'aceptar_maestro', null, { skipSave: true })); H.save(); toast('Resueltos (maestro)', 'success'); renderConf(); } }, 'Aceptar todo (maestro)'),
          h('button', { class: 'btn sm', onclick: () => { if (!window.confirm(`¿Mantener el programa en ${cs.length} conflicto(s)?`)) return; cs.forEach(c => H.resolverConflicto(c, 'mantener_programa', null, { skipSave: true })); H.save(); toast('Resueltos (programa)', 'success'); renderConf(); } }, 'Mantener todo')),
        h('div', { class: 'row-list' }, ...cs.slice(0, 300).map(c => conflictoRow(c, renderConf))));
    };
    renderConf();
    const selM = selectEl(MESES.map((x, i) => [i, MES_ESP(i)]), mm, { onchange: e => { mm = +e.target.value; } });
    const selY = selectEl([YEAR + 1, YEAR, YEAR - 1].map(y => [y, y]), my, { onchange: e => { my = +e.target.value; } });
    root.appendChild(h('div', { class: 'section' },
      h('div', { class: 's-hd' }, svg(ic.conciliacion, 16), h('h3', {}, 'Maestro y asignaciones MP')),
      h('div', { class: 's-bd' },
        h('div', { class: 'notice info' }, 'Importa el maestro Excel (hojas PMP_AAAA y Registro_MP-AAAA): lo que coincide se oficializa, lo nuevo se importa y las diferencias quedan como conflictos abajo para resolver. Descarga la plantilla del mes, asigna responsables y súbela.'),
        h('div', { class: 'btn-row' }, h('button', { class: 'btn primary', onclick: () => importarMaestro(renderConf) }, svg(ic.up, 14), 'Importar maestro (.xlsx/.xlsm)')),
        h('div', { class: 'btn-row', style: { marginTop: '10px', alignItems: 'center' } },
          h('span', { class: 'faint', style: { fontSize: '12px' } }, 'Plantilla:'), field(null, selM), field(null, selY),
          h('button', { class: 'btn', onclick: () => descargarPlantilla(my, mm) }, svg(ic.dl, 14), 'Descargar plantilla'),
          h('button', { class: 'btn', onclick: () => subirPlantilla(my, mm) }, svg(ic.up, 14), 'Subir asignaciones')),
        h('div', { style: { marginTop: '14px' } }, h('div', { class: 'faint', style: { fontSize: '11.5px', marginBottom: '5px' } }, 'Conflictos con el maestro:'), confBox))));

    // 3) Mantenimiento de datos
    const nBorr = () => H.getState().eventos.filter(e => !e.anulado && e.oficial !== 'Sí').length;
    const nDup = () => H.idsMPDuplicadas().size;
    const maint = h('div', { class: 's-bd' });
    const renderMaint = () => mount(maint, h('div', { class: 'btn-row' },
      h('button', { class: 'btn', onclick: () => { const n = nBorr(); if (!n) return toast('No hay borradores', 'success'); if (!window.confirm(`¿Oficializar ${n} evento(s) en borrador?`)) return; H.oficializarTodosBorradores(); H.save(); toast(`${n} eventos oficializados`, 'success'); renderMaint(); refreshChrome(); } }, `Oficializar borradores (${nBorr()})`),
      h('button', { class: 'btn', onclick: () => go('eventos', { dup: 1 }) }, `Ver MP duplicadas (${nDup()})`),
      h('button', { class: 'btn', title: 'Deja una sola MP por equipo y mes (conserva la oficial / más reciente y anula el resto)', onclick: () => { const n = nDup(); if (!n) return toast('No hay MP duplicadas', 'success'); if (!window.confirm(`¿Consolidar las MP duplicadas? Se conservará una por equipo y mes (la oficial o la más reciente) y se anularán las demás.`)) return; const k = H.consolidarMPDuplicadas(); toast(k ? `${k} MP duplicada(s) anulada(s)` : 'Sin duplicadas que consolidar', 'success'); renderMaint(); refreshChrome(); } }, `Quitar MP duplicadas (${nDup()})`),
      h('button', { class: 'btn', onclick: () => { const k = H.normalizarTiposEvento(); H.save(); toast(k ? `${k} etiquetas normalizadas` : 'Sin etiquetas que normalizar', 'success'); } }, 'Normalizar tipos de evento'),
      h('button', { class: 'btn', onclick: () => { const k = H.reconstruirCiclos(); H.save(); toast(k ? `${k} ciclos reconstruidos` : 'Ciclos ya consistentes', 'success'); refreshChrome(); } }, 'Reconstruir ciclos'),
      h('button', { class: 'btn ghost', title: 'Auditoría: quién cambió qué y cuándo', onclick: () => formHistorialCambios() }, 'Historial de cambios')));
    renderMaint();
    root.appendChild(h('div', { class: 'section' },
      h('div', { class: 's-hd' }, svg(ic.config, 16), h('h3', {}, 'Mantenimiento de datos'), h('span', { class: 's-sub' }, 'limpieza en una pasada')), maint));

    // 4) Respaldo — el Google Sheet ES el respaldo. Si está conectado, no se ofrece copia
    // JSON (sería redundante). La copia JSON queda solo como salvavidas SIN conexión.
    root.appendChild(h('div', { class: 'section' },
      h('div', { class: 's-hd' }, svg(ic.dl, 16), h('h3', {}, 'Respaldo')),
      h('div', { class: 's-bd' }, Cloud.connected
        ? h('div', { class: 'notice', style: { borderColor: 'color-mix(in srgb, var(--op) 35%, var(--border))', background: 'var(--op-bg)', color: 'color-mix(in srgb, var(--op) 80%, var(--text))' } }, '✓ Tus datos se guardan y respaldan automáticamente en el Google Sheet en cada cambio. No necesitas descargar copias.')
        : h('div', {},
          h('div', { class: 'faint', style: { fontSize: '11.5px', marginBottom: '6px' } }, 'Sin conexión al Google Sheet: los datos viven solo en este navegador. Descarga una copia JSON por seguridad o conéctate al Sheet en la sección de arriba.'),
          h('div', { class: 'btn-row' },
            h('button', { class: 'btn sm', onclick: backupExport }, svg(ic.dl, 14), 'Descargar copia JSON'),
            h('button', { class: 'btn sm', onclick: backupImport }, svg(ic.up, 14), 'Importar copia JSON'))))));
    return root;
  };

  function backupExport() { dl(new Blob([H.exportarBackupJSON()], { type: 'application/json' }), 'HHHA-respaldo-' + H.hoyLocal() + '.json'); toast('Backup JSON exportado', 'success'); }
  function backupImport() {
    const inp = h('input', { type: 'file', accept: 'application/json', style: { display: 'none' }, onchange: async e => { const f = e.target.files[0]; if (!f) return; try { const data = JSON.parse(await f.text()); const msg = `Importar backup?\n· Equipos: ${data.equipos?.length || 0}\n· Eventos: ${data.eventos?.length || 0}\nReemplaza los datos actuales.`; if (!window.confirm(msg)) return; const r = H.importarBackup(data); if (!r.ok) return toast(r.error, 'error'); toast(`Importado · ${r.eventos} eventos`, 'success'); go('inicio'); } catch (err) { toast('Error: ' + err.message, 'error'); } } });
    document.body.appendChild(inp); inp.click(); setTimeout(() => inp.remove(), 1000);
  }
  // Export Excel — "Cuaderno de operaciones" autónomo, pensado para trabajar SIN
  // la aplicación: portada con instrucciones + leyenda de códigos, tablero por
  // servicio, hoja de ruta imprimible (columnas en blanco para registrar a mano),
  // plan anual P/R, inventario, pendientes (con columnas para actualizar), ciclos
  // y bitácora. Todas las tablas con autofiltro y títulos combinados.
  function excelExport() {
    if (!window.XLSX) return toast('XLSX no disponible (sin conexión)', 'error');
    const S = H.getState(); S.equipos.forEach(H.recalcEstadoEquipo);
    const wb = XLSX.utils.book_new();
    const year = YEAR, hoy = H.hoyLocal(), periodo = MES_ESP(MONTH) + ' ' + year;
    const M = (r, c0, c1) => ({ s: { r, c: c0 }, e: { r, c: c1 } });
    function tableSheet(title, subtitle, header, rows, cols) {
      const aoa = [[title]]; aoa.push(subtitle ? [subtitle] : []);
      const headRow = aoa.length; aoa.push(header); rows.forEach(r => aoa.push(r));
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      if (cols) ws['!cols'] = cols;
      ws['!merges'] = [M(0, 0, Math.max(header.length - 1, 1))];
      ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: headRow, c: 0 }, e: { r: headRow + rows.length, c: header.length - 1 } }) };
      return ws;
    }
    const add = (ws, name) => XLSX.utils.book_append_sheet(wb, ws, name);

    // datos base
    const op = S.equipos.filter(e => e.estado === 'operativo');
    const noOp = S.equipos.filter(e => e.estado === 'no_operativo');
    const enST = S.equipos.filter(e => e.estado === 'en_servicio_tecnico');
    const baja = S.equipos.filter(e => e.estado === 'baja');
    const eqVivos = S.equipos.filter(e => e.estado !== 'baja');
    const alerta30 = S.equipos.filter(e => ['no_operativo', 'en_servicio_tecnico'].includes(e.estado) && H.diasEnEstado(e) > 30);
    const mpProg = eqVivos.filter(e => H.mpProgramadaEnMes(e, MESES[MONTH]));
    const mpEjec = mpProg.filter(e => H.mpDelMesEjecutada(e, YEAR, MONTH));
    const mpPendL = mpProg.filter(e => H.mpEstadoMes(e, YEAR, MONTH) === 'pendiente');
    const pct = mpProg.length ? Math.round(mpEjec.length / mpProg.length * 100) : 0;
    const mpAtras = eqVivos.filter(e => [...Array(MONTH).keys()].some(m => H.mpProgramadaEnMes(e, MESES[m]) && H.mpEstadoMes(e, YEAR, m) === 'pendiente'));
    const pendAb = S.pendientes.filter(p => !p.anulado && p.estado !== 'cerrado');
    const pendVenc = pendAb.filter(p => p.fechaComp && p.fechaComp < hoy);
    const ciclosAb = S.ciclos.filter(c => c.estado === 'abierto');
    const borr = S.eventos.filter(e => e.oficial !== 'Sí' && !e.anulado);

    // ===== 1) INICIO (portada + instrucciones + leyenda) =====
    const inicio = [
      ['Gestión Equipos Críticos HHHA · Cuaderno de operaciones'],
      ['Documento para trabajar SIN acceso a la aplicación'],
      [],
      ['Exportado el', hoy, '', 'Periodo MP', periodo],
      ['Equipos en catálogo', S.equipos.length, '', 'MP del mes', mpEjec.length + '/' + mpProg.length + ' (' + pct + '%)'],
      [],
      ['CÓMO USAR ESTE ARCHIVO'],
      ['1.', 'Cada hoja es independiente. Usa los filtros (▼) de los encabezados para ordenar y buscar.'],
      ['2.', '"Hoja de ruta MP" está pensada para imprimir y registrar la mantención del mes a mano.'],
      ['3.', 'Las columnas con (✎) están en blanco para que las completes tú.'],
      ['4.', 'Al volver a la aplicación, transcribe lo registrado (o importa el respaldo JSON).'],
      [],
      ['CONTENIDO'],
      ['Tablero', 'Indicadores y estado por servicio, a la fecha de exportación.'],
      ['Hoja de ruta MP', 'MP programadas del mes para ejecutar y firmar manualmente.'],
      ['Plan anual MP', 'Carta gantt: Programado (P) y Realizado (R) por mes.'],
      ['Inventario', 'Catálogo completo de equipos con su estado actual.'],
      ['Pendientes', 'Gestiones por resolver, con columnas para actualizar.'],
      ['Ciclos correctivos', 'Fallas/correctivos con apertura y cierre.'],
      ['Bitácora', 'Historial de eventos registrados.'],
      [],
      ['LEYENDA · ESTADOS DEL EQUIPO'],
      ['Operativo', 'Funciona y está disponible.'],
      ['No operativo', 'Fuera de servicio (falla / espera de repuestos).'],
      ['En servicio técnico', 'Enviado a reparación externa.'],
      ['Baja', 'Equipo dado de baja.'],
      ['Desconocido', 'Sin información de estado.'],
      [],
      ['LEYENDA · RESULTADO DE LA MP'],
      ['Si', 'Mantención preventiva realizada.'],
      ...Object.keys(CAUSALES).map(k => [k, CAUSALES[k].desc + (CAUSALES[k].reprog30 ? ' — reprogramar dentro de 30 días.' : '')]),
      ['FS', 'Equipo fuera de servicio.'],
      ['NU', 'Equipo no ubicado.'],
      ['Baja', 'Equipo dado de baja.'],
      ['No', 'No realizada.'],
      [],
      ['LEYENDA · TIPOS DE PENDIENTE'],
      ...Object.keys(TIPO_PENDIENTE).map(k => [TIPO_PENDIENTE[k], '']),
      [],
      ['LEYENDA · PROGRAMACIÓN (columna P)'],
      ['X', 'Mantención programada en el mes.'],
      ['R / RA', 'Reprogramada.'],
      ['PM', 'Puesta en marcha / programada.']
    ];
    const wsInicio = XLSX.utils.aoa_to_sheet(inicio);
    wsInicio['!cols'] = [{ wch: 22 }, { wch: 72 }, { wch: 4 }, { wch: 14 }, { wch: 18 }];
    wsInicio['!merges'] = [M(0, 0, 4), M(1, 0, 4)];
    add(wsInicio, 'Inicio');

    // ===== 2) TABLERO =====
    const servicios = [...new Set(S.equipos.map(e => e.servicio || '(sin servicio)'))].sort();
    const svcRows = servicios.map(sv => {
      const es = S.equipos.filter(e => (e.servicio || '(sin servicio)') === sv);
      const prog = es.filter(e => e.estado !== 'baja' && H.mpProgramadaEnMes(e, MESES[MONTH]));
      const ejec = prog.filter(e => H.mpDelMesEjecutada(e, YEAR, MONTH)).length;
      const pend = es.reduce((a, e) => a + H.pendientesDe(e.inv).filter(p => p.estado !== 'cerrado').length, 0);
      return [sv, es.length, es.filter(e => e.estado === 'operativo').length, es.filter(e => e.estado === 'no_operativo').length,
        es.filter(e => e.estado === 'en_servicio_tecnico').length, prog.length ? (ejec + '/' + prog.length) : '—',
        prog.length ? Math.round(ejec / prog.length * 100) + '%' : '—', pend];
    });
    const tablero = [
      ['Tablero de indicadores · ' + periodo], [],
      ['INDICADOR', 'VALOR'],
      ['Equipos en catálogo', S.equipos.length],
      ['  · Operativos', op.length],
      ['  · No operativos', noOp.length],
      ['  · En servicio técnico', enST.length],
      ['  · Baja', baja.length],
      ['Alertas (fuera de servicio > 30 días)', alerta30.length],
      ['MP programadas del mes', mpProg.length],
      ['  · Ejecutadas', mpEjec.length],
      ['  · Pendientes', mpPendL.length],
      ['  · % cumplido', pct + '%'],
      ['MP atrasadas (meses previos)', mpAtras.length],
      ['Pendientes abiertos', pendAb.length],
      ['  · Vencidos', pendVenc.length],
      ['Ciclos correctivos abiertos', ciclosAb.length],
      ['Eventos en borrador (sin oficializar)', borr.length]
    ];
    const wsTab = XLSX.utils.aoa_to_sheet(tablero);
    wsTab['!cols'] = [{ wch: 40 }, { wch: 14 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 16 }, { wch: 7 }, { wch: 13 }];
    wsTab['!merges'] = [M(0, 0, 1)];
    XLSX.utils.sheet_add_aoa(wsTab, [[], ['ESTADO POR SERVICIO'],
      ['Servicio', 'Equipos', 'Operativos', 'No oper.', 'Serv. téc.', 'MP mes (ej/prog)', '% MP', 'Pend. abiertos'],
      ...svcRows], { origin: -1 });
    add(wsTab, 'Tablero');

    // ===== 3) HOJA DE RUTA MP (imprimible, columnas en blanco) =====
    const keyMes = `${year}-${String(MONTH + 1).padStart(2, '0')}`;
    const asig = (S.asignacionesMP || {})[keyMes] || {};
    const rutaHeader = ['N° Inv.', 'Equipo', 'Servicio', 'Unidad', 'Ubicación', 'Freq', 'Responsable asignado', 'Prog.', 'Realizada ✎', 'Fecha ✎', 'Estado resultante ✎', 'Firma ✎', 'Observación ✎'];
    const rutaRows = mpProg.slice().sort((a, b) => (a.servicio || '').localeCompare(b.servicio || '')).map(e => [
      e.inv, e.equipo || '', e.servicio || '', e.unidad || '', e.ubic || '', e.freq || '', asig[e.inv] || '', (e.prog || {})[MESES[MONTH]] || '', '', '', '', '', ''
    ]);
    add(tableSheet('Hoja de ruta MP · ' + periodo, 'Imprime esta hoja y registra cada MP a medida que la ejecutas. Códigos de "Realizada" en la hoja Inicio.', rutaHeader, rutaRows,
      [{ wch: 13 }, { wch: 24 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 11 }, { wch: 24 }, { wch: 7 }, { wch: 12 }, { wch: 11 }, { wch: 18 }, { wch: 14 }, { wch: 34 }]), 'Hoja de ruta MP');

    // ===== 4) PLAN ANUAL MP (P/R por mes) =====
    const planTop = ['', '', '', '', '']; MESES.forEach(m => planTop.push(m, ''));
    const planHd = ['N° Inv.', 'Equipo', 'Servicio', 'Freq', 'Responsable']; MESES.forEach(() => planHd.push('P', 'R'));
    const planRows = S.equipos.map(e => {
      const row = [e.inv, e.equipo || '', e.servicio || '', e.freq || '', H.encargadoDe(e) || ''];
      MESES.forEach(m => { const reg = (e.registro || {})[m] || {}; row.push((reg.P || (e.prog || {})[m] || ''), (reg.R || '')); });
      return row;
    });
    const wsPlan = XLSX.utils.aoa_to_sheet([['Plan anual de mantención preventiva · ' + year], planTop, planHd, ...planRows]);
    wsPlan['!cols'] = [{ wch: 13 }, { wch: 24 }, { wch: 20 }, { wch: 10 }, { wch: 22 }, ...Array(24).fill({ wch: 4 })];
    const merges = [M(0, 0, 28)]; MESES.forEach((m, i) => merges.push(M(1, 5 + i * 2, 5 + i * 2 + 1)));
    wsPlan['!merges'] = merges;
    wsPlan['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 2, c: 0 }, e: { r: 2 + planRows.length, c: planHd.length - 1 } }) };
    add(wsPlan, `Plan anual MP ${year}`);

    // ===== 5) INVENTARIO =====
    const invHeader = ['N° Inv.', 'Carpeta', 'Serie', 'Familia', 'Equipo', 'Marca', 'Modelo', 'Servicio', 'Unidad', 'Ubicación', 'Procedencia', 'Año', 'VUR', 'Clasificación', 'Freq MP', 'Estado', 'Días en estado', 'Pend. abiertos', 'Ciclo abierto', 'Encargado'];
    const invRows = S.equipos.map(e => [e.inv, e.carpeta || '', e.serie || '', e.fam || '', e.equipo || '', e.marca || '', e.modelo || '', e.servicio || '', e.unidad || '', e.ubic || '', e.proc || '', e.ano || '', e.vur || '', e.clasif || '', e.freq || '', ESTADO_LABEL[e.estado] || e.estado, H.diasEnEstado(e), H.pendientesDe(e.inv).filter(p => p.estado !== 'cerrado').length, H.ciclosAbiertosDe(e.inv).length ? 'Sí' : 'No', H.encargadoDe(e) || '']);
    add(tableSheet('Inventario de equipos', 'Catálogo completo al ' + hoy + '.', invHeader, invRows,
      [{ wch: 13 }, { wch: 8 }, { wch: 15 }, { wch: 16 }, { wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 6 }, { wch: 5 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 13 }, { wch: 12 }, { wch: 11 }, { wch: 20 }]), 'Inventario');

    // ===== 6) PENDIENTES (con columnas para actualizar offline) =====
    const pHeader = ['ID', 'N° Inv.', 'Equipo', 'Servicio', 'Tipo', 'Descripción', 'Responsable', 'Creado', 'Compromiso', 'Estado actual', 'Avance ✎', 'Nuevo estado ✎', 'Fecha ✎'];
    const pRows = S.pendientes.filter(p => !p.anulado).sort((a, b) => (a.estado === 'cerrado' ? 1 : 0) - (b.estado === 'cerrado' ? 1 : 0) || (a.fechaComp || '9999').localeCompare(b.fechaComp || '9999')).map(p => [p.id, p.inv, p.equipo || '', p.servicio || '', TIPO_PENDIENTE[p.tipo] || p.tipo, p.desc || '', p.ejecutor || '', fmtFecha(p.fechaCrea), fmtFecha(p.fechaComp), ESTADO_PEND_LABEL[p.estado] || p.estado, '', '', '']);
    add(tableSheet('Pendientes', 'Completa las columnas (✎) para hacer seguimiento sin la aplicación.', pHeader, pRows,
      [{ wch: 5 }, { wch: 13 }, { wch: 22 }, { wch: 20 }, { wch: 18 }, { wch: 44 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 13 }, { wch: 30 }, { wch: 14 }, { wch: 11 }]), 'Pendientes');

    // ===== 7) CICLOS CORRECTIVOS =====
    const cHeader = ['N° Informe / Folio', 'N° Inv.', 'Equipo', 'Estado', 'Apertura', 'Cierre', 'Ingeniero', 'Descripción inicial'];
    const cRows = S.ciclos.slice().sort((a, b) => (a.estado === 'abierto' ? 0 : 1) - (b.estado === 'abierto' ? 0 : 1)).map(c => { const eq = H.findEquipo(c.inv) || {}; return [c.folio, c.inv, eq.equipo || '', c.estado, fmtFecha(c.fechaApertura), fmtFecha(c.fechaCierre), c.ingenieroAsignado || '', c.descripcionInicial || '']; });
    add(tableSheet('Ciclos correctivos', null, cHeader, cRows,
      [{ wch: 24 }, { wch: 13 }, { wch: 22 }, { wch: 11 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 46 }]), 'Ciclos correctivos');

    // ===== 8) BITÁCORA (historial de eventos) =====
    const bHeader = ['Fecha', 'N° Inv.', 'Equipo', 'Servicio', 'Tipo', 'Resultado', 'Estado', 'Ejecutor', 'N° Informe / Folio', 'Oficial', 'Observación'];
    const bRows = S.eventos.filter(e => !e.anulado && !H.eventoEsAuto(e)).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).map(e => [fmtFecha(e.fecha), e.inv, e.equipo || '', e.servicio || '', H.etiquetaTipoEvento(e), e.resultado || '', e.estado || '', e.ejecutor || '', e.folio || '', e.oficial || 'No', e.obs || '']);
    add(tableSheet('Bitácora de eventos', null, bHeader, bRows,
      [{ wch: 12 }, { wch: 13 }, { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 8 }, { wch: 44 }]), 'Bitácora');

    dl(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' }), `HHHA_cuaderno_${hoy}.xlsx`);
    toast(`Excel exportado · ${wb.SheetNames.length} hojas`, 'success');
  }
  function descargarPlantilla(y, m) {
    if (!window.XLSX) return toast('XLSX no disponible', 'error');
    const d = H.construirAsignacionMP(y, m);
    if (!d.rows.length) return toast(`Sin equipos programados en ${MES_ESP(m)} ${y}`, 'warn-backup');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([d.header, ...d.rows]); XLSX.utils.book_append_sheet(wb, ws, 'Asignación');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Responsable oficial'], ...EJECUTORES.map(e => [e])]), 'Responsables_oficiales');
    dl(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' }), `Plantilla_${MES_ESP(m)}_${y}.xlsx`);
    toast(`Plantilla: ${d.rows.length} equipos`, 'success');
  }
  function subirPlantilla(y, m) {
    if (!window.XLSX) return toast('XLSX no disponible', 'error');
    const inp = h('input', { type: 'file', accept: '.xlsx,.xls', style: { display: 'none' }, onchange: async e => { const f = e.target.files[0]; if (!f) return; try { const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' }); const hoja = wb.SheetNames.find(n => /asignaci/i.test(n)) || wb.SheetNames[0]; const rows = XLSX.utils.sheet_to_json(wb.Sheets[hoja], { header: 1, defval: null, blankrows: false }); const r = H.procesarPlantillaMP(rows, y, m); if (!r.ok) return toast(r.error, 'error'); toast(`${r.cargadas} asignaciones cargadas en ${r.mes} ${r.year}`, 'success'); } catch (err) { toast('Error: ' + err.message, 'error'); } } });
    document.body.appendChild(inp); inp.click(); setTimeout(() => inp.remove(), 1000);
  }
  async function importarMaestro(after) {
    if (!window.XLSX) return toast('XLSX no disponible (sin conexión)', 'error');
    const inp = h('input', { type: 'file', accept: '.xlsx,.xlsm,.xls', style: { display: 'none' }, onchange: async e => {
      const f = e.target.files[0]; if (!f) return;
      toast('Procesando maestro…', '');
      try {
        const S = H.getState(); const impId = S.counters.importacion++; S.importaciones.push({ id: impId, fecha: new Date().toISOString(), archivo: f.name, resueltos: 0 });
        const parsed = await H.parsearMaestro(f); const res = H.compararMaestro(parsed, impId); H.save();
        toast(`Maestro conciliado · ${res.oficializados || 0} oficializadas (coinciden) · ${res.eventosSinteticos} importadas · ${res.autoCompletados} auto-completadas · ${res.conflictos} conflictos`, 'success');
        after && after();
      } catch (err) { toast('Error: ' + err.message, 'error'); }
    } });
    document.body.appendChild(inp); inp.click(); setTimeout(() => inp.remove(), 1000);
  }

  // ============================ chrome (rail/topbar) ========================
  const railNav = h('nav', { class: 'topnav' });
  const navItems = {};
  function buildRail() {
    mount(railNav, ...NAV.map(n => { const it = h('button', { class: 'nav-item', onclick: () => go(n.id) }, svg(ic[n.icon], 16), h('span', {}, n.label), h('span', { class: 'badge-count', style: { display: 'none' } })); navItems[n.id] = it; return it; }));
  }
  function syncNav() { for (const id in navItems) navItems[id].classList.toggle('active', id === view || (view === 'equipo' && id === 'equipos') || (view === 'ciclos' && id === 'eventos') || (view === 'asignaciones' && id === 'cumplimiento')); }
  function refreshChrome() {
    const S = H.getState();
    const counts = {
      pendientes: S.pendientes.filter(p => !p.anulado && p.estado !== 'cerrado').length,
      conciliacion: (S.conflictos || []).filter(c => c.estado === 'pendiente' || c.estado === 'pospuesto').length,
      ciclos: S.ciclos.filter(c => c.estado === 'abierto').length
    };
    for (const id in navItems) {
      const b = navItems[id].querySelector('.badge-count'); const n = counts[id];
      if (n) { b.textContent = n; b.style.display = ''; navItems[id].classList.toggle('alarm', id === 'conciliacion' && n > 0); } else b.style.display = 'none';
    }
    const ind = $('#state-ind'); if (ind) ind.textContent = `${S.__userActions || 0} cambios`;
  }

  function renderView() {
    const v = (VIEWS[view] || VIEWS.inicio);
    const node = v();
    mount($('#view'), node);
    const titles = { inicio: 'Cola de trabajo', equipos: 'Equipos', tablero: 'Tablero por estado', equipo: 'Ficha de equipo', pendientes: 'Pendientes', ciclos: 'Ciclos correctivos', eventos: 'Bitácora de eventos', asignaciones: 'MP del mes · detalle', cumplimiento: 'Cumplimiento por servicio', configuracion: 'Configuración' };
    const t = titles[view] || 'Gestión Equipos Críticos HHHA';
    const tt = $('#tb-title'); if (tt) tt.textContent = t;
    document.title = 'Gestión Equipos Críticos HHHA' + (view === 'inicio' ? '' : ' · ' + t);
  }

  // ============================ helpers final ===============================
  function MES_ESP(i) { return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][i]; }
  window.MES_ESP = MES_ESP; // usado por algunas vistas

  function applyTheme(t) { document.documentElement.setAttribute('data-theme', t); localStorage.setItem('sigem_theme', t); const b = $('#btn-theme'); if (b) mount(b, svg(t === 'dark' ? ic.sun : ic.moon, 16)); }
  function applyDensity(d) { document.documentElement.setAttribute('data-density', d); localStorage.setItem('sigem_density', d); const b = $('#btn-density'); if (b) b.title = d === 'comodo' ? 'Densidad: cómoda (clic → compacta)' : 'Densidad: compacta (clic → cómoda)'; }

  // Recordatorio automático al abrir la app: avisa de pendientes vencidos y
  // recordatorios (proxRecord) para hoy, con acceso directo a revisarlos.
  function recordatoriosAlAbrir() {
    const S = H.getState(); const hoy = H.hoyLocal();
    const act = S.pendientes.filter(p => !p.anulado && p.estado !== 'cerrado');
    const vencidos = act.filter(p => p.fechaComp && p.fechaComp < hoy).length;
    const recordHoy = act.filter(p => p.proxRecord && p.proxRecord <= hoy).length;
    if (!vencidos && !recordHoy) return;
    const partes = [];
    if (vencidos) partes.push(`${vencidos} pendiente${vencidos !== 1 ? 's' : ''} vencido${vencidos !== 1 ? 's' : ''}`);
    if (recordHoy) partes.push(`${recordHoy} recordatorio${recordHoy !== 1 ? 's' : ''} para hoy`);
    toast('⏰ ' + partes.join(' · '), 'warn-backup', { label: 'Revisar', run: () => go('pendientes', (recordHoy && !vencidos) ? { record: 1 } : { vencidos: 1 }) });
  }

  // ============================ BOOT ========================================
  function boot() {
    if (window.XLSX) H.configure({ env: { xlsx: window.XLSX } });
    H.setSeed(window.SEED || {});
    H.bootstrapDatos();

    const app = h('div', { class: 'app' },
      h('header', { class: 'topbar' },
        h('div', { class: 'brand', title: 'Gestión Equipos Críticos HHHA' }, h('span', { class: 'mark' }, 'H'), h('span', { class: 'brand-name s-hide' }, 'HHHA')),
        railNav,
        h('div', { class: 'tb-spacer' }),
        h('div', { class: 'search-pill', onclick: () => openCmdk() }, svg(ic.search, 15), h('span', { class: 'muted s-hide' }, 'Buscar…'), h('span', { class: 'kbd s-hide' }, '⌘K')),
        h('span', { class: 'pill muted s-hide', id: 'state-ind', title: 'Cambios desde el arranque' }, '0 cambios'),
        h('button', { class: 'btn icon ghost', id: 'btn-density', title: 'Densidad', onclick: () => applyDensity(document.documentElement.getAttribute('data-density') === 'comodo' ? 'compacto' : 'comodo') }, svg(ic.density, 16)),
        h('button', { class: 'btn icon ghost', id: 'btn-theme', title: 'Tema', onclick: () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark') }),
        h('button', { class: 'btn icon ghost s-hide', title: 'Exportar libro Excel', onclick: excelExport }, svg(ic.dl, 16)),
        h('button', { class: 'btn icon ghost', title: 'Configuración', onclick: () => go('configuracion') }, svg(ic.config, 16)),
        h('span', { class: 'u-avatar', title: 'Cristian · ' + APP_VERSION }, 'C'),
        h('span', { id: 'tb-title', style: { display: 'none' } })),
      h('main', { class: 'view', id: 'view' }));
    mount(document.getElementById('root'), app);

    buildRail();
    applyTheme(localStorage.getItem('sigem_theme') || 'light');
    applyDensity(localStorage.getItem('sigem_density') || 'compacto');
    fromHash();
    renderView(); syncNav(); refreshChrome();
    setTimeout(recordatoriosAlAbrir, 600);
    if (Cloud.auto && Cloud.connected) { setTimeout(() => { Cloud.pull().then(r => { if (r && r.ok) { renderView(); refreshChrome(); toast('Sincronizado desde Google Sheets', 'success'); } }).catch(e => toast('Google Sheets: ' + e.message, 'error')); }, 400); }

    window.addEventListener('hashchange', () => { if (suppressHash) { suppressHash = false; return; } fromHash(); renderView(); syncNav(); });
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); cmdkEl ? closeCmdk() : openCmdk(); }
      else if (e.key === 'Escape') { if (cmdkEl) closeCmdk(); else if (drawerOpen) closeDrawer(); else closePop(); }
      else if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && !drawerOpen && !cmdkEl) { e.preventDefault(); openCmdk(); }
      else if ((e.key === 'j' || e.key === 'k') && kbList && !drawerOpen && !cmdkEl && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) {
        const rows = [...document.querySelectorAll('#view table.dense tbody tr')]; if (!rows.length) return;
        kbList.idx = Math.max(0, Math.min((kbList.idx < 0 ? 0 : kbList.idx + (e.key === 'j' ? 1 : -1)), rows.length - 1));
        rows.forEach(r => r.classList.remove('kb-focus')); const r = rows[kbList.idx]; if (r) { r.classList.add('kb-focus'); r.scrollIntoView && r.scrollIntoView({ block: 'nearest' }); }
      }
      else if (e.key === 'Enter' && kbList && kbList.idx >= 0 && !drawerOpen && !cmdkEl && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) { kbList.open(kbList.rows[kbList.idx]); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
