"""Producción: Vercel (función Python) + Supabase (pooler) + Brevo (SMTP)."""

import os

from .base import *  # noqa: F403
from .base import DATABASES


def _lista(nombre: str) -> list[str]:
    """Variable obligatoria separada por comas: si falta, el arranque falla con su nombre."""
    return [v.strip() for v in os.environ[nombre].split(",") if v.strip()]


DEBUG = False
SECRET_KEY = os.environ["SECRET_KEY"]

# Si falta alguna, mejor que no arranque: sin FRONTEND_URL los correos llevarían enlaces a
# localhost, y sin CSRF_TRUSTED_ORIGINS el login detrás del rewrite de Vercel daría 403.
ALLOWED_HOSTS = _lista("ALLOWED_HOSTS")
CSRF_TRUSTED_ORIGINS = _lista("CSRF_TRUSTED_ORIGINS")
FRONTEND_URL = os.environ["FRONTEND_URL"].rstrip("/")

# El pooler de Supabase en modo transacción no admite sentencias preparadas (psycopg 3).
DATABASES["default"].setdefault("OPTIONS", {})["prepare_threshold"] = None

# Los límites de peticiones (login, reservas) se comparten entre las instancias serverless.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.db.DatabaseCache",
        "LOCATION": "cache_django",
    }
}

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp-relay.brevo.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_TIMEOUT = 10

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True  # solo abarca *.sonrisa.marcovinir.dev (no hay ninguno)
# La lista de precarga de HSTS solo admite dominios raíz; sonrisa.marcovinir.dev no lo es.
SILENCED_SYSTEM_CHECKS = ["security.W021"]
SECURE_CONTENT_TYPE_NOSNIFF = True
