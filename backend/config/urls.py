from django.urls import include, path

urlpatterns = [
    path("api/v1/", include("apps.comun.urls")),
    path("api/v1/auth/", include("apps.cuentas.urls")),
    path("api/v1/", include("apps.clinica.urls")),
    path("api/v1/", include("apps.citas.urls")),
    path("api/v1/panel/", include("apps.cuentas.urls_panel")),
    path("api/v1/panel/", include("apps.citas.urls_panel")),
    path("api/v1/panel/reportes/", include("apps.reportes.urls")),
]
