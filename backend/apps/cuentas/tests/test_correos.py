"""Correos de cuentas con la identidad de la clínica."""

from apps.cuentas import correos

ENLACE = "https://sonrisa.marcovinir.dev/panel/activar/MQ/abc-123"


def test_activacion_lleva_boton_con_el_enlace():
    html = correos.html_activacion("Sofía", ENLACE)
    assert "ACTIVA TU CUENTA" in html
    assert "Hola, Sofía" in html
    assert f'href="{ENLACE}"' in html
    assert "Elegir mi contraseña" in html


def test_recuperacion_lleva_boton_y_aviso():
    html = correos.html_recuperacion("Laura", ENLACE)
    assert "RESTABLECER CONTRASEÑA" in html
    assert f'href="{ENLACE}"' in html
    assert "Si no lo pediste, ignora este correo" in html
