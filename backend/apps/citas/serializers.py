from rest_framework import serializers


class HoraLibreSerializer(serializers.Serializer):
    inicio = serializers.DateTimeField()
    fin = serializers.DateTimeField()
    dentistas = serializers.ListField(child=serializers.IntegerField())


class ConsultaDisponibilidadSerializer(serializers.Serializer):
    servicio = serializers.IntegerField()
    fecha = serializers.DateField()
    dentista = serializers.IntegerField(required=False)


class ConsultaDiasSerializer(serializers.Serializer):
    servicio = serializers.IntegerField()
    desde = serializers.DateField()
    hasta = serializers.DateField()
    dentista = serializers.IntegerField(required=False)
