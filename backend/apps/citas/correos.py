"""Textos de los correos de citas."""

from django.conf import settings

from .formato import colones, fecha_hora_es
from .models import Cita

ASUNTO_CONFIRMADA = "Tu cita en Sonrisa Viva está confirmada"
ASUNTO_REPROGRAMADA = "Tu cita fue reprogramada"
ASUNTO_CANCELADA = "Tu cita fue cancelada"
ASUNTO_CANCELADA_CLINICA = "Tu cita fue cancelada por la clínica"


def enlace_gestion(token: str) -> str:
    return f"{settings.FRONTEND_URL}/cita/{token}"


def _detalle(cita: Cita) -> str:
    dentista = cita.dentista.usuario
    return (
        f"Servicio: {cita.servicio.nombre}\n"
        f"Dentista: {dentista.nombre} {dentista.apellidos}\n"
        f"Fecha: {fecha_hora_es(cita.inicio)}\n"
        f"Precio aproximado: {colones(cita.precio_colones)}\n"
    )


def texto_confirmada(cita: Cita, token: str) -> str:
    return (
        f"Hola, {cita.paciente.nombre}:\n\n"
        "Tu cita en Clínica Dental Sonrisa Viva quedó confirmada.\n\n"
        f"{_detalle(cita)}\n"
        "Si necesitas cambiarla o cancelarla (hasta 24 horas antes), usa este enlace:\n"
        f"{enlace_gestion(token)}\n\n"
        "¡Te esperamos!\n"
    )


def texto_reprogramada(cita: Cita) -> str:
    return (
        f"Hola, {cita.paciente.nombre}:\n\n"
        "Tu cita quedó con la nueva fecha:\n\n"
        f"{_detalle(cita)}\n"
        "Puedes seguir usando el mismo enlace del primer correo para gestionarla.\n"
    )


def texto_cancelada(cita: Cita, por_clinica: bool = False) -> str:
    motivo = (
        "La clínica tuvo que cancelar tu cita. Lamentamos el inconveniente; "
        "puedes agendar otra cuando quieras en nuestro sitio.\n"
        if por_clinica
        else "Cancelaste tu cita. Si quieres, puedes agendar otra cuando gustes.\n"
    )
    return f"Hola, {cita.paciente.nombre}:\n\n{motivo}\n{_detalle(cita)}"
