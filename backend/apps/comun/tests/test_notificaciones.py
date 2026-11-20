from django.core import mail
from django.test import override_settings

from apps.comun.notificaciones import NotificadorCorreo, NotificadorMemoria, obtener_notificador


def test_obtener_notificador_en_pruebas_es_memoria():
    assert isinstance(obtener_notificador(), NotificadorMemoria)


def test_notificador_memoria_registra_envio():
    NotificadorMemoria.limpiar()
    obtener_notificador().enviar("ana@x.test", "Hola", "Texto")
    assert NotificadorMemoria.enviados == [
        {
            "destinatario": "ana@x.test",
            "asunto": "Hola",
            "texto": "Texto",
            "html": None,
            "adjuntos": [],
        }
    ]


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
def test_notificador_correo_envia_por_django():
    NotificadorCorreo().enviar("ana@x.test", "Asunto", "Cuerpo", "<p>Cuerpo</p>")
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == ["ana@x.test"]
    assert mail.outbox[0].alternatives[0][0] == "<p>Cuerpo</p>"


def test_notificador_correo_envia_html_y_adjuntos(settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    NotificadorCorreo().enviar(
        "a@x.test",
        "Asunto",
        "texto plano",
        "<p>hola</p>",
        [("cita.ics", "BEGIN:VCALENDAR", "text/calendar")],
    )
    (mensaje,) = mail.outbox
    assert mensaje.body == "texto plano"
    assert tuple(mensaje.alternatives[0]) == ("<p>hola</p>", "text/html")
    assert mensaje.attachments[0][0] == "cita.ics"
