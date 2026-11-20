"""Cómo se elige dentista cuando el paciente reserva con «cualquiera» (abierto a extensión)."""

from datetime import date, datetime, time, timedelta
from typing import Protocol

from django.db.models import Count, Q
from django.utils import timezone

from apps.clinica.models import Dentista

from .models import EstadoCita


class EstrategiaAsignacion(Protocol):
    def elegir(self, candidatos: list[Dentista], dia: date) -> Dentista: ...


class MenosCitasDelDia:
    """El dentista con menos citas no canceladas ese día; si empatan, el de menor id."""

    def elegir(self, candidatos: list[Dentista], dia: date) -> Dentista:
        zona = timezone.get_current_timezone()
        ini = datetime.combine(dia, time.min, tzinfo=zona)
        fin = ini + timedelta(days=1)
        conteos = dict(
            Dentista.objects.filter(pk__in=[d.pk for d in candidatos])
            .annotate(
                n=Count(
                    "citas",
                    filter=Q(citas__inicio__gte=ini, citas__inicio__lt=fin)
                    & ~Q(citas__estado=EstadoCita.CANCELADA),
                )
            )
            .values_list("pk", "n")
        )
        return min(candidatos, key=lambda d: (conteos.get(d.pk, 0), d.pk))
