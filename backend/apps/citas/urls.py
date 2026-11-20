from django.urls import path

from . import views

urlpatterns = [
    path("citas/", views.ReservaView.as_view(), name="reservar"),
    path("citas/gestion/<str:token>/", views.GestionCitaView.as_view(), name="gestion-cita"),
    path("disponibilidad/", views.DisponibilidadView.as_view(), name="disponibilidad"),
    path("disponibilidad/dias/", views.DiasDisponiblesView.as_view(), name="disponibilidad-dias"),
]
