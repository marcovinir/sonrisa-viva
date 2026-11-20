"""Ayudas para las pruebas (no se usan en producción)."""

from rest_framework.test import APIClient

from apps.cuentas.models import Usuario


def cliente_de(usuario: Usuario | None = None) -> APIClient:
    cliente = APIClient()
    if usuario is not None:
        cliente.force_login(usuario)
    return cliente


def crear_admin(email: str = "admin@x.test") -> Usuario:
    return Usuario.objects.crear_usuario(
        email, "Admin", "Prueba", "admin", password="Clave-Segura-2026", activo=True
    )
