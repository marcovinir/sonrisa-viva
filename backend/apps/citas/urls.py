from django.urls import path

from . import views

urlpatterns = [
    path("disponibilidad/", views.DisponibilidadView.as_view(), name="disponibilidad"),
    path("disponibilidad/dias/", views.DiasDisponiblesView.as_view(), name="disponibilidad-dias"),
]
