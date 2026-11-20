"""Envío de notificaciones detrás de una interfaz (inversión de dependencias)."""

from typing import ClassVar, Protocol

from django.conf import settings
from django.core.mail import send_mail
from django.utils.module_loading import import_string


class Notificador(Protocol):
    def enviar(
        self, destinatario: str, asunto: str, texto: str, html: str | None = None
    ) -> None: ...


class NotificadorCorreo:
    """Envía correos con el backend de correo configurado en Django."""

    def enviar(self, destinatario: str, asunto: str, texto: str, html: str | None = None) -> None:
        send_mail(
            asunto,
            texto,
            settings.DEFAULT_FROM_EMAIL,
            [destinatario],
            html_message=html,
            fail_silently=False,
        )


class NotificadorMemoria:
    """Guarda los envíos en memoria; se usa en las pruebas."""

    enviados: ClassVar[list[dict]] = []

    def enviar(self, destinatario: str, asunto: str, texto: str, html: str | None = None) -> None:
        self.enviados.append(
            {"destinatario": destinatario, "asunto": asunto, "texto": texto, "html": html}
        )

    @classmethod
    def limpiar(cls) -> None:
        cls.enviados.clear()


def obtener_notificador() -> Notificador:
    return import_string(settings.NOTIFICADOR)()
