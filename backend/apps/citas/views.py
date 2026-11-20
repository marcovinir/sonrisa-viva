from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.clinica.models import Dentista, Servicio

from . import selectors, services
from .serializers import (
    ConsultaDiasSerializer,
    ConsultaDisponibilidadSerializer,
    HoraLibreSerializer,
    ReservaSerializer,
    ResumenCitaSerializer,
)


class PublicoMixin:
    permission_classes = [AllowAny]
    throttle_scope = "publico"


def _servicio_y_dentista(datos) -> tuple[Servicio, Dentista | None, bool]:
    """Devuelve el servicio (404 si no está activo), el dentista pedido y si existe."""
    servicio = get_object_or_404(Servicio, pk=datos["servicio"], activo=True)
    if "dentista" not in datos:
        return servicio, None, True
    dentista = Dentista.objects.filter(pk=datos["dentista"]).first()
    return servicio, dentista, dentista is not None


class DisponibilidadView(PublicoMixin, APIView):
    def get(self, request):
        consulta = ConsultaDisponibilidadSerializer(data=request.query_params)
        consulta.is_valid(raise_exception=True)
        datos = consulta.validated_data
        servicio, dentista, existe = _servicio_y_dentista(datos)
        horas = selectors.disponibilidad(servicio, datos["fecha"], dentista) if existe else []
        return Response(
            {
                "fecha": datos["fecha"].isoformat(),
                "horas": HoraLibreSerializer(horas, many=True).data,
            }
        )


class ReservaView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "reservas"

    def post(self, request):
        pedido = ReservaSerializer(data=request.data)
        pedido.is_valid(raise_exception=True)
        datos = pedido.validated_data
        cita, _token = services.reservar(
            servicio_id=datos["servicio"],
            inicio=datos["inicio"],
            paciente=datos["paciente"],
            dentista_id=datos.get("dentista"),
        )
        return Response(ResumenCitaSerializer(cita).data, status=status.HTTP_201_CREATED)


class DiasDisponiblesView(PublicoMixin, APIView):
    def get(self, request):
        consulta = ConsultaDiasSerializer(data=request.query_params)
        consulta.is_valid(raise_exception=True)
        datos = consulta.validated_data
        servicio, dentista, existe = _servicio_y_dentista(datos)
        dias = (
            selectors.dias_con_disponibilidad(servicio, datos["desde"], datos["hasta"], dentista)
            if existe
            else []
        )
        return Response({"dias": [d.isoformat() for d in dias]})
