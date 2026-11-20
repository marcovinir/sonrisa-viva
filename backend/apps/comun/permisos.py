from rest_framework.permissions import BasePermission

MENSAJE_SIN_PERMISO = "No tienes permiso para realizar esta acción."


def tiene_alguno(*codigos: str) -> type[BasePermission]:
    """Crea una clase de permiso DRF: usuario autenticado con al menos uno de `codigos`."""

    class TieneAlguno(BasePermission):
        message = MENSAJE_SIN_PERMISO

        def has_permission(self, request, view) -> bool:
            usuario = request.user
            return bool(
                usuario
                and usuario.is_authenticated
                and any(usuario.tiene_permiso(c) for c in codigos)
            )

    TieneAlguno.__name__ = f"TieneAlguno[{','.join(codigos)}]"
    return TieneAlguno


def tiene_permiso(codigo: str) -> type[BasePermission]:
    """Crea una clase de permiso DRF que exige un usuario autenticado con `codigo`."""
    return tiene_alguno(codigo)
