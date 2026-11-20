from apps.citas.formato import colones, fecha_hora_es
from conftest import h


def test_fecha_hora_es_manana_y_tarde():
    assert fecha_hora_es(h(9)) == "lunes 2 de marzo de 2026, 9:00 a. m."
    assert fecha_hora_es(h(13, 30)) == "lunes 2 de marzo de 2026, 1:30 p. m."
    assert fecha_hora_es(h(12, 0)) == "lunes 2 de marzo de 2026, 12:00 p. m."


def test_fecha_hora_es_convierte_a_hora_local():
    from datetime import UTC, datetime

    assert fecha_hora_es(datetime(2026, 3, 2, 15, 0, tzinfo=UTC)).endswith("9:00 a. m.")


def test_colones_con_separador():
    assert colones(25000) == "₡25 000"
    assert colones(150000) == "₡150 000"
    assert colones(900) == "₡900"
