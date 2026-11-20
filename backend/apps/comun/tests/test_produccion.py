"""Settings de producción (Vercel + Supabase + Resend).

Se cargan en un proceso aparte para no mezclarlos con los settings de las pruebas.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[3]

ENTORNO = {
    "SECRET_KEY": "solo-para-pruebas",
    "DATABASE_URL": "postgres://u:p@pooler.ejemplo.test:6543/postgres",
    "ALLOWED_HOSTS": "sonrisa-viva-api.vercel.app",
    "CSRF_TRUSTED_ORIGINS": "https://sonrisa.marcovinir.dev",
    "FRONTEND_URL": "https://sonrisa.marcovinir.dev",
}

LEER = """
import json
from django.conf import settings
db = settings.DATABASES["default"]
print(json.dumps({
    "prepare_threshold": db.get("OPTIONS", {}).get("prepare_threshold", "falta"),
    "conn_max_age": db["CONN_MAX_AGE"],
    "cache": settings.CACHES["default"]["BACKEND"],
    "email_backend": settings.EMAIL_BACKEND,
    "email_host": settings.EMAIL_HOST,
    "email_port": settings.EMAIL_PORT,
    "email_tls": settings.EMAIL_USE_TLS,
    "email_user": settings.EMAIL_HOST_USER,
    "frontend_url": settings.FRONTEND_URL,
    "csrf": settings.CSRF_TRUSTED_ORIGINS,
    "hsts": settings.SECURE_HSTS_SECONDS,
}))
"""


def _cargar(sin: str | None = None) -> subprocess.CompletedProcess:
    entorno = {k: v for k, v in os.environ.items() if k not in ENTORNO}
    entorno.update({k: v for k, v in ENTORNO.items() if k != sin})
    entorno["DJANGO_SETTINGS_MODULE"] = "config.settings.produccion"
    return subprocess.run(
        [sys.executable, "-c", "import django; django.setup()\n" + LEER],
        cwd=BACKEND,
        env=entorno,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )


def _settings() -> dict:
    r = _cargar()
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout)


def test_produccion_exige_frontend_url():
    # Sin ella, los correos llevarían enlaces a localhost.
    r = _cargar(sin="FRONTEND_URL")
    assert r.returncode != 0
    assert "FRONTEND_URL" in r.stderr


def test_produccion_exige_csrf_trusted_origins():
    # Sin ella, el login detrás del rewrite de Vercel responde 403.
    r = _cargar(sin="CSRF_TRUSTED_ORIGINS")
    assert r.returncode != 0
    assert "CSRF_TRUSTED_ORIGINS" in r.stderr


def test_produccion_desactiva_sentencias_preparadas():
    # El pooler de Supabase en modo transacción no las soporta.
    s = _settings()
    assert s["prepare_threshold"] is None
    assert s["conn_max_age"] == 0


def test_produccion_usa_cache_en_base():
    # Los límites de peticiones se comparten entre las instancias de Vercel.
    assert _settings()["cache"] == "django.core.cache.backends.db.DatabaseCache"


def test_produccion_envia_por_smtp_de_resend():
    s = _settings()
    assert s["email_backend"] == "django.core.mail.backends.smtp.EmailBackend"
    assert (s["email_host"], s["email_port"], s["email_tls"]) == ("smtp.resend.com", 587, True)
    assert s["email_user"] == "resend"  # Resend usa ese usuario fijo y la API key como clave


def test_produccion_lee_las_urls_del_entorno():
    s = _settings()
    assert s["frontend_url"] == "https://sonrisa.marcovinir.dev"
    assert s["csrf"] == ["https://sonrisa.marcovinir.dev"]
    assert s["hsts"] == 31536000
