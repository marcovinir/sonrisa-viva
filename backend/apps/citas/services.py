"""Reglas de negocio de las citas: reservar, reprogramar, cancelar y cambiar de estado."""

from datetime import datetime, timedelta

from django.db import IntegrityError, transaction
from rest_framework.exceptions import ValidationError

from apps.clinica.models import Dentista, Servicio
from apps.comun.errores import Conflicto
from apps.comun.notificaciones import Notificador, obtener_notificador
from apps.cuentas.managers import normalizar_email

from . import correos, reglas, selectors
from .asignacion import EstrategiaAsignacion, MenosCitasDelDia
from .models import Cita, Paciente
from .tokens import generar_token


def _hora_ofrecida(
    servicio: Servicio, inicio: datetime, dentista: Dentista | None, excluir: Cita | None = None
) -> selectors.HoraLibre:
    """La hora tal como la ofrece el motor; si no la ofrece, el pedido no es válido."""
    for hora in selectors.disponibilidad(
        servicio, reglas.fecha_local(inicio), dentista, excluir_cita=excluir
    ):
        if hora["inicio"] == inicio:
            return hora
    raise ValidationError(reglas.HORA_NO_DISPONIBLE)


def _guardar(cita: Cita) -> Cita:
    try:
        with transaction.atomic():
            cita.save()
    except IntegrityError:
        # cita_sin_traslape: otra persona ganó la misma hora entre la consulta y el guardado.
        raise Conflicto(reglas.HORA_OCUPADA) from None
    return cita


def reservar(
    servicio_id: int,
    inicio: datetime,
    paciente: dict,
    dentista_id: int | None = None,
    estrategia: EstrategiaAsignacion | None = None,
    notificador: Notificador | None = None,
) -> tuple[Cita, str]:
    servicio = Servicio.objects.filter(pk=servicio_id, activo=True).first()
    if servicio is None:
        raise ValidationError({"servicio": ["El servicio no existe o no está disponible."]})
    dentista = None
    if dentista_id is not None:
        dentista = Dentista.objects.filter(pk=dentista_id).first()
        if dentista is None:
            raise ValidationError({"dentista": ["El dentista no existe."]})

    hora = _hora_ofrecida(servicio, inicio, dentista)
    libres = list(Dentista.objects.filter(pk__in=hora["dentistas"]).select_related("usuario"))
    elegido = dentista or (estrategia or MenosCitasDelDia()).elegir(
        libres, reglas.fecha_local(inicio)
    )

    with transaction.atomic():
        paciente_obj, _ = Paciente.objects.update_or_create(
            email=normalizar_email(paciente["email"]),
            defaults={
                "nombre": paciente["nombre"],
                "apellidos": paciente["apellidos"],
                "telefono": paciente["telefono"],
            },
        )
        token, token_hash = generar_token()
        cita = _guardar(
            Cita(
                paciente=paciente_obj,
                dentista=elegido,
                servicio=servicio,
                inicio=inicio,
                fin=inicio + timedelta(minutes=servicio.duracion_min),
                precio_colones=servicio.precio_colones,
                token_gestion_hash=token_hash,
            )
        )

    (notificador or obtener_notificador()).enviar(
        paciente_obj.email, correos.ASUNTO_CONFIRMADA, correos.texto_confirmada(cita, token)
    )
    return cita, token
