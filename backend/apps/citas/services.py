"""Reglas de negocio de las citas: reservar, reprogramar, cancelar y cambiar de estado."""

from datetime import datetime, timedelta

from django.db import IntegrityError, transaction
from rest_framework.exceptions import ValidationError

from apps.clinica.models import Dentista, Servicio
from apps.clinica.services import bloquear_agenda, hay_bloqueo
from apps.comun.errores import Conflicto
from apps.comun.notificaciones import Notificador, enviar_sin_fallar, obtener_notificador
from apps.cuentas.managers import normalizar_email

from . import correos, reglas, selectors
from .asignacion import EstrategiaAsignacion, MenosCitasDelDia
from .models import Cita, EstadoCita, Paciente
from .tokens import generar_token


def _hora_ofrecida(
    servicio: Servicio,
    inicio: datetime,
    dentista: Dentista | None,
    excluir: Cita | None = None,
    duracion: timedelta | None = None,
) -> selectors.HoraLibre:
    """La hora tal como la ofrece el motor; si no la ofrece, el pedido no es válido."""
    for hora in selectors.disponibilidad(
        servicio, reglas.fecha_local(inicio), dentista, excluir_cita=excluir, duracion=duracion
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


def _paciente_de(datos: dict) -> tuple[Paciente, str]:
    """El paciente del correo, sin sobrescribir sus datos si ya existía.

    Quien conozca un correo no puede cambiar el nombre ni el teléfono que ve la clínica:
    si escribió otros datos, quedan como nota en la cita para que la clínica los revise.
    """
    paciente, creado = Paciente.objects.get_or_create(
        email=normalizar_email(datos["email"]),
        defaults={
            "nombre": datos["nombre"],
            "apellidos": datos["apellidos"],
            "telefono": datos["telefono"],
        },
    )
    escritos = (datos["nombre"].strip(), datos["apellidos"].strip(), datos["telefono"].strip())
    guardados = (paciente.nombre, paciente.apellidos, paciente.telefono)
    if creado or escritos == guardados:
        return paciente, ""
    nombre, apellidos, telefono = escritos
    return paciente, f"En la reserva escribió: {nombre} {apellidos}, teléfono {telefono}."


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

    fin = inicio + timedelta(minutes=servicio.duracion_min)
    with transaction.atomic():
        # Un bloqueo que se esté guardando a la vez no lo vio el motor: se vuelve a mirar ya
        # con la agenda tomada.
        bloquear_agenda(elegido.pk)
        if hay_bloqueo(elegido.pk, inicio, fin):
            raise Conflicto(reglas.HORA_OCUPADA)
        paciente_obj, nota = _paciente_de(paciente)
        token, token_hash = generar_token()
        cita = _guardar(
            Cita(
                paciente=paciente_obj,
                dentista=elegido,
                servicio=servicio,
                inicio=inicio,
                fin=fin,
                precio_colones=servicio.precio_colones,
                notas_internas=nota,
                token_gestion_hash=token_hash,
            )
        )

    enviar_sin_fallar(
        notificador or obtener_notificador(),
        paciente_obj.email,
        correos.ASUNTO_CONFIRMADA,
        correos.texto_confirmada(cita, token),
    )
    return cita, token


# --- Gestión por el paciente (enlace) ------------------------------------------------


def puede_cambiar(cita: Cita) -> bool:
    return cita.estado == EstadoCita.CONFIRMADA and (
        cita.inicio - reglas.ahora() >= reglas.LIMITE_CAMBIOS
    )


def _exigir_cambiable(cita: Cita) -> None:
    if cita.estado != EstadoCita.CONFIRMADA:
        raise ValidationError(reglas.NO_MODIFICABLE)
    if not puede_cambiar(cita):
        raise ValidationError(reglas.FUERA_DE_PLAZO)


def reprogramar(cita: Cita, nuevo_inicio: datetime, notificador: Notificador | None = None) -> Cita:
    """Mueve la cita (mismo servicio y dentista) a otra hora libre."""
    _exigir_cambiable(cita)
    duracion = cita.fin - cita.inicio  # la foto de la reserva, aunque el servicio cambie
    _hora_ofrecida(cita.servicio, nuevo_inicio, cita.dentista, excluir=cita, duracion=duracion)
    with transaction.atomic():
        bloquear_agenda(cita.dentista_id)
        if hay_bloqueo(cita.dentista_id, nuevo_inicio, nuevo_inicio + duracion):
            raise Conflicto(reglas.HORA_OCUPADA)
        cita.inicio = nuevo_inicio
        cita.fin = nuevo_inicio + duracion
        _guardar(cita)
    enviar_sin_fallar(
        notificador or obtener_notificador(),
        cita.paciente.email,
        correos.ASUNTO_REPROGRAMADA,
        correos.texto_reprogramada(cita),
    )
    return cita


def cancelar_por_paciente(cita: Cita, notificador: Notificador | None = None) -> Cita:
    _exigir_cambiable(cita)
    cita.estado = EstadoCita.CANCELADA
    cita.save(update_fields=["estado"])
    enviar_sin_fallar(
        notificador or obtener_notificador(),
        cita.paciente.email,
        correos.ASUNTO_CANCELADA,
        correos.texto_cancelada(cita),
    )
    return cita


# --- Panel: cambios de estado --------------------------------------------------------

TRANSICIONES = {
    EstadoCita.CONFIRMADA: {EstadoCita.CANCELADA, EstadoCita.COMPLETADA, EstadoCita.NO_ASISTIO},
}


def cambiar_estado(
    cita: Cita, nuevo: str, hecho_por, notificador: Notificador | None = None
) -> Cita:
    from rest_framework.exceptions import PermissionDenied

    from apps.comun.permisos import MENSAJE_SIN_PERMISO
    from apps.cuentas.permisos import CITAS_GESTIONAR_TODAS, CITAS_MARCAR_ASISTENCIA

    nuevo = EstadoCita(nuevo)
    gestiona_todas = hecho_por.tiene_permiso(CITAS_GESTIONAR_TODAS)
    if nuevo == EstadoCita.CANCELADA and not gestiona_todas:
        raise PermissionDenied(MENSAJE_SIN_PERMISO)
    if nuevo in (EstadoCita.COMPLETADA, EstadoCita.NO_ASISTIO):
        es_suya = cita.dentista.usuario_id == hecho_por.pk
        if not hecho_por.tiene_permiso(CITAS_MARCAR_ASISTENCIA) or not (es_suya or gestiona_todas):
            raise PermissionDenied(MENSAJE_SIN_PERMISO)
    if nuevo not in TRANSICIONES.get(cita.estado, set()):
        raise ValidationError(
            reglas.TRANSICION_INVALIDA.format(
                actual=EstadoCita(cita.estado).label, nuevo=nuevo.label
            )
        )
    if nuevo in (EstadoCita.COMPLETADA, EstadoCita.NO_ASISTIO) and cita.fin > reglas.ahora():
        raise ValidationError(reglas.CITA_NO_TERMINADA)
    cita.estado = nuevo
    cita.save(update_fields=["estado"])
    if nuevo == EstadoCita.CANCELADA:
        enviar_sin_fallar(
            notificador or obtener_notificador(),
            cita.paciente.email,
            correos.ASUNTO_CANCELADA_CLINICA,
            correos.texto_cancelada(cita, por_clinica=True),
        )
    return cita
