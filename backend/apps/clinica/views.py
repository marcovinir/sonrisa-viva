from django.http import Http404
from rest_framework import generics, mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.comun.permisos import tiene_permiso
from apps.cuentas.permisos import CATALOGO_GESTIONAR, DENTISTAS_GESTIONAR

from . import selectors, services
from .models import CategoriaServicio, Dentista, Servicio
from .serializers import (
    CategoriaSerializer,
    DentistaPanelSerializer,
    DentistaPublicoSerializer,
    HorarioSerializer,
    ServicioPanelSerializer,
    ServicioPublicoSerializer,
)

# --- Público -------------------------------------------------------------------------


class PublicoMixin:
    permission_classes = [AllowAny]
    throttle_scope = "publico"
    pagination_class = None


class ServiciosPublicosView(PublicoMixin, generics.ListAPIView):
    serializer_class = ServicioPublicoSerializer

    def get_queryset(self):
        return selectors.servicios_publicos()


class CategoriasPublicasView(PublicoMixin, generics.ListAPIView):
    serializer_class = CategoriaSerializer

    def get_queryset(self):
        return selectors.categorias_publicas()


class DentistasPublicosView(PublicoMixin, generics.ListAPIView):
    serializer_class = DentistaPublicoSerializer

    def get_queryset(self):
        servicio = self.request.query_params.get("servicio") or ""
        return selectors.dentistas_publicos(int(servicio) if servicio.isdigit() else None)


# --- Panel ---------------------------------------------------------------------------


class BorradoProtegidoMixin:
    def perform_destroy(self, instance):
        services.borrar(instance)


class CategoriaPanelViewSet(BorradoProtegidoMixin, viewsets.ModelViewSet):
    permission_classes = [tiene_permiso(CATALOGO_GESTIONAR)]
    serializer_class = CategoriaSerializer
    queryset = CategoriaServicio.objects.all()


class ServicioPanelViewSet(BorradoProtegidoMixin, viewsets.ModelViewSet):
    permission_classes = [tiene_permiso(CATALOGO_GESTIONAR)]
    serializer_class = ServicioPanelSerializer

    def get_queryset(self):
        qs = Servicio.objects.select_related("categoria")
        if categoria := self.request.query_params.get("categoria"):
            qs = qs.filter(categoria_id=categoria)
        if (activo := self.request.query_params.get("activo")) in ("true", "false"):
            qs = qs.filter(activo=activo == "true")
        return qs

    def perform_create(self, serializer):
        serializer.instance = services.crear_servicio(serializer.validated_data)


class DentistaPanelViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Los dentistas nacen al crear su usuario: aquí solo se listan y se editan."""

    permission_classes = [tiene_permiso(DENTISTAS_GESTIONAR)]
    serializer_class = DentistaPanelSerializer
    http_method_names = ["get", "patch", "put", "head", "options"]

    def get_queryset(self):
        return selectors.dentistas_panel()

    def update(self, request, *args, **kwargs):
        if not kwargs.get("partial"):
            return self.http_method_not_allowed(request, *args, **kwargs)
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=["put"])
    def horarios(self, request, pk=None):
        dentista = self.get_object()
        bloques = HorarioSerializer(data=request.data, many=True)
        bloques.is_valid(raise_exception=True)
        creados = services.reemplazar_horario(dentista, bloques.validated_data)
        return Response(HorarioSerializer(creados, many=True).data)


class MiPerfilView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DentistaPanelSerializer

    def get_object(self):
        try:
            return selectors.dentistas_panel().get(usuario=self.request.user)
        except Dentista.DoesNotExist:
            raise Http404 from None
