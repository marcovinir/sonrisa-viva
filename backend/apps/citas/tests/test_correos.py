"""Correos de citas con la identidad de la clínica: HTML, texto plano y .ics."""

import pytest

from apps.citas import correos, services
from apps.citas.formato import colones
from apps.comun.notificaciones import NotificadorMemoria
from conftest import con_horario, h

PACIENTE = {"nombre": "Carlos", "apellidos": "Solís", "email": "c@x.test", "telefono": "88888888"}


@pytest.fixture
def reserva(dentista, servicio, domingo):
    """Cita del lunes 2 de marzo a las 9:00 (60 min) y el correo que generó."""
    con_horario(dentista, servicio)
    cita, token = services.reservar(servicio.id, h(9), PACIENTE)
    (envio,) = NotificadorMemoria.enviados
    NotificadorMemoria.limpiar()
    return cita, token, envio


def test_confirmada_lleva_html_con_la_identidad_y_el_boton(reserva):
    _, token, envio = reserva
    html = envio["html"]
    assert "Sonrisa Viva" in html
    assert "CITA CONFIRMADA" in html
    assert "¡Listo, Carlos! Te esperamos." in html
    assert f'href="{correos.enlace_gestion(token)}"' in html
    assert "Ver o cambiar mi cita" in html
    for dato in (
        "Limpieza dental",
        "Laura Vargas",
        "lunes 2 de marzo de 2026, 9:00 a. m.",
        colones(25000),
    ):
        assert dato in html
    assert "Sitio de demostración" in html
    # El texto plano sigue en el mismo mensaje, para quien no ve HTML.
    assert correos.enlace_gestion(token) in envio["texto"]


def test_confirmada_adjunta_el_ics(reserva):
    cita, _, envio = reserva
    ((nombre, contenido, tipo),) = envio["adjuntos"]
    assert (nombre, tipo) == ("cita-sonrisa-viva.ics", "text/calendar")
    assert f"UID:cita-{cita.id}@sonrisaviva" in contenido
    assert "DTSTART:20260302T150000Z" in contenido  # 9:00 en Costa Rica (UTC−6)
    assert "DTEND:20260302T160000Z" in contenido
    assert "SUMMARY:Cita: Limpieza dental · Sonrisa Viva" in contenido


def test_usa_las_indicaciones_del_servicio_o_las_generales(reserva, servicio):
    _, _, envio = reserva
    assert correos.INDICACIONES_GENERALES in envio["html"]
    servicio.indicaciones = "Ven sin haber comido en las 2 horas previas."
    servicio.save()
    services.reservar(servicio.id, h(10), {**PACIENTE, "email": "otro@x.test"})
    (envio,) = NotificadorMemoria.enviados
    assert "Ven sin haber comido en las 2 horas previas." in envio["html"]
    assert correos.INDICACIONES_GENERALES not in envio["html"]


def test_el_html_escapa_lo_que_escribe_el_paciente(dentista, servicio, domingo):
    con_horario(dentista, servicio)
    services.reservar(servicio.id, h(9), {**PACIENTE, "nombre": "<b>Ana</b>"})
    (envio,) = NotificadorMemoria.enviados
    assert "<b>Ana</b>" not in envio["html"]
    assert "&lt;b&gt;Ana&lt;/b&gt;" in envio["html"]


def test_reprogramada_lleva_la_nueva_fecha_y_el_ics(reserva):
    cita, _, _ = reserva
    services.reprogramar(cita, h(14))
    (envio,) = NotificadorMemoria.enviados
    assert "NUEVA FECHA" in envio["html"]
    assert "lunes 2 de marzo de 2026, 2:00 p. m." in envio["html"]
    ((_, contenido, _),) = envio["adjuntos"]
    assert "DTSTART:20260302T200000Z" in contenido
    assert "SEQUENCE:1" in contenido  # el calendario actualiza el mismo evento


def test_canceladas_invitan_a_agendar_otra(reserva, settings):
    cita, _, _ = reserva
    services.cancelar_por_paciente(cita)
    (envio,) = NotificadorMemoria.enviados
    assert "CITA CANCELADA" in envio["html"]
    assert f'href="{settings.FRONTEND_URL}/reservar"' in envio["html"]
    assert "Agendar otra cita" in envio["html"]
    assert not envio["adjuntos"]


def test_cancelada_por_la_clinica_lo_dice(reserva):
    cita, _, _ = reserva
    html = correos.html_cancelada(cita, por_clinica=True)
    assert "La clínica tuvo que cancelar tu cita" in html
