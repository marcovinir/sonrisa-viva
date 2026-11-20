import secrets

import pytest

from apps.citas.models import Cita, Paciente
from apps.clinica.models import CategoriaServicio, Servicio
from apps.comun.pruebas import cliente_de, crear_admin
from conftest import h


@pytest.fixture
def admin(db):
    return cliente_de(crear_admin())


def test_publico_lista_solo_servicios_activos(servicio, categoria):
    Servicio.objects.create(
        categoria=categoria,
        nombre="Viejo",
        slug="viejo",
        duracion_min=30,
        precio_colones=1,
        activo=False,
    )
    r = cliente_de().get("/api/v1/servicios/")
    assert r.status_code == 200
    assert [s["slug"] for s in r.json()] == ["limpieza-dental"]
    assert r.json()[0]["categoria"] == {"id": categoria.id, "nombre": "Preventiva"}
    assert set(r.json()[0]) == {
        "id",
        "nombre",
        "slug",
        "descripcion",
        "duracion_min",
        "precio_colones",
        "categoria",
    }


def test_publico_categorias_solo_con_servicios_activos(servicio):
    CategoriaServicio.objects.create(nombre="Vacía", orden=9)
    r = cliente_de().get("/api/v1/categorias/")
    assert [c["nombre"] for c in r.json()] == ["Preventiva"]


def test_publico_no_requiere_sesion(db):
    assert cliente_de().get("/api/v1/servicios/").status_code == 200


def test_panel_servicios_exige_permiso(dentista):
    assert cliente_de().get("/api/v1/panel/servicios/").status_code == 403
    assert cliente_de(dentista.usuario).get("/api/v1/panel/servicios/").status_code == 403


def test_admin_crea_servicio_con_slug_generado(admin, categoria):
    datos = {
        "categoria": categoria.id,
        "nombre": "Limpieza dental",
        "duracion_min": 45,
        "precio_colones": 25000,
    }
    r1 = admin.post("/api/v1/panel/servicios/", datos, format="json")
    r2 = admin.post("/api/v1/panel/servicios/", datos, format="json")
    assert r1.status_code == 201, r1.json()
    assert r1.json()["slug"] == "limpieza-dental"
    assert r2.json()["slug"] == "limpieza-dental-2"


def test_duracion_invalida_da_400_con_campo(admin, categoria):
    r = admin.post(
        "/api/v1/panel/servicios/",
        {"categoria": categoria.id, "nombre": "X", "duracion_min": 50, "precio_colones": 1},
        format="json",
    )
    assert r.status_code == 400
    assert "duracion_min" in r.json()["campos"]


def test_borrar_servicio_con_citas_da_409(admin, servicio, dentista):
    p = Paciente.objects.create(nombre="A", apellidos="B", email="a@b.test", telefono="88888888")
    Cita.objects.create(
        paciente=p,
        dentista=dentista,
        servicio=servicio,
        inicio=h(9),
        fin=h(10),
        precio_colones=1,
        token_gestion_hash=secrets.token_hex(32),
    )
    r = admin.delete(f"/api/v1/panel/servicios/{servicio.id}/")
    assert r.status_code == 409
    assert r.json()["detalle"] == (
        "No se puede borrar porque tiene citas asociadas; desactívalo en su lugar."
    )


def test_borrar_categoria_con_servicios_da_409(admin, servicio, categoria):
    r = admin.delete(f"/api/v1/panel/categorias/{categoria.id}/")
    assert r.status_code == 409
    assert r.json()["detalle"] == (
        "No se puede borrar porque tiene servicios asociados; muévelos a otra categoría primero."
    )


def test_borrar_servicio_sin_citas(admin, servicio):
    assert admin.delete(f"/api/v1/panel/servicios/{servicio.id}/").status_code == 204


def test_admin_desactiva_servicio_y_desaparece_del_publico(admin, servicio):
    r = admin.patch(f"/api/v1/panel/servicios/{servicio.id}/", {"activo": False}, format="json")
    assert r.status_code == 200
    assert cliente_de().get("/api/v1/servicios/").json() == []


def test_panel_filtra_servicios_por_activo(admin, servicio):
    r = admin.get("/api/v1/panel/servicios/?activo=false")
    assert r.json()["count"] == 0
    assert admin.get("/api/v1/panel/servicios/?activo=true").json()["count"] == 1


def test_admin_edita_las_indicaciones_del_servicio(admin, servicio):
    url = f"/api/v1/panel/servicios/{servicio.id}/"
    assert admin.get(url).json()["indicaciones"] == ""
    r = admin.patch(url, {"indicaciones": "Ven sin haber comido."}, format="json")
    assert r.status_code == 200, r.json()
    assert admin.get(url).json()["indicaciones"] == "Ven sin haber comido."
