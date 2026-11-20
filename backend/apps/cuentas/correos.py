"""Correos de cuentas: texto plano y HTML con la identidad de la clínica."""

from apps.comun.correos import html_correo

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


def html_activacion(nombre: str, enlace: str) -> str:
    return html_correo(
        "correos/cuenta.html",
        asunto=ASUNTO_ACTIVACION,
        resumen="Elige tu contraseña para entrar al panel.",
        etiqueta="ACTIVA TU CUENTA",
        titulo=f"Hola, {nombre}",
        mensaje="Se creó tu cuenta en el panel de Clínica Dental Sonrisa Viva. "
        "Elige tu contraseña para entrar.",
        boton_url=enlace,
        boton_texto="Elegir mi contraseña",
        nota="El enlace deja de funcionar en cuanto lo uses.",
    )


def html_recuperacion(nombre: str, enlace: str) -> str:
    return html_correo(
        "correos/cuenta.html",
        asunto=ASUNTO_RECUPERACION,
        resumen="Elige una contraseña nueva para el panel.",
        etiqueta="RESTABLECER CONTRASEÑA",
        titulo=f"Hola, {nombre}",
        mensaje="Recibimos una solicitud para restablecer tu contraseña del panel de Sonrisa Viva.",
        boton_url=enlace,
        boton_texto="Elegir una contraseña nueva",
        nota="Si no lo pediste, ignora este correo: tu contraseña no cambia.",
    )
