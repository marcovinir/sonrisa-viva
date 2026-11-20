from rest_framework.exceptions import ValidationError
from rest_framework.views import exception_handler

MENSAJE_VALIDACION = "Revisa los datos marcados."


def _a_texto(valor) -> str:
    if isinstance(valor, list):
        return " ".join(_a_texto(v) for v in valor)
    if isinstance(valor, dict):
        return " ".join(_a_texto(v) for v in valor.values())
    return str(valor)


def manejador_excepciones(exc, context):
    """Da a todos los errores de la API la forma {"detalle": str, "campos": {...}}."""
    respuesta = exception_handler(exc, context)
    if respuesta is None:
        return None

    datos = respuesta.data
    if isinstance(exc, ValidationError):
        if isinstance(datos, dict):
            no_campo = datos.pop("non_field_errors", None)
            campos = {
                k: [str(e) for e in (v if isinstance(v, list) else [v])] for k, v in datos.items()
            }
            detalle = _a_texto(no_campo) if no_campo else MENSAJE_VALIDACION
        else:
            campos, detalle = {}, _a_texto(datos)
    else:
        detalle = datos.get("detail", datos) if isinstance(datos, dict) else datos
        campos, detalle = {}, _a_texto(detalle)

    respuesta.data = {"detalle": detalle, "campos": campos}
    return respuesta
