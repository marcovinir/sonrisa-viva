from django.urls import include, path

urlpatterns = [
    path("api/v1/", include("apps.comun.urls")),
    path("api/v1/auth/", include("apps.cuentas.urls")),
]
