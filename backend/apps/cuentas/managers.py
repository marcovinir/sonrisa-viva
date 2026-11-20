from django.contrib.auth.base_user import BaseUserManager


def normalizar_email(email: str) -> str:
    return (email or "").strip().lower()


class UsuarioManager(BaseUserManager):
    use_in_migrations = True

    def crear_usuario(
        self,
        email: str,
        nombre: str,
        apellidos: str,
        rol,
        password: str | None = None,
        activo: bool = False,
    ):
        from .models import Rol

        if not email:
            raise ValueError("El correo es obligatorio.")
        if isinstance(rol, str):
            rol = Rol.objects.get(nombre=rol)
        usuario = self.model(
            email=normalizar_email(email),
            nombre=nombre,
            apellidos=apellidos,
            rol=rol,
            is_active=activo,
        )
        if password:
            usuario.set_password(password)
        else:
            usuario.set_unusable_password()
        usuario.save(using=self._db)
        return usuario

    def create_user(self, email, password=None, **extra):
        return self.crear_usuario(
            email,
            extra.pop("nombre", ""),
            extra.pop("apellidos", ""),
            extra.pop("rol", "dentista"),
            password=password,
            activo=extra.pop("is_active", False),
        )

    def create_superuser(self, email, password=None, **extra):
        return self.crear_usuario(
            email,
            extra.pop("nombre", ""),
            extra.pop("apellidos", ""),
            "admin",
            password=password,
            activo=True,
        )

    def get_by_natural_key(self, username):
        return self.get(email=normalizar_email(username))
