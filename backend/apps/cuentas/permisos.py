"""Catálogo de roles y permisos del panel (fuente única de verdad)."""

ROL_ADMIN = "admin"
ROL_DENTISTA = "dentista"

USUARIOS_GESTIONAR = "usuarios.gestionar"
CATALOGO_GESTIONAR = "catalogo.gestionar"
DENTISTAS_GESTIONAR = "dentistas.gestionar"
BLOQUEOS_PROPIOS = "dentistas.bloqueos_propios"
CITAS_VER_TODAS = "citas.ver_todas"
CITAS_GESTIONAR_TODAS = "citas.gestionar_todas"
CITAS_VER_PROPIAS = "citas.ver_propias"
CITAS_MARCAR_ASISTENCIA = "citas.marcar_asistencia"
REPORTES_VER = "reportes.ver"

DESCRIPCIONES_PERMISO: dict[str, str] = {
    USUARIOS_GESTIONAR: "Crear, editar y desactivar usuarios del sistema",
    CATALOGO_GESTIONAR: "Gestionar categorías y servicios",
    DENTISTAS_GESTIONAR: "Gestionar dentistas, horarios y bloqueos",
    BLOQUEOS_PROPIOS: "Gestionar los bloqueos de su propia agenda",
    CITAS_VER_TODAS: "Ver las citas de todos los dentistas",
    CITAS_GESTIONAR_TODAS: "Modificar las citas de todos los dentistas",
    CITAS_VER_PROPIAS: "Ver sus propias citas",
    CITAS_MARCAR_ASISTENCIA: "Marcar sus citas como completadas o no asistidas",
    REPORTES_VER: "Ver los reportes",
}

DESCRIPCIONES_ROL: dict[str, str] = {
    ROL_ADMIN: "Administra la clínica y los usuarios",
    ROL_DENTISTA: "Atiende pacientes y gestiona su agenda",
}

PERMISOS_POR_ROL: dict[str, set[str]] = {
    ROL_ADMIN: set(DESCRIPCIONES_PERMISO),
    ROL_DENTISTA: {CITAS_VER_PROPIAS, CITAS_MARCAR_ASISTENCIA, BLOQUEOS_PROPIOS},
}
