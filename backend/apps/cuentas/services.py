"""Reglas de negocio de las cuentas: activación y recuperación de contraseña."""

from typing import Literal

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework.exceptions import ValidationError

from apps.comun.notificaciones import Notificador, obtener_notificador

from . import correos
from .managers import normalizar_email
from .models import Usuario
from .permisos import ROL_ADMIN, ROL_DENTISTA


class TokenInvalido(Exception):
    pass


def enlace_para(usuario: Usuario, tipo: Literal["activar", "restablecer"]) -> str:
    uid = urlsafe_base64_encode(force_bytes(usuario.pk))
    token = default_token_generator.make_token(usuario)
    return f"{settings.FRONTEND_URL}/panel/{tipo}/{uid}/{token}"


def enviar_enlace_activacion(usuario: Usuario, notificador: Notificador | None = None) -> None:
    notificador = notificador or obtener_notificador()
    enlace = enlace_para(usuario, "activar")
    notificador.enviar(
        usuario.email,
        correos.ASUNTO_ACTIVACION,
        correos.texto_activacion(usuario.nombre, enlace),
        correos.html_activacion(usuario.nombre, enlace),
    )


def enviar_enlace_recuperacion(email: str, notificador: Notificador | None = None) -> None:
    usuario = Usuario.objects.filter(email=normalizar_email(email), is_active=True).first()
    if usuario is None:
        return  # Sin pistas: no revelamos qué correos existen.
    notificador = notificador or obtener_notificador()
    enlace = enlace_para(usuario, "restablecer")
    notificador.enviar(
        usuario.email,
        correos.ASUNTO_RECUPERACION,
        correos.texto_recuperacion(usuario.nombre, enlace),
        correos.html_recuperacion(usuario.nombre, enlace),
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


def establecer_contrasena(
    uid: str, token: str, password: str, tipo: Literal["activar", "restablecer"] = "activar"
) -> Usuario:
    """Activa una cuenta nueva o restablece la contraseña de una cuenta activa.

    - "activar" solo sirve para cuentas que nunca tuvieron contraseña.
    - "restablecer" solo sirve para cuentas activas: un enlace pedido antes de que el admin
      desactivara la cuenta no la puede reactivar.
    """
    usuario = _usuario_del_enlace(uid, token)
    if tipo == "activar" and usuario.has_usable_password():
        raise TokenInvalido
    if tipo == "restablecer" and not usuario.is_active:
        raise TokenInvalido
    try:
        validate_password(password, usuario)
    except DjangoValidationError as e:
        raise ValidationError({"password": list(e.messages)}) from None
    usuario.set_password(password)
    usuario.is_active = True
    usuario.save(update_fields=["password", "is_active"])
    return usuario


# --- Gestión de usuarios desde el panel ------------------------------------------------

AUTO_DESACTIVAR = "No puedes desactivar tu propia cuenta."
ULTIMO_ADMIN = "Debe quedar al menos un administrador activo."
YA_ACTIVADO = "Este usuario ya activó su cuenta."
EMAIL_DUPLICADO = "Ya existe un usuario con ese correo."


@transaction.atomic
def crear_usuario_panel(
    email: str, nombre: str, apellidos: str, rol: str, notificador: Notificador | None = None
) -> Usuario:
    from apps.clinica.models import Dentista

    if Usuario.objects.filter(email=normalizar_email(email)).exists():
        raise ValidationError({"email": [EMAIL_DUPLICADO]})
    usuario = Usuario.objects.crear_usuario(email, nombre, apellidos, rol)
    if rol == ROL_DENTISTA:
        Dentista.objects.create(usuario=usuario, visible_en_web=False)
    enviar_enlace_activacion(usuario, notificador)
    return usuario


def desactivar_usuario(usuario: Usuario, hecho_por: Usuario) -> Usuario:
    if usuario.pk == hecho_por.pk:
        raise ValidationError(AUTO_DESACTIVAR)
    if (
        usuario.is_active
        and usuario.rol.nombre == ROL_ADMIN
        and not Usuario.objects.filter(rol__nombre=ROL_ADMIN, is_active=True)
        .exclude(pk=usuario.pk)
        .exists()
    ):
        raise ValidationError(ULTIMO_ADMIN)
    usuario.is_active = False
    campos = ["is_active"]
    if not usuario.has_usable_password():
        usuario.set_unusable_password()  # cambia el hash: invalida el enlace pendiente
        campos.append("password")
    usuario.save(update_fields=campos)
    return usuario


def reactivar_usuario(usuario: Usuario, notificador: Notificador | None = None) -> Usuario:
    if usuario.has_usable_password():
        usuario.is_active = True
        usuario.save(update_fields=["is_active"])
    else:
        enviar_enlace_activacion(usuario, notificador)
    return usuario


def reenviar_activacion(usuario: Usuario, notificador: Notificador | None = None) -> None:
    if usuario.has_usable_password():
        raise ValidationError(YA_ACTIVADO)
    enviar_enlace_activacion(usuario, notificador)
