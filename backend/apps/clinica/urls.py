from django.urls import path
from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("panel/categorias", views.CategoriaPanelViewSet, basename="panel-categorias")
router.register("panel/servicios", views.ServicioPanelViewSet, basename="panel-servicios")

urlpatterns = [
    path("servicios/", views.ServiciosPublicosView.as_view(), name="servicios-publicos"),
    path("categorias/", views.CategoriasPublicasView.as_view(), name="categorias-publicas"),
    *router.urls,
]
