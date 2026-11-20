from rest_framework.routers import SimpleRouter

from .views_panel import CitaPanelViewSet

router = SimpleRouter()
router.register("citas", CitaPanelViewSet, basename="panel-citas")

urlpatterns = router.urls
