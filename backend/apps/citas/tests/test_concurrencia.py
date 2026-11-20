"""Citas contra bloqueos cuando ocurren al mismo tiempo.

Dos citas no pueden cruzarse por la restricción `cita_sin_traslape`; una cita y un bloqueo
se protegen con un bloqueo de fila sobre el dentista (ver `bloquear_agenda`).
"""

import threading

import pytest
from django.db import connection, transaction
from rest_framework.exceptions import ValidationError

from apps.citas import selectors, services
from apps.citas.models import Cita
from apps.clinica.models import Bloqueo
from apps.clinica.services import guardar_bloqueo
from apps.comun.errores import Conflicto
from conftest import con_horario, h

PACIENTE = {"nombre": "Carlos", "apellidos": "Solís", "email": "c@x.test", "telefono": "88888888"}


def _motor_dice_libre(monkeypatch, dentista, inicio, fin):
    """Simula la carrera: el motor de disponibilidad todavía no ve el bloqueo."""
    hora = {"inicio": inicio, "fin": fin, "dentistas": [dentista.pk]}
    monkeypatch.setattr(selectors, "disponibilidad", lambda *a, **k: [hora])


def test_reservar_sobre_un_bloqueo_que_el_motor_no_vio_da_409(
    dentista, servicio, domingo, monkeypatch
):
    con_horario(dentista, servicio)
    Bloqueo.objects.create(dentista=dentista, inicio=h(9), fin=h(10), motivo="Congreso")
    _motor_dice_libre(monkeypatch, dentista, h(9), h(10))
    with pytest.raises(Conflicto):
        services.reservar(servicio.id, h(9), PACIENTE)
    assert Cita.objects.count() == 0


def test_reprogramar_sobre_un_bloqueo_que_el_motor_no_vio_da_409(
    dentista, servicio, domingo, monkeypatch
):
    con_horario(dentista, servicio)
    cita, _ = services.reservar(servicio.id, h(9), PACIENTE)
    Bloqueo.objects.create(dentista=dentista, inicio=h(14), fin=h(15), motivo="Congreso")
    _motor_dice_libre(monkeypatch, dentista, h(14), h(15))
    with pytest.raises(Conflicto):
        services.reprogramar(cita, h(14))
    cita.refresh_from_db()
    assert cita.inicio == h(9)


def _en_otro_hilo(funcion, resultado: dict) -> threading.Thread:
    """Corre `funcion` en su propia conexión (su propia transacción)."""

    def correr():
        try:
            resultado["valor"] = funcion()
        except Exception as e:  # noqa: BLE001 — la prueba inspecciona el error
            resultado["error"] = e
        finally:
            connection.close()

    hilo = threading.Thread(target=correr)
    hilo.start()
    return hilo


# serialized_rollback: el vaciado de la base tras la prueba también borra los roles sembrados por
# la migración; así se restauran.
@pytest.mark.django_db(transaction=True, serialized_rollback=True)
def test_reserva_y_bloqueo_simultaneos_solo_queda_el_bloqueo(dentista, servicio, domingo):
    con_horario(dentista, servicio)
    resultado: dict = {}
    with transaction.atomic():
        guardar_bloqueo(dentista, h(9), h(10), "Congreso")  # aún sin confirmar
        hilo = _en_otro_hilo(lambda: services.reservar(servicio.id, h(9), PACIENTE), resultado)
        hilo.join(timeout=1.5)  # la reserva llega mientras el bloqueo sigue abierto
    hilo.join(timeout=15)
    assert not hilo.is_alive()
    assert Bloqueo.objects.count() == 1
    assert Cita.objects.count() == 0
    assert isinstance(resultado.get("error"), (Conflicto, ValidationError))


# serialized_rollback: el vaciado de la base tras la prueba también borra los roles sembrados por
# la migración; así se restauran.
@pytest.mark.django_db(transaction=True, serialized_rollback=True)
def test_bloqueo_y_reserva_simultaneos_solo_queda_la_cita(dentista, servicio, domingo):
    con_horario(dentista, servicio)
    resultado: dict = {}
    with transaction.atomic():
        services.reservar(servicio.id, h(9), PACIENTE)  # aún sin confirmar
        hilo = _en_otro_hilo(lambda: guardar_bloqueo(dentista, h(9), h(10), "Congreso"), resultado)
        hilo.join(timeout=1.5)  # el bloqueo llega mientras la reserva sigue abierta
    hilo.join(timeout=15)
    assert not hilo.is_alive()
    assert Cita.objects.count() == 1
    assert Bloqueo.objects.count() == 0
    assert isinstance(resultado.get("error"), Conflicto)
