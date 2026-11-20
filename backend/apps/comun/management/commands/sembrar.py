import hashlib
import os
import random
from datetime import datetime, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.citas.models import Cita, Paciente
from apps.clinica.models import (
    Bloqueo,
    CategoriaServicio,
    Dentista,
    DentistaServicio,
    HorarioSemanal,
    Servicio,
)
from apps.comun import semillas as s
from apps.cuentas.models import Usuario
from apps.cuentas.permisos import ROL_ADMIN

PASO = timedelta(minutes=15)


class Command(BaseCommand):
    help = "Carga datos de ejemplo de la clínica (servicios, dentistas, horarios y citas)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reiniciar",
            action="store_true",
            help="Borra los datos de ejemplo (conserva los admins) y los vuelve a crear.",
        )

    @transaction.atomic
    def handle(self, *args, reiniciar=False, **options):
        if reiniciar:
            self._borrar()
        elif Servicio.objects.exists():
            self.stdout.write("Ya hay datos de ejemplo; usa --reiniciar para regenerarlos.")
            return

        rng = random.Random(42)
        clave = os.environ.get("SEMILLA_ADMIN_PASSWORD", s.CLAVE_DEMO_POR_DEFECTO)
        self._admin(clave)
        servicios = self._catalogo()
        dentistas = self._dentistas(servicios, clave)
        pacientes = self._pacientes(rng)
        citas = self._citas(rng, dentistas, pacientes)
        self.stdout.write(
            self.style.SUCCESS(
                f"Listo: {len(servicios)} servicios, {len(dentistas)} dentistas, "
                f"{len(pacientes)} pacientes y {citas} citas. Admin: {s.ADMIN_EMAIL}"
            )
        )

    def _borrar(self):
        Cita.objects.all().delete()
        Paciente.objects.all().delete()
        Bloqueo.objects.all().delete()
        HorarioSemanal.objects.all().delete()
        DentistaServicio.objects.all().delete()
        Dentista.objects.all().delete()
        Servicio.objects.all().delete()
        CategoriaServicio.objects.all().delete()
        Usuario.objects.exclude(rol__nombre=ROL_ADMIN).delete()

    def _admin(self, clave: str):
        if not Usuario.objects.filter(email=s.ADMIN_EMAIL).exists():
            Usuario.objects.crear_usuario(
                s.ADMIN_EMAIL, "Admin", "Sonrisa Viva", ROL_ADMIN, password=clave, activo=True
            )

    def _catalogo(self) -> dict[str, Servicio]:
        categorias = {
            nombre: CategoriaServicio.objects.create(nombre=nombre, orden=i)
            for i, nombre in enumerate(s.CATEGORIAS, start=1)
        }
        return {
            slug: Servicio.objects.create(
                categoria=categorias[cat],
                nombre=nombre,
                slug=slug,
                duracion_min=duracion,
                precio_colones=precio,
                descripcion=descripcion,
                indicaciones=s.INDICACIONES.get(slug, ""),
            )
            for cat, nombre, slug, duracion, precio, descripcion in s.SERVICIOS
        }

    def _dentistas(self, servicios: dict[str, Servicio], clave: str) -> list[Dentista]:
        dentistas = []
        for email, nombre, apellidos, especialidad, foto, slugs, sabado in s.DENTISTAS:
            usuario = Usuario.objects.crear_usuario(
                email, nombre, apellidos, "dentista", password=clave, activo=True
            )
            dentista = Dentista.objects.create(
                usuario=usuario,
                especialidad=especialidad,
                biografia=f"{especialidad} en Clínica Dental Sonrisa Viva.",
                foto_url=f"/equipo/{foto}.jpg",
            )
            dentista.servicios.set([servicios[slug] for slug in slugs])
            bloques = list(s.LUNES_A_VIERNES) + ([s.SABADO] if sabado else [])
            HorarioSemanal.objects.bulk_create(
                HorarioSemanal(dentista=dentista, dia_semana=d, hora_inicio=i, hora_fin=f)
                for d, i, f in bloques
            )
            dentistas.append(dentista)
        return dentistas

    def _pacientes(self, rng: random.Random) -> list[Paciente]:
        pacientes = []
        for n in range(1, s.TOTAL_PACIENTES + 1):
            nombre = rng.choice(s.NOMBRES)
            apellidos = f"{rng.choice(s.APELLIDOS)} {rng.choice(s.APELLIDOS)}"
            telefono = f"{rng.choice('678')}{rng.randint(0, 999):03d}-{rng.randint(0, 9999):04d}"
            pacientes.append(
                Paciente(
                    nombre=nombre,
                    apellidos=apellidos,
                    email=f"paciente{n:02d}@correo.test",
                    telefono=telefono,
                )
            )
        return Paciente.objects.bulk_create(pacientes)

    def _citas(self, rng: random.Random, dentistas: list[Dentista], pacientes: list[Paciente]):
        """Coloca citas al azar dentro de los horarios, sin traslapes, en los últimos 180 días."""
        zona = timezone.get_current_timezone()
        hoy = timezone.localdate()
        horarios = {
            d.pk: [(h.dia_semana, h.hora_inicio, h.hora_fin) for h in d.horarios.all()]
            for d in dentistas
        }
        servicios = {d.pk: list(d.servicios.all()) for d in dentistas}
        ocupado: dict[tuple, list[tuple[datetime, datetime]]] = {}
        estados, pesos = zip(*s.PESOS_ESTADO.items(), strict=True)
        citas = []
        intentos = 0
        while len(citas) < s.TOTAL_CITAS and intentos < 20000:
            intentos += 1
            dentista = rng.choice(dentistas)
            fecha = hoy - timedelta(days=rng.randint(1, s.DIAS_HACIA_ATRAS))
            bloques = [b for b in horarios[dentista.pk] if b[0] == fecha.weekday()]
            if not bloques:
                continue
            _, h_ini, h_fin = rng.choice(bloques)
            servicio = rng.choice(servicios[dentista.pk])
            duracion = timedelta(minutes=servicio.duracion_min)
            inicio_bloque = datetime.combine(fecha, h_ini, tzinfo=zona)
            fin_bloque = datetime.combine(fecha, h_fin, tzinfo=zona)
            pasos = int((fin_bloque - duracion - inicio_bloque) / PASO)
            if pasos < 0:
                continue
            inicio = inicio_bloque + PASO * rng.randint(0, pasos)
            fin = inicio + duracion
            clave = (dentista.pk, fecha)
            if any(inicio < f and i < fin for i, f in ocupado.get(clave, [])):
                continue
            ocupado.setdefault(clave, []).append((inicio, fin))
            token = f"semilla-{len(citas)}-{rng.random()}"
            citas.append(
                Cita(
                    paciente=rng.choice(pacientes),
                    dentista=dentista,
                    servicio=servicio,
                    inicio=inicio,
                    fin=fin,
                    precio_colones=servicio.precio_colones,
                    estado=rng.choices(estados, weights=pesos)[0],
                    token_gestion_hash=hashlib.sha256(token.encode()).hexdigest(),
                )
            )
        Cita.objects.bulk_create(citas)
        return len(citas)
