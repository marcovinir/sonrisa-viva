"""Envío de notificaciones detrás de una interfaz (inversión de dependencias)."""

import logging
from typing import ClassVar, Protocol

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.module_loading import import_string

logger = logging.getLogger(__name__)

# (nombre del archivo, contenido, tipo MIME), p. ej. el .ics de una cita.
Adjunto = tuple[str, str, str]


class Notificador(Protocol):
    def enviar(
        self,
        destinatario: str,
        asunto: str,
        texto: str,
        html: str | None = None,
        adjuntos: list[Adjunto] | None = None,
    ) -> None: ...


class NotificadorCorreo:
    """Envía correos con el backend de correo configurado en Django."""

    def enviar(
        self,
        destinatario: str,
        asunto: str,
        texto: str,
        html: str | None = None,
        adjuntos: list[Adjunto] | None = None,
    ) -> None:
        # Texto plano + HTML en el mismo mensaje: cada cliente muestra lo que soporta.
        mensaje = EmailMultiAlternatives(asunto, texto, settings.DEFAULT_FROM_EMAIL, [destinatario])
        if html:
            mensaje.attach_alternative(html, "text/html")
        for nombre, contenido, tipo in adjuntos or []:
            mensaje.attach(nombre, contenido, tipo)
        mensaje.send(fail_silently=False)


class NotificadorMemoria:
    """Guarda los envíos en memoria; se usa en las pruebas."""

    enviados: ClassVar[list[dict]] = []

    def enviar(
        self,
        destinatario: str,
        asunto: str,
        texto: str,
        html: str | None = None,
        adjuntos: list[Adjunto] | None = None,
    ) -> None:
        self.enviados.append(
            {
                "destinatario": destinatario,
                "asunto": asunto,
                "texto": texto,
                "html": html,
                "adjuntos": list(adjuntos or []),
            }
        )

    @classmethod
    def limpiar(cls) -> None:
        cls.enviados.clear()


def obtener_notificador() -> Notificador:
    return import_string(settings.NOTIFICADOR)()


def enviar_sin_fallar(
    notificador: Notificador,
    destinatario: str,
    asunto: str,
    texto: str,
    html: str | None = None,
    adjuntos: list[Adjunto] | None = None,
) -> bool:
    """Envía y, si falla, solo lo registra: la operación que ya se guardó no debe deshacerse
    ni devolverse como error por un problema del correo. Devuelve si se pudo enviar."""
    try:
        notificador.enviar(destinatario, asunto, texto, html, adjuntos)
        return True
    except Exception:
        logger.exception("No se pudo enviar el correo «%s» a %s", asunto, destinatario)
        return False
