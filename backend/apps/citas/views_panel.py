from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.comun.permisos import tiene_alguno
from apps.cuentas.permisos import CITAS_VER_PROPIAS, CITAS_VER_TODAS

from . import selectors, services
from .serializers import CambioEstadoSerializer, CitaPanelSerializer


class CitaPanelViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Agenda del panel. El dentista solo ve las suyas: las ajenas dan 404."""

    permission_classes = [tiene_alguno(CITAS_VER_TODAS, CITAS_VER_PROPIAS)]
    serializer_class = CitaPanelSerializer
    http_method_names = ["get", "patch", "post", "head", "options"]

    def get_queryset(self):
        return selectors.citas_panel(self.request.user, self.request.query_params)

    @action(detail=True, methods=["post"])
    def estado(self, request, pk=None):
        pedido = CambioEstadoSerializer(data=request.data)
        pedido.is_valid(raise_exception=True)
        cita = services.cambiar_estado(
            self.get_object(), pedido.validated_data["estado"], request.user
        )
        return Response(CitaPanelSerializer(cita).data)
