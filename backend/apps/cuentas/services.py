"""Reglas de negocio de las cuentas: activación y recuperación de contraseña."""

from typing import Literal

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework.exceptions import ValidationError

from apps.comun.notificaciones import Notificador, obtener_notificador

from . import correos
from .managers import normalizar_email
from .models import Usuario


class TokenInvalido(Exception):
    pass


def enlace_para(usuario: Usuario, tipo: Literal["activar", "restablecer"]) -> str:
    uid = urlsafe_base64_encode(force_bytes(usuario.pk))
    token = default_token_generator.make_token(usuario)
    return f"{settings.FRONTEND_URL}/panel/{tipo}/{uid}/{token}"


def enviar_enlace_activacion(usuario: Usuario, notificador: Notificador | None = None) -> None:
    notificador = notificador or obtener_notificador()
    notificador.enviar(
        usuario.email,
        correos.ASUNTO_ACTIVACION,
        correos.texto_activacion(usuario.nombre, enlace_para(usuario, "activar")),
    )


def enviar_enlace_recuperacion(email: str, notificador: Notificador | None = None) -> None:
    usuario = Usuario.objects.filter(email=normalizar_email(email), is_active=True).first()
    if usuario is None:
        return  # Sin pistas: no revelamos qué correos existen.
    notificador = notificador or obtener_notificador()
    notificador.enviar(
        usuario.email,
        correos.ASUNTO_RECUPERACION,
        correos.texto_recuperacion(usuario.nombre, enlace_para(usuario, "restablecer")),
    )


def _usuario_del_enlace(uid: str, token: str) -> Usuario:
    try:
        pk = force_str(urlsafe_base64_decode(uid))
        usuario = Usuario.objects.get(pk=pk)
    except (ValueError, TypeError, OverflowError, Usuario.DoesNotExist):
        raise TokenInvalido from None
    if not default_token_generator.check_token(usuario, token):
        raise TokenInvalido
    return usuario


def establecer_contrasena(uid: str, token: str, password: str) -> Usuario:
    usuario = _usuario_del_enlace(uid, token)
    try:
        validate_password(password, usuario)
    except DjangoValidationError as e:
        raise ValidationError({"password": list(e.messages)}) from None
    usuario.set_password(password)
    usuario.is_active = True
    usuario.save(update_fields=["password", "is_active"])
    return usuario
