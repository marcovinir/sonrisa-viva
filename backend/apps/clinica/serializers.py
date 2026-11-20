from rest_framework import serializers

from .models import Bloqueo, CategoriaServicio, Dentista, HorarioSemanal, Servicio


class BloqueoSerializer(serializers.ModelSerializer):
    dentista = serializers.PrimaryKeyRelatedField(queryset=Dentista.objects.all(), required=False)

    class Meta:
        model = Bloqueo
        fields = ["id", "dentista", "inicio", "fin", "motivo"]


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaServicio
        fields = ["id", "nombre", "orden"]


class CategoriaMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaServicio
        fields = ["id", "nombre"]


class ServicioPublicoSerializer(serializers.ModelSerializer):
    categoria = CategoriaMiniSerializer()

    class Meta:
        model = Servicio
        fields = [
            "id",
            "nombre",
            "slug",
            "descripcion",
            "duracion_min",
            "precio_colones",
            "categoria",
        ]


class ServicioPanelSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True, max_length=140)

    class Meta:
        model = Servicio
        fields = [
            "id",
            "categoria",
            "nombre",
            "slug",
            "descripcion",
            "duracion_min",
            "precio_colones",
            "activo",
        ]

    def validate_duracion_min(self, valor: int) -> int:
        if valor <= 0 or valor % 15:
            raise serializers.ValidationError("La duración debe ser un múltiplo de 15 minutos.")
        return valor

    def validate_precio_colones(self, valor: int) -> int:
        if valor < 0:
            raise serializers.ValidationError("El precio no puede ser negativo.")
        return valor

    def validate_slug(self, valor: str) -> str:
        if (
            valor
            and Servicio.objects.exclude(pk=getattr(self.instance, "pk", None))
            .filter(slug=valor)
            .exists()
        ):
            raise serializers.ValidationError("Ya existe un servicio con ese slug.")
        return valor


class DentistaPublicoSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(source="usuario.nombre")
    apellidos = serializers.CharField(source="usuario.apellidos")
    servicios = serializers.SerializerMethodField()

    class Meta:
        model = Dentista
        fields = [
            "id",
            "nombre",
            "apellidos",
            "especialidad",
            "biografia",
            "foto_url",
            "servicios",
        ]

    def get_servicios(self, dentista: Dentista) -> list[int]:
        return sorted(s.id for s in dentista.activos)


class UsuarioMiniSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    nombre = serializers.CharField()
    apellidos = serializers.CharField()
    is_active = serializers.BooleanField()


class HorarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorarioSemanal
        fields = ["dia_semana", "hora_inicio", "hora_fin"]
        extra_kwargs = {"dia_semana": {"min_value": 0, "max_value": 6}}


class DentistaPanelSerializer(serializers.ModelSerializer):
    usuario = UsuarioMiniSerializer(read_only=True)
    servicios = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Servicio.objects.all(), required=False
    )
    horarios = HorarioSerializer(many=True, read_only=True)

    class Meta:
        model = Dentista
        fields = [
            "id",
            "usuario",
            "especialidad",
            "biografia",
            "foto_url",
            "visible_en_web",
            "servicios",
            "horarios",
        ]

    def to_representation(self, instance):
        datos = super().to_representation(instance)
        datos["servicios"] = sorted(datos["servicios"])
        return datos
