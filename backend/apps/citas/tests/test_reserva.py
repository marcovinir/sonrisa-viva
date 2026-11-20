import hashlib
import re
import secrets

import pytest

from apps.citas.models import Cita, Paciente
from apps.comun.notificaciones import NotificadorMemoria
from apps.comun.pruebas import cliente_de
from conftest import con_horario, crear_dentista, h

URL = "/api/v1/citas/"
PACIENTE = {
    "nombre": "Carlos",
    "apellidos": "Solís",
    "email": "Carlos@Correo.test",
    "telefono": "8888-8888",
}


@pytest.fixture
def listo(dentista, servicio, domingo):
    return con_horario(dentista, servicio)


def reservar(servicio, inicio, dentista=None, paciente=None):
    datos = {
        "servicio": servicio.id,
        "inicio": inicio.isoformat(),
        "paciente": paciente or PACIENTE,
    }
    if dentista is not None:
        datos["dentista"] = dentista.id
    return cliente_de().post(URL, datos, format="json")


def test_reserva_crea_cita_paciente_y_envia_correo(listo, servicio):
    r = reservar(servicio, h(9))
    assert r.status_code == 201, r.json()
    cita = Cita.objects.get()
    assert cita.dentista == listo and cita.estado == "confirmada"
    assert cita.fin == h(10) and cita.precio_colones == servicio.precio_colones
    assert cita.paciente.email == "carlos@correo.test"
    (envio,) = NotificadorMemoria.enviados
    assert envio["destinatario"] == "carlos@correo.test"
    assert envio["asunto"] == "Tu cita en Sonrisa Viva está confirmada"
    assert "lunes 2 de marzo de 2026, 9:00 a. m." in envio["texto"]
    assert "₡25 000" in envio["texto"]
    token = re.search(r"/cita/([A-Za-z0-9_\-]+)", envio["texto"]).group(1)
    assert cita.token_gestion_hash == hashlib.sha256(token.encode()).hexdigest()


def test_respuesta_tiene_resumen_sin_token(listo, servicio):
    r = reservar(servicio, h(9)).json()
    assert set(r) == {
        "id",
        "servicio",
        "dentista",
        "inicio",
        "fin",
        "precio_colones",
        "estado",
        "paciente",
    }
    assert r["paciente"] == {"nombre": "Carlos", "email": "carlos@correo.test"}
    assert "token" not in str(r).lower()


def test_reserva_reutiliza_paciente_por_correo_y_actualiza_telefono(listo, servicio):
    reservar(servicio, h(9))
    reservar(
        servicio,
        h(10),
        paciente={**PACIENTE, "email": " carlos@CORREO.test", "telefono": "7777-7777"},
    )
    assert Paciente.objects.count() == 1
    assert Paciente.objects.get().telefono == "7777-7777"


def test_reserva_cualquiera_asigna_dentista_con_menos_citas(listo, servicio):
    otro = con_horario(crear_dentista("otro@x.test"), servicio)
    p = Paciente.objects.create(nombre="A", apellidos="B", email="a@b.test", telefono="88888888")
    Cita.objects.create(
        paciente=p,
        dentista=listo,
        servicio=servicio,
        inicio=h(14),
        fin=h(15),
        precio_colones=1,
        token_gestion_hash=secrets.token_hex(32),
    )
    reservar(servicio, h(9))
    assert Cita.objects.get(inicio=h(9)).dentista == otro


def test_reserva_cualquiera_empate_menor_id(listo, servicio):
    otro = con_horario(crear_dentista("otro@x.test"), servicio)
    reservar(servicio, h(9))
    assert Cita.objects.get().dentista == min(listo, otro, key=lambda d: d.id)


def test_reserva_dentista_pedido(listo, servicio):
    otro = con_horario(crear_dentista("otro@x.test"), servicio)
    reservar(servicio, h(9), dentista=otro)
    assert Cita.objects.get().dentista == otro


@pytest.mark.parametrize(
    "inicio",
    [h(9, 10), h(12), h(18), h(9, dia=3)],
    ids=["fuera-de-rejilla", "no-cabe-en-bloque", "fuera-de-horario", "martes-sin-horario"],
)
def test_reserva_hora_inventada_400(listo, servicio, inicio):
    r = reservar(servicio, inicio)
    assert r.status_code == 400
    assert r.json()["detalle"] == "Esa hora ya no está disponible."
    assert Cita.objects.count() == 0


def test_reserva_a_menos_de_2h_400(dentista, servicio):
    import time_machine

    con_horario(dentista, servicio)
    with time_machine.travel(h(8), tick=False):
        r = reservar(servicio, h(9))
    assert r.status_code == 400


def test_reserva_hora_ocupada_concurrente_409(listo, servicio, monkeypatch):
    from apps.citas import selectors

    hora = selectors.disponibilidad(servicio, h(9).date())[4]  # 9:00
    assert hora["inicio"] == h(9)
    p = Paciente.objects.create(nombre="A", apellidos="B", email="a@b.test", telefono="88888888")
    Cita.objects.create(
        paciente=p,
        dentista=listo,
        servicio=servicio,
        inicio=h(9),
        fin=h(10),
        precio_colones=1,
        token_gestion_hash=secrets.token_hex(32),
    )
    # Simula la carrera: el motor aún cree que la hora está libre.
    monkeypatch.setattr(selectors, "disponibilidad", lambda *a, **k: [hora])
    r = reservar(servicio, h(9))
    assert r.status_code == 409
    assert r.json()["detalle"] == "Esa hora acaba de ocuparse, elige otra."
    assert Cita.objects.count() == 1


def test_reserva_dentista_que_no_hace_el_servicio_400(listo, servicio):
    otro = crear_dentista("otro@x.test")
    assert reservar(servicio, h(9), dentista=otro).status_code == 400


def test_reserva_paciente_invalido_400_con_campos(listo, servicio):
    r = reservar(
        servicio, h(9), paciente={"nombre": "", "apellidos": "X", "email": "no", "telefono": "abc"}
    )
    assert r.status_code == 400
    campos = r.json()["campos"]
    assert "paciente" in campos or {"nombre", "email", "telefono"} <= set(campos)
