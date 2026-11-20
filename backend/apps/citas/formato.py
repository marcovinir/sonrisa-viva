"""Formatos en español de Costa Rica para correos y textos."""

from datetime import datetime

from django.utils import timezone

DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]  # fmt: skip


def fecha_hora_es(dt: datetime) -> str:
    """«lunes 2 de marzo de 2026, 9:00 a. m.» en hora de Costa Rica."""
    local = timezone.localtime(dt)
    hora12 = local.hour % 12 or 12
    sufijo = "a. m." if local.hour < 12 else "p. m."
    return (
        f"{DIAS[local.weekday()]} {local.day} de {MESES[local.month - 1]} de {local.year}, "
        f"{hora12}:{local.minute:02d} {sufijo}"
    )


def colones(monto: int) -> str:
    """«₡25 000» con espacio fino como separador de miles."""
    return f"₡{monto:,}".replace(",", " ")
