/** Apps Script pegado al Excel INCIDENCIAS. No crea otra hoja: usa Hoja 1. */
var HEADERS = [
  "Código",
  "Fecha",
  "Hora",
  "Trabajador",
  "DNI",
  "Cargo",
  "Medida",
  "Motivo",
  "Responsable",
  "DNI responsable",
  "Llamada",
  "Carta",
  "DT",
  "Texto"
];

var CHECKS = ["Llamada", "Carta", "DT"];

function doGet(e) {
  var params = e && e.parameter ? e.parameter : {};
  return json_(withLock_(function () {
    var sh = sheet_();
    if (params.dni) return leerDni_(sh, String(params.dni));
    return leerRecientes_(sh, 1);
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
    var sh = sheet_();
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

/** Ejecutar una vez desde el editor: actualiza Hoja 1 sin crear otra. */
function crearEncabezados() {
  var sh = sheet_();
  writeAll_(sh, readActas_(sh));
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("El script tiene que estar dentro del Excel INCIDENCIAS.");
  var sh = ss.getSheets()[0];
  var width = Math.max(sh.getLastColumn(), HEADERS.length);
  var first = sh.getRange(1, 1, 1, width).getValues()[0];
  var missing = HEADERS.some(function (name, index) { return first[index] !== name; });
  if (missing) {
    var saved = readActas_(sh);
    sh.showColumns(1, width);
    var extra = sh.getMaxColumns() - HEADERS.length;
    if (extra > 0) sh.deleteColumns(HEADERS.length + 1, extra);
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sh.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight("bold")
      .setBackground("#1F3D2A")
      .setFontColor("#FFFFFF");
    sh.setFrozenRows(1);
    if (saved.length) writeAll_(sh, saved);
  }
  return sh;
}

function colIndex_(name) {
  return HEADERS.indexOf(name) + 1;
}

function readActas_(sh) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  var header = sh.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var rows = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  return rows.reduce(function (list, row) {
    var acta = actaDeFila_(header, row);
    if (acta) list.push(acta);
    return list;
  }, []);
}

function leerRecientes_(sh, dias) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  var start = Math.max(2, last - 399);
  var header = sh.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var rows = sh.getRange(start, 1, last - start + 1, HEADERS.length).getValues();
  return rows.reduce(function (list, row) {
    var acta = actaDeFila_(header, row);
    if (acta && esReciente_(row[1], dias)) list.push(acta);
    return list;
  }, []);
}

function leerDni_(sh, dni) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  var header = sh.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var values = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  var col = header.indexOf("DNI");
  if (col < 0) return [];
  var wanted = String(dni);
  var list = [];
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][col]) !== wanted) continue;
    var acta = actaDeFila_(header, values[i]);
    if (acta) list.push(acta);
  }
  return list;
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
  sh.getRange(fila, 1, 1, HEADERS.length).setValues([rowFromActa_(acta)]);
  var checks = sh.getRange(fila, colIndex_("Llamada"), 1, CHECKS.length);
  checks.insertCheckboxes();
  var columnas = acta.columnas || {};
  checks.setBackgrounds([[
    columnas.llamada ? "#1F8A3B" : "#D64545",
    columnas.escrita ? "#1F8A3B" : "#D64545",
    columnas.dt ? "#1F8A3B" : "#D64545"
  ]]);
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

function actaDeFila_(header, row) {
  function cell(name) {
    var index = header.indexOf(name);
    return index < 0 ? "" : row[index];
  }
  var id = String(cell("Código") || "");
  if (!id) return null;
  var medida = String(cell("Medida") || "");
  var tipo = medida === "Suspensión" ? "dt" : medida === "Llamada escrita" ? "escrita" : "llamada";
  function marcado(name) {
    var value = cell(name);
    return value === true || value === "SÍ" || value === "SI";
  }
  var nota = textoCorrido_(cell("Descripción"));
  var texto = textoCorrido_(cell("Texto"));
  if (nota && texto.toLowerCase().indexOf(nota.toLowerCase()) === -1) texto = textoCorrido_(texto + " " + nota);
  return {
    id: id,
    fecha: fechaCorta_(cell("Fecha")),
    hora: horaCorta_(cell("Hora")),
    tipo: tipo,
    motivoLabel: String(cell("Motivo") || ""),
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
      llamada: marcado("Llamada"),
      escrita: marcado("Carta"),
      dt: marcado("DT")
    },
    progreso: {
      llamada: marcado("Llamada"),
      escrita: marcado("Carta"),
      dt: marcado("DT")
    }
  };
}

function writeAll_(sh, actas) {
  var last = Math.max(sh.getLastRow(), actas.length + 1);
  if (last > 1) {
    sh.getRange(2, 1, last - 1, HEADERS.length).clearContent().setBackground(null);
  }
  if (!actas.length) return;
  var rows = actas.map(rowFromActa_);
  sh.getRange(2, 1, actas.length, HEADERS.length).setValues(rows);
  var start = colIndex_("Llamada");
  var checks = sh.getRange(2, start, actas.length, CHECKS.length);
  checks.insertCheckboxes();
  checks.setBackgrounds(actas.map(function (acta) {
    var columnas = acta.columnas || {};
    return CHECKS.map(function (name) {
      var on = name === "Llamada" ? columnas.llamada : name === "Carta" ? columnas.escrita : columnas.dt;
      return on ? "#1F8A3B" : "#D64545";
    });
  }));
  sh.getRange(2, colIndex_("Texto"), actas.length, 1).setWrap(false);
}

function rowFromActa_(acta) {
  var trabajador = acta.trabajador || {};
  var responsable = acta.supervisor || {};
  var columnas = acta.columnas || {};
  var medida = acta.tipo === "dt" ? "Suspensión" : acta.tipo === "escrita" ? "Llamada escrita" : "Llamada de atención";
  return [
    acta.id || "",
    acta.fecha || "",
    acta.hora || "",
    trabajador.nombre || "",
    trabajador.dni || "",
    trabajador.cargo || "",
    medida,
    acta.motivoLabel || "",
    responsable.nombre || "",
    responsable.dni || "",
    !!columnas.llamada,
    !!columnas.escrita,
    !!columnas.dt,
    textoFinal_(acta)
  ];
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

function unir_(anterior, nuevo) {
  var a = textoCorrido_(anterior);
  var b = textoCorrido_(nuevo);
  if (!a) return b;
  if (!b || a === b || a.indexOf(b) !== -1) return a;
  if (b.indexOf(a) !== -1) return b;
  return a + " - " + b;
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

function columnasDe_(actas, dni) {
  var lista = actas.filter(function (acta) {
    return acta.trabajador && acta.trabajador.dni === dni && acta.tipo !== "conforme";
  });
  return {
    llamada: lista.some(function (acta) { return acta.tipo === "llamada" || (acta.columnas && acta.columnas.llamada); }),
    escrita: lista.some(function (acta) { return acta.tipo === "escrita" || (acta.columnas && acta.columnas.escrita); }),
    dt: lista.some(function (acta) { return acta.tipo === "dt" || (acta.columnas && acta.columnas.dt); })
  };
}

function onEdit(e) {
  if (!e || !e.range) return;
  var sh = e.range.getSheet();
  var ss = sh.getParent();
  if (ss.getSheets()[0].getName() !== sh.getName()) return;
  if (e.range.getRow() < 2) return;
  var header = String(sh.getRange(1, e.range.getColumn()).getValue() || "");
  if (CHECKS.indexOf(header) === -1) return;
  var on = e.range.getValue() === true;
  e.range.setBackground(on ? "#1F8A3B" : "#D64545");
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
