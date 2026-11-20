"""Arma el HTML de los correos con la plantilla común de la clínica."""

from django.conf import settings
from django.template.loader import render_to_string


def html_correo(plantilla: str, **contexto) -> str:
    """Las variables se escapan (autoescape): lo que escribe un paciente no se vuelve HTML."""
    return render_to_string(
        plantilla, {"logo_url": f"{settings.FRONTEND_URL}/correo/logo.png", **contexto}
    )
