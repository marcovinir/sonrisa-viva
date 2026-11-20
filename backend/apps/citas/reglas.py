"""Reglas fijas de la agenda y mensajes de error (fuente única de verdad)."""

from datetime import date, datetime, timedelta

from django.utils import timezone

PASO_MIN = 15
PASO = timedelta(minutes=PASO_MIN)
ANTICIPACION_MIN = timedelta(hours=2)
ANTICIPACION_MAX_DIAS = 60
LIMITE_CAMBIOS = timedelta(hours=24)

HORA_OCUPADA = "Esa hora acaba de ocuparse, elige otra."
HORA_NO_DISPONIBLE = "Esa hora ya no está disponible."
FUERA_DE_PLAZO = "Solo puedes cambiar o cancelar tu cita hasta 24 horas antes."
TRANSICION_INVALIDA = "No se puede pasar una cita de «{actual}» a «{nuevo}»."
CITA_NO_TERMINADA = "Solo puedes marcar asistencia cuando la cita ya terminó."
NO_MODIFICABLE = "Esta cita ya no se puede modificar."


def ahora() -> datetime:
    """La hora actual. Todo el código de citas la pide aquí para poder congelarla en pruebas."""
    return timezone.now()


def fecha_local(dt: datetime) -> date:
    """La fecha de `dt` en hora de Costa Rica."""
    return timezone.localtime(dt).date()


def hoy() -> date:
    return fecha_local(ahora())
