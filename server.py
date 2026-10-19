"""Sirve la app y la fase compartida de los supervisores, sin internet externo."""
import json
import threading
from datetime import datetime
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STORE = ROOT / "data" / "campo.json"
LOCK = threading.Lock()


def load_actas():
    if not STORE.exists():
        return []
    try:
        data = json.loads(STORE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    actas = data.get("actas", [])
    return actas if isinstance(actas, list) else []


def save_actas(actas):
    STORE.parent.mkdir(parents=True, exist_ok=True)
    STORE.write_text(json.dumps({"actas": actas}, ensure_ascii=False), encoding="utf-8")


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        path, _, query = self.path.partition("?")
        if path == "/api/actas":
            from urllib.parse import parse_qs
            params = parse_qs(query)
            dni = (params.get("dni") or [""])[0]
            with LOCK:
                actas = load_actas()
            if dni:
                actas = [item for item in actas if (item.get("trabajador") or {}).get("dni") == dni]
            else:
                hoy = datetime.now().date()
                corte = hoy
                def reciente(item):
                    raw = str(item.get("createdAt") or "")
                    try:
                        marca = datetime.fromisoformat(raw.replace("Z", "+00:00")).astimezone().date()
                    except ValueError:
                        return True
                    return marca >= corte
                actas = [item for item in actas if reciente(item)]
            body = json.dumps(actas, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()

    def do_POST(self):
        if self.path.split("?", 1)[0] != "/api/actas":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", "0") or 0)
        try:
            acta = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeError, json.JSONDecodeError):
            self.send_error(400)
            return
        if not isinstance(acta, dict) or not acta.get("id"):
            self.send_error(400)
            return
        acta.pop("pending", None)
        acta.pop("synced", None)
        acta.pop("confirmado", None)
        with LOCK:
            actas = [item for item in load_actas() if item.get("id") != acta["id"]]
            actas.insert(0, acta)
            save_actas(actas)
        self.send_response(204)
        self.end_headers()

    def do_DELETE(self):
        path = self.path.split("?", 1)[0]
        prefix = "/api/actas/"
        if not path.startswith(prefix):
            self.send_error(404)
            return
        acta_id = path[len(prefix):]
        with LOCK:
            save_actas([item for item in load_actas() if item.get("id") != acta_id])
        self.send_response(204)
        self.end_headers()


if __name__ == "__main__":
    ThreadingHTTPServer.allow_reuse_address = True
    server = ThreadingHTTPServer(("0.0.0.0", 8765), Handler)
    print("Supervisores en http://127.0.0.1:8765/", flush=True)
    server.serve_forever()
