"""Datos de ejemplo de la clínica ficticia (usados por `manage.py sembrar`)."""

from datetime import time

ADMIN_EMAIL = "admin@sonrisaviva.test"
CLAVE_DEMO_POR_DEFECTO = "Demo-Sonrisa-2026"

CATEGORIAS = ["Preventiva", "Estética", "Ortodoncia", "Restauración", "Cirugía"]

# (categoría, nombre, slug, duración en minutos, precio en colones, descripción)
# Lo que sale en el correo de confirmación como «Antes de tu cita» (el resto usa el general).
INDICACIONES = {
    "limpieza-dental": "Cepíllate como de costumbre; si tienes sensibilidad, cuéntanos al llegar.",
    "blanqueamiento": "Evita café, té y vino tinto las 24 horas previas.",
    "control-brackets": "Trae tu kit de limpieza de brackets y avísanos si algún bracket "
    "está suelto.",
    "endodoncia": "Come algo liviano antes de venir: la zona quedará anestesiada unas horas.",
    "extraccion-simple": "Come antes de la cita y planea descansar el resto del día.",
}

SERVICIOS = [
    (
        "Preventiva",
        "Valoración general",
        "valoracion-general",
        30,
        15000,
        "Revisión completa de dientes y encías con plan de tratamiento.",
    ),
    (
        "Preventiva",
        "Limpieza dental",
        "limpieza-dental",
        45,
        25000,
        "Profilaxis, eliminación de sarro y pulido.",
    ),
    (
        "Preventiva",
        "Sellantes",
        "sellantes",
        30,
        20000,
        "Protección de las fosas de molares contra las caries.",
    ),
    (
        "Estética",
        "Blanqueamiento",
        "blanqueamiento",
        90,
        120000,
        "Blanqueamiento en consultorio con lámpara LED.",
    ),
    (
        "Estética",
        "Carillas de resina",
        "carillas-de-resina",
        60,
        90000,
        "Corrección de forma y color por pieza.",
    ),
    (
        "Ortodoncia",
        "Valoración de ortodoncia",
        "valoracion-ortodoncia",
        45,
        20000,
        "Estudio de mordida y opciones de tratamiento.",
    ),
    (
        "Ortodoncia",
        "Control de brackets",
        "control-brackets",
        30,
        30000,
        "Ajuste mensual de brackets.",
    ),
    (
        "Restauración",
        "Resina (calza)",
        "resina",
        60,
        40000,
        "Restauración estética de una pieza con caries.",
    ),
    (
        "Restauración",
        "Endodoncia",
        "endodoncia",
        90,
        150000,
        "Tratamiento de conducto en una pieza.",
    ),
    (
        "Cirugía",
        "Extracción simple",
        "extraccion-simple",
        45,
        45000,
        "Extracción de una pieza sin complicaciones.",
    ),
]

LUNES_A_VIERNES = [
    (dia, inicio, fin)
    for dia in range(5)
    for inicio, fin in ((time(8), time(12)), (time(13), time(17)))
]

# (email, nombre, apellidos, especialidad, slug de foto, servicios, trabaja sábado)
DENTISTAS = [
    (
        "laura.vargas@sonrisaviva.test",
        "Laura",
        "Vargas Rojas",
        "Odontología general",
        "laura-vargas",
        ["valoracion-general", "limpieza-dental", "sellantes", "resina", "extraccion-simple"],
        True,
    ),
    (
        "andres.mora@sonrisaviva.test",
        "Andrés",
        "Mora Jiménez",
        "Ortodoncia",
        "andres-mora",
        ["valoracion-general", "valoracion-ortodoncia", "control-brackets"],
        False,
    ),
    (
        "valeria.castro@sonrisaviva.test",
        "Valeria",
        "Castro Solano",
        "Estética dental",
        "valeria-castro",
        ["valoracion-general", "limpieza-dental", "blanqueamiento", "carillas-de-resina"],
        False,
    ),
    (
        "diego.quesada@sonrisaviva.test",
        "Diego",
        "Quesada Araya",
        "Endodoncia y cirugía",
        "diego-quesada",
        [
            "valoracion-general",
            "resina",
            "endodoncia",
            "extraccion-simple",
            "sellantes",
            "limpieza-dental",
        ],
        False,
    ),
]

SABADO = (5, time(8), time(12))

NOMBRES = [
    "María",
    "José",
    "Ana",
    "Luis",
    "Sofía",
    "Carlos",
    "Daniela",
    "Jorge",
    "Valentina",
    "Pablo",
    "Camila",
    "Esteban",
    "Gabriela",
    "Mauricio",
    "Fernanda",
    "Ricardo",
]
APELLIDOS = [
    "Rodríguez",
    "Jiménez",
    "Mora",
    "Vargas",
    "Rojas",
    "Solís",
    "Araya",
    "Chaves",
    "Alfaro",
    "Castro",
    "Herrera",
    "Quesada",
    "Brenes",
    "Calderón",
    "Ulate",
    "Núñez",
]

TOTAL_PACIENTES = 60
TOTAL_CITAS = 200
DIAS_HACIA_ATRAS = 180
PESOS_ESTADO = {"completada": 75, "no_asistio": 10, "cancelada": 15}
