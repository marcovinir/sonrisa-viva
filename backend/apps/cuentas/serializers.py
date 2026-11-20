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
