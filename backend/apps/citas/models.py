from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import DateTimeRangeField, RangeOperators
from django.db import models
from django.db.models import F, Func, Q

from apps.clinica.models import Dentista, Servicio
from apps.cuentas.managers import normalizar_email


class TsTzRange(Func):
    function = "TSTZRANGE"
    output_field = DateTimeRangeField()


class Paciente(models.Model):
    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=30)

    class Meta:
        db_table = "paciente"
        ordering = ["nombre", "apellidos"]

    def __str__(self) -> str:
        return f"{self.nombre} {self.apellidos}"

    def save(self, *args, **kwargs):
        self.email = normalizar_email(self.email)
        super().save(*args, **kwargs)


class EstadoCita(models.TextChoices):
    CONFIRMADA = "confirmada", "Confirmada"
    CANCELADA = "cancelada", "Cancelada"
    COMPLETADA = "completada", "Completada"
    NO_ASISTIO = "no_asistio", "No asistió"


class Cita(models.Model):
    """Una cita. `fin` y `precio_colones` son la foto del servicio al reservar (no derivados)."""

    paciente = models.ForeignKey(Paciente, on_delete=models.PROTECT, related_name="citas")
    dentista = models.ForeignKey(Dentista, on_delete=models.PROTECT, related_name="citas")
    servicio = models.ForeignKey(Servicio, on_delete=models.PROTECT, related_name="citas")
    inicio = models.DateTimeField()
    fin = models.DateTimeField()
    precio_colones = models.IntegerField()
    estado = models.CharField(
        max_length=20, choices=EstadoCita.choices, default=EstadoCita.CONFIRMADA
    )
    notas_internas = models.TextField(blank=True)
    token_gestion_hash = models.CharField(max_length=64, unique=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cita"
        ordering = ["inicio"]
        indexes = [models.Index(fields=["dentista", "inicio"], name="cita_dentista_inicio")]
        constraints = [
            models.CheckConstraint(condition=Q(inicio__lt=F("fin")), name="cita_inicio_antes_fin"),
            ExclusionConstraint(
                name="cita_sin_traslape",
                expressions=[
                    (TsTzRange("inicio", "fin"), RangeOperators.OVERLAPS),
                    ("dentista", RangeOperators.EQUAL),
                ],
                condition=~Q(estado=EstadoCita.CANCELADA),
            ),
        ]

    def __str__(self) -> str:
        return f"{self.servicio} · {self.paciente} · {self.inicio:%Y-%m-%d %H:%M}"
