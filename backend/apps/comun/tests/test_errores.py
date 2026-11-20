from django.http import Http404
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView


class CorreoSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VistaValida(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        CorreoSerializer(data=request.data).is_valid(raise_exception=True)


class VistaNoExiste(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        raise Http404


def test_error_validacion_tiene_forma_estandar():
    r = VistaValida.as_view()(APIRequestFactory().post("/x/", {"email": "no"}, format="json"))
    assert r.status_code == 400
    assert r.data["detalle"] == "Revisa los datos marcados."
    assert list(r.data["campos"]) == ["email"]
    assert isinstance(r.data["campos"]["email"][0], str)


def test_error_404_tiene_forma_estandar():
    r = VistaNoExiste.as_view()(APIRequestFactory().get("/x/"))
    assert r.status_code == 404
    assert set(r.data) == {"detalle", "campos"}
    assert r.data["campos"] == {}
    assert r.data["detalle"]
