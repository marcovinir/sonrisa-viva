from rest_framework.permissions import BasePermission


def tiene_permiso(codigo: str) -> type[BasePermission]:
    """Crea una clase de permiso DRF que exige un usuario autenticado con `codigo`."""

    class TienePermiso(BasePermission):
        message = "No tienes permiso para realizar esta acción."

        def has_permission(self, request, view) -> bool:
            usuario = request.user
            return bool(usuario and usuario.is_authenticated and usuario.tiene_permiso(codigo))

    TienePermiso.__name__ = f"TienePermiso[{codigo}]"
    return TienePermiso
