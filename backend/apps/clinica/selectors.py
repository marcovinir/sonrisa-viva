"""Consultas de la clínica."""

from django.db.models import QuerySet

from .models import CategoriaServicio, Servicio


def servicios_publicos() -> QuerySet[Servicio]:
    return Servicio.objects.filter(activo=True).select_related("categoria")


def categorias_publicas() -> QuerySet[CategoriaServicio]:
    return CategoriaServicio.objects.filter(servicios__activo=True).distinct()
