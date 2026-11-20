from django.urls import path

from .views import REPORTES, vista

urlpatterns = [
    path(f"{nombre}/", vista(f), name=f"reporte-{nombre}") for nombre, f in REPORTES.items()
]
