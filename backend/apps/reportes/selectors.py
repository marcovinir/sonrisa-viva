"""Reportes agregados del panel: una consulta por reporte, con agregaciones del ORM."""

from datetime import date, datetime, time, timedelta

from django.db.models import Count, Q, QuerySet, Sum
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone

from apps.citas.models import Cita, EstadoCita

NO_CANCELADA = ~Q(estado=EstadoCita.CANCELADA)
COMPLETADA = Q(estado=EstadoCita.COMPLETADA)


def _citas(desde: date, hasta: date) -> QuerySet[Cita]:
    zona = timezone.get_current_timezone()
    return Cita.objects.filter(
        inicio__gte=datetime.combine(desde, time.min, tzinfo=zona),
        inicio__lt=datetime.combine(hasta + timedelta(days=1), time.min, tzinfo=zona),
    )


def _metricas(**extra) -> dict:
    return {
        "total": Count("id", filter=NO_CANCELADA),
        "completadas": Count("id", filter=COMPLETADA),
        "ingresos_colones": Coalesce(Sum("precio_colones", filter=COMPLETADA), 0),
        **extra,
    }


def citas_por_servicio(desde: date, hasta: date) -> list[dict]:
    filas = (
        _citas(desde, hasta)
        .values("servicio_id", "servicio__nombre")
        .annotate(**_metricas())
        .filter(total__gt=0)
        .order_by("-total", "servicio__nombre")
    )
    return [
        {"id": f["servicio_id"], "nombre": f["servicio__nombre"], "total": f["total"],
         "completadas": f["completadas"], "ingresos_colones": f["ingresos_colones"]}
        for f in filas
    ]  # fmt: skip


def citas_por_categoria(desde: date, hasta: date) -> list[dict]:
    filas = (
        _citas(desde, hasta)
        .values("servicio__categoria_id", "servicio__categoria__nombre")
        .annotate(**_metricas())
        .filter(total__gt=0)
        .order_by("-total", "servicio__categoria__nombre")
    )
    return [
        {"id": f["servicio__categoria_id"], "nombre": f["servicio__categoria__nombre"],
         "total": f["total"], "completadas": f["completadas"],
         "ingresos_colones": f["ingresos_colones"]}
        for f in filas
    ]  # fmt: skip


def citas_por_dentista(desde: date, hasta: date) -> list[dict]:
    filas = (
        _citas(desde, hasta)
        .values("dentista_id", "dentista__usuario__nombre", "dentista__usuario__apellidos")
        .annotate(**_metricas(no_asistio=Count("id", filter=Q(estado=EstadoCita.NO_ASISTIO))))
        .filter(total__gt=0)
        .order_by("-total", "dentista__usuario__nombre")
    )
    return [
        {"id": f["dentista_id"], "nombre": f["dentista__usuario__nombre"],
         "apellidos": f["dentista__usuario__apellidos"], "total": f["total"],
         "completadas": f["completadas"], "no_asistio": f["no_asistio"],
         "ingresos_colones": f["ingresos_colones"]}
        for f in filas
    ]  # fmt: skip


def _meses(desde: date, hasta: date) -> list[str]:
    meses, actual = [], desde.replace(day=1)
    while actual <= hasta:
        meses.append(f"{actual:%Y-%m}")
        actual = (actual + timedelta(days=32)).replace(day=1)
    return meses


def citas_por_mes(desde: date, hasta: date) -> list[dict]:
    zona = timezone.get_current_timezone()
    filas = (
        _citas(desde, hasta)
        .annotate(mes=TruncMonth("inicio", tzinfo=zona))
        .values("mes")
        .annotate(
            total=Count("id", filter=NO_CANCELADA),
            completadas=Count("id", filter=COMPLETADA),
            canceladas=Count("id", filter=Q(estado=EstadoCita.CANCELADA)),
            no_asistio=Count("id", filter=Q(estado=EstadoCita.NO_ASISTIO)),
        )
    )
    por_mes = {f"{timezone.localtime(f['mes']):%Y-%m}": f for f in filas}
    campos = ("total", "completadas", "canceladas", "no_asistio")
    return [
        {"mes": mes, **{c: por_mes[mes][c] if mes in por_mes else 0 for c in campos}}
        for mes in _meses(desde, hasta)
    ]


def tasa_asistencia(desde: date, hasta: date) -> dict:
    datos = _citas(desde, hasta).aggregate(
        completadas=Count("id", filter=COMPLETADA),
        no_asistio=Count("id", filter=Q(estado=EstadoCita.NO_ASISTIO)),
    )
    atendibles = datos["completadas"] + datos["no_asistio"]
    tasa = round(datos["completadas"] / atendibles, 3) if atendibles else None
    return {**datos, "tasa": tasa}
