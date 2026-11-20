import pytest
from django.db import IntegrityError

from apps.cuentas.models import Rol, Usuario
from apps.cuentas.permisos import PERMISOS_POR_ROL


def test_roles_sembrados_con_sus_permisos(db):
    assert set(Rol.objects.values_list("nombre", flat=True)) == {"admin", "dentista"}
    dentista = Rol.objects.get(nombre="dentista")
    codigos = {rp.permiso.codigo for rp in dentista.rolpermiso_set.all()}
    assert codigos == PERMISOS_POR_ROL["dentista"]
    admin = Rol.objects.get(nombre="admin")
    assert {rp.permiso.codigo for rp in admin.rolpermiso_set.all()} == PERMISOS_POR_ROL["admin"]


def test_crear_usuario_normaliza_email_y_nace_inactivo(db):
    u = Usuario.objects.crear_usuario(" Ana@Clinica.TEST ", "Ana", "Mora", "dentista")
    assert u.email == "ana@clinica.test"
    assert u.is_active is False
    assert not u.has_usable_password()


def test_email_unico(db):
    Usuario.objects.crear_usuario("dup@x.test", "A", "B", "dentista")
    with pytest.raises(IntegrityError):
        Usuario.objects.crear_usuario("DUP@x.test", "C", "D", "dentista")


def test_tiene_permiso_por_rol(db):
    d = Usuario.objects.crear_usuario("d@x.test", "D", "X", "dentista")
    assert d.tiene_permiso("citas.ver_propias")
    assert not d.tiene_permiso("reportes.ver")
    assert not d.es_admin


def test_create_superuser_es_admin_activo(db):
    a = Usuario.objects.create_superuser("a@x.test", "clave-Segura-123", nombre="A", apellidos="B")
    assert a.es_admin
    assert a.is_active
    assert a.check_password("clave-Segura-123")
    assert a.tiene_permiso("reportes.ver")
