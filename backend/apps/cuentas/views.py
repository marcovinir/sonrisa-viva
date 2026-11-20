from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .managers import normalizar_email
from .serializers import LoginSerializer, UsuarioYoSerializer

MENSAJE_LOGIN_INVALIDO = "Correo o contraseña incorrectos."


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    """Entrega la cookie csrftoken que el frontend reenvía en X-CSRFToken."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    # DRF solo exige CSRF a usuarios ya autenticados; el login lo exige siempre.
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        datos = LoginSerializer(data=request.data)
        datos.is_valid(raise_exception=True)
        usuario = authenticate(
            request,
            email=normalizar_email(datos.validated_data["email"]),
            password=datos.validated_data["password"],
        )
        if usuario is None:
            raise ValidationError({"non_field_errors": [MENSAJE_LOGIN_INVALIDO]})
        login(request, usuario)
        return Response(UsuarioYoSerializer(usuario).data)


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class YoView(APIView):
    def get(self, request):
        return Response(UsuarioYoSerializer(request.user).data)
