from django.urls import path

from . import views

urlpatterns = [
    path("csrf/", views.CsrfView.as_view(), name="auth-csrf"),
    path("login/", views.LoginView.as_view(), name="auth-login"),
    path("logout/", views.LogoutView.as_view(), name="auth-logout"),
    path("yo/", views.YoView.as_view(), name="auth-yo"),
    path("activar/", views.EstablecerContrasenaView.as_view(tipo="activar"), name="auth-activar"),
    path(
        "restablecer/",
        views.EstablecerContrasenaView.as_view(tipo="restablecer"),
        name="auth-restablecer",
    ),
    path("recuperar/", views.RecuperarView.as_view(), name="auth-recuperar"),
]
