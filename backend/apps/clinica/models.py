from django.conf import settings
from django.db import models
from django.db.models import F, Q
from django.db.models.functions import Mod
from django.db.models.lookups import Exact


class CategoriaServicio(models.Model):
    nombre = models.CharField(max_length=80, unique=True)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "categoria_servicio"
        ordering = ["orden", "nombre"]
        verbose_name_plural = "categorías de servicio"

    def __str__(self) -> str:
        return self.nombre


class Servicio(models.Model):
    categoria = models.ForeignKey(
        CategoriaServicio, on_delete=models.PROTECT, related_name="servicios"
    )
    nombre = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    descripcion = models.TextField(blank=True)
    # Lo que el paciente debe saber antes de venir; sale en el correo de confirmación.
    indicaciones = models.TextField(blank=True, default="")
    duracion_min = models.PositiveSmallIntegerField()
    precio_colones = models.IntegerField()
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "servicio"
        ordering = ["categoria__orden", "nombre"]
        constraints = [
            models.CheckConstraint(
                condition=Q(duracion_min__gt=0) & Q(Exact(Mod(F("duracion_min"), 15), 0)),
                name="servicio_duracion_valida",
            ),
            models.CheckConstraint(
                condition=Q(precio_colones__gte=0), name="servicio_precio_no_negativo"
            ),
        ]

    def __str__(self) -> str:
        return self.nombre


class Dentista(models.Model):
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="dentista"
    )
    especialidad = models.CharField(max_length=120, blank=True)
    biografia = models.TextField(blank=True)
    foto_url = models.CharField(max_length=300, blank=True)
    visible_en_web = models.BooleanField(default=True)
    servicios = models.ManyToManyField(
        Servicio, through="DentistaServicio", related_name="dentistas"
    )

    class Meta:
        db_table = "dentista"
        ordering = ["usuario__nombre", "usuario__apellidos"]

    def __str__(self) -> str:
        return str(self.usuario)


class DentistaServicio(models.Model):
    dentista = models.ForeignKey(Dentista, on_delete=models.CASCADE)
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE)

    class Meta:
        db_table = "dentista_servicio"
        constraints = [
            models.UniqueConstraint(
                fields=["dentista", "servicio"], name="dentista_servicio_unico"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.dentista} · {self.servicio}"


class HorarioSemanal(models.Model):
    """Bloque de atención semanal. dia_semana: 0 = lunes … 6 = domingo."""

    dentista = models.ForeignKey(Dentista, on_delete=models.CASCADE, related_name="horarios")
    dia_semana = models.PositiveSmallIntegerField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()

    class Meta:
        db_table = "horario_semanal"
        ordering = ["dentista", "dia_semana", "hora_inicio"]
        constraints = [
            models.CheckConstraint(condition=Q(dia_semana__lte=6), name="horario_dia_valido"),
            models.CheckConstraint(
                condition=Q(hora_inicio__lt=F("hora_fin")), name="horario_inicio_antes_fin"
            ),
        ]

    DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

    def __str__(self) -> str:
        dia = self.DIAS[self.dia_semana]
        return f"{self.dentista} · {dia} {self.hora_inicio:%H:%M}–{self.hora_fin:%H:%M}"


class Bloqueo(models.Model):
    dentista = models.ForeignKey(Dentista, on_delete=models.CASCADE, related_name="bloqueos")
    inicio = models.DateTimeField()
    fin = models.DateTimeField()
    motivo = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = "bloqueo"
        ordering = ["inicio"]
        constraints = [
            models.CheckConstraint(
                condition=Q(inicio__lt=F("fin")), name="bloqueo_inicio_antes_fin"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.dentista} · bloqueo {self.inicio:%Y-%m-%d %H:%M}"
