"""Consultas de citas y disponibilidad."""

from collections import defaultdict
from datetime import date, datetime, time, timedelta
from typing import TypedDict

from django.db.models import Q, QuerySet
from django.utils import timezone
from django.utils.dateparse import parse_date

from apps.clinica.models import Bloqueo, Dentista, HorarioSemanal, Servicio
from apps.cuentas.permisos import CITAS_VER_TODAS

from . import reglas
from .disponibilidad import Intervalo, horas_libres
from .models import Cita, EstadoCita


class HoraLibre(TypedDict):
    inicio: datetime
    fin: datetime
    dentistas: list[int]


def candidatos(servicio: Servicio, dentista: Dentista | None = None):
    """Dentistas que pueden atender el servicio y se muestran en la web."""
    qs = Dentista.objects.filter(
        servicios=servicio, visible_en_web=True, usuario__is_active=True
    ).distinct()
    if dentista is not None:
        qs = qs.filter(pk=dentista.pk)
    return list(qs)


def _limites() -> tuple[datetime, datetime, date, date]:
    zona = timezone.get_current_timezone()
    hoy = reglas.hoy()
    ultimo = hoy + timedelta(days=reglas.ANTICIPACION_MAX_DIAS)
    desde = reglas.ahora() + reglas.ANTICIPACION_MIN
    hasta = datetime.combine(ultimo + timedelta(days=1), time.min, tzinfo=zona)
    return desde, hasta, hoy, ultimo


def _calcular(
    servicio: Servicio,
    dias: list[date],
    dentista: Dentista | None = None,
    excluir_cita: Cita | None = None,
    duracion: timedelta | None = None,
) -> dict[date, list[HoraLibre]]:
    """Horas libres de varios días con una consulta por tabla (no una por dentista o día)."""
    resultado: dict[date, list[HoraLibre]] = {d: [] for d in dias}
    desde, hasta, hoy, ultimo = _limites()
    dias = [d for d in dias if hoy <= d <= ultimo]
    dentistas = candidatos(servicio, dentista)
    if not dias or not dentistas or not servicio.activo:
        return resultado

    zona = timezone.get_current_timezone()
    rango_ini = datetime.combine(min(dias), time.min, tzinfo=zona)
    rango_fin = datetime.combine(max(dias) + timedelta(days=1), time.min, tzinfo=zona)
    ids = [d.pk for d in dentistas]

    horarios: dict[tuple[int, int], list[tuple[time, time]]] = defaultdict(list)
    for h in HorarioSemanal.objects.filter(dentista_id__in=ids):
        horarios[(h.dentista_id, h.dia_semana)].append((h.hora_inicio, h.hora_fin))

    ocupados: dict[int, list[Intervalo]] = defaultdict(list)
    citas = Cita.objects.filter(
        dentista_id__in=ids, inicio__lt=rango_fin, fin__gt=rango_ini
    ).exclude(estado=EstadoCita.CANCELADA)
    if excluir_cita is not None:
        citas = citas.exclude(pk=excluir_cita.pk)
    for c in citas.only("dentista_id", "inicio", "fin"):
        ocupados[c.dentista_id].append((c.inicio, c.fin))
    for b in Bloqueo.objects.filter(dentista_id__in=ids, inicio__lt=rango_fin, fin__gt=rango_ini):
        ocupados[b.dentista_id].append((b.inicio, b.fin))

    # Al reprogramar se usa la duración de la cita, que puede ser distinta a la actual.
    duracion = duracion or timedelta(minutes=servicio.duracion_min)
    for dia in dias:
        libres: dict[datetime, list[int]] = defaultdict(list)
        for pk in sorted(ids):
            bloques = [
                (datetime.combine(dia, ini, tzinfo=zona), datetime.combine(dia, fin, tzinfo=zona))
                for ini, fin in horarios.get((pk, dia.weekday()), [])
            ]
            for inicio in horas_libres(bloques, ocupados[pk], duracion, desde, hasta, reglas.PASO):
                libres[inicio].append(pk)
        resultado[dia] = [
            {"inicio": t, "fin": t + duracion, "dentistas": libres[t]} for t in sorted(libres)
        ]
    return resultado


def disponibilidad(
    servicio: Servicio,
    fecha: date,
    dentista: Dentista | None = None,
    excluir_cita: Cita | None = None,
    duracion: timedelta | None = None,
) -> list[HoraLibre]:
    return _calcular(servicio, [fecha], dentista, excluir_cita, duracion)[fecha]


def dias_con_disponibilidad(
    servicio: Servicio, desde: date, hasta: date, dentista: Dentista | None = None
) -> list[date]:
    _, _, hoy, ultimo = _limites()
    desde, hasta = max(desde, hoy), min(hasta, ultimo)
    if desde > hasta:
        return []
    dias = [desde + timedelta(days=n) for n in range((hasta - desde).days + 1)]
    return [d for d, horas in _calcular(servicio, dias, dentista).items() if horas]


def citas_panel(usuario, filtros) -> QuerySet[Cita]:
    """Citas que ve el usuario en el panel: todas (admin) o solo las suyas (dentista)."""
    qs = Cita.objects.select_related("paciente", "dentista__usuario", "servicio").order_by("inicio")
    if not usuario.tiene_permiso(CITAS_VER_TODAS):
        qs = qs.filter(dentista__usuario=usuario)
    zona = timezone.get_current_timezone()
    if desde := _fecha(filtros.get("desde")):
        qs = qs.filter(inicio__gte=datetime.combine(desde, time.min, tzinfo=zona))
    if hasta := _fecha(filtros.get("hasta")):
        qs = qs.filter(
            inicio__lt=datetime.combine(hasta + timedelta(days=1), time.min, tzinfo=zona)
        )
    for campo in ("dentista", "servicio"):
        if (valor := filtros.get(campo) or "").isdigit():
            qs = qs.filter(**{f"{campo}_id": int(valor)})
    if estado := filtros.get("estado"):
        qs = qs.filter(estado=estado)
    if q := (filtros.get("q") or "").strip():
        qs = qs.filter(
            Q(paciente__nombre__icontains=q)
            | Q(paciente__apellidos__icontains=q)
            | Q(paciente__email__icontains=q)
        )
    if filtros.get("orden") == "-inicio":  # la lista del panel: más recientes primero
        qs = qs.order_by("-inicio")
    return qs


def _fecha(valor):
    try:
        return parse_date(valor or "")
    except ValueError:
        return None
