"""Cálculo de horas libres: funciones puras sobre intervalos (sin base de datos)."""

from datetime import datetime, timedelta

Intervalo = tuple[datetime, datetime]


def techo_a_paso(dt: datetime, paso: timedelta) -> datetime:
    """Redondea `dt` hacia arriba al siguiente múltiplo de `paso` dentro de su hora local."""
    base = dt.replace(minute=0, second=0, microsecond=0)
    pasos = -(-(dt - base) // paso)  # división entera hacia arriba
    return base + pasos * paso


def horas_libres(
    bloques: list[Intervalo],
    ocupados: list[Intervalo],
    duracion: timedelta,
    desde: datetime,
    hasta: datetime,
    paso: timedelta,
) -> list[datetime]:
    """Inicios posibles (en la rejilla de `paso`) donde una cita de `duracion` cabe entera
    dentro de un bloque, después de `desde`, antes de `hasta` y sin cruzar ningún ocupado."""
    candidatos: list[datetime] = []
    inicio_minimo = techo_a_paso(desde, paso)
    for b_ini, b_fin in sorted(bloques):
        t = max(b_ini, inicio_minimo)
        limite = min(b_fin, hasta)
        while t + duracion <= limite:
            fin = t + duracion
            if not any(t < o_fin and o_ini < fin for o_ini, o_fin in ocupados):
                candidatos.append(t)
            t += paso
    return candidatos
