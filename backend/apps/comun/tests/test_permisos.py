from rest_framework.response import Response
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.views import APIView

from apps.comun.permisos import tiene_permiso
from apps.cuentas.models import Usuario


class VistaReportes(APIView):
    permission_classes = [tiene_permiso("reportes.ver")]

    def get(self, request):
        return Response({"ok": True})


def _get(usuario=None):
    request = APIRequestFactory().get("/x/")
    if usuario:
        force_authenticate(request, user=usuario)
    return VistaReportes.as_view()(request)


def test_permiso_niega_a_anonimo(db):
    assert _get().status_code == 403


def test_permiso_niega_sin_codigo(db):
    d = Usuario.objects.crear_usuario("d@x.test", "D", "X", "dentista", activo=True)
    assert _get(d).status_code == 403


def test_permiso_permite_con_codigo(db):
    a = Usuario.objects.crear_usuario("a@x.test", "A", "X", "admin", activo=True)
    assert _get(a).status_code == 200
