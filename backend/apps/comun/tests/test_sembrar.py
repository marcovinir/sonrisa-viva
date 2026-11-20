from io import StringIO

from django.contrib.auth import authenticate
from django.core.management import call_command

from apps.citas.models import Cita, EstadoCita, Paciente
from apps.clinica.models import CategoriaServicio, Dentista, HorarioSemanal, Servicio
from apps.cuentas.models import Usuario


def sembrar(*args) -> str:
    salida = StringIO()
    call_command("sembrar", *args, stdout=salida)
    return salida.getvalue()


def test_sembrar_crea_datos(db):
    sembrar()
    assert CategoriaServicio.objects.count() == 5
    assert Servicio.objects.count() == 10
    assert Dentista.objects.count() == 4
    assert 180 <= Cita.objects.count() <= 220
    assert 50 <= Paciente.objects.count() <= 70
    assert authenticate(email="admin@sonrisaviva.test", password="Demo-Sonrisa-2026")
    assert all(s.duracion_min % 15 == 0 for s in Servicio.objects.all())
    assert HorarioSemanal.objects.filter(dia_semana=5).count() == 1


def test_sembrar_reparte_estados_y_las_citas_caen_en_el_horario(db):
    sembrar()
    estados = set(Cita.objects.values_list("estado", flat=True))
    assert estados == {EstadoCita.COMPLETADA, EstadoCita.NO_ASISTIO, EstadoCita.CANCELADA}
    for c in Cita.objects.select_related("dentista", "servicio")[:50]:
        assert c.servicio in c.dentista.servicios.all()
        assert (c.fin - c.inicio).total_seconds() == c.servicio.duracion_min * 60


def test_sembrar_dos_veces_no_duplica(db):
    sembrar()
    citas = Cita.objects.count()
    salida = sembrar()
    assert Cita.objects.count() == citas
    assert Servicio.objects.count() == 10
    assert "ya hay datos" in salida.lower()


def test_sembrar_reiniciar_regenera(db):
    sembrar()
    citas = Cita.objects.count()
    otro_admin = Usuario.objects.crear_usuario("jefa@x.test", "J", "K", "admin", activo=True)
    sembrar("--reiniciar")
    assert Cita.objects.count() == citas
    assert Dentista.objects.count() == 4
    assert Usuario.objects.filter(pk=otro_admin.pk).exists()


def test_sembrar_trae_indicaciones_para_algunos_servicios(db):
    call_command("sembrar", stdout=StringIO())
    con = Servicio.objects.exclude(indicaciones="")
    assert con.count() >= 4
    assert "brackets" in Servicio.objects.get(slug="control-brackets").indicaciones
