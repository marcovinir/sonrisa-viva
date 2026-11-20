from django.contrib.auth.base_user import AbstractBaseUser
from django.db import models

from .managers import UsuarioManager
from .permisos import ROL_ADMIN


class Rol(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = "rol"
        ordering = ["nombre"]
        verbose_name_plural = "roles"

    def __str__(self) -> str:
        return self.nombre


class Permiso(models.Model):
    codigo = models.CharField(max_length=80, unique=True)
    descripcion = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = "permiso"
        ordering = ["codigo"]

    def __str__(self) -> str:
        return self.codigo


class RolPermiso(models.Model):
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE)
    permiso = models.ForeignKey(Permiso, on_delete=models.CASCADE)

    class Meta:
        db_table = "rol_permiso"
        constraints = [
            models.UniqueConstraint(fields=["rol", "permiso"], name="rol_permiso_unico"),
        ]

    def __str__(self) -> str:
        return f"{self.rol} → {self.permiso}"


class Usuario(AbstractBaseUser):
    email = models.EmailField(unique=True)
    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=150)
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT, related_name="usuarios")
    is_active = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True)

    objects = UsuarioManager()

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = ["nombre", "apellidos"]

    class Meta:
        db_table = "usuario"
        ordering = ["nombre", "apellidos"]

    def __str__(self) -> str:
        return f"{self.nombre} {self.apellidos}".strip() or self.email

    def codigos_permiso(self) -> set[str]:
        if not hasattr(self, "_codigos_permiso"):
            self._codigos_permiso = set(
                Permiso.objects.filter(rolpermiso__rol_id=self.rol_id).values_list(
                    "codigo", flat=True
                )
            )
        return self._codigos_permiso

    def tiene_permiso(self, codigo: str) -> bool:
        return codigo in self.codigos_permiso()

    @property
    def es_admin(self) -> bool:
        return self.rol.nombre == ROL_ADMIN
