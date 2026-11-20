from rest_framework import serializers

from .models import Cita


class PacienteReservaSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=100)
    apellidos = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    telefono = serializers.RegexField(
        r"^[0-9+\-\s]{8,20}$",
        error_messages={"invalid": "Escribe un teléfono válido (solo números, + o -)."},
    )


class ReservaSerializer(serializers.Serializer):
    servicio = serializers.IntegerField()
    inicio = serializers.DateTimeField()
    dentista = serializers.IntegerField(required=False, allow_null=True)
    paciente = PacienteReservaSerializer()


class ResumenCitaSerializer(serializers.ModelSerializer):
    servicio = serializers.SerializerMethodField()
    dentista = serializers.SerializerMethodField()
    paciente = serializers.SerializerMethodField()

    class Meta:
        model = Cita
        fields = [
            "id",
            "servicio",
            "dentista",
            "inicio",
            "fin",
            "precio_colones",
            "estado",
            "paciente",
        ]

    def get_servicio(self, cita: Cita) -> dict:
        return {"id": cita.servicio_id, "nombre": cita.servicio.nombre}

    def get_dentista(self, cita: Cita) -> dict:
        u = cita.dentista.usuario
        return {"id": cita.dentista_id, "nombre": u.nombre, "apellidos": u.apellidos}

    def get_paciente(self, cita: Cita) -> dict:
        return {"nombre": cita.paciente.nombre, "email": cita.paciente.email}


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
