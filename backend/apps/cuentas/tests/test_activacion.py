import re

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from apps.comun.notificaciones import NotificadorMemoria
from apps.cuentas.models import Usuario
from apps.cuentas.services import enviar_enlace_activacion, enviar_enlace_recuperacion

CLAVE_NUEVA = "Sonrisa-Nueva-2026"
ENLACE_INVALIDO = "El enlace no es válido o ya fue usado."


@pytest.fixture(autouse=True)
def _sin_throttle():
    cache.clear()


@pytest.fixture
def cliente():
    c = APIClient(enforce_csrf_checks=True)
    c.get("/api/v1/auth/csrf/")
    c.credentials(HTTP_X_CSRFTOKEN=c.cookies["csrftoken"].value)
    return c


@pytest.fixture
def nuevo(db):
    return Usuario.objects.crear_usuario("dra.lopez@x.test", "Sofía", "López", "dentista")


def uid_y_token(texto: str, tipo: str) -> dict:
    m = re.search(rf"/panel/{tipo}/([^/\s]+)/([^/\s]+)", texto)
    assert m, texto
    return {"uid": m.group(1), "token": m.group(2)}


def test_activacion_envia_correo_con_enlace(nuevo):
    enviar_enlace_activacion(nuevo)
    (envio,) = NotificadorMemoria.enviados
    assert envio["destinatario"] == "dra.lopez@x.test"
    assert envio["asunto"] == "Activa tu cuenta en Sonrisa Viva"
    assert "http://localhost:5173/panel/activar/" in envio["texto"]


def test_activar_con_enlace_valido_activa_y_permite_login(cliente, nuevo):
    enviar_enlace_activacion(nuevo)
    datos = uid_y_token(NotificadorMemoria.enviados[0]["texto"], "activar")
    r = cliente.post("/api/v1/auth/activar/", {**datos, "password": CLAVE_NUEVA}, format="json")
    assert r.status_code == 204
    nuevo.refresh_from_db()
    assert nuevo.is_active
    r = cliente.post(
        "/api/v1/auth/login/",
        {"email": "dra.lopez@x.test", "password": CLAVE_NUEVA},
        format="json",
    )
    assert r.status_code == 200


def test_enlace_usado_dos_veces_falla(cliente, nuevo):
    enviar_enlace_activacion(nuevo)
    datos = uid_y_token(NotificadorMemoria.enviados[0]["texto"], "activar")
    cliente.post("/api/v1/auth/activar/", {**datos, "password": CLAVE_NUEVA}, format="json")
    r = cliente.post(
        "/api/v1/auth/activar/", {**datos, "password": "Otra-Clave-2026"}, format="json"
    )
    assert r.status_code == 400
    assert r.json() == {"detalle": ENLACE_INVALIDO, "campos": {}}


def test_token_inventado_falla(cliente, nuevo):
    r = cliente.post(
        "/api/v1/auth/activar/",
        {"uid": "MQ", "token": "abc-123", "password": CLAVE_NUEVA},
        format="json",
    )
    assert r.status_code == 400
    assert r.json()["detalle"] == ENLACE_INVALIDO


def test_contrasena_debil_rechazada(cliente, nuevo):
    enviar_enlace_activacion(nuevo)
    datos = uid_y_token(NotificadorMemoria.enviados[0]["texto"], "activar")
    r = cliente.post("/api/v1/auth/activar/", {**datos, "password": "123"}, format="json")
    assert r.status_code == 400
    assert "password" in r.json()["campos"]
    nuevo.refresh_from_db()
    assert not nuevo.is_active


def test_recuperar_correo_inexistente_204_sin_envio(cliente, db):
    r = cliente.post("/api/v1/auth/recuperar/", {"email": "nadie@x.test"}, format="json")
    assert r.status_code == 204
    assert NotificadorMemoria.enviados == []


def test_recuperar_usuario_inactivo_sin_envio(nuevo):
    enviar_enlace_recuperacion("dra.lopez@x.test")
    assert NotificadorMemoria.enviados == []


def test_restablecer_cambia_contrasena(cliente, db):
    Usuario.objects.crear_usuario(
        "admin@x.test", "A", "B", "admin", password="Vieja-Clave-2026", activo=True
    )
    r = cliente.post("/api/v1/auth/recuperar/", {"email": " ADMIN@x.test "}, format="json")
    assert r.status_code == 204
    (envio,) = NotificadorMemoria.enviados
    assert envio["asunto"] == "Restablece tu contraseña"
    datos = uid_y_token(envio["texto"], "restablecer")
    r = cliente.post("/api/v1/auth/restablecer/", {**datos, "password": CLAVE_NUEVA}, format="json")
    assert r.status_code == 204
    assert Usuario.objects.get(email="admin@x.test").check_password(CLAVE_NUEVA)
