import secrets

import pytest
import time_machine

from apps.citas.models import Cita, EstadoCita, Paciente
from apps.comun.notificaciones import NotificadorMemoria
from apps.comun.pruebas import cliente_de, crear_admin
from conftest import crear_dentista, h

URL = "/api/v1/panel/citas/"


def crear_cita(
    dentista, servicio, inicio, fin, estado=EstadoCita.CONFIRMADA, email="p@x.test", nombre="Pedro"
):
    p, _ = Paciente.objects.get_or_create(
        email=email, defaults={"nombre": nombre, "apellidos": "Q", "telefono": "88888888"}
    )
    return Cita.objects.create(
        paciente=p,
        dentista=dentista,
        servicio=servicio,
        inicio=inicio,
        fin=fin,
        precio_colones=servicio.precio_colones,
        estado=estado,
        token_gestion_hash=secrets.token_hex(32),
    )


@pytest.fixture
def admin(db):
    return cliente_de(crear_admin())


@pytest.fixture
def otro(db):
    return crear_dentista("otro@x.test")


@pytest.fixture
def citas(dentista, otro, servicio):
    return {
        "mia": crear_cita(dentista, servicio, h(9), h(10)),
        "ajena": crear_cita(otro, servicio, h(9), h(10), email="o@x.test", nombre="Olga"),
    }


def test_admin_ve_todas_dentista_solo_las_suyas(admin, dentista, citas):
    assert admin.get(URL).json()["count"] == 2
    r = cliente_de(dentista.usuario).get(URL).json()
    assert [c["id"] for c in r["results"]] == [citas["mia"].id]
    c = r["results"][0]
    assert set(c) == {
        "id",
        "inicio",
        "fin",
        "estado",
        "precio_colones",
        "notas_internas",
        "paciente",
        "dentista",
        "servicio",
        "creado_en",
    }
    assert set(c["paciente"]) == {"id", "nombre", "apellidos", "email", "telefono"}


def test_dentista_cita_ajena_404(dentista, citas):
    c = cliente_de(dentista.usuario)
    assert c.get(f"{URL}{citas['ajena'].id}/").status_code == 404
    assert (
        c.post(
            f"{URL}{citas['ajena'].id}/estado/", {"estado": "completada"}, format="json"
        ).status_code
        == 404
    )


def test_filtros_fecha_estado_dentista_q(admin, dentista, otro, servicio, citas):
    crear_cita(dentista, servicio, h(9, dia=3), h(10, dia=3), estado=EstadoCita.CANCELADA)
    assert admin.get(f"{URL}?desde=2026-03-03&hasta=2026-03-03").json()["count"] == 1
    assert admin.get(f"{URL}?estado=cancelada").json()["count"] == 1
    assert admin.get(f"{URL}?dentista={otro.id}").json()["count"] == 1
    assert admin.get(f"{URL}?q=olga").json()["count"] == 1
    assert admin.get(f"{URL}?servicio={servicio.id}").json()["count"] == 3


def test_marcar_completada_despues_de_terminar(dentista, citas):
    r = cliente_de(dentista.usuario).post(
        f"{URL}{citas['mia'].id}/estado/", {"estado": "completada"}, format="json"
    )
    assert r.status_code == 200, r.json()
    assert r.json()["estado"] == "completada"


def test_marcar_completada_antes_de_terminar_400(dentista, citas):
    with time_machine.travel(h(9, 30), tick=False):
        r = cliente_de(dentista.usuario).post(
            f"{URL}{citas['mia'].id}/estado/", {"estado": "no_asistio"}, format="json"
        )
    assert r.status_code == 400
    assert r.json()["detalle"] == "Solo puedes marcar asistencia cuando la cita ya terminó."


def test_transicion_desde_final_400(admin, citas):
    cita = citas["mia"]
    cita.estado = EstadoCita.COMPLETADA
    cita.save()
    r = admin.post(f"{URL}{cita.id}/estado/", {"estado": "cancelada"}, format="json")
    assert r.status_code == 400
    assert r.json()["detalle"] == "No se puede pasar una cita de «Completada» a «Cancelada»."


def test_estado_desconocido_400(admin, citas):
    r = admin.post(f"{URL}{citas['mia'].id}/estado/", {"estado": "perdida"}, format="json")
    assert r.status_code == 400


def test_dentista_no_puede_cancelar_403(dentista, citas):
    r = cliente_de(dentista.usuario).post(
        f"{URL}{citas['mia'].id}/estado/", {"estado": "cancelada"}, format="json"
    )
    assert r.status_code == 403


def test_admin_cancela_y_notifica_paciente(admin, citas):
    r = admin.post(f"{URL}{citas['mia'].id}/estado/", {"estado": "cancelada"}, format="json")
    assert r.status_code == 200
    (envio,) = NotificadorMemoria.enviados
    assert envio["asunto"] == "Tu cita fue cancelada por la clínica"
    assert envio["destinatario"] == "p@x.test"


def test_editar_notas_internas(dentista, citas):
    c = cliente_de(dentista.usuario)
    r = c.patch(
        f"{URL}{citas['mia'].id}/", {"notas_internas": "Sensibilidad", "estado": "x"}, format="json"
    )
    assert r.status_code == 200
    citas["mia"].refresh_from_db()
    assert citas["mia"].notas_internas == "Sensibilidad"
    assert citas["mia"].estado == "confirmada"


def test_sin_permiso_403(db):
    assert cliente_de().get(URL).status_code == 403


def test_lista_sin_n_mas_1(admin, dentista, servicio, django_assert_max_num_queries):
    for i in range(20):
        crear_cita(dentista, servicio, h(8, dia=2 + i), h(9, dia=2 + i), email=f"p{i}@x.test")
    with django_assert_max_num_queries(8):
        r = admin.get(URL)
    assert r.json()["count"] == 20
