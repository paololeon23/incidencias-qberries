/* Q Berries · Compromiso laboral
   Flujo: 1 persona (padrón) → 2 lote → 3 evaluación → 4 acta firmada.
   El texto de la llamada reproduce el cuaderno de campo. */
(function () {
  "use strict";

  const CRITERIOS = [
    { id: "rojizo", label: "Rojizo", umbral: 5, hint: "Color rojo en la selección. Es el motivo del cuaderno." },
    { id: "verde", label: "Verde", umbral: 3, hint: "Fruta inmadura" },
    { id: "sobremaduro", label: "Sobremaduro", umbral: 4, hint: "Fruta blanda o pasada" },
    { id: "dano", label: "Daño", umbral: 3, hint: "Golpe, rajado o daño mecánico" },
    { id: "pedunculo", label: "Pedúnculo", umbral: 2, hint: "Fruta con pedúnculo" },
    { id: "descarte", label: "Descarte", umbral: 8, hint: "Porcentaje total de descarte" }
  ];

  const STEPS = [
    { short: "Cosechador", title: "Cosechador" },
    { short: "Checklist", title: "Checklist" }
  ];

  const MEDIDAS = [
    { id: "llamada", label: "Llamada de atención", limite: 5, vez: "1.ª vez", destino: "Queda en la app", rank: 1 },
    { id: "escrita", label: "Llamada escrita", limite: 10, vez: "Si se repite · carta", destino: "Carta de compromiso", rank: 2 },
    { id: "dt", label: "Suspensión", limite: 15, vez: "Si se repite otra vez · DT", destino: "Se envía a RRHH", rank: 3 }
  ];

  const SUCESOS = [
    { id: "instruccion", grupo: "Disciplina", label: "Incumplió la instrucción" },
    { id: "tardia", grupo: "Disciplina", label: "Llegada tardía" },
    { id: "falta", grupo: "Disciplina", label: "Inasistencia" },
    { id: "epp", grupo: "Disciplina", label: "EPP y seguridad" },
    { id: "bpa", grupo: "Disciplina", label: "BPA e inocuidad" },
    { id: "fruta", grupo: "Disciplina", label: "Calidad de fruta" },
    { id: "conducta", grupo: "Disciplina", label: "Conducta" }
  ];

  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    back: '<path d="M15 18 9 12l6-6"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    clip: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 4a3 3 0 0 1 6 0v1H9V4Z"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.2 2.4c-.8.3-1.2.9-1.2 1.6V14"/><path d="M12 17h.01"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    alert: '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 4.8 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
    download: '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/>',
    pdf: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
    scan: '<path d="M4 4h6v6H4z"/><path d="M14 4h6v6h-6z"/><path d="M4 14h6v6H4z"/><path d="M14 14h2.2v2.2H14z"/><path d="M17.8 14H20v2.2h-2.2z"/><path d="M14 17.8h2.2V20H14z"/><path d="M17.8 17.8H20V20h-2.2z"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
  };

  const IMG = window.QB_IMG || { check: "./icons/aprobacion.png", logo: "./assets/icon-192.png", supervisor: "./assets/Supervisor.png" };
  const PAGE = 6;
  const APP_VERSION = "9.1";
  const app = document.getElementById("app");
  const actions = document.getElementById("actions");
  const loader = document.getElementById("loader");
  const loaderText = document.getElementById("loader-text");

  const state = {
    screen: "home",
    step: 1,
    maxReached: 1,
    returnTo: "home",
    query: "",
    searchMode: "dni",
    manualOpen: false,
    manualNombre: "",
    manualCargo: "COSECHA",
    histFilter: "todas",
    histQuery: "",
    histPage: 1,
    viewing: null,
    saving: false,
    campoOnline: false,
    pulling: false,
    signed: false,
    padrón: { count: 0, updatedAt: "" },
    workers: [],
    workersByDni: new Map(),
    scriptUrl: "",
    updateAvailable: false,
    evaluadores: [],
    supervisores: [],
    lotes: [],
    actas: [],
    draft: emptyDraft()
  };

  let deferredPrompt = null;
  let picker = { kind: "", items: [] };
  let askResolve = null;

  function emptyDraft() {
    return {
      trabajador: null,
      evaluador: null,
      supervisor: null,
      lote: null,
      criterios: { rojizo: "", verde: "", sobremaduro: "", dano: "", pedunculo: "", descarte: "" },
      marcados: [],
      porcentaje: "",
      descripcion: "",
      medidaManual: "",
      carnetVisto: false,
      qrOk: false,
      qrValor: "",
      otro: "",
      detalle: "",
      texto: "",
      textoTouched: false,
      firma: null
    };
  }

  function icon(name, size) {
    const s = size || 22;
    return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  function norm(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function titleCase(value) {
    return String(value || "").toLocaleLowerCase("es-PE").replace(/(^|[\s'-])(\p{L})/gu, (_, sep, letter) => {
      return sep + letter.toLocaleUpperCase("es-PE");
    });
  }

  function fmtPct(n) {
    return new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(n);
  }

  function readPct(raw) {
    const s = String(raw ?? "").trim().replace(",", ".");
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function cortoHora(value) {
    const text = String(value || "").trim();
    if (/^\d{1,2}:\d{2}$/.test(text)) return text.padStart(5, "0");
    const match = text.match(/\b(\d{1,2}):(\d{2})\b/);
    if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
    return text;
  }

  function cortoFecha(value) {
    const text = String(value || "").trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return text;
    const date = new Date(text);
    if (Number.isNaN(date.getTime()) || date.getFullYear() < 1901) return text;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${date.getFullYear()}`;
  }

  function diaDe(acta) {
    if (acta && /^\d{8}$/.test(acta.yyyymmdd)) return acta.yyyymmdd;
    const id = String(acta && acta.id || "");
    const fromId = id.match(/^CL-(\d{8})-/);
    if (fromId) return fromId[1];
    const fecha = String(acta && acta.fecha || "");
    const match = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) return `${match[3]}${match[2]}${match[1]}`;
    if (acta && acta.createdAt) {
      const stamp = limaStamp(new Date(acta.createdAt));
      if (/^\d{8}$/.test(stamp.yyyymmdd)) return stamp.yyyymmdd;
    }
    return "";
  }

  function completarActa(acta) {
    if (!acta) return acta;
    const dia = diaDe(acta);
    if (dia) acta.yyyymmdd = dia;
    if (!acta.createdAt && dia) {
      const hora = /^\d{2}:\d{2}$/.test(String(acta.hora || "")) ? acta.hora : "00:00";
      acta.createdAt = `${dia.slice(0, 4)}-${dia.slice(4, 6)}-${dia.slice(6, 8)}T${hora}:00-05:00`;
    }
    return acta;
  }

  function diaAnterior(yyyymmdd) {
    const fecha = new Date(Date.UTC(Number(yyyymmdd.slice(0, 4)), Number(yyyymmdd.slice(4, 6)) - 1, Number(yyyymmdd.slice(6, 8)) - 1));
    const y = String(fecha.getUTCFullYear());
    const m = String(fecha.getUTCMonth() + 1).padStart(2, "0");
    const d = String(fecha.getUTCDate()).padStart(2, "0");
    return `${y}${m}${d}`;
  }

  function jornadaDeFecha(yyyymmdd, hora) {
    if (!/^\d{8}$/.test(yyyymmdd)) return "";
    const marca = String(hora || "");
    if (/^\d{2}:\d{2}/.test(marca) && marca.slice(0, 5) < "06:00") return diaAnterior(yyyymmdd);
    return yyyymmdd;
  }

  function jornadaDe(acta) {
    return jornadaDeFecha(diaDe(acta), acta && acta.hora);
  }

  function jornadaHoy() {
    const stamp = limaStamp();
    return jornadaDeFecha(stamp.yyyymmdd, stamp.hora);
  }

  function limaStamp(date) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(date || new Date());
    const get = (type) => parts.find((part) => part.type === type).value;
    const y = get("year");
    const m = get("month");
    const d = get("day");
    return {
      yyyymmdd: `${y}${m}${d}`,
      fecha: `${d}/${m}/${y}`,
      hora: `${get("hour")}:${get("minute")}`,
      isoDate: `${y}-${m}-${d}`
    };
  }

  function longDate(date) {
    const text = new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date || new Date());
    return text.charAt(0).toLocaleUpperCase("es-PE") + text.slice(1);
  }

  function shortToday() {
    const dia = jornadaHoy();
    const fecha = new Date(Date.UTC(Number(dia.slice(0, 4)), Number(dia.slice(4, 6)) - 1, Number(dia.slice(6, 8)), 17, 0, 0));
    return new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      weekday: "short",
      day: "numeric",
      month: "short"
    }).format(fecha);
  }

  function joinAnd(items) {
    if (items.length <= 1) return items[0] || "";
    return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
  }

  function initials(nombre) {
    const parts = String(nombre || "").trim().split(/\s+/);
    return ((parts[0] || "?").charAt(0) + (parts[1] || "").charAt(0)).toUpperCase();
  }

  function avatarColor(dni) {
    const hues = ["#1F3D2A", "#2F6B8A", "#8A4B08", "#6B4C9A", "#9A3412", "#1565C0"];
    const n = Number(String(dni).slice(-2)) || 0;
    return hues[n % hues.length];
  }

  function measured() {
    return CRITERIOS.map((criterio) => {
      const valor = readPct(state.draft.criterios[criterio.id]);
      return { ...criterio, valor };
    }).filter((item) => item.valor !== null);
  }

  function invalidPct() {
    return measured().some((item) => Number.isNaN(item.valor) || item.valor < 0 || item.valor > 100);
  }

  function breaches() {
    return measured().filter((item) => !Number.isNaN(item.valor) && item.valor > item.umbral);
  }

  function needsLlamada() {
    return breaches().length > 0 || String(state.draft.otro || "").trim().length > 0;
  }

  function band(item) {
    if (item.valor === null || Number.isNaN(item.valor)) return "empty";
    if (item.valor > item.umbral) return "pobre";
    if (item.valor >= item.umbral * 0.6) return "regular";
    return "excelente";
  }

  function bandLabel(kind) {
    if (kind === "pobre") return "Llamada";
    if (kind === "regular") return "Observar";
    if (kind === "excelente") return "Dentro";
    return "";
  }

  function medidaById(id) {
    return MEDIDAS.find((item) => item.id === id) || MEDIDAS[0];
  }

  function criterioById(id) {
    return SUCESOS.find((item) => item.id === id) || null;
  }

  function actasDe(dni) {
    const buscado = String(dni || "");
    return state.actas.filter((acta) => {
      return acta.trabajador && String(acta.trabajador.dni) === buscado && acta.tipo !== "conforme";
    });
  }

  function columnasDe(dni) {
    const prev = actasDe(dni);
    return {
      llamada: prev.some((acta) => acta.tipo === "llamada" || (acta.columnas && acta.columnas.llamada)),
      escrita: prev.some((acta) => acta.tipo === "escrita" || (acta.columnas && acta.columnas.escrita)),
      dt: prev.some((acta) => acta.tipo === "dt" || (acta.columnas && acta.columnas.dt))
    };
  }

  function faseDe(dni) {
    const cols = columnasDe(dni);
    if (!cols.llamada) return "llamada";
    if (!cols.escrita) return "escrita";
    return "dt";
  }

  function dtEncendido(value) {
    return value === true || value === "SÍ" || value === "SI" || value === "TRUE" || value === "true" || value === 1;
  }

  function dtBloqueado(dni) {
    const ultima = actasDe(dni)
      .filter((acta) => acta.tipo === "dt")
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
    if (!ultima) return false;
    return dtEncendido(ultima.columnas && ultima.columnas.dt);
  }

  function soltarDt(dni) {
    const buscado = String(dni || "");
    state.actas.forEach((acta) => {
      if (!acta.trabajador || String(acta.trabajador.dni) !== buscado || acta.tipo !== "dt") return;
      acta.columnas = Object.assign({}, acta.columnas || {}, { dt: false });
      acta.progreso = Object.assign({}, acta.progreso || {}, { dt: false });
    });
  }

  function aplicarDtServidor(lista) {
    const porDni = new Map();
    (lista || []).forEach((acta) => {
      if (!acta || acta.tipo !== "dt" || !acta.trabajador || !acta.trabajador.dni) return;
      const dni = String(acta.trabajador.dni);
      const on = !acta.columnas || dtEncendido(acta.columnas.dt);
      porDni.set(dni, porDni.get(dni) === true || on);
    });
    porDni.forEach((on, dni) => {
      if (on) cerrarDt(dni);
      else soltarDt(dni);
    });
  }

  function cerrarDt(dni) {
    const ultima = actasDe(dni)
      .filter((acta) => acta.tipo === "dt")
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
    if (!ultima) return;
    ultima.columnas = Object.assign({}, ultima.columnas || {}, { dt: true });
    ultima.progreso = Object.assign({}, ultima.progreso || {}, { dt: true });
  }

  function progresoPropio(previo, medida) {
    const orden = ["llamada", "escrita", "dt"];
    const previoIdx = previo && orden.includes(previo.tipo) ? orden.indexOf(previo.tipo) : -1;
    const ahora = orden.indexOf(medida);
    const hasta = Math.max(previoIdx, ahora);
    return {
      llamada: hasta >= 0,
      escrita: hasta >= 1,
      dt: hasta >= 2
    };
  }

  function casoVigente(dni, responsableDni) {
    const lista = actasDe(dni)
      .filter((acta) => acta.supervisor && acta.supervisor.dni === responsableDni)
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    if (!lista.length) return null;
    const cols = {
      llamada: lista.some((acta) => acta.tipo === "llamada" || (acta.progreso && acta.progreso.llamada)),
      escrita: lista.some((acta) => acta.tipo === "escrita" || (acta.progreso && acta.progreso.escrita)),
      dt: lista.some((acta) => acta.tipo === "dt" || (acta.progreso && acta.progreso.dt))
    };
    if (cols.llamada && cols.escrita && cols.dt) return null;
    return lista[0];
  }

  function medidaSugerida() {
    const dni = state.draft.trabajador ? state.draft.trabajador.dni : "";
    return faseDe(dni);
  }

  function medidaActual() {
    return medidaSugerida();
  }

  function porqueMedida() {
    const fase = medidaActual();
    if (fase === "llamada") return "Fase 1. Marca el suceso. No se salta a la carta.";
    if (fase === "escrita") return "Fase 2. La llamada de atención ya está. Ahora la carta.";
    return "Fase 3. Llamada y carta ya están. Ahora DT.";
  }

  function motivosMarcados() {
    return (state.draft.marcados || []).map(criterioById).filter(Boolean);
  }

  function notaAparte(nota) {
    let text = String(nota || "").trim();
    if (!text) return "";
    if (text === text.toUpperCase()) text = text.toLowerCase();
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (!/[.!?]$/.test(text)) text += ".";
    return `\n\n${text}`;
  }

  function buildTexto() {
    const person = state.draft.trabajador;
    const nombre = titleCase(person ? person.nombre : "el cosechador");
    const motivos = motivosMarcados().map((item) => item.label.toLowerCase());
    const motivo = motivos.length ? joinAnd(motivos) : "el suceso";
    const extra = notaAparte(state.draft.descripcion);
    const medida = medidaActual();
    if (medida === "dt") {
      return `Se escala a Dirección Técnica la suspensión de ${nombre} por ${motivo}. El caso se envía a RRHH.${extra}`;
    }
    if (medida === "escrita") {
      return `Se deja llamada escrita, carta de compromiso, a ${nombre} por ${motivo}, lo cual se compromete a mejorar.${extra}`;
    }
    return `Se le da una llamada de atención a: ${nombre} por ${motivo}, lo cual se compromete a mejorar.${extra}`;
  }

  function hasDraft() {
    const draft = state.draft;
    return !!(draft.trabajador || (draft.marcados && draft.marcados.length) || String(draft.descripcion).trim());
  }

  function persistDraft() {
    try {
      sessionStorage.setItem("qb-draft", JSON.stringify({
        draft: state.draft,
        step: state.step,
        maxReached: state.maxReached,
        query: state.query,
        searchMode: state.searchMode
      }));
      if (state.draft.evaluador) {
        localStorage.setItem("qb-evaluador", JSON.stringify(state.draft.evaluador));
      }
      if (state.draft.supervisor) localStorage.setItem("qb-responsable", JSON.stringify(state.draft.supervisor));
    } catch (error) {
      /* el teléfono puede rechazar la firma si no hay espacio */
    }
  }

  function restoreDraft() {
    try {
      const savedEval = localStorage.getItem("qb-evaluador");
      if (savedEval) state.draft.evaluador = JSON.parse(savedEval);
      const raw = sessionStorage.getItem("qb-draft");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || !saved.draft) return;
      state.draft = Object.assign(emptyDraft(), saved.draft);
      state.draft.marcados = Array.isArray(saved.draft.marcados) ? saved.draft.marcados : [];
      state.step = Math.min(2, Math.max(1, Number(saved.step) || 1));
      state.maxReached = Math.min(2, Math.max(state.step, Number(saved.maxReached) || 1));
      state.query = saved.query || "";
      state.searchMode = saved.searchMode === "nombre" ? "nombre" : "dni";
      state.signed = !!state.draft.firma;
    } catch (error) {
      sessionStorage.removeItem("qb-draft");
    }
  }

  function clearDraft(keepEvaluador) {
    const evaluador = keepEvaluador ? state.draft.evaluador : null;
    const supervisor = keepEvaluador ? state.draft.supervisor : null;
    state.draft = emptyDraft();
    state.draft.evaluador = evaluador;
    state.draft.supervisor = supervisor;
    state.step = 1;
    state.maxReached = 1;
    state.query = "";
    state.searchMode = "dni";
    state.manualOpen = false;
    state.manualNombre = "";
    state.signed = false;
    sessionStorage.removeItem("qb-draft");
  }

  function openDb() {
    if (openDb.promise) return openDb.promise;
    openDb.promise = new Promise((resolve, reject) => {
      const request = indexedDB.open("qb-compromiso", 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("actas")) {
          db.createObjectStore("actas", { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return openDb.promise;
  }

  function idbGetAll() {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const request = db.transaction("actas", "readonly").objectStore("actas").getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    }));
  }

  function idbPut(acta) {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const request = db.transaction("actas", "readwrite").objectStore("actas").put(acta);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }));
  }

  function idbDel(id) {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const request = db.transaction("actas", "readwrite").objectStore("actas").delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }));
  }

  function idbReplace(actas) {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const store = db.transaction("actas", "readwrite").objectStore("actas");
      const clear = store.clear();
      clear.onerror = () => reject(clear.error);
      clear.onsuccess = () => {
        let left = actas.length;
        if (!left) {
          resolve();
          return;
        }
        actas.forEach((acta) => {
          const copy = Object.assign({}, acta);
          const put = store.put(copy);
          put.onerror = () => reject(put.error);
          put.onsuccess = () => {
            left -= 1;
            if (!left) resolve();
          };
        });
      };
    }));
  }

  function syncUrl() {
    return state.scriptUrl || "./api/actas";
  }

  function autoTransfer() {
    return localStorage.getItem("qb-auto-transfer") !== "0";
  }

  function netSignal(ms) {
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms);
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), ms);
    return ctrl.signal;
  }

  async function postActa(acta, signal) {
    const copy = Object.assign({}, acta);
    delete copy.pending;
    delete copy.synced;
    if (state.scriptUrl) {
      return fetch(state.scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ acta: copy }),
        signal
      });
    }
    return fetch("./api/actas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(copy),
      signal
    });
  }

  async function pushActa(acta, opts) {
    const attempts = opts && opts.attempts ? opts.attempts : 2;
    const ms = opts && opts.ms ? opts.ms : 90000;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await postActa(acta, netSignal(ms));
        if (response.ok) return true;
        return false;
      } catch (error) {
        if (attempt === attempts - 1) return false;
      }
    }
    return false;
  }

  function openTransfer(total) {
    const box = document.getElementById("transfer");
    if (!box) return;
    box.classList.remove("is-done");
    box.classList.add("open");
    const sub = document.getElementById("transfer-sub");
    if (sub) sub.textContent = "Subiendo actas. En 3G y H+ va de una en una.";
    const bar = document.getElementById("transfer-bar");
    if (bar) bar.style.width = "0%";
    const count = document.getElementById("transfer-count");
    if (count) count.textContent = `0 / ${total}`;
    const hint = document.getElementById("transfer-hint");
    if (hint) hint.textContent = "No cierres esta pantalla hasta que termine.";
    const actions = document.getElementById("transfer-actions");
    if (actions) actions.hidden = true;
  }

  function paintTransfer(sent, total) {
    const bar = document.getElementById("transfer-bar");
    if (bar) bar.style.width = `${total ? Math.round((sent / total) * 100) : 100}%`;
    const count = document.getElementById("transfer-count");
    if (count) count.textContent = `${sent} / ${total}`;
  }

  function finishTransfer(sent, total) {
    const box = document.getElementById("transfer");
    if (!box || !box.classList.contains("open")) return;
    box.classList.add("is-done");
    const sub = document.getElementById("transfer-sub");
    if (sub) sub.textContent = sent === total ? "Todo quedó en el servidor." : "Lo que falta se reintenta solo cuando haya señal.";
    paintTransfer(sent, total);
    const hint = document.getElementById("transfer-hint");
    if (hint) hint.textContent = sent === total ? "Pendientes en cero." : `${total - sent} siguen en el teléfono.`;
    const actions = document.getElementById("transfer-actions");
    if (actions) actions.hidden = false;
  }

  function closeTransfer() {
    const box = document.getElementById("transfer");
    if (box) box.classList.remove("open", "is-done");
  }

  async function flushPending(show) {
    if (!autoTransfer()) return;
    const queue = state.actas.filter(listoParaSubir);
    if (show && queue.length) openTransfer(queue.length);
    let sent = 0;
    let changed = false;
    for (const acta of queue) {
      acta.pending = true;
      if (await pushActa(acta)) {
        acta.pending = false;
        acta.synced = true;
        changed = true;
        sent += 1;
        if (show) paintTransfer(sent, queue.length);
      }
    }
    if (changed) await idbReplace(state.actas);
    if (sent > 0) avisarPendientes(sent);
    if (show) finishTransfer(sent, queue.length);
    paintNet();
  }

  async function pullCampo() {
    if (state.pulling) return;
    state.pulling = true;
    try {
      const signal = netSignal(10000);
      const marcas = Date.now();
      const dnis = [...new Set(state.actas.filter((acta) => acta.tipo === "dt" && acta.trabajador).map((acta) => String(acta.trabajador.dni)))].slice(0, 8);
      const pedidos = [fetch(conConsulta_(syncUrl(), { dias: "1", t: marcas }), { cache: "no-store", redirect: "follow", signal })];
      dnis.forEach((dni) => pedidos.push(fetch(conConsulta_(syncUrl(), { dni, t: marcas }), { cache: "no-store", redirect: "follow", signal })));
      const responses = await Promise.all(pedidos.map((pedido) => pedido.catch(() => null)));
      let ok = false;
      for (const response of responses) {
        if (!response || !response.ok) continue;
        const remote = await response.json().catch(() => null);
        if (!Array.isArray(remote)) continue;
        ok = true;
        mezclarActas(remote.map((acta) => Object.assign({}, acta, { pending: false, synced: true, confirmado: true })));
      }
      if (!ok) throw new Error("api");
      state.campoOnline = true;
      idbReplace(state.actas);
      const abierto = state.draft.trabajador && state.draft.trabajador.dni;
      if (state.screen === "flow" && abierto && dtBloqueado(abierto)) {
        clearDraft(true);
        go("home");
        avisoDt();
      }
      await flushPending();
    } catch (error) {
      state.campoOnline = false;
      await flushPending();
    } finally {
      state.pulling = false;
      if (state.screen === "home") paintHomeSearch();
      if (state.screen === "flow" && state.step === 1) paintWorkerSearch();
      paintNet();
    }
  }

  function conConsulta_(url, params) {
    const join = url.includes("?") ? "&" : "?";
    const query = Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");
    return `${url}${join}${query}`;
  }

  function mezclarActas(lista) {
    const map = new Map(state.actas.map((acta) => [acta.id, acta]));
    lista.forEach((acta) => {
      if (!acta || !acta.id) return;
      completarActa(acta);
      const local = map.get(acta.id);
      if (local && acta.columnas && Object.prototype.hasOwnProperty.call(acta.columnas, "dt")) {
        const dt = acta.columnas.dt === true || acta.columnas.dt === "SÍ" || acta.columnas.dt === "SI";
        local.columnas = Object.assign({}, local.columnas || {}, { dt });
        local.progreso = Object.assign({}, local.progreso || {}, { dt });
        acta.columnas.dt = dt;
      }
      if (local && (local.confirmado === false || local.pending || local.synced !== true)) return;
      map.set(acta.id, acta);
    });
    state.actas = [...map.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    aplicarDtServidor(lista);
  }

  function yaLoTengo(dni) {
    const responsable = state.draft.supervisor && state.draft.supervisor.dni;
    if (!responsable) return false;
    return state.actas.some((acta) => {
      return acta.trabajador && acta.trabajador.dni === dni && acta.supervisor && acta.supervisor.dni === responsable;
    });
  }

  function tuvoDt(dni) {
    return actasDe(dni).some((acta) => acta.tipo === "dt");
  }

  function servidorBloquea(lista, dni) {
    const filas = (lista || []).filter((acta) => {
      return acta && acta.tipo === "dt" && acta.trabajador && String(acta.trabajador.dni) === String(dni);
    });
    if (!filas.length) return null;
    return filas.some((acta) => !acta.columnas || dtEncendido(acta.columnas.dt));
  }

  async function asegurarHistoria(dni) {
    if (yaLoTengo(dni) && !tuvoDt(dni)) return;
    await historiaDe(dni);
  }

  async function historiaDe(dni) {
    if (!dni || !navigator.onLine) return null;
    try {
      const response = await fetch(conConsulta_(syncUrl(), { dni }), { cache: "no-store", redirect: "follow", signal: netSignal(10000) });
      if (!response.ok) return null;
      const remote = await response.json();
      if (!Array.isArray(remote)) return null;
      mezclarActas(remote.map((acta) => Object.assign({}, acta, { pending: false, synced: true, confirmado: true })));
      idbReplace(state.actas);
      return remote;
    } catch (error) {
      return null;
    }
  }

  function people(byDni) {
    return Object.entries(byDni || {}).map(([dni, value]) => ({
      dni,
      nombre: value.nombre || "",
      cargo: value.cargo || "",
      n: norm(value.nombre || "")
    }));
  }

  async function loadData() {
    const urls = [
      "./data/trabajadores.json",
      "./data/evaluadores.json",
      "./data/supervisores-cosecha.json",
      "./data/lotes-licapa.json"
    ];
    const responses = await Promise.all(urls.map((url) => fetch(url)));
    if (responses.some((response) => !response.ok)) throw new Error("No se pudo leer la data");
    const [trabajadores, evaluadores, supervisores, lotes] = await Promise.all(responses.map((response) => response.json()));
    state.workers = people(trabajadores.byDni);
    state.workersByDni = new Map(state.workers.map((worker) => [worker.dni, worker]));
    state.padrón.count = trabajadores.count || state.workers.length;
    state.padrón.updatedAt = trabajadores.updatedAt || "";
    state.evaluadores = people(evaluadores.byDni);
    state.supervisores = people(supervisores.byDni);
    state.lotes = (lotes || []).map((lote) => ({
      ...lote,
      n: norm(`${lote.codLote} ${lote.lote} ${lote.modulo} ${lote.turno} ${lote.etapa} ${lote.variedad}`)
    }));
    try {
      const cfg = await fetch("./data/servidor.json", { cache: "no-store" });
      if (cfg.ok) {
        const data = await cfg.json();
        state.scriptUrl = String(data.script || "").trim();
      }
    } catch (error) {
      state.scriptUrl = "";
    }
  }

  function searchWorkers(query) {
    const q = norm(query).trim();
    if (q.length < 2) return [];
    if (/^\d+$/.test(q)) {
      return state.workers.filter((worker) => worker.dni.startsWith(q)).slice(0, 20);
    }
    const tokens = q.split(/\s+/);
    return state.workers.filter((worker) => tokens.every((token) => worker.n.includes(token))).slice(0, 25);
  }

  function llamadasDe(dni) {
    return state.actas.filter((acta) => acta.trabajador && acta.trabajador.dni === dni && acta.tipo === "llamada").length;
  }

  function pedirAvisos() {
    if (!("Notification" in window) || Notification.permission !== "default") return;
    Notification.requestPermission().catch(() => {});
  }

  function avisarPendientes(n) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const title = "Pendientes listos";
    const body = n === 1 ? "1 acta ya se subió." : `${n} actas ya se subieron.`;
    try {
      new Notification(title, { body, icon: "./assets/icon-192.png", tag: "qb-pendientes" });
    } catch (error) { /* el teléfono no mostró el aviso */ }
  }

  function toast(message, tone) {
    const stack = document.getElementById("toasts");
    const item = document.createElement("div");
    item.className = `qb-toast-item ${tone || "ok"}`;
    item.textContent = message;
    stack.appendChild(item);
    setTimeout(() => item.remove(), 2800);
  }

  function ask(options) {
    const fb = document.getElementById("fb");
    const iconBox = document.getElementById("fb-icon");
    document.getElementById("fb-title").textContent = options.title;
    document.getElementById("fb-text").textContent = options.text || "";
    document.getElementById("fb-ok").textContent = options.ok || "Continuar";
    const cancel = document.getElementById("fb-cancel");
    cancel.hidden = !!options.hideCancel;
    cancel.textContent = options.cancel || "Cancelar";
    iconBox.className = `qb-fb-icon ${options.tone || "info"}`;
    iconBox.innerHTML = icon(options.tone === "error" || options.tone === "warn" ? "alert" : "check", 22);
    fb.hidden = false;
    requestAnimationFrame(() => fb.classList.add("open"));
    return new Promise((resolve) => {
      askResolve = resolve;
    });
  }

  function closeAsk(value) {
    const fb = document.getElementById("fb");
    fb.classList.remove("open");
    fb.hidden = true;
    if (askResolve) askResolve(value);
    askResolve = null;
  }

  function setLoader(on, text) {
    loader.hidden = !on;
    if (text) loaderText.textContent = text;
  }

  function pathFor(screen) {
    if (screen === "acta" && state.viewing && state.viewing.id) return `/lectura/${encodeURIComponent(state.viewing.id)}`;
    if (screen === "flow") return "/checklist";
    if (screen === "historial") return "/historial";
    return "/";
  }

  function applyPath() {
    const path = (location.hash || "#/").replace(/^#/, "") || "/";
    const lectura = path.match(/^\/lectura\/([^/]+)$/);
    if (lectura) {
      const acta = state.actas.find((item) => item.id === decodeURIComponent(lectura[1]));
      if (acta) {
        state.viewing = acta;
        state.returnTo = "historial";
        state.screen = "acta";
        return;
      }
    }
    if (path === "/checklist") {
      if (state.draft.trabajador && state.draft.trabajador.dni) {
        state.step = 2;
        state.screen = "flow";
      } else state.screen = "home";
      return;
    }
    if (path === "/historial") {
      state.screen = "historial";
      return;
    }
    state.screen = "home";
  }

  function go(screen) {
    state.screen = screen;
    const path = pathFor(screen);
    const next = `#${path}`;
    if (location.hash !== next) history.pushState({ path }, "", next);
    render();
  }

  let headerTools = [];

  function header(opts) {
    headerTools = opts.tools || [];
    const back = opts.back
      ? `<button type="button" class="icon-btn" data-act="${opts.back}" aria-label="Volver">${icon("back", 18)}</button>`
      : `<img class="corp-logo" src="${IMG.logo}" alt="">`;
    return `
      <header class="corp-header ${opts.compact ? "compact glass" : "glass"}">
        <div class="corp-left">
          ${back}
          <div class="corp-titles grow">
            <div class="corp-brand">Q BERRIES</div>
            <h1 class="corp-title">${esc(opts.title)}</h1>
            ${opts.sub ? `<p class="corp-sub">${esc(opts.sub)}</p>` : ""}
          </div>
        </div>
        <div class="status-stack">
          ${opts.net === false ? "" : `<span class="status-chip" id="net-chip"></span><span class="status-chip pending" id="pending-chip"></span>`}
        </div>
      </header>`;
  }

  function paintFab() {
    let wrap = document.getElementById("fab-root");
    if (!headerTools.length) {
      if (wrap) wrap.remove();
      return;
    }
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "fab-root";
      wrap.className = "fab-wrap";
      document.body.appendChild(wrap);
    }
    const tools = headerTools.map((tool) => {
      return `<button type="button" data-act="${tool.act}">${icon(tool.icon, 18)}<span>${esc(tool.label)}</span></button>`;
    }).join("");
    wrap.innerHTML = `
      <div class="fab-menu" id="fab-menu" hidden>${tools}</div>
      <button class="fab-options" id="fab-options-btn" type="button" data-act="toggle-fab" aria-label="Opciones rápidas" aria-expanded="false">${icon("more", 22)}</button>`;
  }

  function render() {
    if (state.screen === "flow" && !(state.draft.trabajador && state.draft.trabajador.dni)) {
      state.screen = "home";
      if ((location.hash || "") !== "#/") history.replaceState({ path: "/" }, "", "#/");
    }
    document.body.dataset.qbScreen = state.screen === "flow" || state.screen === "acta" ? "form" : "home";
    if (state.screen === "home") app.innerHTML = viewHome();
    else if (state.screen === "flow") app.innerHTML = viewFlow();
    else if (state.screen === "historial") app.innerHTML = viewHistorial();
    else if (state.screen === "acta") app.innerHTML = viewActa();
    else if (state.screen === "error") app.innerHTML = viewError();
    afterRender();
  }

  function viewError() {
    return `
      <section class="screen active" id="screen-home">
        ${header({ title: "Compromiso", sub: "Sin padrón", net: false })}
        <div class="panel-scroll">
          <div class="boot-error">
            <h2>No cargó la data</h2>
            <p>Hace falta abrir la app desde el teléfono o la carpeta del proyecto, con los JSON de trabajadores, lotes y evaluadores.</p>
            <button type="button" class="btn btn-primary" data-act="retry">Reintentar</button>
          </div>
        </div>
      </section>`;
  }

  function viewHome() {
    const today = jornadaHoy();
    const delDia = state.actas.filter((acta) => jornadaDe(acta) === today);
    const llamadas = delDia.filter((acta) => acta.tipo === "llamada").length;
    const cartas = delDia.filter((acta) => acta.tipo === "escrita").length;
    const dts = delDia.filter((acta) => acta.tipo === "dt").length;
    const ultima = state.actas[0];
    return `
      <section class="screen active" id="screen-home">
        <div class="home-atmosphere" aria-hidden="true">
          <span class="orb orb-a"></span>
          <span class="orb orb-b"></span>
          <span class="orb orb-c"></span>
        </div>
        ${header({
          title: "Compromiso",
          sub: "Licapa I - II - III · cosecha",
          tools: [
            { act: "historial", icon: "history", label: "Historial" },
            { act: "help", icon: "settings", label: "Ajustes" }
          ]
        })}
        <div class="panel-scroll">
          <section class="section-card resp-card">
            <button type="button" class="resp-select" data-act="open-supervisor" aria-label="Responsable">
              <span>Responsable de todo el proceso</span>
              <strong>${state.draft.supervisor ? esc(titleCase(state.draft.supervisor.nombre)) : "Elige al responsable"}</strong>
              ${icon("chevron", 18)}
            </button>
          </section>
          <section class="section-card finder">
            <div class="section-head">
              <h2 class="section-title">Ingresa el DNI de quien no cumple</h2>
              <p class="section-sub" id="campo-chip">Escribe el DNI o el apellido del personal que no cumple las reglas.</p>
            </div>
            <div class="finder-call">
              <img class="finder-boss" src="${IMG.supervisor}" alt="">
              <button type="button" class="qr-scan-btn" data-act="scan-qr" aria-label="Escanear QR">${icon("scan", 20)}</button>
            </div>
            <div class="finder-row">
              <input id="home-q" class="name-input" type="search" autocomplete="off" placeholder="DNI o apellido" value="${esc(state.query)}" aria-label="Buscar cosechador">
            </div>
            <div id="home-out"></div>
          </section>
          <div class="install-banner" id="install-banner" hidden>
            <div class="install-banner-copy">
              <strong>Instalar en el teléfono</strong>
              <p>Queda como app, con el padrón adentro.</p>
            </div>
            <div class="install-banner-actions">
              <button type="button" class="install-banner-btn" data-act="install">Instalar</button>
              <button type="button" class="install-banner-dismiss" data-act="dismiss-install" aria-label="Cerrar">×</button>
            </div>
          </div>
          <section class="flow-map" aria-label="Flujo de campo">
            <div class="flow-map-kicker">De qué trata</div>
            <h3>Llamada, carta y DT</h3>
            ${flowStep(1, "Llamada de atención", "Primera vez. Se marca el suceso.", false)}
            ${flowStep(2, "Carta de compromiso", "Solo si la llamada ya está. No se salta.", false)}
            ${flowStep(3, "Dirección Técnica", "Solo si la llamada y la carta ya están.", true)}
          </section>
          <section class="ops-panel">
            <div class="ops-head">
              <div>
                <div class="ops-kicker">Hoy en este teléfono</div>
                <h3>${dts ? "Hay casos en DT" : llamadas || cartas ? "Hay medidas hoy" : "Panel del día"}</h3>
              </div>
              <div class="ops-date">${esc(shortToday())}</div>
            </div>
            <div class="ops-kpis ops-kpis-3">
              <div class="kpi">
                <span class="kpi-val">${llamadas}</span>
                <span class="kpi-label">Llamadas</span>
              </div>
              <div class="kpi ${cartas ? "warn" : ""}">
                <span class="kpi-val">${cartas}</span>
                <span class="kpi-label">Cartas</span>
              </div>
              <div class="kpi kpi-sum">
                <span class="kpi-val">${dts}</span>
                <span class="kpi-label">DT</span>
              </div>
            </div>
            <div class="ops-section-label">Última acta</div>
            ${ultima ? ultimaCard(ultima) : `<div class="ops-last-empty">Todavía no hay actas guardadas.</div>`}
          </section>
          <p class="home-foot">Q Berries · Compromiso de trabajo · Licapa</p>
        </div>
      </section>`;
  }

  function flowStep(n, title, text, last) {
    return `
      <div class="flow-step">
        <div class="flow-rail">
          <span class="flow-num">${n}</span>
          ${last ? "" : `<span class="flow-line"></span>`}
        </div>
        <div class="flow-copy">
          <strong>${title}</strong>
          <p>${text}</p>
        </div>
      </div>`;
  }

  function ultimaCard(acta) {
    return `
      <button type="button" class="ops-last-card card-hit" data-act="open-acta" data-id="${esc(acta.id)}" data-from="home">
        <div class="ops-last-top">
          <span class="ops-last-tag">${esc(medidaById(acta.tipo === "conforme" ? "llamada" : acta.tipo).label)}</span>
          <span class="ops-last-time">${esc(cortoHora(acta.hora))} · ${esc(cortoFecha(acta.fecha))}</span>
        </div>
        <div class="ops-last-body">
          <div class="ops-last-info">
            <strong>${esc(titleCase(acta.trabajador.nombre))}</strong>
            <p>DNI ${esc(acta.trabajador.dni)}${acta.motivoLabel ? ` · ${esc(acta.motivoLabel)}` : ""}</p>
          </div>
        </div>
      </button>`;
  }

  function worst(acta) {
    const items = (acta.criterios || []).filter((item) => typeof item.valor === "number");
    if (!items.length) return null;
    items.sort((a, b) => b.valor - a.valor);
    const top = items[0];
    const criterio = CRITERIOS.find((item) => item.id === top.id);
    const kind = criterio ? band({ ...criterio, valor: top.valor }) : "na";
    return { valor: top.valor, label: top.label, band: kind === "empty" ? "na" : kind };
  }

  function viewFlow() {
    return `
      <section class="screen active" id="screen-flow">
        ${header({
          compact: true,
          back: "back",
          title: "Checklist",
          sub: "Licapa I - II - III · cosecha",
          net: false,
          tools: [
            { act: "historial", icon: "history", label: "Historial" },
            { act: "help", icon: "settings", label: "Ajustes" }
          ]
        })}
        <div class="panel-scroll">
          <div class="form-body">
            ${stepChecklist()}
          </div>
        </div>
      </section>`;
  }

  function personCard(person) {
    const fase = faseDe(person.dni);
    const fuera = person.fueraDePadron;
    const next = medidaById(fase).label;
    return `
      <article class="person-card ${fuera ? "is-out" : ""}">
        <div class="avatar" style="background:${avatarColor(person.dni)}">${esc(initials(person.nombre))}</div>
        <div>
          <strong>${esc(titleCase(person.nombre))}</strong>
          <p>DNI ${esc(person.dni)}${person.cargo ? ` · ${esc(titleCase(person.cargo))}` : ""}</p>
          <div class="person-tags">
            <span class="tag ${fase !== "llamada" ? "bad" : ""}">Fase: ${esc(next)}</span>
          </div>
          <button type="button" class="person-change" data-act="clear-worker">Elegir otra persona</button>
        </div>
      </article>`;
  }

  function faseCorta(id) {
    if (id === "escrita") return "Carta";
    if (id === "dt") return "DT";
    return "Llamada";
  }

  function fasePill(dni) {
    if (dtBloqueado(dni)) return `<span class="fase-pill is-lock">Bloqueado</span>`;
    const fase = faseDe(dni);
    return `<span class="fase-pill is-${fase}">${esc(faseCorta(fase))}</span>`;
  }

  function filaTrabajador(worker) {
    const bloqueado = dtBloqueado(worker.dni);
    return `
      <button type="button" class="hit-row${bloqueado ? " is-blocked" : ""}" data-act="abrir" data-dni="${esc(worker.dni)}">
        <span>
          <strong>${esc(titleCase(worker.nombre))}</strong>
          <small>DNI ${esc(worker.dni)}</small>
        </span>
        ${fasePill(worker.dni)}
      </button>`;
  }

  function paintHomeSearch() {
    const slot = document.getElementById("home-out");
    if (!slot) return;
    const query = state.query.trim();
    if (!query) {
      slot.innerHTML = "";
      return;
    }
    if (/^\d+$/.test(query) && query.length < 8) {
      const hits = searchWorkers(query).slice(0, 8);
      slot.innerHTML = hits.length ? `<div class="result-list">${hits.map(filaTrabajador).join("")}</div>` : `<p class="search-empty">${8 - query.length} dígitos más</p>`;
      return;
    }
    if (/^\d{8}$/.test(query)) {
      const found = state.workersByDni.get(query);
      slot.innerHTML = found ? `<div class="result-list">${filaTrabajador(found)}</div>` : `<p class="search-empty">Ese DNI no está en el padrón.</p>`;
      return;
    }
    const hits = searchWorkers(query);
    if (query.length < 2) {
      slot.innerHTML = "";
      return;
    }
    slot.innerHTML = hits.length
      ? `<div class="result-list">${hits.map(filaTrabajador).join("")}</div>`
      : `<p class="search-empty">Nadie coincide.</p>`;
  }

  function avisoDt() {
    toast("Sigue en suspensión. Solo Recursos Humanos lo libera, quitando el check de DT.", "warn");
  }

  async function abrirTrabajador(worker) {
    if (tuvoDt(worker.dni) || dtBloqueado(worker.dni)) {
      const remote = await historiaDe(worker.dni);
      const mando = servidorBloquea(remote, worker.dni);
      if (mando === true) {
        cerrarDt(worker.dni);
        avisoDt();
        return;
      }
      if (mando === false) soltarDt(worker.dni);
      else if (dtBloqueado(worker.dni)) {
        avisoDt();
        return;
      }
    }
    const evaluador = state.draft.evaluador;
    const supervisor = state.draft.supervisor;
    state.draft = emptyDraft();
    state.draft.evaluador = evaluador;
    state.draft.supervisor = supervisor;
    state.draft.trabajador = Object.assign({}, worker, { fueraDePadron: false });
    state.query = worker.dni;
    state.searchMode = "dni";
    state.step = 2;
    state.maxReached = 2;
    persistDraft();
    go("flow");
    const antes = faseDe(worker.dni);
    asegurarHistoria(worker.dni).then(() => {
      if (state.screen === "flow" && state.draft.trabajador && state.draft.trabajador.dni === worker.dni && faseDe(worker.dni) !== antes) render();
    });
  }

  function paintWorkerSearch() {
    const slot = document.getElementById("worker-out");
    const manual = document.getElementById("manual-box");
    if (!slot) return;
    const person = state.draft.trabajador;
    const query = state.query.trim();
    if (person && (state.searchMode === "nombre" || person.dni === query || person.fueraDePadron)) {
      slot.innerHTML = personCard(person);
      if (manual) manual.hidden = true;
      return;
    }
    if (state.searchMode === "dni") {
      if (query.length < 8) {
        slot.innerHTML = query ? `<p class="search-empty">${8 - query.length} dígito${query.length === 7 ? "" : "s"} más</p>` : "";
        if (manual) manual.hidden = true;
        return;
      }
      const found = state.workersByDni.get(query);
      if (found) {
        slot.innerHTML = personCard(found);
        if (manual) manual.hidden = true;
        return;
      }
      slot.innerHTML = `<p class="search-empty">El DNI ${esc(query)} no está en el padrón.</p>
        <button type="button" class="linkish" data-act="open-manual">Registrar fuera del padrón</button>`;
      if (manual) manual.hidden = !state.manualOpen;
      return;
    }
    const hits = searchWorkers(query);
    if (query.length < 2) {
      slot.innerHTML = "";
      return;
    }
    if (!hits.length) {
      slot.innerHTML = `<p class="search-empty">Nadie coincide. Prueba con el DNI.</p>`;
      return;
    }
    slot.innerHTML = `<div class="result-list">${hits.map(filaTrabajador).join("")}</div>`;
  }

  function stepChecklist() {
    const person = state.draft.trabajador;
    const fase = medidaActual();
    const prev = actasDe(person.dni);
    const hecha = (id) => prev.some((acta) => acta.tipo === id);
    const marcados = state.draft.marcados || [];
    const responsable = state.draft.supervisor;
    return `
      <section class="section-card compact">
        <button type="button" class="who-line resp-pick" data-act="open-supervisor">
          <span>Responsable</span>
          <strong>${responsable ? esc(titleCase(responsable.nombre)) : "Elige supervisor de cosecha"}</strong>
        </button>
      </section>
      <section class="section-card compact">
        <div class="who-line">
          <strong>${esc(titleCase(person.nombre))}</strong>
          <span>DNI ${esc(person.dni)}${person.fueraDePadron ? " · Fuera del padrón" : ""}</span>
        </div>
      </section>
      <section class="section-card">
        <div class="section-head">
          <h2 class="section-title">Disciplinaria</h2>
          <p class="section-sub">Identificación, suceso y la medida que toca.</p>
        </div>
        <div class="fase-cols" aria-label="Fases de esta persona">
          ${[["llamada", "Llamada"], ["escrita", "Carta"], ["dt", "DT"]].map(([id, label]) => {
            const on = id === "dt" ? dtBloqueado(person.dni) : hecha(id);
            return `<div class="fase-col ${on ? "is-on" : ""}">${on ? `<img class="fase-check" src="${IMG.check}" alt="">` : "—"} ${esc(label)}</div>`;
          }).join("")}
        </div>
        <div class="fase-list">
          ${MEDIDAS.map((item) => {
            const abierta = item.id === fase;
            const lista = item.id === "dt" ? dtBloqueado(person.dni) : hecha(item.id);
            const bloqueada = !abierta && !lista;
            return `
              <div class="fase ${abierta ? "is-open" : ""} ${lista ? "is-done" : ""} ${bloqueada ? "is-locked" : ""}">
                <button type="button" class="fase-head" data-act="fase" data-fase="${item.id}">
                  <span>
                    <strong>${esc(item.label)}</strong>
                    <small>${lista ? "Ya registrada" : abierta ? (item.id === "escrita" ? "Escanea el QR del carnet" : "Marca el suceso") : "Primero la fase anterior"}</small>
                  </span>
                  <span class="fase-state">${lista ? "Lista" : abierta ? "Abierta" : "Cerrada"}</span>
                </button>
                ${abierta ? `
                  <div class="fase-body">
                    ${SUCESOS.reduce((html, criterio, index) => {
                      const titulo = index === 0 || SUCESOS[index - 1].grupo !== criterio.grupo
                        ? `<p class="suceso-grupo">${esc(criterio.grupo)}</p>`
                        : "";
                      return html + titulo + `
                      <label class="criterio" data-act="criterio">
                        <input type="checkbox" data-criterio="${criterio.id}" ${marcados.includes(criterio.id) ? "checked" : ""}>
                        <span>${esc(criterio.label)}</span>
                      </label>`;
                    }, "")}
                    <label class="field">
                      <span>Descripción del suceso</span>
                      <textarea id="suceso-nota" maxlength="180" placeholder="Qué pasó">${esc(state.draft.descripcion)}</textarea>
                    </label>
                    ${item.id === "escrita" ? `
                      <div class="finder-row carnet-scan">
                        <label class="carnet-row is-show" data-act="carnet">
                          <input type="checkbox" id="carnet-visto" ${state.draft.carnetVisto ? "checked" : ""}>
                          <span>Carnet visto en presencia</span>
                        </label>
                        <button type="button" class="qr-scan-btn ${state.draft.qrOk ? "is-ok" : ""}" data-act="scan-qr" aria-label="Escanear QR">
                          ${icon(state.draft.qrOk ? "check" : "scan", 20)}
                        </button>
                      </div>` : ""}
                  </div>` : ""}
              </div>`;
          }).join("")}
        </div>
      </section>`;
  }

  function paintChecklist() {
    const n = (state.draft.marcados || []).length;
    const sub = document.querySelector("#screen-flow .section-sub");
    if (sub) sub.textContent = n ? `Identificación, suceso y la medida. ${n} marcado${n === 1 ? "" : "s"}.` : "Identificación, suceso y la medida que toca.";
  }

  function stepEval() {
    return `
      <section class="section-card">
        <div class="section-head">
          <h2 class="section-title">Lo medido</h2>
          <p class="section-sub">Deja vacío lo que no mediste. El rojizo es la llamada que antes se escribía a mano.</p>
        </div>
        <div class="defect-grid" id="defect-grid">
          ${CRITERIOS.map((criterio) => defectField(criterio)).join("")}
        </div>
        <p class="eval-status" id="eval-status"></p>
      </section>
      <section class="section-card">
        <div class="section-head">
          <h2 class="section-title">Otro motivo</h2>
          <p class="section-sub">Si la llamada no es por un porcentaje. Ejemplo: no cumplió la instrucción de selección.</p>
        </div>
        <label class="field">
          <span class="sr" style="position:absolute;width:1px;height:1px;overflow:hidden">Otro motivo</span>
          <textarea id="otro" maxlength="180" placeholder="Opcional">${esc(state.draft.otro)}</textarea>
        </label>
      </section>
      <section class="section-card compact">
        <label class="field comment-field">
          <span>Nota de campo</span>
          <textarea id="detalle" maxlength="280" placeholder="Opcional. No sale en la frase del cuaderno.">${esc(state.draft.detalle)}</textarea>
        </label>
        <div class="sentence-preview ${needsLlamada() ? "" : "is-ok"}" id="sentence-preview"></div>
      </section>`;
  }

  function defectField(criterio) {
    const raw = state.draft.criterios[criterio.id];
    const valor = readPct(raw);
    const kind = valor === null ? "empty" : band({ ...criterio, valor });
    const cls = kind === "pobre" ? "is-over" : kind === "regular" ? "is-watch" : kind === "excelente" ? "is-ok" : "";
    return `
      <div class="defect-item ${cls}" data-box="${criterio.id}">
        <label for="pct-${criterio.id}">${esc(criterio.label)}</label>
        <input id="pct-${criterio.id}" class="pct-input" inputmode="decimal" autocomplete="off" placeholder="—" value="${esc(raw)}" data-criterio="${criterio.id}" aria-label="${esc(criterio.label)}">
        <div class="defect-live">
          <span class="defect-live-pct umbral">Umbral ${criterio.umbral}%</span>
          ${kind === "empty" ? `<span class="pill na">Sin dato</span>` : `<span class="pill ${kind}">${bandLabel(kind)}</span>`}
        </div>
      </div>`;
  }

  function paintEval() {
    const status = document.getElementById("eval-status");
    if (!status) return;
    CRITERIOS.forEach((criterio) => {
      const box = document.querySelector(`[data-box="${criterio.id}"]`);
      if (!box) return;
      const valor = readPct(state.draft.criterios[criterio.id]);
      const kind = valor === null ? "empty" : band({ ...criterio, valor });
      box.classList.remove("is-over", "is-watch", "is-ok");
      if (kind === "pobre") box.classList.add("is-over");
      if (kind === "regular") box.classList.add("is-watch");
      if (kind === "excelente") box.classList.add("is-ok");
      const live = box.querySelector(".defect-live");
      live.innerHTML = `<span class="defect-live-pct umbral">Umbral ${criterio.umbral}%</span>${
        kind === "empty" ? `<span class="pill na">Sin dato</span>` : `<span class="pill ${kind}">${bandLabel(kind)}</span>`
      }`;
    });
    const info = evalMessage();
    status.className = `eval-status ${info.cls}`;
    status.textContent = info.msg;
    const preview = document.getElementById("sentence-preview");
    if (preview) {
      preview.className = `sentence-preview ${needsLlamada() ? "" : "is-ok"}`;
      preview.innerHTML = `<span>${needsLlamada() ? "Así queda la llamada" : "Resultado"}</span><p>${esc(buildTexto())}</p>`;
    }
  }

  function evalMessage() {
    if (invalidPct()) return { ok: false, cls: "is-bad", msg: "El porcentaje va de 0 a 100." };
    const any = measured().length > 0 || String(state.draft.otro || "").trim();
    if (!any) return { ok: false, cls: "", msg: "Ingresa al menos un porcentaje, o un motivo escrito." };
    if (needsLlamada()) return { ok: true, cls: "is-warn", msg: "Pasa el umbral. El siguiente paso arma la llamada y pide la firma." };
    return { ok: true, cls: "is-ok", msg: "Dentro del umbral. Se puede guardar la evaluación sin llamada." };
  }

  function stepActa() {
    const llamada = needsLlamada();
    if (!state.draft.textoTouched) state.draft.texto = buildTexto();
    const draft = state.draft;
    const lote = draft.lote;
    return `
      <section class="section-card" style="padding:0;background:transparent;border:none;box-shadow:none">
        <article class="acta-paper ${llamada ? "" : "is-ok"}">
          <div class="acta-kicker">${llamada ? "Llamada de atención" : "Evaluación"}</div>
          <h2 class="acta-title">${llamada ? "Compromiso de trabajo" : "Cosecha dentro del umbral"}</h2>
          <textarea id="acta-texto" class="acta-edit" maxlength="700">${esc(draft.texto)}</textarea>
          <div class="acta-meta">
            <div>${esc(longDate())} · ${esc(limaStamp().hora)}</div>
            <div>${lote ? `${esc(lote.codLote)} · Lote ${esc(lote.lote)} · ${esc(lote.variedad)}` : ""}</div>
            <div>Evalúa ${draft.evaluador ? esc(titleCase(draft.evaluador.nombre)) : "—"}</div>
            ${draft.supervisor ? `<div>Supervisor ${esc(titleCase(draft.supervisor.nombre))}</div>` : ""}
            ${draft.detalle ? `<div>Nota: ${esc(draft.detalle)}</div>` : ""}
          </div>
          ${llamada ? `
            <div class="acta-sign" id="acta-sign-preview">${draft.firma ? `<img alt="Firma" src="${draft.firma}">` : `<span>La firma va debajo</span>`}</div>
            <div class="acta-dni">DNI: ${esc(draft.trabajador.dni)}</div>` : `<div class="acta-dni">DNI: ${esc(draft.trabajador.dni)}</div>`}
        </article>
        ${draft.textoTouched ? `<button type="button" class="regen" data-act="regen">Volver a armar el texto con los porcentajes</button>` : `<p class="regen">Puedes corregir el texto antes de guardar.</p>`}
      </section>
      ${llamada ? `
        <section class="section-card">
          <div class="section-head">
            <h2 class="section-title">Firma del trabajador</h2>
            <p class="section-sub">${esc(titleCase(draft.trabajador.nombre))} firma el compromiso. El DNI ya viene del padrón.</p>
          </div>
          <div class="sign-pad ${draft.firma ? "is-signed" : ""}" id="sign-pad">
            <canvas class="sign-canvas" id="sign"></canvas>
            <div class="sign-line"></div>
            <div class="sign-hint">Firme aquí</div>
            <div class="sign-tools">
              <span>Con el dedo</span>
              <button type="button" data-act="clear-sign">Borrar firma</button>
            </div>
          </div>
        </section>` : ""}`;
  }

  function viewActa() {
    const acta = state.viewing;
    if (!acta) return "";
    const medida = medidaById(acta.tipo === "conforme" ? "llamada" : acta.tipo);
    const rank = medida.rank;
    const previas = state.actas.filter((item) => item.id !== acta.id && item.trabajador && item.trabajador.dni === acta.trabajador.dni && item.tipo !== "conforme");
    return `
      <section class="screen active" id="screen-acta">
        ${header({
          compact: true,
          back: "back",
          title: "RRHH",
          sub: acta.id,
          net: false,
          tools: [
            { act: "historial", icon: "history", label: "Historial" },
            { act: "help", icon: "settings", label: "Ajustes" }
          ]
        })}
        <div class="panel-scroll">
          <div class="form-body">
            <article class="acta-paper is-company" id="print-acta">
              <div class="acta-brand">
                <strong>Q Berries</strong>
                <span>Licapa · Compromiso de trabajo</span>
              </div>
              <h2 class="acta-title">${esc(medida.label)}</h2>
              <p class="acta-body">${esc(acta.texto)}</p>
              <div class="acta-meta">
                <div>${esc(acta.fechaLarga || cortoFecha(acta.fecha))} · ${esc(cortoHora(acta.hora))}</div>
                <div>${esc(titleCase(acta.trabajador.nombre))}${acta.trabajador.cargo ? ` · ${esc(titleCase(acta.trabajador.cargo))}` : ""}</div>
                ${acta.supervisor ? `<div>Responsable: ${esc(titleCase(acta.supervisor.nombre))}</div>` : ""}
                ${typeof acta.porcentaje === "number" ? `<div>Porcentaje: ${esc(fmtPct(acta.porcentaje))}% · límite de esta medida ${medida.limite}%</div>` : ""}
                <div>Medida aplicada: sí · ${esc(medida.label)}</div>
                ${acta.qrOk ? `<div>Presencia formalizada con QR del carnet</div>` : ""}
                ${acta.carnetVisto ? `<div>Carnet visto en presencia</div>` : ""}
              </div>
              <div class="acta-dni">DNI: ${esc(acta.trabajador.dni)}</div>
              <div class="acta-id">${esc(acta.id)}</div>
            </article>
            <section class="section-card">
              <div class="section-head">
                <h2 class="section-title">Estado en campo</h2>
                <p class="section-sub">${previas.length ? `${previas.length} registro${previas.length === 1 ? "" : "s"} anterior${previas.length === 1 ? "" : "es"} de esta persona` : "Primer registro de esta persona"}</p>
              </div>
              <div class="ladder">
                ${MEDIDAS.map((item) => {
                  const now = item.rank === rank;
                  const done = item.rank < rank;
                  return `<div class="ladder-item ${now ? "is-now" : ""} ${done ? "is-done" : ""}">
                    <span class="ladder-dot">${done ? "✓" : item.rank}</span>
                    <div>
                      <strong>${esc(item.label)}</strong>
                      <p>${now ? "Ahora" : done ? "Alcanzada" : "Cerrada"} · ${esc(item.vez)}</p>
                    </div>
                  </div>`;
                }).join("")}
              </div>
              <div class="fase-cols" aria-label="Tres fases">
                ${[["llamada", "Llamada"], ["escrita", "Carta"], ["dt", "DT"]].map(([id, label]) => {
                  const on = !!(acta.columnas && acta.columnas[id]) || actasDe(acta.trabajador.dni).some((item) => item.tipo === id);
                  return `<div class="fase-col ${on ? "is-on" : ""}">${on ? `<img class="fase-check" src="${IMG.check}" alt="">` : "—"} ${esc(label)}</div>`;
                }).join("")}
              </div>
              ${acta.tipo === "dt"
                ? `<button type="button" class="btn btn-primary dt-send" data-act="enviar-dt">${acta.responsableDt ? "DT ya es responsable · reenviar" : "DT responsable y enviar"}</button>${acta.responsableDt ? `<p class="dt-note">Dirección Técnica quedó responsable de este caso.</p>` : ""}`
                : `<button type="button" class="btn btn-primary dt-send" data-act="confirmar">Confirmar lectura</button>`}
            </section>
          </div>
        </div>
      </section>`;
  }

  function viewHistorial() {
    return `
      <section class="screen active" id="screen-historial">
        ${header({
          compact: true,
          back: "home",
          title: "Historial",
          sub: "Actas de este teléfono",
          net: false
        })}
        <div class="panel-scroll">
          <div class="uploads-wrap">
            <div class="hist-tools">
              <input id="hist-q" class="hist-search" type="search" placeholder="DNI o apellido" value="${esc(state.histQuery)}" autocomplete="off">
              <div class="filters" id="hist-filters">
                ${["hoy", "llamada", "escrita", "dt", "todas"].map((key) => {
                  const label = { hoy: "Hoy", llamada: "Llamadas", escrita: "Cartas", dt: "DT", todas: "Todas" }[key];
                  return `<button type="button" data-act="filter" data-filter="${key}" class="${state.histFilter === key ? "is-on" : ""}">${label}</button>`;
                }).join("")}
              </div>
            </div>
            <p class="hist-warn">El día empieza a las 6:00 a. m. y sigue hasta las 6:00 a. m. del día siguiente. Lo anterior sigue en el Excel.</p>
            <p class="uploads-summary" id="hist-summary"></p>
            <div class="uploads-list" id="hist-list"></div>
            <div class="uploads-pager" id="hist-pager" hidden></div>
          </div>
        </div>
      </section>`;
  }

  function filteredActas() {
    const q = norm(state.histQuery).trim();
    const digits = q.replace(/\D/g, "");
    const today = jornadaHoy();
    return state.actas.filter((acta) => {
      if (jornadaDe(acta) !== today) return false;
      if (state.histFilter === "llamada" && acta.tipo !== "llamada") return false;
      if (state.histFilter === "escrita" && acta.tipo !== "escrita") return false;
      if (state.histFilter === "dt" && acta.tipo !== "dt") return false;
      if (!q) return true;
      const byName = norm(acta.trabajador.nombre).includes(q);
      const byDni = digits && acta.trabajador.dni.includes(digits);
      return byName || byDni;
    });
  }

  function paintHist() {
    const summary = document.getElementById("hist-summary");
    const list = document.getElementById("hist-list");
    const pager = document.getElementById("hist-pager");
    if (!list) return;
    const rows = filteredActas();
    const pages = Math.max(1, Math.ceil(rows.length / PAGE));
    if (state.histPage > pages) state.histPage = pages;
    const slice = rows.slice((state.histPage - 1) * PAGE, state.histPage * PAGE);
    summary.textContent = rows.length ? `${rows.length} acta${rows.length === 1 ? "" : "s"}` : "Sin actas con este filtro";
    if (!rows.length) {
      list.innerHTML = state.actas.length
        ? `<div class="uploads-empty">Nada en el día de hoy.<p class="uploads-empty-sub">Lo de ayer sigue en el Excel. No se perdió.</p></div>`
        : `<div class="uploads-empty">No hay actas todavía.<p class="uploads-empty-sub">Cuando registras una, queda en el teléfono y en el Excel.</p></div>`;
      pager.hidden = true;
      return;
    }
    list.innerHTML = slice.map((acta) => {
      const top = worst(acta);
      const score = typeof acta.porcentaje === "number"
        ? `<span class="big">${esc(fmtPct(acta.porcentaje))}%</span><span class="sm">${esc(medidaById(acta.tipo).vez.split("·")[0])}</span>`
        : top ? `<span class="big">${esc(fmtPct(top.valor))}%</span><span class="sm">${esc(top.label)}</span>` : "";
      return `
        <button type="button" class="upload-card card-hit ${acta.tipo === "dt" || acta.tipo === "llamada" || acta.tipo === "escrita" ? "is-pending" : ""}" data-act="open-acta" data-id="${esc(acta.id)}" data-from="historial">
          <div class="upload-card-top">
            <span class="upload-card-type">${esc(medidaById(acta.tipo === "conforme" ? "llamada" : acta.tipo).label)}</span>
            <span class="upload-card-status ${acta.tipo === "dt" ? "pending" : "sent"}">${acta.tipo === "dt" ? "RRHH" : "Campo"}</span>
          </div>
          <div class="upload-card-body">
            <div class="upload-card-info">
              <strong>${esc(titleCase(acta.trabajador.nombre))}</strong>
              <p>DNI ${esc(acta.trabajador.dni)}${acta.motivoLabel ? ` · ${esc(acta.motivoLabel)}` : ""}</p>
            </div>
            ${score ? `<div class="upload-card-score">${score}</div>` : ""}
          </div>
          <div class="upload-card-foot">
            <span class="upload-card-nota">${esc(cortoFecha(acta.fecha))} · ${esc(cortoHora(acta.hora))}</span>
            <span class="upload-card-nota">${esc(acta.id)}</span>
          </div>
        </button>`;
    }).join("");
    pager.hidden = pages < 2;
    pager.innerHTML = `
      <button type="button" class="pager-btn" data-act="page" data-dir="-1" ${state.histPage <= 1 ? "disabled" : ""}>Anterior</button>
      <span class="pager-info">${state.histPage} / ${pages}</span>
      <button type="button" class="pager-btn" data-act="page" data-dir="1" ${state.histPage >= pages ? "disabled" : ""}>Siguiente</button>`;
  }

  function listoParaSubir(acta) {
    return acta.confirmado !== false && (acta.pending || acta.synced !== true);
  }

  function pendientesDeSubida() {
    return state.actas.filter(listoParaSubir).length;
  }

  function paintNet() {
    const chip = document.getElementById("net-chip");
    if (chip) {
      const online = navigator.onLine;
      chip.className = `status-chip ${online ? "online" : "offline"}`;
      chip.innerHTML = `<span class="dot"></span>${online ? "En línea" : "Sin señal"}`;
    }
    const pending = document.getElementById("pending-chip");
    if (!pending) return;
    const n = pendientesDeSubida();
    pending.className = `status-chip pending${n ? " has-items" : ""}`;
    pending.innerHTML = `<span class="dot"></span>${n ? `${n} pendiente${n === 1 ? "" : "s"}` : "Pendientes 0"}`;
  }

  function paintInstall() {
    const banner = document.getElementById("install-banner");
    if (!banner) return;
    const dismissed = localStorage.getItem("qb-install-dismiss") === "1";
    banner.hidden = dismissed || !deferredPrompt;
  }

  function canOpen(step) {
    if (step <= 1) return true;
    return !!state.draft.trabajador;
  }

  function checklistOk() {
    if (!(state.draft.marcados || []).length) return false;
    if (medidaActual() === "escrita" && !state.draft.qrOk) return false;
    return true;
  }

  function canLeave(step) {
    if (step === 1) return !!state.draft.trabajador;
    if (step === 2) return checklistOk();
    return false;
  }

  function nextLabel() {
    if (state.step === 1) return "Ir al checklist";
    const medida = medidaActual();
    if (medida === "dt") return "Enviar a DT";
    if (medida === "escrita") return "Registrar carta";
    return "Registrar llamada";
  }

  function paintActions() {
    actions.classList.toggle("is-acta", state.screen === "acta" && !!state.viewing);
    if (state.screen === "flow") {
      const ok = canLeave(state.step);
      actions.innerHTML = `
        <button type="button" class="btn btn-ghost" data-act="back">${state.step === 1 ? "Inicio" : "Atrás"}</button>
        <button type="button" class="btn btn-primary" data-act="next" ${ok ? "" : "disabled"}>${esc(nextLabel())}</button>`;
      return;
    }
    if (state.screen === "acta" && state.viewing) {
      actions.innerHTML = `
        <button type="button" class="btn btn-ghost" data-act="back">Volver</button>
        <button type="button" class="btn btn-ghost" data-act="pdf">${icon("pdf", 18)} PDF</button>
        <button type="button" class="btn btn-primary" data-act="share">${icon("share", 18)} Compartir</button>`;
      return;
    }
    actions.innerHTML = "";
  }

  function afterRender() {
    paintFab();
    paintActions();
    paintNet();
    paintInstall();
    if (state.screen === "home") paintHomeSearch();
    if (state.screen === "flow" && state.step === 1) paintWorkerSearch();
    if (state.screen === "flow" && state.step === 2) paintChecklist();
    if (state.screen === "historial") paintHist();
    const scroller = document.querySelector(".panel-scroll");
    if (scroller) scroller.scrollTop = 0;
    const helpCount = document.getElementById("help-padron");
    if (helpCount && state.padrón.count) {
      const when = state.padrón.updatedAt ? state.padrón.updatedAt.slice(0, 10) : "";
      helpCount.textContent = `${new Intl.NumberFormat("es-PE").format(state.padrón.count)}${when ? ` · ${when}` : ""}`;
    }
  }

  function snapshotSign() {
    const canvas = document.getElementById("sign");
    if (!canvas || !state.signed) return;
    state.draft.firma = canvas.toDataURL("image/png");
  }

  function setupSign() {
    const canvas = document.getElementById("sign");
    if (!canvas || canvas.dataset.bound === "1") return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2) {
      const tries = Number(canvas.dataset.tries || 0) + 1;
      canvas.dataset.tries = String(tries);
      if (tries < 8) requestAnimationFrame(setupSign);
      return;
    }
    canvas.dataset.bound = "1";
    const ctx = canvas.getContext("2d");
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1F3D2A";
    const cssW = rect.width;
    const cssH = rect.height;

    function clearCanvas() {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    if (state.draft.firma) {
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, 0, 0, cssW, cssH);
        state.signed = true;
        paintActions();
      };
      image.src = state.draft.firma;
    }

    let drawing = false;
    const point = (event) => {
      const box = canvas.getBoundingClientRect();
      return { x: event.clientX - box.left, y: event.clientY - box.top };
    };
    canvas.addEventListener("pointerdown", (event) => {
      drawing = true;
      canvas.setPointerCapture(event.pointerId);
      const p = point(event);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      state.signed = true;
      document.getElementById("sign-pad").classList.add("is-signed");
      paintActions();
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!drawing) return;
      const p = point(event);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    });
    const end = () => {
      if (!drawing) return;
      drawing = false;
      snapshotSign();
      const preview = document.getElementById("acta-sign-preview");
      if (preview && state.draft.firma) preview.innerHTML = `<img alt="Firma" src="${state.draft.firma}">`;
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    canvas._clear = () => {
      clearCanvas();
      state.signed = false;
      state.draft.firma = null;
      document.getElementById("sign-pad").classList.remove("is-signed");
      const preview = document.getElementById("acta-sign-preview");
      if (preview) preview.innerHTML = `<span>La firma va debajo</span>`;
      paintActions();
    };
  }

  function syncWorkerFromDni() {
    if (state.searchMode !== "dni") return;
    const query = state.query.trim();
    if (query.length === 8) {
      const found = state.workersByDni.get(query);
      if (found) {
        state.draft.trabajador = Object.assign({}, found, { fueraDePadron: false });
        state.manualOpen = false;
        return;
      }
      if (state.draft.trabajador && !state.draft.trabajador.fueraDePadron) state.draft.trabajador = null;
      if (state.draft.trabajador && state.draft.trabajador.dni !== query) state.draft.trabajador = null;
      return;
    }
    if (!(state.draft.trabajador && state.draft.trabajador.fueraDePadron && state.draft.trabajador.dni === query)) {
      state.draft.trabajador = null;
    }
  }

  function openPicker(kind) {
    picker.kind = kind;
    const titles = { evaluador: "Evaluador", lote: "Lote de Licapa", supervisor: "Responsable" };
    document.getElementById("picker-title").textContent = titles[kind];
    document.getElementById("picker-q").value = "";
    if (kind === "evaluador") {
      picker.items = state.evaluadores.map((person) => ({
        id: person.dni,
        title: titleCase(person.nombre),
        meta: `DNI ${person.dni}`
      }));
    } else if (kind === "supervisor") {
      picker.items = state.supervisores.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es")).map((person) => ({
        id: person.dni,
        title: titleCase(person.nombre),
        meta: `DNI ${person.dni}`
      }));
    } else {
      picker.items = state.lotes.map((lote) => ({
        id: lote.codLote,
        title: `${lote.codLote} · Lote ${lote.lote}`,
        meta: `${lote.modulo} · Turno ${lote.turno} · ${lote.variedad}`
      }));
    }
    paintPicker();
    const overlay = document.getElementById("picker");
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("precise-open");
    setTimeout(() => document.getElementById("picker-q").focus(), 60);
  }

  function closePicker() {
    const overlay = document.getElementById("picker");
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("precise-open");
  }

  function paintPicker() {
    const q = norm(document.getElementById("picker-q").value).trim();
    const tokens = q ? q.split(/\s+/) : [];
    let items = picker.items.filter((item) => {
      if (!tokens.length) return true;
      const hay = norm(`${item.title} ${item.meta} ${item.id}`);
      return tokens.every((token) => hay.includes(token));
    });
    const more = items.length > 80;
    items = items.slice(0, 80);
    const list = document.getElementById("picker-list");
    if (!items.length) {
      list.innerHTML = `<p class="precise-empty">Sin resultados</p>`;
      return;
    }
    const chosen = picker.kind === "supervisor" && state.draft.supervisor ? state.draft.supervisor.dni : "";
    list.innerHTML = items.map((item) => `
      <button type="button" class="precise-option ${item.id === chosen ? "selected" : ""}" data-act="pick-item" data-id="${esc(item.id)}">
        <span class="opt-title">${esc(item.title)}</span>
        <span class="opt-meta">${esc(item.meta)}</span>
      </button>`).join("") + (more ? `<p class="precise-empty">Sigue escribiendo para afinar.</p>` : "");
  }

  function applyPick(id) {
    if (picker.kind === "evaluador") {
      const person = state.evaluadores.find((item) => item.dni === id);
      if (person) state.draft.evaluador = { dni: person.dni, nombre: person.nombre };
    } else if (picker.kind === "supervisor") {
      if (!id) {
        state.draft.supervisor = null;
        localStorage.removeItem("qb-responsable");
      }
      else {
        const person = state.supervisores.find((item) => item.dni === id);
        if (person) state.draft.supervisor = { dni: person.dni, nombre: person.nombre };
      }
    } else if (picker.kind === "lote") {
      const lote = state.lotes.find((item) => item.codLote === id);
      if (lote) {
        state.draft.lote = {
          codLote: lote.codLote,
          lote: lote.lote,
          modulo: lote.modulo,
          turno: lote.turno,
          etapa: lote.etapa,
          variedad: lote.variedad
        };
      }
    }
    closePicker();
    persistDraft();
    render();
  }

  async function saveActa() {
    if (state.saving) return;
    if (state.draft.trabajador && dtBloqueado(state.draft.trabajador.dni)) {
      avisoDt();
      return;
    }
    if (!state.draft.supervisor) {
      toast("Elige al responsable", "warn");
      openPicker("supervisor");
      return;
    }
    if (!checklistOk()) {
      if (!(state.draft.marcados || []).length) toast("Marca el suceso", "warn");
      else toast("Escanea el QR del carnet", "warn");
      return;
    }
    state.saving = true;
    const stamp = limaStamp();
    const medida = medidaActual();
    const criterios = motivosMarcados();
    const dni = state.draft.trabajador.dni;
    const yaDt = columnasDe(dni).dt;
    const columnas = Object.assign(columnasDe(dni), { [medida]: true });
    const acta = {
      id: `CL-${stamp.yyyymmdd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      yyyymmdd: stamp.yyyymmdd,
      fecha: stamp.fecha,
      hora: stamp.hora,
      fechaLarga: longDate(),
      tipo: medida,
      motivoId: criterios.map((item) => item.id).join(","),
      motivoLabel: criterios.map((item) => item.label).join(", "),
      criterios: criterios.map((item) => ({ id: item.id, label: item.label })),
      columnas: columnas,
      progreso: columnas,
      porcentaje: null,
      texto: buildTexto(),
      descripcion: String(state.draft.descripcion || "").trim(),
      carnetVisto: medida === "escrita" ? !!state.draft.carnetVisto : false,
      qrOk: medida === "escrita" ? !!state.draft.qrOk : false,
      qrValor: medida === "escrita" && state.draft.qrOk ? String(state.draft.qrValor || "").slice(0, 120) : "",
      trabajador: {
        dni: dni,
        nombre: state.draft.trabajador.nombre,
        cargo: state.draft.trabajador.cargo || "",
        fueraDePadron: !!state.draft.trabajador.fueraDePadron
      },
      evaluador: state.draft.evaluador,
      supervisor: state.draft.supervisor,
      repetia: actasDe(dni).length
    };
    try {
      acta.confirmado = false;
      acta.pending = false;
      acta.synced = false;
      state.actas = state.actas.filter((item) => item.id !== acta.id);
      await idbPut(acta);
      state.actas.unshift(acta);
      state.viewing = acta;
      state.returnTo = "home";
      clearDraft(true);
      if (navigator.vibrate) navigator.vibrate(12);
      const llegaDt = medida === "dt" && !yaDt;
      go("acta");
      if (llegaDt) {
        await ask({
          title: "Recomendación del caso",
          text: "Esta persona llegó a suspensión. Corresponde mandar el acta a RRHH. Recursos Humanos va a evaluar su caso.",
          ok: "Cerrar",
          hideCancel: true
        });
      }
    } catch (error) {
      toast("No se pudo guardar", "error");
    } finally {
      state.saving = false;
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function wrapLines(ctx, text, maxWidth) {
    const lines = [];
    String(text || "").split("\n").forEach((paragraph) => {
      if (!paragraph.trim()) {
        lines.push("");
        return;
      }
      const words = paragraph.split(/\s+/);
      let line = "";
      words.forEach((word) => {
        const next = line ? `${line} ${word}` : word;
        if (ctx.measureText(next).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else line = next;
      });
      if (line) lines.push(line);
    });
    return lines;
  }

  async function renderPng(acta) {
    await document.fonts.ready;
    const width = 1080;
    const pad = 78;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.font = '700 40px "Plus Jakarta Sans", sans-serif';
    const bodyLines = wrapLines(ctx, acta.texto, width - pad * 2);
    const meta = [
      `${acta.fechaLarga || cortoFecha(acta.fecha)} · ${cortoHora(acta.hora)}`,
      acta.lote ? `${acta.lote.codLote} · ${acta.lote.variedad} · ${acta.lote.etapa}` : "",
      acta.evaluador ? `Evalúa ${titleCase(acta.evaluador.nombre)}` : "",
      typeof acta.porcentaje === "number" ? `${fmtPct(acta.porcentaje)}% · ${acta.motivoLabel || ""}` : "",
      acta.supervisor ? `Supervisor ${titleCase(acta.supervisor.nombre)}` : "",
      titleCase(acta.trabajador.nombre)
    ].filter(Boolean);
    const height = 250 + bodyLines.length * 54 + 40 + meta.length * 36 + (acta.firma ? 230 : 40) + 160;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = "#FFFcf7";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#1F3D2A";
    ctx.fillRect(0, 0, width, 118);
    ctx.fillStyle = "#F7941D";
    ctx.fillRect(0, 118, width, 10);
    ctx.fillStyle = "#fff";
    ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText("Q BERRIES", pad, 52);
    ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText("LICAPA  ·  COMPROMISO DE TRABAJO", pad, 86);
    ctx.fillStyle = "#1F3D2A";
    ctx.font = '800 48px "Plus Jakarta Sans", sans-serif';
    const titulo = acta.tipo === "dt" ? "Suspensión" : acta.tipo === "escrita" ? "Llamada escrita" : "Llamada de atención";
    ctx.fillText(titulo, pad, 196);
    ctx.fillStyle = "#2C3330";
    ctx.font = '700 40px "Plus Jakarta Sans", sans-serif';
    let y = 270;
    bodyLines.forEach((line) => {
      ctx.fillText(line, pad, y);
      y += 54;
    });
    y += 20;
    ctx.strokeStyle = "#E3E8E4";
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(width - pad, y);
    ctx.stroke();
    y += 44;
    ctx.fillStyle = "#6B7570";
    ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
    meta.forEach((line) => {
      ctx.fillText(line, pad, y);
      y += 36;
    });
    if (acta.firma) {
      try {
        const image = await loadImage(acta.firma);
        y += 10;
        ctx.drawImage(image, pad, y, 460, 150);
        y += 160;
      } catch (error) {
        y += 20;
      }
    }
    ctx.strokeStyle = "#2C3330";
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(pad + 420, y);
    ctx.stroke();
    y += 42;
    ctx.fillStyle = "#2C3330";
    ctx.font = '800 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`DNI: ${acta.trabajador.dni}`, pad, y);
    y += 48;
    ctx.fillStyle = "#6B7570";
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Q Berries · Licapa · ${acta.id}`, pad, y);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  function pdfEscape(text) {
    const extra = { "¿": 0xbf, "¡": 0xa1, "°": 0xb0, "·": 0xb7, "–": 0x96, "—": 0x97, "“": 0x93, "”": 0x94, "‘": 0x91, "’": 0x92 };
    let out = "";
    for (const ch of String(text || "")) {
      if (ch === "\\" || ch === "(" || ch === ")") {
        out += `\\${ch}`;
        continue;
      }
      const code = ch.codePointAt(0);
      if (code >= 32 && code <= 126) {
        out += ch;
        continue;
      }
      const byte = extra[ch] != null ? extra[ch] : (code >= 160 && code <= 255 ? code : 63);
      out += `\\${byte.toString(8).padStart(3, "0")}`;
    }
    return out;
  }

  function wrapPdf(text, size) {
    const max = Math.max(18, Math.floor(500 / (size * 0.5)));
    const lines = [];
    String(text || "").split("\n").forEach((paragraph) => {
      if (!paragraph.trim()) {
        lines.push("");
        return;
      }
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      let line = "";
      words.forEach((word) => {
        const next = line ? `${line} ${word}` : word;
        if (next.length > max && line) {
          lines.push(line);
          line = word;
        } else line = next;
      });
      if (line) lines.push(line);
    });
    return lines.length ? lines : [""];
  }

  function buildPdf(acta) {
    const medida = medidaById(acta.tipo === "conforme" ? "llamada" : acta.tipo);
    const rows = [
      ["Fecha", `${acta.fechaLarga || cortoFecha(acta.fecha)} · ${cortoHora(acta.hora)}`],
      ["Trabajador", titleCase(acta.trabajador.nombre)],
      ["DNI", acta.trabajador.dni],
      acta.trabajador.cargo ? ["Cargo", titleCase(acta.trabajador.cargo)] : null,
      acta.supervisor ? ["Responsable", titleCase(acta.supervisor.nombre)] : null,
      ["Medida", medida.label]
    ].filter(Boolean);
    const chunks = [];
    const put = (text, size, font, y, color, x = 48) => {
      chunks.push(`${color} rg`);
      chunks.push(`BT /${font} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET`);
    };
    chunks.push("0.122 0.239 0.165 rg");
    chunks.push("0 798 595 44 re f");
    chunks.push("0.969 0.580 0.114 rg");
    chunks.push("0 794 595 4 re f");
    put("Q BERRIES", 14, "F2", 820, "1 1 1");
    put("LICAPA  ·  COMPROMISO DE TRABAJO", 8, "F1", 804, "0.86 0.91 0.87");
    let y = 758;
    put("DOCUMENTO INTERNO", 8, "F2", y, "0.42 0.46 0.44");
    y -= 26;
    put(medida.label, 20, "F2", y, "0.12 0.24 0.16");
    y -= 18;
    put(acta.id, 9, "F1", y, "0.42 0.46 0.44");
    y -= 28;
    wrapPdf(acta.texto, 12).forEach((line) => {
      put(line, 12, "F1", y, "0.17 0.20 0.19");
      y -= 18;
    });
    y -= 8;
    chunks.push("0.89 0.91 0.90 RG 1 w");
    chunks.push(`48 ${y} m 547 ${y} l S`);
    y -= 24;
    put("DATOS DEL REGISTRO", 8, "F2", y, "0.42 0.46 0.44");
    y -= 20;
    rows.forEach(([label, value]) => {
      put(label, 9, "F2", y, "0.42 0.46 0.44");
      put(value, 11, "F1", y, "0.12 0.18 0.15", 160);
      y -= 18;
    });
    chunks.push("0.89 0.91 0.90 RG 1 w");
    chunks.push("48 46 m 547 46 l S");
    put("Q Berries  ·  Fundo Licapa  ·  Uso interno de la empresa", 8, "F1", 30, "0.42 0.46 0.44");
    const stream = chunks.join("\n");
    const objects = [
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      "<< /Type /Page /Parent 5 0 R /MediaBox [0 0 595 842] /Contents 3 0 R /Resources << /Font << /F1 1 0 R /F2 2 0 R >> >> >>",
      "<< /Type /Pages /Kids [4 0 R] /Count 1 >>",
      "<< /Type /Catalog /Pages 5 0 R >>"
    ];
    let body = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(body.length);
      body += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const startxref = body.length;
    body += `xref\n0 ${objects.length + 1}\n`;
    body += "0000000000 65535 f \n";
    offsets.slice(1).forEach((offset) => {
      body += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    body += `trailer\n<< /Size ${objects.length + 1} /Root 6 0 R >>\nstartxref\n${startxref}\n%%EOF`;
    return new Blob([body], { type: "application/pdf" });
  }

  async function confirmarLectura() {
    const acta = state.viewing;
    if (!acta || state.saving) return;
    state.saving = true;
    const btn = document.querySelector("[data-act='confirmar']");
    if (btn) {
      btn.disabled = true;
      btn.classList.add("is-busy");
      btn.innerHTML = `<span class="btn-spin"></span>Subiendo`;
    }
    try {
      acta.confirmado = true;
      acta.pending = true;
      acta.synced = false;
      let uploaded = false;
      if (navigator.onLine) uploaded = await pushActa(acta, { attempts: 1, ms: 40000 });
      if (uploaded) {
        acta.pending = false;
        acta.synced = true;
        toast("Se subió correctamente");
      } else {
        toast(navigator.onLine ? "Quedó pendiente y sube solo." : "Sin señal. Quedó pendiente.", "warn");
      }
      await idbPut(acta);
      clearDraft(true);
      go("home");
    } catch (error) {
      toast("No se pudo subir", "error");
      if (btn) {
        btn.disabled = false;
        btn.classList.remove("is-busy");
        btn.textContent = "Confirmar lectura";
      }
    } finally {
      state.saving = false;
    }
  }

  async function enviarDt() {
    const acta = state.viewing;
    if (!acta || acta.tipo !== "dt" || state.saving) return;
    const dni = acta.trabajador && acta.trabajador.dni;
    acta.columnas = Object.assign(columnasDe(dni), { dt: true });
    acta.confirmado = true;
    acta.responsableDt = "Dirección Técnica";
    acta.pending = true;
    acta.synced = false;
    state.saving = true;
    const btn = document.querySelector("[data-act='enviar-dt']");
    if (btn) {
      btn.disabled = true;
      btn.classList.add("is-busy");
      btn.innerHTML = `<span class="btn-spin"></span>Subiendo`;
    }
    const index = state.actas.findIndex((item) => item.id === acta.id);
    if (index >= 0) state.actas[index] = acta;
    try {
      await idbPut(acta);
      const ok = navigator.onLine && await pushActa(acta, { attempts: 1, ms: 40000 });
      acta.pending = !ok;
      acta.synced = !!ok;
      await idbPut(acta);
      toast(ok ? "Se subió correctamente" : "Quedó pendiente y sube solo.", ok ? "" : "warn");
      clearDraft(true);
      go("home");
    } catch (error) {
      toast("No se pudo enviar a DT", "error");
      if (btn) {
        btn.disabled = false;
        btn.classList.remove("is-busy");
        btn.textContent = "DT responsable y enviar";
      }
    } finally {
      state.saving = false;
    }
  }

  function downloadPdf() {
    const acta = state.viewing;
    if (!acta) return;
    const blob = buildPdf(acta);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `compromiso-${acta.trabajador.dni}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);
    toast("PDF listo");
  }

  async function shareActa(forceDownload) {
    const acta = state.viewing;
    if (!acta) return;
    setLoader(true, "Preparando imagen");
    try {
      const blob = await renderPng(acta);
      const file = new File([blob], `compromiso-${acta.trabajador.dni}.png`, { type: "image/png" });
      if (!forceDownload && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Compromiso de trabajo",
          text: acta.texto
        });
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = file.name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1500);
        toast("Imagen descargada");
      }
    } catch (error) {
      if (error && error.name === "AbortError") return;
      toast("No se pudo compartir el acta", "error");
    } finally {
      setLoader(false);
    }
  }

  function exportActas() {
    const blob = new Blob([JSON.stringify(state.actas, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `compromisos-${limaStamp().yyyymmdd}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);
    toast("Exportación lista");
  }

  let qrStop = false;
  let qrStream = null;
  let qrButton = null;
  let qrTimer = 0;

  function closeQr() {
    qrStop = true;
    if (qrTimer) {
      clearInterval(qrTimer);
      qrTimer = 0;
    }
    if (qrStream) {
      qrStream.getTracks().forEach((track) => track.stop());
      qrStream = null;
    }
    const box = document.getElementById("qr-inline");
    if (box) box.remove();
    document.documentElement.classList.remove("precise-open");
    if (qrButton) {
      qrButton.classList.remove("is-live");
      qrButton.hidden = false;
      qrButton = null;
    }
  }

  function dniEnPadron(raw) {
    const chunks = String(raw || "").match(/\d{8}/g) || [];
    return chunks.find((dni) => state.workersByDni.has(dni)) || "";
  }

  async function acceptQr(raw) {
    closeQr();
    const text = String(raw || "").trim();
    const dni = dniEnPadron(text);
    if (!dni) {
      toast("Ese QR no está en el padrón del teléfono", "warn");
      return;
    }
    const worker = state.workersByDni.get(dni);
    const misma = state.draft.trabajador && state.draft.trabajador.dni === dni;
    if (state.draft.trabajador && !misma) {
      toast("El carnet no es de esta persona. El DNI no coincide.", "warn");
      return;
    }
    if (!state.draft.trabajador) {
      if (tuvoDt(dni) || dtBloqueado(dni)) {
        const remote = await historiaDe(dni);
        const mando = servidorBloquea(remote, dni);
        if (mando === true) {
          cerrarDt(dni);
          avisoDt();
          return;
        }
        if (mando === false) soltarDt(dni);
        else if (dtBloqueado(dni)) {
          avisoDt();
          return;
        }
      }
      const evaluador = state.draft.evaluador;
      const supervisor = state.draft.supervisor;
      state.draft = emptyDraft();
      state.draft.evaluador = evaluador;
      state.draft.supervisor = supervisor;
      state.draft.trabajador = Object.assign({}, worker, { fueraDePadron: false });
      state.query = dni;
      state.searchMode = "dni";
      state.step = 2;
      state.maxReached = 2;
      state.manualOpen = false;
    }
    state.draft.qrOk = true;
    state.draft.qrValor = text.slice(0, 120);
    state.draft.carnetVisto = true;
    state.step = 2;
    state.maxReached = Math.max(state.maxReached, 2);
    persistDraft();
    go("flow");
    toast(misma ? "Carnet verificado" : `${titleCase(worker.nombre)} · ${medidaById(faseDe(dni)).label}`);
    const antes = faseDe(dni);
    asegurarHistoria(dni).then(() => {
      if (state.screen === "flow" && state.draft.trabajador && state.draft.trabajador.dni === dni && faseDe(dni) !== antes) render();
    });
  }

  async function openQr(button) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast("Este teléfono no abre la cámara", "warn");
      return;
    }
    closeQr();
    qrButton = button;
    button.classList.add("is-live");
    const box = document.createElement("div");
    box.id = "qr-inline";
    box.className = "overlay open";
    box.innerHTML = `<div class="qr-modal" role="dialog" aria-modal="true" aria-label="Escanear QR"><p class="qr-modal-title">Apunta al QR del carnet</p><div class="scan-box is-wait"><p class="scan-wait">Abriendo cámara…</p><video id="cam" playsinline muted autoplay webkit-playsinline="true"></video><div class="finder-sq"></div><button type="button" class="qr-close" data-act="close-qr" aria-label="Cerrar">×</button></div></div>`;
    document.body.appendChild(box);
    document.documentElement.classList.add("precise-open");
    const video = box.querySelector("video");
    const stage = box.querySelector(".scan-box");
    const waitText = box.querySelector(".scan-wait");
    const probe = document.createElement("canvas");
    probe.width = 16;
    probe.height = 16;
    const probeCtx = probe.getContext("2d", { willReadFrequently: true });
    const frameLit = () => {
      if (!video.videoWidth || !probeCtx) return false;
      probeCtx.drawImage(video, 0, 0, 16, 16);
      const data = probeCtx.getImageData(0, 0, 16, 16).data;
      let lit = 0;
      for (let i = 0; i < data.length; i += 16) {
        if (data[i] + data[i + 1] + data[i + 2] > 36) lit += 1;
      }
      return lit > 2;
    };
    const started = Date.now();
    const reveal = () => {
      if (qrStop || !stage.classList.contains("is-wait")) return;
      if (frameLit()) {
        stage.classList.remove("is-wait");
        return;
      }
      if (Date.now() - started > 2500 && video.videoWidth) {
        if (waitText) waitText.textContent = "La cámara no muestra imagen. Revisa el permiso.";
      }
    };
    video.addEventListener("loadeddata", reveal);
    video.addEventListener("playing", reveal);
    let stream = null;
    const ask = { audio: false, video: { facingMode: { ideal: "environment" } } };
    try {
      stream = await navigator.mediaDevices.getUserMedia(ask);
    } catch (error) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      } catch (again) {
        closeQr();
        toast("Permite la cámara para leer el QR", "warn");
        return;
      }
    }
    qrStream = stream;
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    try { await video.play(); } catch (error) { /* el video sigue con autoplay */ }
    reveal();
    qrStop = false;
    let detector = null;
    if ("BarcodeDetector" in window) {
      try { detector = new BarcodeDetector({ formats: ["qr_code"] }); } catch (error) { detector = null; }
    }
    const canvas = detector ? null : document.createElement("canvas");
    const ctx = canvas ? canvas.getContext("2d", { willReadFrequently: true }) : null;
    qrTimer = setInterval(async () => {
      if (qrStop || video.readyState < 2) return;
      let value = "";
      try {
        if (detector) {
          const codes = await detector.detect(video);
          if (codes[0]) value = codes[0].rawValue || "";
        } else if (ctx && window.jsQR && video.videoWidth) {
          const size = 280;
          canvas.width = size;
          canvas.height = size;
          const side = Math.min(video.videoWidth, video.videoHeight);
          const sx = (video.videoWidth - side) / 2;
          const sy = (video.videoHeight - side) / 2;
          ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size);
          const image = ctx.getImageData(0, 0, size, size);
          const code = window.jsQR(image.data, size, size, { inversionAttempts: "dontInvert" });
          if (code) value = code.data || "";
        }
      } catch (error) { /* el siguiente intervalo reintenta */ }
      if (value) acceptQr(value);
      else reveal();
    }, 450);
  }

  async function onClick(event) {
    const button = event.target.closest("[data-act]");
    if (!button) {
      closeFab();
      if (event.target.id === "picker") closePicker();
      if (event.target.id === "help") closeHelp();
      if (event.target.id === "qr-inline") closeQr();
      return;
    }
    const act = button.dataset.act;
    if (act !== "toggle-fab" && !button.closest(".fab-menu")) closeFab();
    if (act === "toggle-fab") {
      const menuBox = document.getElementById("fab-menu");
      const fab = document.getElementById("fab-options-btn");
      if (!menuBox || !fab) return;
      const open = menuBox.hidden;
      menuBox.hidden = !open;
      fab.setAttribute("aria-expanded", open ? "true" : "false");
      fab.classList.toggle("is-on", open);
      return;
    }
    if (act === "help") {
      paintAjustes();
      checkUpdate();
      document.getElementById("help").hidden = false;
      requestAnimationFrame(() => document.getElementById("help").classList.add("open"));
      return;
    }
    if (act === "close-help") return closeHelp();
    if (act === "clear-cache") return clearAppCache();
    if (act === "toggle-transfer") return toggleTransfer();
    if (act === "apply-update") return applyUpdate();
    if (act === "close-transfer") return closeTransfer();
    if (act === "close-picker") return closePicker();
    if (act === "historial") {
      state.histPage = 1;
      state.histFilter = "todas";
      return go("historial");
    }
    if (act === "home") {
      clearDraft(true);
      return go("home");
    }
    if (act === "confirmar") return confirmarLectura();
    if (act === "retry") return boot();
    if (act === "install") return doInstall();
    if (act === "dismiss-install") {
      localStorage.setItem("qb-install-dismiss", "1");
      paintInstall();
      return;
    }
    if (act === "export") return exportActas();
    if (act === "start") return startNew();
    if (act === "back") return goBack();
    if (act === "next") return goNext();
    if (act === "goto") {
      const n = Number(button.dataset.step);
      if (canOpen(n) && n !== state.step) {
        if (state.step === 4) snapshotSign();
        state.step = n;
        state.maxReached = Math.max(state.maxReached, n);
        persistDraft();
        render();
      }
      return;
    }
    if (act === "mode-dni" || act === "mode-nombre") {
      state.searchMode = act === "mode-dni" ? "dni" : "nombre";
      state.query = "";
      state.draft.trabajador = null;
      state.manualOpen = false;
      persistDraft();
      render();
      const input = document.getElementById("worker-q");
      if (input) input.focus();
      return;
    }
    if (act === "abrir" || act === "pick-worker") {
      const worker = state.workersByDni.get(button.dataset.dni);
      if (!worker) return;
      return abrirTrabajador(worker);
    }
    if (act === "clear-worker") {
      state.draft.trabajador = null;
      state.query = "";
      state.manualOpen = false;
      persistDraft();
      render();
      return;
    }
    if (act === "open-manual") {
      state.manualOpen = true;
      paintWorkerSearch();
      const input = document.getElementById("manual-nombre");
      if (input) input.focus();
      return;
    }
    if (act === "save-manual") return saveManual();
    if (act === "open-evaluador") return openPicker("evaluador");
    if (act === "open-lote") return openPicker("lote");
    if (act === "open-supervisor") return openPicker("supervisor");
    if (act === "fase") {
      const id = button.dataset.fase;
      if (id === medidaActual()) return;
      const dni = state.draft.trabajador ? state.draft.trabajador.dni : "";
      const ya = actasDe(dni).some((acta) => acta.tipo === id);
      toast(ya ? "Esa fase ya quedó registrada." : "No se salta. Primero la fase anterior.", ya ? "info" : "warn");
      return;
    }
    if (act === "criterio") {
      const input = button.matches("input") ? button : button.querySelector("input");
      if (!input) return;
      const id = input.dataset.criterio;
      const set = new Set(state.draft.marcados || []);
      if (input.checked) set.add(id);
      else set.delete(id);
      state.draft.marcados = [...set];
      persistDraft();
      paintChecklist();
      paintActions();
      return;
    }
    if (act === "carnet") {
      const box = document.getElementById("carnet-visto");
      state.draft.carnetVisto = box ? box.checked : !state.draft.carnetVisto;
      persistDraft();
      return;
    }
    if (act === "scan-qr") return openQr(button);
    if (act === "close-qr") return closeQr();
    if (act === "pick-item") return applyPick(button.dataset.id);
    if (act === "regen") {
      state.draft.textoTouched = false;
      state.draft.texto = buildTexto();
      persistDraft();
      render();
      return;
    }
    if (act === "clear-sign") {
      const canvas = document.getElementById("sign");
      if (canvas && canvas._clear) canvas._clear();
      persistDraft();
      return;
    }
    if (act === "share") return shareActa(false);
    if (act === "download") return shareActa(true);
    if (act === "pdf") return downloadPdf();
    if (act === "enviar-dt") return enviarDt();
    if (act === "open-acta") {
      state.viewing = state.actas.find((acta) => acta.id === button.dataset.id) || null;
      state.returnTo = button.dataset.from || "historial";
      if (state.viewing) go("acta");
      return;
    }
    if (act === "delete-acta") return removeActa(button.dataset.id);
    if (act === "filter") {
      state.histFilter = button.dataset.filter;
      state.histPage = 1;
      document.querySelectorAll("#hist-filters button").forEach((chip) => {
        chip.classList.toggle("is-on", chip.dataset.filter === state.histFilter);
      });
      paintHist();
      return;
    }
    if (act === "page") {
      state.histPage += Number(button.dataset.dir);
      paintHist();
    }
  }

  function closeFab() {
    const menuBox = document.getElementById("fab-menu");
    const fab = document.getElementById("fab-options-btn");
    if (menuBox) menuBox.hidden = true;
    if (fab) {
      fab.setAttribute("aria-expanded", "false");
      fab.classList.remove("is-on");
    }
  }

  function paintAjustes() {
    const version = document.getElementById("app-version");
    if (version) version.textContent = APP_VERSION;
    const transfer = document.getElementById("transfer-state");
    if (transfer) {
      transfer.textContent = autoTransfer()
        ? "Activa. Sube los pendientes sola, también en 3G y H+."
        : "Apagada. Las actas se quedan en el teléfono hasta activarla.";
    }
    const update = document.getElementById("update-state");
    if (update) {
      update.textContent = state.updateAvailable
        ? "Hay una versión nueva. Presiona para bajarla completa."
        : "Está al día. Si sale una versión nueva, aquí se avisa.";
    }
  }

  async function checkUpdate() {
    try {
      const response = await fetch("./version.json", { cache: "no-store", signal: netSignal(20000) });
      if (!response.ok) return;
      const data = await response.json();
      state.updateAvailable = String(data.version || "") !== APP_VERSION;
    } catch (error) { /* sin red se sigue con la copia del teléfono */ }
    paintAjustes();
  }

  async function clearAppCache() {
    const ok = await ask({
      title: "¿Borrar la caché?",
      text: "Se vuelve a bajar la app. Las actas guardadas en el teléfono no se borran.",
      ok: "Borrar",
      tone: "error"
    });
    if (!ok) return;
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    location.reload();
  }

  function toggleTransfer() {
    localStorage.setItem("qb-auto-transfer", autoTransfer() ? "0" : "1");
    paintAjustes();
    if (autoTransfer()) {
      toast("Transferencia automática activa");
      flushPending(true);
    } else toast("Transferencia automática apagada", "warn");
  }

  async function refrescarCampo() {
    const vistos = new Set();
    const bloqueados = new Set();
    state.actas.forEach((acta) => {
      if (acta.tipo !== "dt" || !acta.trabajador) return;
      const dni = String(acta.trabajador.dni);
      vistos.add(dni);
      if (dtBloqueado(dni)) bloqueados.add(dni);
    });
    const signal = netSignal(10000);
    const marcas = Date.now();
    const inicio = performance.now();
    const pedidos = [fetch(conConsulta_(syncUrl(), { dias: "1", t: marcas }), { cache: "no-store", redirect: "follow", signal })];
    vistos.forEach((dni) => {
      pedidos.push(fetch(conConsulta_(syncUrl(), { dni, t: marcas }), { cache: "no-store", redirect: "follow", signal }));
    });
    const responses = await Promise.all(pedidos.map((pedido) => pedido.catch(() => null)));
    let ok = false;
    for (const response of responses) {
      if (!response || !response.ok) continue;
      const remote = await response.json().catch(() => null);
      if (!Array.isArray(remote)) continue;
      ok = true;
      mezclarActas(remote.map((acta) => Object.assign({}, acta, { pending: false, synced: true, confirmado: true })));
    }
    const segundos = Math.round((performance.now() - inicio) / 100) / 10;
    if (ok) idbReplace(state.actas);
    if (state.screen === "home") paintHomeSearch();
    paintNet();
    return {
      ok,
      segundos,
      libres: [...bloqueados].filter((dni) => !dtBloqueado(dni)),
      cerrados: [...vistos].filter((dni) => !bloqueados.has(dni) && dtBloqueado(dni))
    };
  }

  async function applyUpdate() {
    const label = document.getElementById("update-state");
    if (label) label.textContent = "Revisando la versión y el Excel…";
    await checkUpdate();
    if (!state.updateAvailable) {
      if (label) label.textContent = "Pidiendo el Excel…";
      try {
        const resultado = await refrescarCampo();
        if (!resultado.ok) {
          if (label) label.textContent = "El Excel no respondió. Presiona otra vez.";
          toast("El GET no respondió. Presiona otra vez.", "warn");
          return;
        }
        if (resultado.libres.length) {
          if (label) label.textContent = `Listo en ${resultado.segundos} s. Suspensión liberada.`;
          toast(`El Excel liberó la suspensión. GET ${resultado.segundos} s.`);
          return;
        }
        if (resultado.cerrados.length) {
          if (label) label.textContent = `Listo en ${resultado.segundos} s. Volvió a suspensión.`;
          toast(`Otra vez en suspensión. GET ${resultado.segundos} s.`);
          return;
        }
        if (label) label.textContent = `Está al día. GET ${resultado.segundos} s.`;
        toast(`Excel revisado en ${resultado.segundos} s. Sin cambios.`);
      } catch (error) {
        if (label) label.textContent = "El Excel no respondió. Presiona otra vez.";
        toast("El GET no respondió. Presiona otra vez.", "warn");
      }
      return;
    }
    setLoader(true, "Bajando la app");
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) await reg.update();
        if (reg && reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      location.reload();
    } catch (error) {
      setLoader(false);
      toast("No se pudo bajar. Revisa la señal.", "warn");
    }
  }

  function closeHelp() {
    const help = document.getElementById("help");
    help.classList.remove("open");
    help.hidden = true;
  }

  function startNew() {
    clearDraft(true);
    go("home");
  }

  async function goBack() {
    if (state.screen === "acta") {
      go(state.returnTo || "home");
      return;
    }
    if (state.screen !== "flow") {
      go("home");
      return;
    }
    clearDraft(true);
    go("home");
  }

  function goNext() {
    if (!canLeave(state.step)) return;
    if (state.step === 2) {
      saveActa();
      return;
    }
    state.step += 1;
    state.maxReached = Math.max(state.maxReached, state.step);
    persistDraft();
    render();
  }

  function saveManual() {
    const dni = state.query.trim();
    const nombre = state.manualNombre.trim();
    if (!/^\d{8}$/.test(dni)) {
      toast("El DNI tiene 8 dígitos", "warn");
      return;
    }
    if (state.workersByDni.has(dni)) {
      toast("Ese DNI ya está en el padrón", "warn");
      return;
    }
    if (nombre.length < 5) {
      toast("Escribe el nombre completo", "warn");
      return;
    }
    state.draft.trabajador = {
      dni,
      nombre: nombre.toUpperCase(),
      cargo: (state.manualCargo || "COSECHA").trim().toUpperCase(),
      fueraDePadron: true
    };
    state.manualOpen = false;
    persistDraft();
    paintWorkerSearch();
    paintActions();
    toast("Quedó fuera del padrón", "warn");
  }

  async function removeActa(id) {
    const ok = await ask({
      title: "¿Borrar esta acta?",
      text: "Se quita de la fase de este trabajador.",
      ok: "Borrar",
      tone: "error"
    });
    if (!ok) return;
    try {
      await idbDel(id);
      state.actas = state.actas.filter((acta) => acta.id !== id);
      try {
      if (state.scriptUrl) {
        await fetch(state.scriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "delete", id })
        });
      } else {
        await fetch(`./api/actas/${encodeURIComponent(id)}`, { method: "DELETE" });
      }
      } catch (error) { /* el siguiente enlace lo vuelve a alinear */ }
      toast("Acta borrada");
      if (state.screen === "acta") go(state.returnTo || "historial");
      else paintHist();
    } catch (error) {
      toast("No se pudo borrar", "error");
    }
  }

  async function doInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    paintInstall();
  }

  function onInput(event) {
    const target = event.target;
    if (target.id === "home-q") {
      let value = target.value;
      if (/^\d+$/.test(value)) value = value.replace(/\D/g, "").slice(0, 8);
      if (value !== target.value) target.value = value;
      state.query = value;
      const scroller = document.querySelector("#screen-home .panel-scroll");
      const top = scroller ? scroller.scrollTop : 0;
      paintHomeSearch();
      if (scroller) {
        scroller.scrollTop = top;
        requestAnimationFrame(() => { scroller.scrollTop = top; });
      }
      return;
    }
    if (target.id === "worker-q") {
      let value = target.value;
      if (state.searchMode === "dni") {
        value = value.replace(/\D/g, "").slice(0, 8);
        if (value !== target.value) target.value = value;
      }
      state.query = value;
      state.manualOpen = false;
      syncWorkerFromDni();
      persistDraft();
      paintWorkerSearch();
      paintActions();
      return;
    }
    if (target.id === "manual-nombre") {
      state.manualNombre = target.value;
      return;
    }
    if (target.id === "manual-cargo") {
      state.manualCargo = target.value;
      return;
    }
    if (target.id === "pct-caso") {
      state.draft.porcentaje = target.value.replace(/[^\d.,]/g, "");
      if (state.draft.porcentaje !== target.value) target.value = state.draft.porcentaje;
      if (state.draft.medidaManual === medidaSugerida()) state.draft.medidaManual = "";
      persistDraft();
      paintChecklist();
      paintActions();
      return;
    }
    if (target.id === "suceso-nota") {
      state.draft.descripcion = target.value;
      persistDraft();
      return;
    }
    if (target.id === "otro") {
      state.draft.otro = target.value;
      state.draft.textoTouched = false;
      persistDraft();
      paintEval();
      paintActions();
      return;
    }
    if (target.id === "detalle") {
      state.draft.detalle = target.value;
      persistDraft();
      return;
    }
    if (target.id === "acta-texto") {
      state.draft.texto = target.value;
      state.draft.textoTouched = true;
      persistDraft();
      const regen = document.querySelector(".regen");
      if (regen && regen.tagName !== "BUTTON") {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "regen";
        button.dataset.act = "regen";
        button.textContent = "Volver a armar el texto con los porcentajes";
        regen.replaceWith(button);
      }
      return;
    }
    if (target.id === "hist-q") {
      state.histQuery = target.value;
      state.histPage = 1;
      paintHist();
      return;
    }
    if (target.id === "picker-q") paintPicker();
  }

  function bindViewport() {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const sync = () => {
      const keyboard = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      document.documentElement.style.setProperty("--kb", `${keyboard}px`);
      document.body.classList.toggle("kb-open", keyboard > 80);
    };
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
  }

  async function boot() {
    try {
      await loadData();
      try {
        const saved = localStorage.getItem("qb-responsable");
        if (saved) state.draft.supervisor = JSON.parse(saved);
      } catch (error) { /* si el guardado está dañado, se elige de nuevo */ }
      state.actas = await idbGetAll();
      state.actas.forEach(completarActa);
      state.actas.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      sessionStorage.removeItem("qb-draft");
      applyPath();
      if (!location.hash) history.replaceState({ path: pathFor(state.screen) }, "", `#${pathFor(state.screen)}`);
      render();
      pedirAvisos();
      checkUpdate();
      pullCampo();
      if (!boot.syncing) {
        boot.syncing = true;
        setInterval(pullCampo, 12000);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") pullCampo();
        });
      }
    } catch (error) {
      state.screen = "error";
      render();
    }
  }

  document.body.addEventListener("click", onClick);
  document.body.addEventListener("input", onInput);
  document.getElementById("fb-ok").addEventListener("click", () => closeAsk(true));
  document.getElementById("fb-cancel").addEventListener("click", () => closeAsk(false));
  document.getElementById("fb").addEventListener("click", (event) => {
    if (event.target.id === "fb") closeAsk(false);
  });
  window.addEventListener("popstate", () => {
    applyPath();
    render();
  });
  window.addEventListener("online", () => {
    paintNet();
    pullCampo();
  });
  window.addEventListener("offline", paintNet);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    paintInstall();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.id === "worker-q") {
      event.preventDefault();
      if (state.step === 1 && canLeave(1)) goNext();
    }
    if (event.key === "Escape") {
      closePicker();
      closeHelp();
    }
  });
  bindViewport();
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }
  boot();
})();
