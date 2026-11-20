import secrets
from datetime import time

import pytest
import time_machine

from apps.citas.models import Cita, EstadoCita, Paciente
from apps.clinica.models import Bloqueo, HorarioSemanal
from apps.comun.pruebas import cliente_de
from conftest import crear_dentista, h

URL = "/api/v1/disponibilidad/"


def con_horario(dentista, servicio, dia=0):
    dentista.servicios.add(servicio)
    for ini, fin in ((time(8), time(12)), (time(13), time(17))):
        HorarioSemanal.objects.create(
            dentista=dentista, dia_semana=dia, hora_inicio=ini, hora_fin=fin
        )
    return dentista


@pytest.fixture
def domingo():
    with time_machine.travel(h(7, 0, dia=1), tick=False):
        yield


@pytest.fixture
def listo(dentista, servicio, domingo):
    return con_horario(dentista, servicio)


def pedir(servicio, fecha="2026-03-02", **extra):
    params = {"servicio": servicio.id, "fecha": fecha, **extra}
    return cliente_de().get(URL, params)


def inicios(r):
    return [x["inicio"] for x in r.json()["horas"]]


def iso(dt):
    return dt.isoformat()


def test_dia_sin_horario_vacio(listo, servicio):
    r = pedir(servicio, "2026-03-03")  # martes
    assert r.status_code == 200
    assert r.json() == {"fecha": "2026-03-03", "horas": []}


def test_lunes_con_horario_devuelve_horas_y_dentista(listo, servicio):
    r = pedir(servicio)
    horas = r.json()["horas"]
    # servicio de 60 min: 8:00…11:00 y 13:00…16:00 cada 15 min = 13 + 13
    assert len(horas) == 26
    assert horas[0]["dentistas"] == [listo.id]
    assert inicios(r)[0].startswith("2026-03-02T08:00:00")
    assert horas[0]["fin"].startswith("2026-03-02T09:00:00")


def test_excluye_citas_y_bloqueos(listo, servicio):
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
    Cita.objects.create(
        paciente=p,
        dentista=listo,
        servicio=servicio,
        inicio=h(10),
        fin=h(11),
        precio_colones=1,
        estado=EstadoCita.CANCELADA,
        token_gestion_hash=secrets.token_hex(32),
    )
    Bloqueo.objects.create(dentista=listo, inicio=h(13), fin=h(17))
    r = inicios(pedir(servicio))
    assert not any("T08:15" in x or "T09:" in x or "T13:" in x for x in r)
    assert any("T08:00" in x for x in r) and any("T10:00" in x for x in r)


def test_anticipacion_minima_2h(dentista, servicio):
    con_horario(dentista, servicio)
    with time_machine.travel(h(8, 5), tick=False):
        r = inicios(pedir(servicio))
    assert r[0].startswith("2026-03-02T10:15:00")


def test_mas_de_60_dias_vacio(listo, servicio):
    assert pedir(servicio, "2026-05-04").json()["horas"] == []  # lunes, día 64


def test_cualquiera_une_dentistas(listo, servicio):
    otro = con_horario(crear_dentista("otro@x.test"), servicio)
    horas = pedir(servicio).json()["horas"]
    assert horas[0]["dentistas"] == sorted([listo.id, otro.id])


def test_dentista_especifico(listo, servicio):
    otro = con_horario(crear_dentista("otro@x.test"), servicio)
    horas = pedir(servicio, dentista=otro.id).json()["horas"]
    assert horas[0]["dentistas"] == [otro.id]


def test_dentista_que_no_hace_el_servicio_vacio(listo, servicio):
    otro = crear_dentista("otro@x.test")
    HorarioSemanal.objects.create(
        dentista=otro, dia_semana=0, hora_inicio=time(8), hora_fin=time(12)
    )
    assert pedir(servicio, dentista=otro.id).json()["horas"] == []


def test_dentista_inactivo_o_no_visible_no_aparece(listo, servicio):
    listo.visible_en_web = False
    listo.save()
    assert pedir(servicio).json()["horas"] == []
    listo.visible_en_web = True
    listo.save()
    listo.usuario.is_active = False
    listo.usuario.save()
    assert pedir(servicio).json()["horas"] == []


def test_servicio_inactivo_404(listo, servicio):
    servicio.activo = False
    servicio.save()
    assert pedir(servicio).status_code == 404


def test_fecha_invalida_400(listo, servicio):
    r = pedir(servicio, "2026-13-40")
    assert r.status_code == 400
    assert "fecha" in r.json()["campos"]


def test_dias_con_disponibilidad_en_rango(listo, servicio):
    r = cliente_de().get(
        f"{URL}dias/", {"servicio": servicio.id, "desde": "2026-02-20", "hasta": "2026-03-16"}
    )
    assert r.status_code == 200
    assert r.json()["dias"] == ["2026-03-02", "2026-03-09", "2026-03-16"]
