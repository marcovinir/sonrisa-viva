from django.urls import path
from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("panel/categorias", views.CategoriaPanelViewSet, basename="panel-categorias")
router.register("panel/servicios", views.ServicioPanelViewSet, basename="panel-servicios")
router.register("panel/dentistas", views.DentistaPanelViewSet, basename="panel-dentistas")

urlpatterns = [
    path("servicios/", views.ServiciosPublicosView.as_view(), name="servicios-publicos"),
    path("categorias/", views.CategoriasPublicasView.as_view(), name="categorias-publicas"),
    path("dentistas/", views.DentistasPublicosView.as_view(), name="dentistas-publicos"),
    path("panel/mi-perfil/", views.MiPerfilView.as_view(), name="panel-mi-perfil"),
    *router.urls,
]
