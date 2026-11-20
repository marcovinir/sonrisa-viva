"""Textos de los correos de cuentas."""

ASUNTO_ACTIVACION = "Activa tu cuenta en Sonrisa Viva"
ASUNTO_RECUPERACION = "Restablece tu contraseña"


def texto_activacion(nombre: str, enlace: str) -> str:
    return (
        f"Hola, {nombre}:\n\n"
        "Se creó tu cuenta en el panel de Clínica Dental Sonrisa Viva.\n"
        "Para activarla y elegir tu contraseña, abre este enlace:\n\n"
        f"{enlace}\n\n"
        "El enlace deja de funcionar en cuanto lo uses.\n"
    )


def texto_recuperacion(nombre: str, enlace: str) -> str:
    return (
        f"Hola, {nombre}:\n\n"
        "Recibimos una solicitud para restablecer tu contraseña del panel de Sonrisa Viva.\n"
        "Si fuiste tú, abre este enlace:\n\n"
        f"{enlace}\n\n"
        "Si no lo pediste, ignora este correo: tu contraseña no cambia.\n"
    )
