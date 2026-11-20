from datetime import date, timedelta

from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.citas import reglas
from apps.comun.permisos import tiene_permiso
from apps.cuentas.permisos import REPORTES_VER

from . import selectors


def _por_defecto_desde() -> date:
    """El primer día del mes de hace 5 meses (seis meses contando el actual)."""
    inicio = reglas.hoy().replace(day=1)
    for _ in range(5):
        inicio = (inicio - timedelta(days=1)).replace(day=1)
    return inicio


class RangoSerializer(serializers.Serializer):
    desde = serializers.DateField(required=False)
    hasta = serializers.DateField(required=False)

    def validate(self, datos):
        datos.setdefault("desde", _por_defecto_desde())
        datos.setdefault("hasta", reglas.hoy())
        if datos["desde"] > datos["hasta"]:
            raise serializers.ValidationError({"desde": ["Debe ser anterior a «hasta»."]})
        return datos


class ReporteView(APIView):
    permission_classes = [tiene_permiso(REPORTES_VER)]
    reporte = None  # función del selector: (desde, hasta) -> list | dict

    def get(self, request):
        rango = RangoSerializer(data=request.query_params)
        rango.is_valid(raise_exception=True)
        return Response(self.reporte(rango.validated_data["desde"], rango.validated_data["hasta"]))


def vista(funcion):
    # as_view() guarda `reporte` en la instancia: ahí la función no se liga como método.
    return ReporteView.as_view(reporte=funcion)


REPORTES = {
    "citas-por-servicio": selectors.citas_por_servicio,
    "citas-por-categoria": selectors.citas_por_categoria,
    "citas-por-dentista": selectors.citas_por_dentista,
    "citas-por-mes": selectors.citas_por_mes,
    "tasa-asistencia": selectors.tasa_asistencia,
}
