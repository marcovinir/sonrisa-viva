import secrets

import pytest
from django.db import IntegrityError, transaction

from apps.citas.models import Cita, EstadoCita, Paciente
from conftest import crear_dentista, h


@pytest.fixture
def cita_base(dentista, servicio):
    paciente = Paciente.objects.create(
        nombre="Carlos", apellidos="Solís", email=" Carlos@Correo.TEST ", telefono="8888-8888"
    )
    return {"paciente": paciente, "dentista": dentista, "servicio": servicio}


def crear_cita(base, inicio, fin, estado=EstadoCita.CONFIRMADA, dentista=None):
    with transaction.atomic():
        return Cita.objects.create(
            paciente=base["paciente"],
            dentista=dentista or base["dentista"],
            servicio=base["servicio"],
            inicio=inicio,
            fin=fin,
            precio_colones=base["servicio"].precio_colones,
            estado=estado,
            token_gestion_hash=secrets.token_hex(32),
        )


def test_paciente_normaliza_email(cita_base):
    assert cita_base["paciente"].email == "carlos@correo.test"


def test_cita_nace_confirmada(cita_base):
    assert crear_cita(cita_base, h(9), h(10)).estado == "confirmada"


def test_cita_traslapada_mismo_dentista_falla(cita_base):
    crear_cita(cita_base, h(9), h(10))
    with pytest.raises(IntegrityError):
        crear_cita(cita_base, h(9, 30), h(10, 30))


def test_cita_contenida_en_otra_falla(cita_base):
    crear_cita(cita_base, h(9), h(11))
    with pytest.raises(IntegrityError):
        crear_cita(cita_base, h(9, 15), h(9, 45))


def test_citas_pegadas_se_permiten(cita_base):
    crear_cita(cita_base, h(9), h(10))
    crear_cita(cita_base, h(10), h(11))
    assert Cita.objects.count() == 2


def test_cita_cancelada_no_bloquea(cita_base):
    crear_cita(cita_base, h(9), h(10), estado=EstadoCita.CANCELADA)
    crear_cita(cita_base, h(9), h(10))
    assert Cita.objects.count() == 2


def test_otro_dentista_misma_hora_se_permite(cita_base):
    otro = crear_dentista("otro@x.test")
    crear_cita(cita_base, h(9), h(10))
    crear_cita(cita_base, h(9), h(10), dentista=otro)
    assert Cita.objects.count() == 2


def test_fin_antes_de_inicio_falla(cita_base):
    with pytest.raises(IntegrityError):
        crear_cita(cita_base, h(10), h(9))
