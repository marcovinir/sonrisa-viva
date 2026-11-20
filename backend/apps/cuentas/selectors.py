from django.db.models import Q, QuerySet

from .models import Usuario


def usuarios_panel(filtros) -> QuerySet[Usuario]:
    qs = Usuario.objects.select_related("rol").order_by("nombre", "apellidos")
    if rol := filtros.get("rol"):
        qs = qs.filter(rol__nombre=rol)
    if (activo := filtros.get("activo")) in ("true", "false"):
        qs = qs.filter(is_active=activo == "true")
    if q := (filtros.get("q") or "").strip():
        qs = qs.filter(Q(email__icontains=q) | Q(nombre__icontains=q) | Q(apellidos__icontains=q))
    return qs
