from django.http import Http404
from django.utils.dateparse import parse_date
from rest_framework import generics, mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.comun.permisos import MENSAJE_SIN_PERMISO, tiene_alguno, tiene_permiso
from apps.cuentas.permisos import BLOQUEOS_PROPIOS, CATALOGO_GESTIONAR, DENTISTAS_GESTIONAR

from . import selectors, services
from .models import Bloqueo, CategoriaServicio, Dentista, Servicio
from .serializers import (
    BloqueoSerializer,
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


class BloqueoPanelViewSet(viewsets.ModelViewSet):
    """El admin gestiona los bloqueos de todos; cada dentista, solo los suyos."""

    permission_classes = [tiene_alguno(DENTISTAS_GESTIONAR, BLOQUEOS_PROPIOS)]
    serializer_class = BloqueoSerializer

    def _gestiona_todos(self) -> bool:
        return self.request.user.tiene_permiso(DENTISTAS_GESTIONAR)

    def _mi_dentista(self) -> Dentista:
        perfil = Dentista.objects.filter(usuario=self.request.user).first()
        if perfil is None:
            raise PermissionDenied(MENSAJE_SIN_PERMISO)
        return perfil

    def get_queryset(self):
        qs = Bloqueo.objects.select_related("dentista")
        params = self.request.query_params
        if self._gestiona_todos():
            if dentista := params.get("dentista"):
                qs = qs.filter(dentista_id=dentista)
        else:
            qs = qs.filter(dentista__usuario=self.request.user)
        if desde := parse_date(params.get("desde") or ""):
            qs = qs.filter(fin__date__gte=desde)
        if hasta := parse_date(params.get("hasta") or ""):
            qs = qs.filter(inicio__date__lte=hasta)
        return qs

    def _guardar(self, serializer, bloqueo=None):
        datos = serializer.validated_data
        if self._gestiona_todos():
            dentista = datos.get("dentista") or getattr(bloqueo, "dentista", None)
            if dentista is None:
                raise ValidationError({"dentista": ["Este campo es requerido."]})
        else:
            dentista = self._mi_dentista()
        serializer.instance = services.guardar_bloqueo(
            dentista,
            datos.get("inicio", getattr(bloqueo, "inicio", None)),
            datos.get("fin", getattr(bloqueo, "fin", None)),
            datos.get("motivo", getattr(bloqueo, "motivo", "")),
            bloqueo=bloqueo,
        )

    def perform_create(self, serializer):
        self._guardar(serializer)

    def perform_update(self, serializer):
        self._guardar(serializer, bloqueo=serializer.instance)


class MiPerfilView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DentistaPanelSerializer

    def get_object(self):
        try:
            return selectors.dentistas_panel().get(usuario=self.request.user)
        except Dentista.DoesNotExist:
            raise Http404 from None
