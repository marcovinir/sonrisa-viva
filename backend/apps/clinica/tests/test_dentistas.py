import pytest

from apps.clinica.models import HorarioSemanal, Servicio
from apps.comun.pruebas import cliente_de, crear_admin
from conftest import crear_dentista


@pytest.fixture
def admin(db):
    return cliente_de(crear_admin())


@pytest.fixture
def con_servicio(dentista, servicio):
    dentista.servicios.add(servicio)
    return dentista


def test_publico_oculta_dentista_inactivo_o_no_visible(con_servicio):
    oculto = crear_dentista("oculto@x.test")
    oculto.visible_en_web = False
    oculto.save()
    inactivo = crear_dentista("inactivo@x.test")
    inactivo.usuario.is_active = False
    inactivo.usuario.save()
    r = cliente_de().get("/api/v1/dentistas/")
    assert r.status_code == 200
    assert [d["id"] for d in r.json()] == [con_servicio.id]
    assert set(r.json()[0]) == {
        "id",
        "nombre",
        "apellidos",
        "especialidad",
        "biografia",
        "foto_url",
        "servicios",
    }


def test_publico_filtra_por_servicio(con_servicio, servicio):
    crear_dentista("sin@x.test")
    r = cliente_de().get(f"/api/v1/dentistas/?servicio={servicio.id}")
    assert [d["id"] for d in r.json()] == [con_servicio.id]


def test_publico_no_lista_servicios_inactivos_del_dentista(con_servicio, categoria, servicio):
    viejo = Servicio.objects.create(
        categoria=categoria,
        nombre="V",
        slug="v",
        duracion_min=30,
        precio_colones=1,
        activo=False,
    )
    con_servicio.servicios.add(viejo)
    assert cliente_de().get("/api/v1/dentistas/").json()[0]["servicios"] == [servicio.id]


def test_admin_actualiza_perfil_y_servicios(admin, dentista, servicio):
    r = admin.patch(
        f"/api/v1/panel/dentistas/{dentista.id}/",
        {"especialidad": "Ortodoncia", "visible_en_web": False, "servicios": [servicio.id]},
        format="json",
    )
    assert r.status_code == 200, r.json()
    assert r.json()["especialidad"] == "Ortodoncia"
    assert r.json()["servicios"] == [servicio.id]
    assert r.json()["usuario"]["email"] == "dra@x.test"


def test_panel_no_permite_crear_ni_borrar(admin, dentista):
    assert admin.post("/api/v1/panel/dentistas/", {}, format="json").status_code == 405
    assert admin.delete(f"/api/v1/panel/dentistas/{dentista.id}/").status_code == 405


def test_reemplazar_horario_valido(admin, dentista):
    HorarioSemanal.objects.create(
        dentista=dentista, dia_semana=3, hora_inicio="08:00", hora_fin="09:00"
    )
    bloques = [
        {"dia_semana": 0, "hora_inicio": "08:00", "hora_fin": "12:00"},
        {"dia_semana": 0, "hora_inicio": "13:00", "hora_fin": "17:00"},
    ]
    r = admin.put(f"/api/v1/panel/dentistas/{dentista.id}/horarios/", bloques, format="json")
    assert r.status_code == 200, r.json()
    assert [(b["dia_semana"], b["hora_inicio"]) for b in r.json()] == [
        (0, "08:00:00"),
        (0, "13:00:00"),
    ]
    assert dentista.horarios.count() == 2


def test_horario_traslapado_400(admin, dentista):
    bloques = [
        {"dia_semana": 0, "hora_inicio": "08:00", "hora_fin": "12:00"},
        {"dia_semana": 0, "hora_inicio": "11:00", "hora_fin": "13:00"},
    ]
    r = admin.put(f"/api/v1/panel/dentistas/{dentista.id}/horarios/", bloques, format="json")
    assert r.status_code == 400
    assert r.json()["campos"]["horarios"] == ["Los bloques del lunes se traslapan."]


def test_horario_fuera_de_rejilla_400(admin, dentista):
    bloques = [{"dia_semana": 1, "hora_inicio": "08:10", "hora_fin": "12:00"}]
    r = admin.put(f"/api/v1/panel/dentistas/{dentista.id}/horarios/", bloques, format="json")
    assert r.status_code == 400
    assert dentista.horarios.count() == 0


def test_horario_inicio_despues_de_fin_400(admin, dentista):
    bloques = [{"dia_semana": 1, "hora_inicio": "12:00", "hora_fin": "08:00"}]
    r = admin.put(f"/api/v1/panel/dentistas/{dentista.id}/horarios/", bloques, format="json")
    assert r.status_code == 400


def test_dentista_ve_mi_perfil(dentista):
    r = cliente_de(dentista.usuario).get("/api/v1/panel/mi-perfil/")
    assert r.status_code == 200 and r.json()["id"] == dentista.id


def test_admin_sin_perfil_mi_perfil_404(db):
    assert cliente_de(crear_admin("a2@x.test")).get("/api/v1/panel/mi-perfil/").status_code == 404


def test_dentista_no_entra_a_panel_dentistas_403(dentista):
    assert cliente_de(dentista.usuario).get("/api/v1/panel/dentistas/").status_code == 403
