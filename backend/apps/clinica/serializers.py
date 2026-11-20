from rest_framework import serializers

from .models import CategoriaServicio, Servicio


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
