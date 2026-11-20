"""Reglas de negocio de la clínica (catálogo, dentistas, horarios y bloqueos)."""

from django.db import transaction
from django.db.models import ProtectedError
from django.utils.text import slugify

from apps.comun.errores import Conflicto

from .models import CategoriaServicio, Servicio

EN_USO_SERVICIO = "No se puede borrar porque tiene citas asociadas; desactívalo en su lugar."
EN_USO_CATEGORIA = (
    "No se puede borrar porque tiene servicios asociados; muévelos a otra categoría primero."
)


def slug_disponible(nombre: str, excluir_id: int | None = None) -> str:
    base = slugify(nombre)[:130] or "servicio"
    slug, n = base, 2
    existentes = Servicio.objects.exclude(pk=excluir_id)
    while existentes.filter(slug=slug).exists():
        slug, n = f"{base}-{n}", n + 1
    return slug


@transaction.atomic
def crear_servicio(datos: dict) -> Servicio:
    if not datos.get("slug"):
        datos = {**datos, "slug": slug_disponible(datos["nombre"])}
    return Servicio.objects.create(**datos)


def borrar(obj: Servicio | CategoriaServicio) -> None:
    try:
        obj.delete()
    except ProtectedError:
        raise Conflicto(
            EN_USO_SERVICIO if isinstance(obj, Servicio) else EN_USO_CATEGORIA
        ) from None
