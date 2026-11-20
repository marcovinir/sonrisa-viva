from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.comun.permisos import tiene_permiso

from . import selectors, services
from .permisos import USUARIOS_GESTIONAR
from .serializers import CrearUsuarioPanelSerializer, UsuarioPanelSerializer


class UsuarioPanelViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [tiene_permiso(USUARIOS_GESTIONAR)]
    serializer_class = UsuarioPanelSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return selectors.usuarios_panel(self.request.query_params)

    def create(self, request):
        datos = CrearUsuarioPanelSerializer(data=request.data)
        datos.is_valid(raise_exception=True)
        usuario = services.crear_usuario_panel(**datos.validated_data)
        return Response(UsuarioPanelSerializer(usuario).data, status=status.HTTP_201_CREATED)

    def _responder(self, usuario):
        usuario.refresh_from_db()
        return Response(UsuarioPanelSerializer(usuario).data)

    @action(detail=True, methods=["post"])
    def desactivar(self, request, pk=None):
        return self._responder(services.desactivar_usuario(self.get_object(), request.user))

    @action(detail=True, methods=["post"])
    def reactivar(self, request, pk=None):
        return self._responder(services.reactivar_usuario(self.get_object()))

    @action(detail=True, methods=["post"], url_path="reenviar-activacion")
    def reenviar_activacion(self, request, pk=None):
        usuario = self.get_object()
        services.reenviar_activacion(usuario)
        return self._responder(usuario)
