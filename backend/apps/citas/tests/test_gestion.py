import pytest
import time_machine

from apps.citas import selectors, services
from apps.citas.models import Cita
from apps.comun.notificaciones import NotificadorMemoria
from apps.comun.pruebas import cliente_de
from conftest import con_horario, h

PACIENTE = {"nombre": "Carlos", "apellidos": "Solís", "email": "c@x.test", "telefono": "88888888"}


@pytest.fixture
def reservada(dentista, servicio, domingo):
    """Cita del lunes 2 a las 9:00 (60 min), reservada el domingo a las 7:00."""
    con_horario(dentista, servicio)
    cita, token = services.reservar(servicio.id, h(9), PACIENTE)
    NotificadorMemoria.limpiar()
    return cita, token


def url(token):
    return f"/api/v1/citas/gestion/{token}/"


def test_ver_cita_por_token(reservada):
    cita, token = reservada
    r = cliente_de().get(url(token))
    assert r.status_code == 200
    assert r.json()["id"] == cita.id
    assert r.json()["puede_cambiar"] is True


def test_token_desconocido_404(reservada):
    assert cliente_de().get(url("no-existe")).status_code == 404


def test_reprogramar_a_hora_libre(reservada):
    cita, token = reservada
    r = cliente_de().patch(url(token), {"inicio": h(14).isoformat()}, format="json")
    assert r.status_code == 200, r.json()
    cita.refresh_from_db()
    assert cita.inicio == h(14) and cita.fin == h(15)
    assert NotificadorMemoria.enviados[0]["asunto"] == "Tu cita fue reprogramada"


def test_reprogramar_solapando_consigo_misma_permitido(reservada):
    cita, token = reservada
    r = cliente_de().patch(url(token), {"inicio": h(9, 15).isoformat()}, format="json")
    assert r.status_code == 200, r.json()
    cita.refresh_from_db()
    assert cita.inicio == h(9, 15)


def test_reprogramar_a_hora_ocupada_400(reservada, servicio):
    _, token = reservada
    services.reservar(servicio.id, h(14), {**PACIENTE, "email": "otra@x.test"})
    r = cliente_de().patch(url(token), {"inicio": h(14, 30).isoformat()}, format="json")
    assert r.status_code == 400
    assert r.json()["detalle"] == "Esa hora ya no está disponible."


def test_cambios_a_menos_de_24h_400(reservada):
    _, token = reservada
    with time_machine.travel(h(10, 0, dia=1), tick=False):  # domingo 10:00 → faltan 23 h
        assert cliente_de().get(url(token)).json()["puede_cambiar"] is False
        r = cliente_de().delete(url(token))
        assert r.status_code == 400
        assert r.json()["detalle"] == (
            "Solo puedes cambiar o cancelar tu cita hasta 24 horas antes."
        )
        r = cliente_de().patch(url(token), {"inicio": h(14).isoformat()}, format="json")
        assert r.status_code == 400


def test_cancelar_libera_la_hora(reservada, servicio):
    cita, token = reservada
    assert cliente_de().delete(url(token)).status_code == 204
    cita.refresh_from_db()
    assert cita.estado == "cancelada"
    horas = [x["inicio"] for x in selectors.disponibilidad(servicio, h(9).date())]
    assert h(9) in horas
    assert NotificadorMemoria.enviados[0]["asunto"] == "Tu cita fue cancelada"


def test_cancelada_no_se_puede_reprogramar_400(reservada):
    _, token = reservada
    cliente_de().delete(url(token))
    r = cliente_de().patch(url(token), {"inicio": h(14).isoformat()}, format="json")
    assert r.status_code == 400
    assert r.json()["detalle"] == "Esta cita ya no se puede modificar."
    assert cliente_de().get(url(token)).json()["puede_cambiar"] is False


def test_correos_de_cambio_y_cancelacion(reservada):
    _, token = reservada
    cliente_de().patch(url(token), {"inicio": h(14).isoformat()}, format="json")
    cliente_de().delete(url(token))
    asuntos = [e["asunto"] for e in NotificadorMemoria.enviados]
    assert asuntos == ["Tu cita fue reprogramada", "Tu cita fue cancelada"]
    assert "1:00 p. m." not in NotificadorMemoria.enviados[0]["texto"]
    assert "2:00 p. m." in NotificadorMemoria.enviados[0]["texto"]


def test_reprogramar_conserva_dentista_y_precio(reservada):
    cita, token = reservada
    antes = (cita.dentista_id, cita.precio_colones, cita.token_gestion_hash)
    cliente_de().patch(url(token), {"inicio": h(14).isoformat()}, format="json")
    cita = Cita.objects.get(pk=cita.pk)
    assert (cita.dentista_id, cita.precio_colones, cita.token_gestion_hash) == antes
