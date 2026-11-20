from datetime import time

import pytest
from django.db import IntegrityError

from apps.clinica.models import DentistaServicio, HorarioSemanal, Servicio


def test_duracion_no_multiplo_de_15_falla(categoria):
    with pytest.raises(IntegrityError):
        Servicio.objects.create(
            categoria=categoria, nombre="X", slug="x", duracion_min=50, precio_colones=1
        )


def test_duracion_cero_falla(categoria):
    with pytest.raises(IntegrityError):
        Servicio.objects.create(
            categoria=categoria, nombre="X", slug="x", duracion_min=0, precio_colones=1
        )


def test_precio_negativo_falla(categoria):
    with pytest.raises(IntegrityError):
        Servicio.objects.create(
            categoria=categoria, nombre="X", slug="x", duracion_min=30, precio_colones=-1
        )


def test_horario_inicio_despues_de_fin_falla(dentista):
    with pytest.raises(IntegrityError):
        HorarioSemanal.objects.create(
            dentista=dentista, dia_semana=0, hora_inicio=time(12), hora_fin=time(8)
        )


def test_horario_dia_invalido_falla(dentista):
    with pytest.raises(IntegrityError):
        HorarioSemanal.objects.create(
            dentista=dentista, dia_semana=7, hora_inicio=time(8), hora_fin=time(12)
        )


def test_dentista_servicio_duplicado_falla(dentista, servicio):
    DentistaServicio.objects.create(dentista=dentista, servicio=servicio)
    with pytest.raises(IntegrityError):
        DentistaServicio.objects.create(dentista=dentista, servicio=servicio)


def test_dentista_lista_sus_servicios(dentista, servicio):
    dentista.servicios.add(servicio)
    assert list(dentista.servicios.all()) == [servicio]
