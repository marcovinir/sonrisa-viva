"""Correos de citas: texto plano, HTML con la identidad de la clínica y el .ics."""

from datetime import UTC

from django.conf import settings
from django.utils import timezone

from apps.comun.correos import html_correo
from apps.comun.notificaciones import Adjunto

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


# --- HTML y .ics ------------------------------------------------------------------------

INDICACIONES_GENERALES = "Llega 10 minutos antes y trae tu cédula o pasaporte."


def indicaciones(cita: Cita) -> str:
    return cita.servicio.indicaciones.strip() or INDICACIONES_GENERALES


def _contexto(cita: Cita) -> dict:
    dentista = cita.dentista.usuario
    return {
        "servicio": cita.servicio.nombre,
        "dentista": f"{dentista.nombre} {dentista.apellidos}",
        "fecha": fecha_hora_es(cita.inicio),
        "precio": colones(cita.precio_colones),
        "indicaciones": indicaciones(cita),
    }


def html_confirmada(cita: Cita, token: str) -> str:
    return html_correo(
        "correos/confirmada.html",
        asunto=ASUNTO_CONFIRMADA,
        resumen=f"{cita.servicio.nombre}, {fecha_hora_es(cita.inicio)}",
        etiqueta="CITA CONFIRMADA",
        titulo=f"¡Listo, {cita.paciente.nombre}! Te esperamos.",
        boton_url=enlace_gestion(token),
        boton_texto="Ver o cambiar mi cita",
        **_contexto(cita),
    )


def html_reprogramada(cita: Cita) -> str:
    return html_correo(
        "correos/reprogramada.html",
        asunto=ASUNTO_REPROGRAMADA,
        resumen=f"Nueva fecha: {fecha_hora_es(cita.inicio)}",
        etiqueta="NUEVA FECHA",
        titulo=f"{cita.paciente.nombre}, tu cita cambió de fecha",
        **_contexto(cita),
    )


def html_cancelada(cita: Cita, por_clinica: bool = False) -> str:
    motivo = (
        "La clínica tuvo que cancelar tu cita. Lamentamos el inconveniente: "
        "puedes agendar otra cuando quieras."
        if por_clinica
        else "Cancelaste tu cita. Cuando quieras, puedes agendar otra."
    )
    return html_correo(
        "correos/cancelada.html",
        asunto=ASUNTO_CANCELADA_CLINICA if por_clinica else ASUNTO_CANCELADA,
        resumen=motivo,
        etiqueta="CITA CANCELADA",
        color_etiqueta="#8C1D18",
        titulo=f"{cita.paciente.nombre}, tu cita quedó cancelada",
        motivo=motivo,
        boton_url=f"{settings.FRONTEND_URL}/reservar",
        boton_texto="Agendar otra cita",
        **_contexto(cita),
    )


def _ics_texto(valor: str) -> str:
    """Escapa un texto para iCalendar (RFC 5545)."""
    return valor.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,")


def _utc(momento) -> str:
    return momento.astimezone(UTC).strftime("%Y%m%dT%H%M%SZ")


def ics(cita: Cita, secuencia: int = 0) -> Adjunto:
    """Evento de calendario; al reprogramar sube la secuencia y el calendario lo actualiza."""
    lineas = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Sonrisa Viva//Citas//ES",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        f"UID:cita-{cita.id}@sonrisaviva",
        f"SEQUENCE:{secuencia}",
        f"DTSTAMP:{_utc(timezone.now())}",
        f"DTSTART:{_utc(cita.inicio)}",
        f"DTEND:{_utc(cita.fin)}",
        f"SUMMARY:{_ics_texto(f'Cita: {cita.servicio.nombre} · Sonrisa Viva')}",
        f"LOCATION:{_ics_texto('Clínica Dental Sonrisa Viva, San José')}",
        f"DESCRIPTION:{_ics_texto(indicaciones(cita))}",
        "END:VEVENT",
        "END:VCALENDAR",
    ]
    return ("cita-sonrisa-viva.ics", "\r\n".join(lineas) + "\r\n", "text/calendar")
