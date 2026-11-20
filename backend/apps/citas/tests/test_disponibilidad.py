from datetime import timedelta

from apps.citas.disponibilidad import horas_libres
from conftest import h

M15 = timedelta(minutes=15)
M30 = timedelta(minutes=30)


def libres(bloques, ocupados=(), duracion=M30, desde=None, hasta=None):
    return horas_libres(
        bloques=list(bloques),
        ocupados=list(ocupados),
        duracion=duracion,
        desde=desde or h(0),
        hasta=hasta or h(23, 59),
        paso=M15,
    )


def test_rejilla_de_15_en_un_bloque():
    assert libres([(h(8), h(9))]) == [h(8), h(8, 15), h(8, 30)]


def test_excluye_ocupados_y_permite_pegadas():
    r = libres([(h(8), h(10))], ocupados=[(h(8, 30), h(9))])
    assert h(8) in r and h(9) in r
    assert h(8, 15) not in r and h(8, 30) not in r and h(8, 45) not in r


def test_respeta_desde_alineando_a_la_rejilla():
    assert libres([(h(8), h(9))], desde=h(8, 7))[0] == h(8, 15)


def test_respeta_hasta():
    assert libres([(h(8), h(12))], hasta=h(9)) == [h(8), h(8, 15), h(8, 30)]


def test_servicio_mas_largo_que_el_bloque_no_da_horas():
    assert libres([(h(8), h(9))], duracion=timedelta(minutes=90)) == []


def test_varios_bloques_en_orden():
    r = libres([(h(13), h(13, 30)), (h(8), h(8, 30))])
    assert r == [h(8), h(13)]
