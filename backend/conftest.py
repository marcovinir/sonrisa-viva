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
