from rest_framework import serializers

from .models import Usuario


class UsuarioYoSerializer(serializers.ModelSerializer):
    rol = serializers.CharField(source="rol.nombre")
    permisos = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ["id", "email", "nombre", "apellidos", "rol", "permisos"]

    def get_permisos(self, usuario: Usuario) -> list[str]:
        return sorted(usuario.codigos_permiso())


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)


class EstablecerContrasenaSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)


class RecuperarSerializer(serializers.Serializer):
    email = serializers.CharField()


class UsuarioPanelSerializer(serializers.ModelSerializer):
    rol = serializers.CharField(source="rol.nombre", read_only=True)
    activado = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ["id", "email", "nombre", "apellidos", "rol", "is_active", "activado", "creado_en"]
        read_only_fields = ["email", "is_active", "creado_en"]

    def get_activado(self, usuario: Usuario) -> bool:
        return usuario.has_usable_password()


class CrearUsuarioPanelSerializer(serializers.Serializer):
    email = serializers.EmailField()
    nombre = serializers.CharField(max_length=100)
    apellidos = serializers.CharField(max_length=150)
    rol = serializers.ChoiceField(choices=["admin", "dentista"])
