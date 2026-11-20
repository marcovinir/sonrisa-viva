from datetime import datetime
from zoneinfo import ZoneInfo

import pytest

CR = ZoneInfo("America/Costa_Rica")


def h(hh: int, mm: int = 0, dia: int = 2) -> datetime:
    """Fecha fija (lunes 2 de marzo de 2026) a la hora dada, en hora de Costa Rica."""
    return datetime(2026, 3, dia, hh, mm, tzinfo=CR)


@pytest.fixture
def categoria(db):
    from apps.clinica.models import CategoriaServicio

    return CategoriaServicio.objects.create(nombre="Preventiva", orden=1)


@pytest.fixture
def servicio(categoria):
    from apps.clinica.models import Servicio

    return Servicio.objects.create(
        categoria=categoria,
        nombre="Limpieza dental",
        slug="limpieza-dental",
        descripcion="Profilaxis completa",
        duracion_min=60,
        precio_colones=25000,
    )


def crear_dentista(email: str = "dra@x.test"):
    from apps.clinica.models import Dentista
    from apps.cuentas.models import Usuario

    u = Usuario.objects.crear_usuario(email, "Laura", "Vargas", "dentista", activo=True)
    return Dentista.objects.create(usuario=u, especialidad="Odontología general")


@pytest.fixture
def dentista(db):
    return crear_dentista()


@pytest.fixture(autouse=True)
def _limpiar_notificaciones():
    from apps.comun.notificaciones import NotificadorMemoria

    NotificadorMemoria.limpiar()
    yield
    NotificadorMemoria.limpiar()


@pytest.fixture(autouse=True)
def _limpiar_throttles():
    from django.core.cache import cache

    cache.clear()


def con_horario(dentista, servicio, dia: int = 0):
    """Le da al dentista el servicio y un horario de 8 a 12 y de 13 a 17 el día indicado."""
    from datetime import time

    from apps.clinica.models import HorarioSemanal

    dentista.servicios.add(servicio)
    for ini, fin in ((time(8), time(12)), (time(13), time(17))):
        HorarioSemanal.objects.create(
            dentista=dentista, dia_semana=dia, hora_inicio=ini, hora_fin=fin
        )
    return dentista


@pytest.fixture
def domingo():
    """Congela la hora en el domingo 1 de marzo de 2026 a las 7:00 (Costa Rica)."""
    import time_machine

    with time_machine.travel(h(7, 0, dia=1), tick=False):
        yield
