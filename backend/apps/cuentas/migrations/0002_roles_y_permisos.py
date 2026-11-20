from django.db import migrations

from apps.cuentas.permisos import DESCRIPCIONES_PERMISO, DESCRIPCIONES_ROL, PERMISOS_POR_ROL


def sembrar(apps, schema_editor):
    Rol = apps.get_model("cuentas", "Rol")
    Permiso = apps.get_model("cuentas", "Permiso")
    RolPermiso = apps.get_model("cuentas", "RolPermiso")

    permisos = {}
    for codigo, descripcion in DESCRIPCIONES_PERMISO.items():
        permisos[codigo], _ = Permiso.objects.update_or_create(
            codigo=codigo, defaults={"descripcion": descripcion}
        )
    for nombre, codigos in PERMISOS_POR_ROL.items():
        rol, _ = Rol.objects.update_or_create(
            nombre=nombre, defaults={"descripcion": DESCRIPCIONES_ROL[nombre]}
        )
        for codigo in codigos:
            RolPermiso.objects.get_or_create(rol=rol, permiso=permisos[codigo])


def deshacer(apps, schema_editor):
    apps.get_model("cuentas", "RolPermiso").objects.all().delete()
    apps.get_model("cuentas", "Permiso").objects.all().delete()
    apps.get_model("cuentas", "Rol").objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [("cuentas", "0001_initial")]

    operations = [migrations.RunPython(sembrar, deshacer)]
