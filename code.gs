/** Apps Script pegado al Excel INCIDENCIAS.
 *  Hoja 1 (antigua): archivo. No se escribe más ahí.
 *  Hoja ACUMULADOS: cantidades por incidencia. Sin Llamada/Carta/DT. Sin duplicados. */
var SHEET_ACTIVA = "ACUMULADOS";

var COUNT_COLS = [
  { id: "instruccion", header: "Instrucción" },
  { id: "tardia", header: "Tardía" },
  { id: "falta", header: "Inasistencia" },
  { id: "epp", header: "EPP" },
  { id: "bpa", header: "BPA" },
  { id: "fruta", header: "Fruta" },
  { id: "conducta", header: "Conducta" }
];

var HEADERS = [
  "Código",
  "Fecha",
  "Hora",
  "Trabajador",
  "DNI",
  "Cargo",
  "Nivel",
  "Incidencia",
  "Responsable",
  "DNI responsable"
].concat(COUNT_COLS.map(function (item) { return item.header; })).concat([
  "Acumulado",
  "Texto"
]);

function doGet(e) {
  var params = e && e.parameter ? e.parameter : {};
  return json_(withLock_(function () {
    var activa = sheetActiva_();
    var archivo = sheetArchivo_();
    if (params.dni) return leerDni_(activa, archivo, String(params.dni));
    return leerRecientes_(activa, archivo, 1);
  }));
}

function doPost(e) {
  var body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (error) {
    body = {};
  }
  withLock_(function () {
    var sh = sheetActiva_();
    if (body.action === "delete" && body.id) {
      borrarFila_(sh, body.id);
      return;
    }
    var acta = body.acta || body;
    if (acta && acta.id) {
      delete acta.pending;
      delete acta.synced;
      delete acta.confirmado;
      guardarFila_(sh, acta);
    }
  });
  return json_({ ok: true });
}

/** Ejecutar una vez: recrea encabezados de ACUMULADOS (cantidades). No toca la hoja antigua. */
function crearEncabezados() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("El script tiene que estar dentro del Excel INCIDENCIAS.");
  var sh = ss.getSheetByName(SHEET_ACTIVA);
  if (!sh) sh = ss.insertSheet(SHEET_ACTIVA);
  var saved = readActas_(sh);
  sh.clear();
  while (sh.getMaxColumns() < HEADERS.length) sh.insertColumnsAfter(sh.getMaxColumns(), 1);
  if (sh.getMaxColumns() > HEADERS.length) {
    sh.deleteColumns(HEADERS.length + 1, sh.getMaxColumns() - HEADERS.length);
  }
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (saved.length) writeAll_(sh, dedupeActas_(saved));
  formatearHoja_(sh);
}

function sheetArchivo_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("El script tiene que estar dentro del Excel INCIDENCIAS.");
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName() !== SHEET_ACTIVA) return sheets[i];
  }
  return sheets[0] || null;
}

function sheetActiva_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("El script tiene que estar dentro del Excel INCIDENCIAS.");
  var sh = ss.getSheetByName(SHEET_ACTIVA);
  if (!sh) {
    sh = ss.insertSheet(SHEET_ACTIVA);
    asegurarEncabezados_(sh, true);
  } else {
    asegurarEncabezados_(sh, false);
  }
  return sh;
}

function asegurarEncabezados_(sh, force) {
  var width = Math.max(sh.getLastColumn(), HEADERS.length);
  var first = width ? sh.getRange(1, 1, 1, width).getValues()[0] : [];
  var missing = force || !first.length || HEADERS.some(function (name, index) {
    return first[index] !== name;
  });
  if (!missing) return;
  var saved = readActas_(sh);
  sh.clear();
  while (sh.getMaxColumns() < HEADERS.length) sh.insertColumnsAfter(sh.getMaxColumns(), 1);
  if (sh.getMaxColumns() > HEADERS.length) {
    sh.deleteColumns(HEADERS.length + 1, sh.getMaxColumns() - HEADERS.length);
  }
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (saved.length) writeAll_(sh, dedupeActas_(saved));
  else formatearHoja_(sh);
}

function formatearHoja_(sh) {
  if (!sh) return;
  try { sh.setTabColor("#1F8A3B"); } catch (e) {}
  sh.setFrozenRows(1);
  sh.setRowHeight(1, 36);
  var head = sh.getRange(1, 1, 1, HEADERS.length);
  head.setValues([HEADERS]);
  head
    .setFontFamily("Arial")
    .setFontSize(9)
    .setFontWeight("bold")
    .setFontColor("#FFFFFF")
    .setBackground("#1F3D2A")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);
  var widths = [118, 92, 58, 200, 86, 84, 120, 160, 170, 100, 78, 64, 88, 52, 52, 58, 78, 78, 300];
  for (var i = 0; i < HEADERS.length; i++) {
    sh.setColumnWidth(i + 1, widths[i] || 90);
  }
  var last = Math.max(sh.getLastRow(), 2);
  var rows = Math.max(last - 1, 1);
  var body = sh.getRange(2, 1, rows, HEADERS.length);
  body
    .setFontFamily("Arial")
    .setFontSize(10)
    .setFontColor("#2C3330")
    .setVerticalAlignment("middle")
    .setWrap(false);
  sh.getRange(2, colIndex_("Fecha"), rows, 2).setHorizontalAlignment("center");
  sh.getRange(2, colIndex_("DNI"), rows, 1).setHorizontalAlignment("center");
  sh.getRange(2, colIndex_("Instrucción"), rows, COUNT_COLS.length + 1).setHorizontalAlignment("center");
  sh.getRange(2, colIndex_("Texto"), rows, 1).setWrap(false);
  sh.getRange(2, 1, Math.max(rows, 400), HEADERS.length)
    .setBorder(true, true, true, true, true, true, "#D7DED8", SpreadsheetApp.BorderStyle.SOLID);
  aplicarZebra_(sh);
  colorearCantidades_(sh);
  try {
    var filter = sh.getFilter();
    if (filter) filter.remove();
    sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), HEADERS.length).createFilter();
  } catch (err) {}
}

function aplicarZebra_(sh) {
  var last = sh.getLastRow();
  if (last < 2) return;
  for (var r = 2; r <= last; r++) {
    sh.getRange(r, 1, 1, HEADERS.length).setBackground(r % 2 === 0 ? "#F7FAF7" : "#FFFFFF");
  }
}

function colorearCantidades_(sh) {
  var last = sh.getLastRow();
  if (last < 2) return;
  var start = colIndex_("Instrucción");
  var end = colIndex_("Acumulado");
  var values = sh.getRange(2, start, last - 1, end - start + 1).getValues();
  var backgrounds = values.map(function (row) {
    return row.map(function (value) {
      var n = Number(value) || 0;
      if (n >= 3) return "#FDECEC";
      if (n === 2) return "#FFF8EB";
      if (n === 1) return "#EAF5EC";
      return null;
    });
  });
  sh.getRange(2, start, last - 1, end - start + 1).setBackgrounds(backgrounds);
}

function pintarCantidades_(sh, fila, conteos, acumulado) {
  var start = colIndex_("Instrucción");
  var colors = COUNT_COLS.map(function (item) {
    var n = Number((conteos && conteos[item.id]) || 0);
    if (n >= 3) return "#FDECEC";
    if (n === 2) return "#FFF8EB";
    if (n === 1) return "#EAF5EC";
    return fila % 2 === 0 ? "#F7FAF7" : "#FFFFFF";
  });
  var maxN = Number(acumulado) || 0;
  colors.push(maxN >= 3 ? "#FDECEC" : maxN === 2 ? "#FFF8EB" : maxN === 1 ? "#EAF5EC" : (fila % 2 === 0 ? "#F7FAF7" : "#FFFFFF"));
  sh.getRange(fila, start, 1, COUNT_COLS.length + 1)
    .setBackgrounds([colors])
    .setHorizontalAlignment("center")
    .setFontWeight("bold");
}

function colIndex_(name) {
  return HEADERS.indexOf(name) + 1;
}

function headerRow_(sh) {
  var lastCol = Math.max(sh.getLastColumn(), 1);
  return sh.getRange(1, 1, 1, lastCol).getValues()[0];
}

function readActas_(sh) {
  if (!sh) return [];
  var last = sh.getLastRow();
  if (last < 2) return [];
  var header = headerRow_(sh);
  var rows = sh.getRange(2, 1, last - 1, header.length).getValues();
  return rows.reduce(function (list, row) {
    var acta = actaDeFila_(header, row);
    if (acta) list.push(acta);
    return list;
  }, []);
}

function dedupeActas_(lista) {
  var seen = {};
  var out = [];
  for (var i = lista.length - 1; i >= 0; i--) {
    var acta = lista[i];
    if (!acta || !acta.id) continue;
    var key = String(acta.id);
    if (seen[key]) continue;
    seen[key] = true;
    out.unshift(acta);
  }
  return out;
}

function leerRecientes_(activa, archivo, dias) {
  var recientes = [];
  function tomar(sh) {
    if (!sh) return;
    var last = sh.getLastRow();
    if (last < 2) return;
    var start = Math.max(2, last - 399);
    var header = headerRow_(sh);
    var rows = sh.getRange(start, 1, last - start + 1, header.length).getValues();
    rows.forEach(function (row) {
      var acta = actaDeFila_(header, row);
      if (acta && esReciente_(row[1], dias)) recientes.push(acta);
    });
  }
  tomar(activa);
  tomar(archivo);
  return dedupeActas_(recientes);
}

function leerDni_(activa, archivo, dni) {
  var list = [];
  function tomar(sh) {
    if (!sh) return;
    var last = sh.getLastRow();
    if (last < 2) return;
    var header = headerRow_(sh);
    var values = sh.getRange(2, 1, last - 1, header.length).getValues();
    var col = header.indexOf("DNI");
    if (col < 0) return;
    var wanted = String(dni);
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][col]) !== wanted) continue;
      var acta = actaDeFila_(header, values[i]);
      if (acta) list.push(acta);
    }
  }
  tomar(archivo);
  tomar(activa);
  return dedupeActas_(list);
}

function esReciente_(fecha, dias) {
  var f = fecha;
  if (Object.prototype.toString.call(f) !== "[object Date]") {
    var parts = String(fecha || "").split("/");
    if (parts.length !== 3) return true;
    f = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  }
  if (isNaN(f.getTime())) return true;
  var limite = new Date();
  limite.setHours(0, 0, 0, 0);
  limite.setDate(limite.getDate() - (dias - 1));
  return f >= limite;
}

function guardarFila_(sh, acta) {
  var last = sh.getLastRow();
  var fila = last + 1;
  if (last >= 2) {
    var ids = sh.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(acta.id)) {
        fila = i + 2;
        break;
      }
    }
  }
  var conteos = conteosDe_(acta);
  var acumulado = acumuladoDe_(conteos);
  var rango = sh.getRange(fila, 1, 1, HEADERS.length);
  rango.setValues([rowFromActa_(acta)]);
  rango
    .setFontFamily("Arial")
    .setFontSize(10)
    .setFontColor("#2C3330")
    .setVerticalAlignment("middle")
    .setBorder(true, true, true, true, false, false, "#D7DED8", SpreadsheetApp.BorderStyle.SOLID);
  rango.setBackground(fila % 2 === 0 ? "#F7FAF7" : "#FFFFFF");
  sh.getRange(fila, colIndex_("Fecha"), 1, 2).setHorizontalAlignment("center");
  sh.getRange(fila, colIndex_("DNI")).setHorizontalAlignment("center");
  pintarCantidades_(sh, fila, conteos, acumulado);
  sh.getRange(fila, colIndex_("Texto")).setWrap(false);
}

function borrarFila_(sh, id) {
  var last = sh.getLastRow();
  if (last < 2) return;
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === String(id)) sh.deleteRow(i + 2);
  }
}

function numero_(value) {
  var n = Number(value);
  return isFinite(n) && n > 0 ? n : 0;
}

function conteosDe_(acta) {
  var conteos = {};
  COUNT_COLS.forEach(function (item) { conteos[item.id] = 0; });
  var fuente = acta && acta.conteos ? acta.conteos : {};
  COUNT_COLS.forEach(function (item) {
    conteos[item.id] = numero_(fuente[item.id]);
  });
  if (Object.keys(fuente).some(function (key) { return numero_(fuente[key]) > 0; })) return conteos;
  var ids = [];
  if (Array.isArray(acta.criterios)) {
    ids = acta.criterios.map(function (item) { return item && item.id; }).filter(Boolean);
  } else if (acta.motivoId) {
    ids = String(acta.motivoId).split(",").map(function (part) { return part.trim(); }).filter(Boolean);
  }
  ids.forEach(function (id) {
    if (Object.prototype.hasOwnProperty.call(conteos, id)) conteos[id] = Math.max(conteos[id], 1);
  });
  return conteos;
}

function acumuladoDe_(conteos) {
  var max = 0;
  COUNT_COLS.forEach(function (item) {
    var n = numero_(conteos[item.id]);
    if (n > max) max = n;
  });
  return max;
}

function nivelLabel_(acta, acumulado) {
  if (acta && (acta.tipo === "medida" || acta.tipo === "dt")) return "Medida";
  if (acta && (acta.tipo === "critico" || acta.tipo === "escrita")) return "Estado crítico";
  if (acumulado >= 3) return "Medida";
  if (acumulado >= 2) return "Estado crítico";
  return "Llamada incidencia";
}

function actaDeFila_(header, row) {
  function cell(name) {
    var index = header.indexOf(name);
    return index < 0 ? "" : row[index];
  }
  var id = String(cell("Código") || "");
  if (!id) return null;
  var medida = String(cell("Nivel") || cell("Medida") || "");
  var tipo = medida === "Medida" || medida === "Suspensión" ? "medida"
    : medida === "Estado crítico" || medida === "Llamada escrita" ? "critico"
    : "incidencia";
  function marcado(name) {
    var value = cell(name);
    return value === true || value === "SÍ" || value === "SI";
  }
  var conteos = {};
  COUNT_COLS.forEach(function (item) {
    conteos[item.id] = numero_(cell(item.header));
  });
  var acumulado = numero_(cell("Acumulado")) || acumuladoDe_(conteos);
  var nota = textoCorrido_(cell("Descripción"));
  var texto = textoCorrido_(cell("Texto"));
  if (nota && texto.toLowerCase().indexOf(nota.toLowerCase()) === -1) texto = textoCorrido_(texto + " " + nota);
  return {
    id: id,
    fecha: fechaCorta_(cell("Fecha")),
    hora: horaCorta_(cell("Hora")),
    tipo: tipo,
    motivoLabel: String(cell("Incidencia") || cell("Motivo") || ""),
    conteos: conteos,
    acumulado: acumulado,
    descripcion: "",
    texto: texto,
    trabajador: {
      nombre: String(cell("Trabajador") || ""),
      dni: String(cell("DNI") || ""),
      cargo: String(cell("Cargo") || "")
    },
    supervisor: {
      nombre: String(cell("Responsable") || ""),
      dni: String(cell("DNI responsable") || "")
    },
    columnas: {
      llamada: marcado("Llamada") || acumulado >= 1,
      escrita: marcado("Carta") || acumulado >= 2,
      dt: marcado("DT") || acumulado >= 3
    },
    progreso: {
      llamada: marcado("Llamada") || acumulado >= 1,
      escrita: marcado("Carta") || acumulado >= 2,
      dt: marcado("DT") || acumulado >= 3
    }
  };
}

function writeAll_(sh, actas) {
  var clean = dedupeActas_(actas || []);
  var last = Math.max(sh.getLastRow(), clean.length + 1);
  if (last > 1) {
    sh.getRange(2, 1, last - 1, HEADERS.length).clearContent().setBackground(null);
  }
  if (!clean.length) {
    formatearHoja_(sh);
    return;
  }
  var rows = clean.map(rowFromActa_);
  sh.getRange(2, 1, clean.length, HEADERS.length).setValues(rows);
  formatearHoja_(sh);
  for (var i = 0; i < clean.length; i++) {
    var conteos = conteosDe_(clean[i]);
    pintarCantidades_(sh, i + 2, conteos, acumuladoDe_(conteos));
  }
}

function rowFromActa_(acta) {
  var trabajador = acta.trabajador || {};
  var responsable = acta.supervisor || {};
  var conteos = conteosDe_(acta);
  var acumulado = acumuladoDe_(conteos);
  return [
    acta.id || "",
    acta.fecha || "",
    acta.hora || "",
    trabajador.nombre || "",
    trabajador.dni || "",
    trabajador.cargo || "",
    nivelLabel_(acta, acumulado),
    acta.motivoLabel || "",
    responsable.nombre || "",
    responsable.dni || ""
  ].concat(COUNT_COLS.map(function (item) {
    return numero_(conteos[item.id]) || "";
  })).concat([
    acumulado || "",
    textoFinal_(acta)
  ]);
}

function fechaCorta_(value) {
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, "America/Lima", "dd/MM/yyyy");
  }
  return String(value || "");
}

function horaCorta_(value) {
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, "America/Lima", "HH:mm");
  }
  var text = String(value || "");
  var match = text.match(/(\d{1,2}):(\d{2})/);
  if (!match) return text;
  return ("0" + match[1]).slice(-2) + ":" + match[2];
}

function textoFinal_(acta) {
  var texto = textoCorrido_(acta.texto);
  var nota = textoCorrido_(acta.descripcion);
  if (!nota || texto.toLowerCase().indexOf(nota.toLowerCase()) !== -1) return texto;
  return textoCorrido_(texto + " " + nota);
}

function textoCorrido_(text) {
  return String(text || "").replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
