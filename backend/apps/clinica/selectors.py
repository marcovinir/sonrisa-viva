"""Consultas de la clínica."""

from django.db.models import Prefetch, QuerySet

from .models import CategoriaServicio, Dentista, Servicio


def servicios_publicos() -> QuerySet[Servicio]:
    return Servicio.objects.filter(activo=True).select_related("categoria")


def categorias_publicas() -> QuerySet[CategoriaServicio]:
    return CategoriaServicio.objects.filter(servicios__activo=True).distinct()


def dentistas_publicos(servicio_id: int | None = None) -> QuerySet[Dentista]:
    """Dentistas que se muestran en la web: visibles y con la cuenta activa."""
    qs = (
        Dentista.objects.filter(visible_en_web=True, usuario__is_active=True)
        .select_related("usuario")
        .prefetch_related(
            Prefetch("servicios", queryset=Servicio.objects.filter(activo=True), to_attr="activos")
        )
    )
    if servicio_id:
        qs = qs.filter(servicios__id=servicio_id, servicios__activo=True).distinct()
    return qs


def dentistas_panel() -> QuerySet[Dentista]:
    return Dentista.objects.select_related("usuario").prefetch_related("servicios", "horarios")
