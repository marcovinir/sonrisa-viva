import secrets

import pytest

from apps.citas.models import Cita, EstadoCita, Paciente
from apps.clinica.models import CategoriaServicio, Servicio
from apps.comun.pruebas import cliente_de, crear_admin
from conftest import crear_dentista, h

BASE = "/api/v1/panel/reportes/"
RANGO = "?desde=2026-01-01&hasta=2026-03-31"


def cita(dentista, servicio, dia, estado, hora=9):
    p, _ = Paciente.objects.get_or_create(
        email="p@x.test", defaults={"nombre": "P", "apellidos": "Q", "telefono": "88888888"}
    )
    return Cita.objects.create(
        paciente=p,
        dentista=dentista,
        servicio=servicio,
        inicio=h(hora, dia=dia),
        fin=h(hora + 1, dia=dia),
        precio_colones=servicio.precio_colones,
        estado=estado,
        token_gestion_hash=secrets.token_hex(32),
    )


@pytest.fixture
def datos(dentista, servicio):
    estetica = CategoriaServicio.objects.create(nombre="Estética", orden=2)
    blanqueo = Servicio.objects.create(
        categoria=estetica,
        nombre="Blanqueamiento",
        slug="blanqueamiento",
        duracion_min=60,
        precio_colones=120000,
    )
    otro = crear_dentista("otro@x.test")
    C, N, X = EstadoCita.COMPLETADA, EstadoCita.NO_ASISTIO, EstadoCita.CANCELADA
    cita(dentista, servicio, 2, C)  # limpieza 25 000
    cita(dentista, servicio, 3, C)  # limpieza 25 000
    cita(dentista, servicio, 4, N)
    cita(dentista, servicio, 5, X)  # cancelada: no cuenta en total
    cita(otro, blanqueo, 2, C)  # blanqueo 120 000
    cita(otro, blanqueo, 9, EstadoCita.CONFIRMADA)
    return {"limpieza": servicio, "blanqueo": blanqueo, "dentista": dentista, "otro": otro}


@pytest.fixture
def admin(db):
    return cliente_de(crear_admin())


def test_por_servicio_cuenta_y_suma_ingresos(admin, datos):
    r = admin.get(f"{BASE}citas-por-servicio/{RANGO}")
    assert r.status_code == 200
    assert r.json() == [
        {
            "id": datos["limpieza"].id,
            "nombre": "Limpieza dental",
            "total": 3,
            "completadas": 2,
            "ingresos_colones": 50000,
        },
        {
            "id": datos["blanqueo"].id,
            "nombre": "Blanqueamiento",
            "total": 2,
            "completadas": 1,
            "ingresos_colones": 120000,
        },
    ]


def test_por_categoria(admin, datos):
    r = admin.get(f"{BASE}citas-por-categoria/{RANGO}").json()
    assert {c["nombre"]: (c["total"], c["ingresos_colones"]) for c in r} == {
        "Preventiva": (3, 50000),
        "Estética": (2, 120000),
    }


def test_por_dentista(admin, datos):
    r = admin.get(f"{BASE}citas-por-dentista/{RANGO}").json()
    fila = next(d for d in r if d["id"] == datos["dentista"].id)
    assert fila == {
        "id": datos["dentista"].id,
        "nombre": "Laura",
        "apellidos": "Vargas",
        "total": 3,
        "completadas": 2,
        "no_asistio": 1,
        "ingresos_colones": 50000,
    }


def test_por_mes_rellena_meses_vacios(admin, datos):
    r = admin.get(f"{BASE}citas-por-mes/{RANGO}").json()
    assert [m["mes"] for m in r] == ["2026-01", "2026-02", "2026-03"]
    assert r[0] == {
        "mes": "2026-01",
        "total": 0,
        "completadas": 0,
        "canceladas": 0,
        "no_asistio": 0,
    }
    assert r[2] == {
        "mes": "2026-03",
        "total": 5,
        "completadas": 3,
        "canceladas": 1,
        "no_asistio": 1,
    }


def test_tasa_asistencia_y_null_sin_datos(admin, datos):
    assert admin.get(f"{BASE}tasa-asistencia/{RANGO}").json() == {
        "completadas": 3,
        "no_asistio": 1,
        "tasa": 0.75,
    }
    vacio = admin.get(f"{BASE}tasa-asistencia/?desde=2025-01-01&hasta=2025-01-31").json()
    assert vacio == {"completadas": 0, "no_asistio": 0, "tasa": None}


def test_rango_fechas_filtra(admin, datos):
    r = admin.get(f"{BASE}citas-por-servicio/?desde=2026-03-02&hasta=2026-03-02").json()
    assert {s["nombre"]: s["total"] for s in r} == {"Limpieza dental": 1, "Blanqueamiento": 1}


def test_rango_invalido_400(admin, datos):
    assert admin.get(f"{BASE}citas-por-mes/?desde=2026-03-31&hasta=2026-01-01").status_code == 400


def test_dentista_sin_permiso_403(dentista):
    assert cliente_de(dentista.usuario).get(f"{BASE}tasa-asistencia/").status_code == 403
