"""Reglas de negocio de la clínica (catálogo, dentistas, horarios y bloqueos)."""

from datetime import time

from django.db import transaction
from django.db.models import ProtectedError
from django.utils.text import slugify
from rest_framework.exceptions import ValidationError

from apps.comun.errores import Conflicto

from .models import CategoriaServicio, Dentista, HorarioSemanal, Servicio

EN_USO_SERVICIO = "No se puede borrar porque tiene citas asociadas; desactívalo en su lugar."
EN_USO_CATEGORIA = (
    "No se puede borrar porque tiene servicios asociados; muévelos a otra categoría primero."
)
DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]


# --- Catálogo ------------------------------------------------------------------------


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


# --- Horario semanal -----------------------------------------------------------------


def _en_rejilla(t: time) -> bool:
    return t.second == 0 and t.microsecond == 0 and t.minute % 15 == 0


@transaction.atomic
def reemplazar_horario(dentista: Dentista, bloques: list[dict]) -> list[HorarioSemanal]:
    """Reemplaza el horario semanal completo del dentista, validándolo antes."""
    errores: list[str] = []
    por_dia: dict[int, list[tuple[time, time]]] = {}
    for b in bloques:
        ini, fin = b["hora_inicio"], b["hora_fin"]
        if not (_en_rejilla(ini) and _en_rejilla(fin)):
            errores.append("Las horas deben ir en múltiplos de 15 minutos.")
        if ini >= fin:
            errores.append("La hora de inicio debe ser anterior a la de fin.")
        por_dia.setdefault(b["dia_semana"], []).append((ini, fin))
    for dia, rangos in sorted(por_dia.items()):
        rangos.sort()
        if any(fin_a > ini_b for (_, fin_a), (ini_b, _) in zip(rangos, rangos[1:], strict=False)):
            errores.append(f"Los bloques del {DIAS[dia]} se traslapan.")
    if errores:
        raise ValidationError({"horarios": list(dict.fromkeys(errores))})
    dentista.horarios.all().delete()
    ordenados = sorted(bloques, key=lambda b: (b["dia_semana"], b["hora_inicio"]))
    return HorarioSemanal.objects.bulk_create(
        HorarioSemanal(dentista=dentista, **b) for b in ordenados
    )
