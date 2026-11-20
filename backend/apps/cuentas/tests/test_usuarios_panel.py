import re

import pytest

from apps.clinica.models import Dentista
from apps.comun.notificaciones import NotificadorMemoria
from apps.comun.pruebas import cliente_de, crear_admin
from apps.cuentas.models import Usuario

URL = "/api/v1/panel/usuarios/"


@pytest.fixture
def yo(db):
    return crear_admin("jefa@x.test")


@pytest.fixture
def admin(yo):
    return cliente_de(yo)


def crear(admin, email="nuevo@x.test", rol="dentista"):
    return admin.post(
        URL, {"email": email, "nombre": "Nuevo", "apellidos": "Pérez", "rol": rol}, format="json"
    )


def test_crear_dentista_envia_activacion_y_crea_perfil_oculto(admin):
    r = crear(admin)
    assert r.status_code == 201, r.json()
    assert r.json()["is_active"] is False and r.json()["activado"] is False
    assert r.json()["rol"] == "dentista"
    u = Usuario.objects.get(email="nuevo@x.test")
    assert Dentista.objects.get(usuario=u).visible_en_web is False
    (envio,) = NotificadorMemoria.enviados
    assert "/panel/activar/" in envio["texto"]


def test_crear_admin_no_crea_perfil(admin):
    assert crear(admin, "otra@x.test", "admin").status_code == 201
    assert not Dentista.objects.filter(usuario__email="otra@x.test").exists()


def test_correo_duplicado_400(admin):
    crear(admin)
    r = crear(admin, " NUEVO@x.test ")
    assert r.status_code == 400
    assert r.json()["campos"]["email"] == ["Ya existe un usuario con ese correo."]


def test_rol_invalido_400(admin):
    assert crear(admin, rol="jefe").status_code == 400


def test_no_puede_desactivarse_a_si_mismo(admin, yo):
    crear_admin("otro@x.test")
    r = admin.post(f"{URL}{yo.id}/desactivar/")
    assert r.status_code == 400
    assert r.json()["detalle"] == "No puedes desactivar tu propia cuenta."


def test_admin_desactiva_a_otro_admin(admin):
    otro = crear_admin("otro2@x.test")
    r = admin.post(f"{URL}{otro.id}/desactivar/")
    assert r.status_code == 200 and r.json()["is_active"] is False


def test_ultimo_admin_activo_no_se_desactiva(db):
    from rest_framework.exceptions import ValidationError

    from apps.cuentas.services import desactivar_usuario

    unico = crear_admin("unico@x.test")
    pendiente = Usuario.objects.crear_usuario("p@x.test", "P", "Q", "admin")  # inactivo
    with pytest.raises(ValidationError) as e:
        desactivar_usuario(unico, hecho_por=pendiente)
    assert "Debe quedar al menos un administrador activo." in str(e.value.detail)


def test_desactivar_invalida_enlace_pendiente(admin):
    crear(admin)
    m = re.search(r"/panel/activar/([^/\s]+)/([^/\s]+)", NotificadorMemoria.enviados[0]["texto"])
    u = Usuario.objects.get(email="nuevo@x.test")
    assert admin.post(f"{URL}{u.id}/desactivar/").status_code == 200
    r = cliente_de().post(
        "/api/v1/auth/activar/",
        {"uid": m.group(1), "token": m.group(2), "password": "Sonrisa-Nueva-2026"},
        format="json",
    )
    assert r.status_code == 400


def test_reactivar_usuario_activado(admin):
    u = Usuario.objects.crear_usuario(
        "act@x.test", "A", "B", "dentista", password="Clave-Segura-2026", activo=False
    )
    r = admin.post(f"{URL}{u.id}/reactivar/")
    assert r.status_code == 200 and r.json()["is_active"] is True


def test_reactivar_pendiente_reenvia_enlace(admin):
    crear(admin)
    NotificadorMemoria.limpiar()
    u = Usuario.objects.get(email="nuevo@x.test")
    r = admin.post(f"{URL}{u.id}/reactivar/")
    assert r.status_code == 200 and r.json()["is_active"] is False
    assert len(NotificadorMemoria.enviados) == 1


def test_reenviar_activacion_a_usuario_activado_400(admin, yo):
    r = admin.post(f"{URL}{yo.id}/reenviar-activacion/")
    assert r.status_code == 400
    assert r.json()["detalle"] == "Este usuario ya activó su cuenta."


def test_patch_solo_nombre_y_apellidos(admin, yo):
    r = admin.patch(
        f"{URL}{yo.id}/",
        {"nombre": "Ana", "email": "cambio@x.test", "rol": "dentista"},
        format="json",
    )
    assert r.status_code == 200
    yo.refresh_from_db()
    assert yo.nombre == "Ana" and yo.email == "jefa@x.test" and yo.rol.nombre == "admin"


def test_delete_no_permitido_405(admin, yo):
    assert admin.delete(f"{URL}{yo.id}/").status_code == 405


def test_dentista_no_gestiona_usuarios_403(dentista):
    assert cliente_de(dentista.usuario).get(URL).status_code == 403


def test_busqueda_q_por_correo_y_filtros(admin):
    crear(admin)
    assert admin.get(f"{URL}?q=nuevo@").json()["count"] == 1
    assert admin.get(f"{URL}?rol=dentista").json()["count"] == 1
    assert admin.get(f"{URL}?activo=true").json()["count"] == 1  # solo la jefa
