from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny

from apps.comun.permisos import tiene_permiso
from apps.cuentas.permisos import CATALOGO_GESTIONAR

from . import selectors, services
from .models import CategoriaServicio, Servicio
from .serializers import CategoriaSerializer, ServicioPanelSerializer, ServicioPublicoSerializer

# --- Público -------------------------------------------------------------------------


class ServiciosPublicosView(generics.ListAPIView):
    permission_classes = [AllowAny]
    throttle_scope = "publico"
    pagination_class = None
    serializer_class = ServicioPublicoSerializer

    def get_queryset(self):
        return selectors.servicios_publicos()


class CategoriasPublicasView(generics.ListAPIView):
    permission_classes = [AllowAny]
    throttle_scope = "publico"
    pagination_class = None
    serializer_class = CategoriaSerializer

    def get_queryset(self):
        return selectors.categorias_publicas()


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
