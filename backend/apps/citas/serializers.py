from rest_framework import serializers

from .models import Cita, EstadoCita


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


class CitaPanelSerializer(serializers.ModelSerializer):
    paciente = serializers.SerializerMethodField()
    dentista = serializers.SerializerMethodField()
    servicio = serializers.SerializerMethodField()

    class Meta:
        model = Cita
        fields = [
            "id",
            "inicio",
            "fin",
            "estado",
            "precio_colones",
            "notas_internas",
            "paciente",
            "dentista",
            "servicio",
            "creado_en",
        ]
        read_only_fields = ["inicio", "fin", "estado", "precio_colones", "creado_en"]

    def get_paciente(self, cita: Cita) -> dict:
        p = cita.paciente
        return {
            "id": p.id,
            "nombre": p.nombre,
            "apellidos": p.apellidos,
            "email": p.email,
            "telefono": p.telefono,
        }

    def get_dentista(self, cita: Cita) -> dict:
        u = cita.dentista.usuario
        return {"id": cita.dentista_id, "nombre": u.nombre, "apellidos": u.apellidos}

    def get_servicio(self, cita: Cita) -> dict:
        s = cita.servicio
        return {"id": s.id, "nombre": s.nombre, "duracion_min": s.duracion_min}


class CambioEstadoSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(choices=EstadoCita.choices)


class ReprogramarSerializer(serializers.Serializer):
    inicio = serializers.DateTimeField()


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
