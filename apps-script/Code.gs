/****************************************************************************
 * SIGEM · Backend de almacenamiento en Google Sheets (Apps Script Web App)
 * --------------------------------------------------------------------------
 * Guarda el estado de SIGEM (JSON comprimido) en una hoja OCULTA `_SIGEM_DATA`
 * y escribe además las hojas de trabajo legibles que envía la app (para poder
 * trabajar con el archivo aunque no se tenga el programa).
 *
 * CÓMO INSTALARLO
 *   1. Crea (o abre) un Google Sheet nuevo para SIGEM.
 *   2. Menú  Extensiones → Apps Script.  Borra el contenido y pega este archivo.
 *   3. (Opcional) define un token compartido: edita SHARED_TOKEN abajo con una
 *      clave secreta (la misma que pondrás en la app). Déjalo '' para acceso libre.
 *   4. Implementar → Nueva implementación → tipo "Aplicación web".
 *        · Ejecutar como: Yo
 *        · Quién tiene acceso: Cualquiera
 *      Copia la URL .../exec y pégala en SIGEM → Configuración.
 *   5. La primera vez te pedirá autorizar permisos sobre la hoja: acepta.
 *
 * Reimplementa (Implementar → Gestionar implementaciones → editar → Nueva versión)
 * cada vez que cambies este código.
 ****************************************************************************/

var SHARED_TOKEN = '';            // ← pon aquí una clave y la misma en la app (o deja '' = abierto)
var DATA_SHEET   = '_SIGEM_DATA'; // hoja de sistema (oculta) con el JSON comprimido
var META_SHEET   = '_SIGEM_META'; // hoja de sistema (oculta) con metadatos
var CHUNK        = 45000;         // tamaño de trozo por celda (límite de celda: 50.000)

function doGet(e) {
  try {
    e = e || {}; var p = e.parameter || {};
    if (p.api === 'read') {                       // modo HTTP: la app abierta FUERA de Apps Script
      if (!okToken(p.token)) return _json({ ok: false, error: 'token invalido' });
      return _json({ ok: true, dataB64: readData(), updated: readMeta('updated') });
    }
    // Por defecto: SERVIR LA APP (verla desde cualquier parte con la URL .../exec).
    try {
      return HtmlService.createHtmlOutputFromFile('Index')
        .setTitle('SIGEM · Equipos Biomédicos Críticos')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (e2) {
      return HtmlService.createHtmlOutput('<h2 style="font-family:sans-serif">Falta el archivo <b>Index.html</b></h2>' +
        '<p style="font-family:sans-serif">Crea un archivo HTML llamado <b>Index</b> en este proyecto de Apps Script y pega el contenido de <code>app.html</code>. Luego reimplementa. Detalle: ' + e2 + '</p>');
    }
  } catch (err) { return _json({ ok: false, error: String(err) }); }
}

/* API para google.script.run — la usa la app cuando se sirve desde este Apps
 * Script (mismo origen, sin CORS). El control de acceso lo da la implementación. */
function apiRead() { return { ok: true, dataB64: readData(), updated: readMeta('updated') }; }
function apiSaveData(dataB64) { writeData(String(dataB64 || '')); writeMeta('updated', new Date().toISOString()); return { ok: true, ts: new Date().toISOString() }; }
function apiSaveSheets(sheets) { writeSheets(sheets || []); hideSystemSheets(); return { ok: true }; }
// Guarda en una sola llamada: estado del sistema (oculto) + hojas legibles visibles.
function apiSave(payload) {
  payload = payload || {};
  if (typeof payload.dataB64 === 'string') { writeData(payload.dataB64); writeMeta('updated', new Date().toISOString()); }
  if (Array.isArray(payload.sheets)) writeSheets(payload.sheets);
  hideSystemSheets();
  return { ok: true, ts: new Date().toISOString() };
}

/* ===================== ARCHIVOS EN GOOGLE DRIVE ============================
 * Estructura: carpeta raíz "Gestión Equipos Críticos HHHA · Archivos" (su id se
 * guarda en _SIGEM_META) y una SUBCARPETA por equipo (nombre = N° inventario).
 * Requiere el permiso de Drive (la 1ª vez Apps Script lo pedirá al autorizar). */
function _driveRoot() {
  var id = readMeta('driveRoot');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var name = 'Gestión Equipos Críticos HHHA · Archivos';
  var it = DriveApp.getFoldersByName(name);
  var f = it.hasNext() ? it.next() : DriveApp.createFolder(name);
  writeMeta('driveRoot', f.getId());
  return f;
}
function _equipoFolder(inv, create) {
  var root = _driveRoot();
  var it = root.getFoldersByName(String(inv));
  if (it.hasNext()) return it.next();
  return create ? root.createFolder(String(inv)) : null;
}
function _fileInfo(f) { return { id: f.getId(), name: f.getName(), url: f.getUrl(), fecha: f.getLastUpdated().toISOString(), size: f.getSize() }; }

// Sube un archivo a la carpeta del equipo. p = {inv, nombre, mime, dataB64}
function apiSubirArchivo(p) {
  p = p || {};
  if (!p.inv || !p.nombre || !p.dataB64) return { ok: false, error: 'Datos incompletos' };
  try {
    var bytes = Utilities.base64Decode(p.dataB64);
    var blob = Utilities.newBlob(bytes, p.mime || 'application/octet-stream', p.nombre);
    var file = _equipoFolder(p.inv, true).createFile(blob);
    return { ok: true, archivo: _fileInfo(file) };
  } catch (e) { return { ok: false, error: String(e) }; }
}
// Lista los archivos de la carpeta del equipo. Devuelve {ok, archivos:[...]}
function apiArchivosDe(inv) {
  try {
    var folder = _equipoFolder(inv, false);
    if (!folder) return { ok: true, archivos: [] };
    var it = folder.getFiles(), out = [];
    while (it.hasNext()) out.push(_fileInfo(it.next()));
    out.sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
    return { ok: true, archivos: out };
  } catch (e) { return { ok: false, error: String(e) }; }
}
// Envía un archivo a la papelera. p = {id}
function apiEliminarArchivo(p) {
  p = p || {};
  try { if (p.id) DriveApp.getFileById(p.id).setTrashed(true); return { ok: true }; }
  catch (e) { return { ok: false, error: String(e) }; }
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!okToken(body.token)) return _json({ ok: false, error: 'token invalido' });
    if (typeof body.dataB64 === 'string') { writeData(body.dataB64); writeMeta('updated', new Date().toISOString()); }
    if (Array.isArray(body.sheets)) writeSheets(body.sheets);
    hideSystemSheets();
    return _json({ ok: true, ts: new Date().toISOString() });
  } catch (err) { return _json({ ok: false, error: String(err) }); }
}

/* ----------------------------- helpers ---------------------------------- */
function _json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function okToken(t) { return !SHARED_TOKEN || String(t || '') === SHARED_TOKEN; }
function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheetByName(name, create) {
  var sh = ss().getSheetByName(name);
  if (!sh && create) sh = ss().insertSheet(name);
  return sh;
}

function readData() {
  var sh = sheetByName(DATA_SHEET, false);
  if (!sh) return '';
  var last = sh.getLastRow();
  if (last < 1) return '';
  var vals = sh.getRange(1, 1, last, 1).getValues();
  return vals.map(function (r) { return r[0]; }).join('');
}
function writeData(b64) {
  var sh = sheetByName(DATA_SHEET, true);
  sh.clear();
  var chunks = [];
  for (var i = 0; i < b64.length; i += CHUNK) chunks.push([b64.substr(i, CHUNK)]);
  if (!chunks.length) chunks = [['']];
  sh.getRange(1, 1, chunks.length, 1).setValues(chunks);
  sh.hideSheet();
}
function readMeta(k) {
  var sh = sheetByName(META_SHEET, false); if (!sh) return '';
  var v = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 2).getValues();
  for (var i = 0; i < v.length; i++) if (v[i][0] === k) return v[i][1];
  return '';
}
function writeMeta(k, val) {
  var sh = sheetByName(META_SHEET, true);
  var v = sh.getLastRow() ? sh.getRange(1, 1, sh.getLastRow(), 2).getValues() : [];
  var found = false;
  for (var i = 0; i < v.length; i++) if (v[i][0] === k) { v[i][1] = val; found = true; }
  if (!found) v.push([k, val]);
  sh.clear(); sh.getRange(1, 1, v.length, 2).setValues(v); sh.hideSheet();
}

/* ESTRUCTURA DEL LIBRO (se aplica en cada sincronización)
 *   · Hojas de TRABAJO (Inicio, Inventario, Plan anual MP…, Hoja de ruta…,
 *     Pendientes, Bitácora): VISIBLES y ordenadas al frente, en el orden que
 *     envía la app, con la fila de encabezado fija y en negrita.
 *   · Hojas de SISTEMA (las que empiezan con "_": _SIGEM_DATA, _SIGEM_META):
 *     OCULTAS. Guardan el estado comprimido y los metadatos; no editarlas.
 *   · La hoja por defecto vacía que crea Google ("Hoja 1"/"Sheet1") se elimina.
 */
function isSystem(name) { return String(name).charAt(0) === '_'; }

// Escribe las hojas de trabajo legibles que envía la app: [{name, rows, hidden, headerRow}]
function writeSheets(sheets) {
  var order = [], sent = {};
  (sheets || []).forEach(function (spec) {
    if (!spec || !spec.name) return;
    sent[spec.name] = true;
    var sh = sheetByName(spec.name, true);
    sh.clear();
    var rows = spec.rows || [];
    var maxc = 1;
    if (rows.length) {
      rows.forEach(function (r) { if (r.length > maxc) maxc = r.length; });
      var norm = rows.map(function (r) { var a = r.slice(); while (a.length < maxc) a.push(''); return a; });
      sh.getRange(1, 1, norm.length, maxc).setValues(norm);
      var hr = (spec.headerRow != null) ? spec.headerRow : 1;
      sh.setFrozenRows(hr);
      if (hr >= 1) sh.getRange(1, 1, 1, maxc).setFontWeight('bold');
    }
    // Recortar filas/columnas sobrantes. Se deja SIEMPRE ≥1 fila NO inmovilizada: si la hoja
    // sólo trae encabezado (sin datos) y está inmovilizado, Sheets no permite borrar todas
    // las filas no inmovilizadas → "No se pueden eliminar todas las filas que no estén inmovilizadas".
    var usedC = Math.max(maxc, 1);
    var keepR = Math.max(rows.length, 1, sh.getFrozenRows() + 1);
    if (sh.getMaxRows() > keepR) sh.deleteRows(keepR + 1, sh.getMaxRows() - keepR);
    if (sh.getMaxColumns() > usedC) sh.deleteColumns(usedC + 1, sh.getMaxColumns() - usedC);
    if (spec.hidden || isSystem(spec.name)) sh.hideSheet();
    else { sh.showSheet(); order.push(spec.name); }
  });
  arrangeWorkbook(order);
  pruneRetiredSheets(sent);
}

// Borra hojas que SIGEM generó en versiones anteriores y hoy ya NO envía (huérfanas).
// Lista blanca de nombres SIGEM conocidos: SÓLO se eliminan esos. Cualquier hoja que el
// usuario haya creado a mano (otro nombre) NO se toca. Si en el futuro se renombran hojas,
// agrega aquí el nombre antiguo. Las del envío actual y las de sistema ("_") se conservan.
var SIGEM_RETIRADAS = ['Correctivos', 'MP por mes', 'En servicio técnico', 'No operativos'];
var SIGEM_RETIRADAS_PREFIJO = ['Plan anual MP', 'Hoja de ruta'];
function esHojaSigemRetirada(name) {
  if (SIGEM_RETIRADAS.indexOf(name) !== -1) return true;
  for (var i = 0; i < SIGEM_RETIRADAS_PREFIJO.length; i++) {
    if (name.indexOf(SIGEM_RETIRADAS_PREFIJO[i]) === 0) return true;
  }
  return false;
}
function pruneRetiredSheets(sent) {
  sent = sent || {};
  var spread = ss();
  spread.getSheets().forEach(function (sh) {
    var name = sh.getName();
    if (sent[name] || isSystem(name)) return;        // hoja viva del envío actual o de sistema → conservar
    if (!esHojaSigemRetirada(name)) return;          // no es una hoja SIGEM conocida → es del usuario → conservar
    if (spread.getSheets().length <= 1) return;      // nunca dejar el libro sin hojas
    try { spread.deleteSheet(sh); } catch (e) {}
  });
}

// Deja las hojas de trabajo (en 'order') visibles y al frente, y las de sistema
// ocultas. Elimina la hoja por defecto vacía y garantiza ≥1 hoja visible.
function arrangeWorkbook(order) {
  var spread = ss(); order = order || [];
  pruneDefaultSheet(order);
  // 1) Hojas de trabajo al frente (están visibles → se pueden activar/mover).
  var pos = 1;
  order.forEach(function (name) {
    var sh = spread.getSheetByName(name);
    if (!sh) return;
    sh.showSheet(); spread.setActiveSheet(sh); spread.moveActiveSheet(pos++);
  });
  // 2) Ocultar las de sistema (al estar ocultas su posición es indiferente).
  spread.getSheets().forEach(function (sh) {
    if (isSystem(sh.getName())) { try { sh.hideSheet(); } catch (e) {} }
  });
  ensureVisible();
}

// Compatibilidad: ordena/oculta sistema sin reposicionar las de trabajo.
function hideSystemSheets() { arrangeWorkbook(); }

// Borra la hoja por defecto vacía ("Hoja 1"/"Sheet1"…) que no sea de trabajo ni de sistema.
function pruneDefaultSheet(order) {
  var spread = ss();
  var keep = {}; (order || []).forEach(function (n) { keep[n] = true; });
  var DEFAULTS = ['Hoja 1', 'Hoja1', 'Hoja de cálculo 1', 'Sheet1', 'Sheet', 'Sin título', 'Untitled'];
  spread.getSheets().forEach(function (sh) {
    var name = sh.getName();
    if (keep[name] || isSystem(name)) return;
    if (DEFAULTS.indexOf(name) === -1) return;
    if (sh.getLastRow() === 0 && sh.getLastColumn() === 0 && spread.getSheets().length > 1) {
      try { spread.deleteSheet(sh); } catch (e) {}
    }
  });
}

// Sheets no permite ocultar todas las hojas: asegura que quede una visible.
function ensureVisible() {
  var sheets = ss().getSheets();
  if (!sheets.length || sheets.some(function (sh) { return !sh.isSheetHidden(); })) return;
  var target = null;
  for (var i = 0; i < sheets.length; i++) { if (!isSystem(sheets[i].getName())) { target = sheets[i]; break; } }
  (target || sheets[0]).showSheet();
}
