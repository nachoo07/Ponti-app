#!/usr/bin/env bash
set -euo pipefail

# Smoke checks para el frontend/BFF de Ponti Mobile.
# Se ejecuta contra la URL pública de Firebase Hosting (que reescribe
# /api/v1/** al Cloud Run del BFF). El /health del BFF se valida aparte,
# directo contra la URL del servicio Cloud Run, en cada workflow.
#
# Rutas reales del BFF de mobile (api/src/app.ts):
#   - GET  /                       -> SPA (index.html servido por Hosting)
#   - POST /api/v1/auth/login      -> 401 con credenciales inválidas
# NO existen /api/v1/ping, /api/v1/version ni /api/v1/work-orders.

BASE_URL="${1:-${BASE_URL:-http://localhost:8080}}"

if [[ -z "${BASE_URL}" ]]; then
  echo "ERROR: BASE_URL vacío." >&2
  exit 1
fi

BASE_URL="${BASE_URL%/}"

echo "[smoke-fe] Check UI root (${BASE_URL}/)..."
root_status="$(curl -sS -o /tmp/mobile-smoke-body.txt -w '%{http_code}' "${BASE_URL}/")"
if [[ "${root_status}" == "200" ]]; then
  python3 - <<'PY'
from pathlib import Path
body = Path("/tmp/mobile-smoke-body.txt").read_text(errors="replace").lower()
if "<html" not in body:
    raise SystemExit("UI root no devolvió HTML")
PY
elif [[ "${root_status}" == "404" ]]; then
  echo "[smoke-fe] WARN: root devolvió 404 (esperable en local sin build estático del UI)."
else
  echo "ERROR: UI root devolvió status inesperado ${root_status}." >&2
  sed -n '1,15p' /tmp/mobile-smoke-body.txt >&2 || true
  exit 1
fi

echo "[smoke-fe] Check auth guard (login con credenciales inválidas espera 401)..."
login_status="$(curl -sS -o /tmp/mobile-smoke-body.txt -w '%{http_code}' \
  -X POST "${BASE_URL}/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  --data '{"email":"invalid","password":"invalid"}')"
if [[ "${login_status}" != "401" ]]; then
  echo "ERROR: login inválido devolvió HTTP ${login_status} (esperado 401)." >&2
  sed -n '1,20p' /tmp/mobile-smoke-body.txt >&2 || true
  exit 1
fi

echo "[smoke-fe] OK - frontend/bff validado."
