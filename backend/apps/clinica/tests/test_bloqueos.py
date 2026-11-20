import secrets

import pytest

from apps.citas.models import Cita, EstadoCita, Paciente
from apps.clinica.models import Bloqueo
from apps.comun.pruebas import cliente_de, crear_admin
from conftest import crear_dentista, h

URL = "/api/v1/panel/bloqueos/"


@pytest.fixture
def admin(db):
    return cliente_de(crear_admin())


def cita(dentista, servicio, inicio, fin, estado=EstadoCita.CONFIRMADA):
    p, _ = Paciente.objects.get_or_create(
        email="p@x.test", defaults={"nombre": "P", "apellidos": "Q", "telefono": "88888888"}
    )
    return Cita.objects.create(
        paciente=p,
        dentista=dentista,
        servicio=servicio,
        inicio=inicio,
        fin=fin,
        precio_colones=1,
        estado=estado,
        token_gestion_hash=secrets.token_hex(32),
    )


def datos(dentista, ini=9, fin=12):
    return {
        "dentista": dentista.id,
        "inicio": h(ini).isoformat(),
        "fin": h(fin).isoformat(),
        "motivo": "Congreso",
    }


def test_admin_crea_bloqueo_para_cualquier_dentista(admin, dentista):
    r = admin.post(URL, datos(dentista), format="json")
    assert r.status_code == 201, r.json()
    assert Bloqueo.objects.get().dentista == dentista


def test_admin_filtra_por_dentista(admin, dentista):
    otro = crear_dentista("otro@x.test")
    admin.post(URL, datos(dentista), format="json")
    admin.post(URL, datos(otro), format="json")
    assert admin.get(f"{URL}?dentista={otro.id}").json()["count"] == 1


def test_dentista_crea_bloqueo_propio_aunque_mande_otro_dentista(dentista):
    otro = crear_dentista("otro@x.test")
    r = cliente_de(dentista.usuario).post(URL, datos(otro), format="json")
    assert r.status_code == 201, r.json()
    assert Bloqueo.objects.get().dentista == dentista


def test_dentista_no_ve_bloqueo_ajeno_404(dentista):
    otro = crear_dentista("otro@x.test")
    b = Bloqueo.objects.create(dentista=otro, inicio=h(9), fin=h(10))
    c = cliente_de(dentista.usuario)
    assert c.get(f"{URL}{b.id}/").status_code == 404
    assert c.delete(f"{URL}{b.id}/").status_code == 404
    assert c.get(URL).json()["count"] == 0


def test_bloqueo_sobre_cita_confirmada_409(admin, dentista, servicio):
    cita(dentista, servicio, h(10), h(11))
    r = admin.post(URL, datos(dentista), format="json")
    assert r.status_code == 409
    assert r.json()["detalle"] == (
        "Hay 1 cita confirmada en ese rango; cancélala o reprográmala primero."
    )


def test_bloqueo_con_varias_citas_usa_plural(admin, dentista, servicio):
    cita(dentista, servicio, h(9), h(10))
    cita(dentista, servicio, h(10), h(11))
    r = admin.post(URL, datos(dentista), format="json")
    assert r.status_code == 409
    assert r.json()["detalle"] == (
        "Hay 2 citas confirmadas en ese rango; cancélalas o reprográmalas primero."
    )


def test_bloqueo_sobre_cita_cancelada_permitido(admin, dentista, servicio):
    cita(dentista, servicio, h(10), h(11), estado=EstadoCita.CANCELADA)
    assert admin.post(URL, datos(dentista), format="json").status_code == 201


def test_bloqueo_pegado_a_cita_permitido(admin, dentista, servicio):
    cita(dentista, servicio, h(12), h(13))
    assert admin.post(URL, datos(dentista), format="json").status_code == 201


def test_editar_bloqueo_valida_citas(admin, dentista, servicio):
    b = Bloqueo.objects.create(dentista=dentista, inicio=h(7), fin=h(8))
    cita(dentista, servicio, h(10), h(11))
    r = admin.patch(f"{URL}{b.id}/", {"fin": h(11).isoformat()}, format="json")
    assert r.status_code == 409


def test_bloqueo_fin_antes_inicio_400(admin, dentista):
    r = admin.post(URL, datos(dentista, 12, 9), format="json")
    assert r.status_code == 400


def test_sin_permiso_403(db):
    from apps.cuentas.models import Usuario

    sin_perfil = Usuario.objects.crear_usuario("x@x.test", "X", "Y", "dentista", activo=True)
    assert cliente_de().get(URL).status_code == 403
    assert cliente_de(sin_perfil).post(URL, {}, format="json").status_code in (400, 403)
