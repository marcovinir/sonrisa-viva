from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.clinica.models import Dentista, Servicio

from . import selectors, services
from .models import Cita
from .serializers import (
    ConsultaDiasSerializer,
    ConsultaDisponibilidadSerializer,
    HoraLibreSerializer,
    ReprogramarSerializer,
    ReservaSerializer,
    ResumenCitaSerializer,
)
from .tokens import hash_token


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


class GestionCitaView(PublicoMixin, APIView):
    """Ver, reprogramar o cancelar la cita con el enlace del correo (sin cuenta)."""

    def _cita(self, token: str) -> Cita:
        return get_object_or_404(
            Cita.objects.select_related("servicio", "dentista__usuario", "paciente"),
            token_gestion_hash=hash_token(token),
        )

    def _respuesta(self, cita: Cita) -> Response:
        datos = ResumenCitaSerializer(cita).data
        datos["puede_cambiar"] = services.puede_cambiar(cita)
        return Response(datos)

    def get(self, request, token):
        return self._respuesta(self._cita(token))

    def patch(self, request, token):
        pedido = ReprogramarSerializer(data=request.data)
        pedido.is_valid(raise_exception=True)
        cita = services.reprogramar(self._cita(token), pedido.validated_data["inicio"])
        return self._respuesta(cita)

    def delete(self, request, token):
        services.cancelar_por_paciente(self._cita(token))
        return Response(status=status.HTTP_204_NO_CONTENT)


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
