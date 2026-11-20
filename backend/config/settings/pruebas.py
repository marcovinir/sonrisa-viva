"""Pruebas automáticas (pytest)."""

from .local import *  # noqa: F403

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
NOTIFICADOR = "apps.comun.notificaciones.NotificadorMemoria"
