"""Reglas de negocio de la clínica (catálogo, dentistas, horarios y bloqueos)."""

from datetime import time

from django.db import transaction
from django.db.models import ProtectedError
from django.utils.text import slugify
from rest_framework.exceptions import ValidationError

from apps.comun.errores import Conflicto

from .models import Bloqueo, CategoriaServicio, Dentista, HorarioSemanal, Servicio

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


def bloquear_agenda(dentista_id: int) -> None:
    """Toma la agenda del dentista hasta que termine la transacción (SELECT … FOR UPDATE).

    Las operaciones que comparan citas con bloqueos (reservar, reprogramar, guardar un bloqueo)
    pasan por aquí: la segunda en llegar espera a que la primera confirme y entonces la ve.
    Dos citas entre sí ya las protege la restricción `cita_sin_traslape` de PostgreSQL.
    """
    list(Dentista.objects.select_for_update().filter(pk=dentista_id).only("pk"))


def hay_bloqueo(dentista_id: int, inicio, fin) -> bool:
    return Bloqueo.objects.filter(dentista_id=dentista_id, inicio__lt=fin, fin__gt=inicio).exists()


BLOQUEO_CON_CITAS = "Hay {n} citas confirmadas en ese rango; cancélalas o reprográmalas primero."
BLOQUEO_CON_UNA_CITA = "Hay 1 cita confirmada en ese rango; cancélala o reprográmala primero."


@transaction.atomic
def guardar_bloqueo(
    dentista: Dentista, inicio, fin, motivo: str = "", bloqueo: Bloqueo | None = None
) -> Bloqueo:
    """Crea o actualiza un bloqueo si no deja citas confirmadas dentro."""
    from apps.citas.models import Cita, EstadoCita

    if inicio >= fin:
        raise ValidationError({"fin": ["El fin debe ser posterior al inicio."]})
    bloquear_agenda(dentista.pk)  # una reserva en curso termina antes de contar sus citas
    n = Cita.objects.filter(
        dentista=dentista, estado=EstadoCita.CONFIRMADA, inicio__lt=fin, fin__gt=inicio
    ).count()
    if n:
        raise Conflicto(BLOQUEO_CON_UNA_CITA if n == 1 else BLOQUEO_CON_CITAS.format(n=n))
    bloqueo = bloqueo or Bloqueo(dentista=dentista)
    bloqueo.dentista, bloqueo.inicio, bloqueo.fin, bloqueo.motivo = dentista, inicio, fin, motivo
    bloqueo.save()
    return bloqueo


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
