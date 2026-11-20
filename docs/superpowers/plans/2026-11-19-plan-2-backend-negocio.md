# Plan 2 — Backend de negocio: implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** la API completa del negocio: el catálogo, los usuarios, los dentistas con sus horarios y bloqueos, el cálculo de disponibilidad, la reserva pública sin cuenta, la gestión de la cita por enlace, el panel de citas con permisos por rol y los reportes.

**Architecture:** se mantienen las capas del Plan 1. Las vistas son delgadas (DRF `APIView` o `ViewSet`). Las escrituras y las reglas van en `services.py`, las lecturas en `selectors.py`. El motor de disponibilidad son funciones puras sobre intervalos, alimentadas por un selector. Hay dos interfaces inyectables: `Notificador`, que viene del Plan 1, y `EstrategiaAsignacion`, que es nueva. La «hora actual» se obtiene siempre con `apps.citas.reglas.ahora()`, y las pruebas la congelan con `time-machine`.

**Tech Stack:** el mismo del Plan 1. Se agrega `time-machine` a `requirements-dev.txt`.

**Spec:** `docs/superpowers/specs/2026-11-19-sonrisa-viva-design.md` (secciones 6 a 9)

## Global Constraints

- Todo lo del Plan 1 sigue vigente:
  - Rutas bajo `/api/v1/` y errores con la forma `{"detalle", "campos"}`.
  - Nombres en español, una issue = una rama = un PR, TDD y CI en verde.
- Las rutas públicas van en la raíz de `/api/v1/`. Las del panel cuelgan de `/api/v1/panel/` y de `/api/v1/panel/reportes/`.
- **Reglas de la agenda.** Son constantes en `apps/citas/reglas.py`, con estos valores exactos:
  - `PASO_MIN = 15`.
  - `ANTICIPACION_MIN = timedelta(hours=2)` y `ANTICIPACION_MAX_DIAS = 60`.
  - `LIMITE_CAMBIOS = timedelta(hours=24)`.
- **Transiciones de estado:** `confirmada → cancelada | completada | no_asistio`. Las otras tres son finales.
  - Solo se puede pasar a `completada` o `no_asistio` cuando `fin <= ahora()`.
- **Fechas:** todas las que van y vienen por la API van en ISO 8601 con zona (DRF lo hace por defecto con `USE_TZ`). El parámetro `fecha` es `YYYY-MM-DD` en hora de Costa Rica.
- **Throttles:** se agregan `"publico": "60/min"` y `"reservas": "10/min"` a `DEFAULT_THROTTLE_RATES`.
- **Mensajes de error exactos** (las pruebas los comparan):
  - `HORA_OCUPADA = "Esa hora acaba de ocuparse, elige otra."` (409)
  - `HORA_NO_DISPONIBLE = "Esa hora ya no está disponible."` (400)
  - `FUERA_DE_PLAZO = "Solo puedes cambiar o cancelar tu cita hasta 24 horas antes."` (400)
  - `TRANSICION_INVALIDA = "No se puede pasar una cita de «{actual}» a «{nuevo}»."` (400)
  - `CITA_NO_TERMINADA = "Solo puedes marcar asistencia cuando la cita ya terminó."` (400)
  - `AUTO_DESACTIVAR = "No puedes desactivar tu propia cuenta."` (400)
  - `ULTIMO_ADMIN = "Debe quedar al menos un administrador activo."` (400)
  - `BLOQUEO_CON_CITAS = "Hay {n} citas confirmadas en ese rango; cancélalas o reprográmalas primero."` (409)
  - `EN_USO = "No se puede borrar porque tiene {cosa} asociadas; desactívalo en su lugar."` (409)

## Review Focus

1. **Dos personas reservan la misma hora a la vez.** La segunda debe recibir un 409 con `HORA_OCUPADA`, nunca un 500. La `IntegrityError` de `cita_sin_traslape` se traduce en el servicio. → tarea 7.
2. **Reservar una hora que nunca se ofreció** (hecha a mano, fuera del horario, fuera de la rejilla de 15 min, a menos de 2 h o a más de 60 días): debe dar 400 con `HORA_NO_DISPONIBLE`, porque la reserva vuelve a validar contra el motor y no confía en el cliente. → tarea 7.
3. **Reprogramar una cita a una hora que se traslapa con ella misma** (de 9:00 a 9:15 en un servicio de 45 min): debe permitirse, porque el motor excluye la propia cita al calcular. → tarea 8.
4. **Un dentista desactivado o un servicio inactivo:** no deben aparecer ni en la lista pública ni en la disponibilidad, aunque tengan horario. → tareas 4 y 6.
5. **Un dentista que intenta ver o cambiar la cita o el bloqueo de otro:** debe recibir 404, no 403, para no revelar que existe. Los *querysets* se filtran por dueño. → tareas 5 y 9.

---

### Task 1: Issues del Plan 2

- [ ] **Step 1:** Crear una issue autosuficiente por cada una de las tareas 2 a 10, con el mismo formato que las del Plan 1 (restricciones globales, la tarea, «Depende de», y el Review Focus en las tareas 5, 6, 7, 8 y 9). Etiqueta `backend`.
- [ ] **Step 2:** En la #1, agregar una sección «Plan 2 — Backend de negocio» con sus casillas, y enlazar este plan. En la #12, quitar la etiqueta `requiere-plan` y comentar el enlace al plan y las issues creadas.
- [ ] **Step 3:** Comprobar con `gh issue list --label backend --state open` que aparecen las 9 issues nuevas.

### Task 2: Catálogo: categorías y servicios

**Files:**
- Create: `backend/apps/clinica/{serializers,selectors,services,views,urls}.py`
- Create: `backend/apps/comun/pruebas.py`, con ayudas para las pruebas: `cliente_de(usuario) -> APIClient` (hace `force_login`) y `crear_admin(email="admin@x.test") -> Usuario`
- Modify: `backend/config/urls.py`: agregar `path("api/v1/", include("apps.clinica.urls"))`
- Modify: `backend/requirements-dev.txt` (+ `time-machine`) y `base.py` (los throttles)
- Test: `backend/apps/clinica/tests/test_catalogo.py`

**Interfaces:**
- Produces: las rutas públicas.
  - `GET /api/v1/servicios/`: sin paginar, solo los activos, ordenados por categoría y nombre. Cada servicio es `ServicioPublico {id, nombre, slug, descripcion, duracion_min, precio_colones, categoria: {id, nombre}}`.
  - `GET /api/v1/categorias/`: `[{id, nombre, orden}]`, solo las que tienen al menos un servicio activo.
  - Throttle `publico`.
- Produces: las rutas del panel, con un router en `/api/v1/panel/` y el permiso `CATALOGO_GESTIONAR`.
  - `panel/categorias/`: CRUD completo.
  - `panel/servicios/`: CRUD completo, con el filtro `?categoria=` y `?activo=true|false`. Si no llega `slug`, se genera con `slugify(nombre)`, y si ya existe se le agrega `-2`, `-3`, etc.
  - `DELETE` de un servicio con citas, o de una categoría con servicios → 409 con `EN_USO`; `{cosa}` es «citas» o «servicios». Se detecta capturando `ProtectedError`.
- Produces: `services.crear_servicio(datos: dict) -> Servicio` y `services.borrar(obj) -> None`. `borrar` traduce `ProtectedError` a `Conflicto(mensaje)`.
- Produces: `apps.comun.errores.Conflicto(APIException)` con `status_code = 409`. Se reutiliza en todo el plan.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `test_publico_lista_solo_servicios_activos`.
  - `test_publico_no_requiere_sesion`.
  - `test_panel_servicios_exige_permiso`: el dentista recibe 403 y el anónimo 403.
  - `test_admin_crea_servicio_con_slug_generado`: el nombre «Limpieza dental» produce el slug `limpieza-dental`, y la segunda vez `limpieza-dental-2`.
  - `test_duracion_invalida_da_400_con_campo`: una duración de 50 da 400 con `campos.duracion_min`. El serializer valida el múltiplo de 15 antes de que llegue a la base de datos.
  - `test_borrar_servicio_con_citas_da_409`.
  - `test_borrar_categoria_con_servicios_da_409`.
  - `test_admin_desactiva_servicio_y_desaparece_del_publico`.
- [ ] **Step 2:** Correr `pytest apps/clinica -q`. Se espera que FALLE.
- [ ] **Step 3:** Implementar los serializers (`ServicioPublicoSerializer`, `CategoriaSerializer` y `ServicioPanelSerializer` con `categoria` como id), los `ModelViewSet` del panel con `permission_classes = [tiene_permiso(CATALOGO_GESTIONAR)]`, y las vistas públicas `ListAPIView` con `AllowAny`.
- [ ] **Step 4:** Correr `pytest -q`. Se espera que todo PASE.
- [ ] **Step 5:** Abrir el PR con `Closes #<issue>`.

### Task 3: Usuarios del panel

**Files:**
- Modify: `backend/apps/cuentas/{services,serializers,views,urls}.py`
- Create: `backend/apps/cuentas/selectors.py`
- Modify: `backend/config/urls.py`: agregar `path("api/v1/panel/", include("apps.cuentas.urls_panel"))`, en el archivo nuevo `apps/cuentas/urls_panel.py`
- Test: `backend/apps/cuentas/tests/test_usuarios_panel.py`

**Interfaces:**
- Produces: `panel/usuarios/`, con el permiso `USUARIOS_GESTIONAR`.
  - Admite `GET` (lista paginada, con filtros `?rol=` y `?activo=` y búsqueda `?q=` por nombre o correo), `POST`, `GET {id}` y `PATCH {id}`. El `DELETE` responde 405.
  - `UsuarioPanel`: `{id, email, nombre, apellidos, rol, is_active, activado: bool, creado_en}`. `activado` es `has_usable_password()`.
  - El `PATCH` solo cambia `nombre` y `apellidos`. El rol y el correo no se pueden editar.
- Produces: las acciones `POST panel/usuarios/{id}/desactivar/`, `.../reactivar/` y `.../reenviar-activacion/`. Las tres responden 200 con `UsuarioPanel`.
- Produces: `services.crear_usuario_panel(email, nombre, apellidos, rol: str, notificador=None) -> Usuario`:
  - Llama a `crear_usuario`, que lo deja inactivo.
  - Si el rol es `dentista`, crea también un `Dentista` vacío con `visible_en_web=False`. Así no aparece en la web hasta que el admin complete su perfil.
  - Llama a `enviar_enlace_activacion`.
  - Si el correo está duplicado → 400 con `campos.email = ["Ya existe un usuario con ese correo."]`.
- Produces: `services.desactivar_usuario(usuario, hecho_por) -> Usuario`:
  - Si es uno mismo → `ValidationError(AUTO_DESACTIVAR)`.
  - Si es el último admin activo → `ValidationError(ULTIMO_ADMIN)`.
  - Pone `is_active=False`. Si la cuenta nunca se activó, vuelve a llamar `set_unusable_password()` para invalidar el enlace pendiente (nota de la #12).
- Produces: `services.reactivar_usuario(usuario) -> Usuario`:
  - Si tiene contraseña usable, pone `is_active=True`.
  - Si no, no lo activa y reenvía el enlace de activación.
- Produces: `services.reenviar_activacion(usuario) -> None`. Si el usuario ya está activado → `ValidationError("Este usuario ya activó su cuenta.")`.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `test_crear_dentista_envia_activacion_y_crea_perfil_oculto`.
  - `test_crear_admin_no_crea_perfil`.
  - `test_correo_duplicado_400`.
  - `test_no_puede_desactivarse_a_si_mismo`.
  - `test_no_desactiva_ultimo_admin`.
  - `test_desactivar_invalida_enlace_pendiente`: se crea un usuario, se toma el enlace del `NotificadorMemoria`, se desactiva, y `POST auth/activar/` responde 400.
  - `test_reactivar_usuario_activado`.
  - `test_reactivar_pendiente_reenvia_enlace`.
  - `test_delete_no_permitido_405`.
  - `test_dentista_no_gestiona_usuarios_403`.
  - `test_busqueda_q_por_correo`.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar `UsuarioPanelViewSet`, con `GenericViewSet` y los mixins de list, create, retrieve y update, más las `@action` de desactivar, reactivar y reenviar.
- [ ] **Step 4:** Correr `pytest -q`. Se espera que todo PASE.
- [ ] **Step 5:** Abrir el PR.

### Task 4: Dentistas: perfil, servicios y horario semanal

**Files:**
- Modify: `backend/apps/clinica/{serializers,selectors,services,views,urls}.py`
- Test: `backend/apps/clinica/tests/test_dentistas.py`

**Interfaces:**
- Produces: `GET /api/v1/dentistas/`, público, con el filtro `?servicio=<id>`.
  - Solo incluye los dentistas con `visible_en_web=True` y `usuario.is_active=True`.
  - Cada uno es `DentistaPublico {id, nombre, apellidos, especialidad, biografia, foto_url, servicios: [ids de servicios activos]}`.
- Produces: `panel/dentistas/`, con el permiso `DENTISTAS_GESTIONAR`.
  - Admite `GET` (lista y detalle) y `PATCH`. No hay `POST` ni `DELETE`, porque los dentistas nacen al crear el usuario.
  - `DentistaPanel`: `{id, usuario: {id, email, nombre, apellidos, is_active}, especialidad, biografia, foto_url, visible_en_web, servicios: [ids], horarios: [{dia_semana, hora_inicio, hora_fin}]}`.
  - El `PATCH` acepta `especialidad`, `biografia`, `foto_url`, `visible_en_web` y `servicios` (una lista de ids que reemplaza a la anterior).
- Produces: `PUT panel/dentistas/{id}/horarios/` con `[{dia_semana, hora_inicio, hora_fin}]`. Reemplaza el horario completo dentro de una transacción, a través de `services.reemplazar_horario(dentista, bloques: list[dict]) -> list[HorarioSemanal]`, que valida:
  - `hora_inicio < hora_fin`.
  - Que los minutos sean múltiplos de 15.
  - Que no haya bloques traslapados en el mismo día. Si los hay → 400 con `campos.horarios = ["Los bloques del {día} se traslapan."]`, donde `{día}` es el nombre del día en minúscula.
- Produces: `GET panel/mi-perfil/`, para cualquier usuario autenticado que tenga perfil de dentista. Devuelve su propio `DentistaPanel`; si no tiene perfil → 404.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `test_publico_oculta_dentista_inactivo_o_no_visible`.
  - `test_publico_filtra_por_servicio`.
  - `test_publico_no_lista_servicios_inactivos_del_dentista`.
  - `test_admin_actualiza_perfil_y_servicios`.
  - `test_reemplazar_horario_valido`.
  - `test_horario_traslapado_400`: los bloques del lunes 8–12 y 11–13 dan 400 con «Los bloques del lunes se traslapan.».
  - `test_horario_fuera_de_rejilla_400`: un bloque de 8:10 da 400.
  - `test_dentista_ve_mi_perfil`.
  - `test_dentista_no_entra_a_panel_dentistas_403`.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar los serializers, el selector `dentistas_publicos(servicio_id: int | None) -> QuerySet[Dentista]` (con `prefetch_related` de los servicios activos) y las vistas.
- [ ] **Step 4:** Correr `pytest -q`. Se espera que todo PASE.
- [ ] **Step 5:** Abrir el PR.

### Task 5: Bloqueos de agenda

**Files:**
- Modify: `backend/apps/comun/permisos.py`: agregar `tiene_alguno(*codigos: str) -> type[BasePermission]`
- Modify: `backend/apps/clinica/{serializers,services,views,urls}.py`
- Test: `backend/apps/clinica/tests/test_bloqueos.py`, `backend/apps/comun/tests/test_permisos.py` (+1 prueba)

**Interfaces:**
- Produces: `tiene_alguno(*codigos)` deja pasar si el usuario tiene **alguno** de los códigos.
- Produces: `panel/bloqueos/`, un CRUD con el permiso `tiene_alguno(DENTISTAS_GESTIONAR, BLOQUEOS_PROPIOS)`.
  - `Bloqueo`: `{id, dentista, inicio, fin, motivo}`.
  - **Queryset:** con `DENTISTAS_GESTIONAR` ve todos, con el filtro opcional `?dentista=`. Si no, ve solo los de `request.user.dentista`, así que los de otro dentista dan 404.
  - Cuando lo crea un dentista, `dentista` se fuerza a su propio perfil y se ignora lo que mande.
  - Filtros `?desde=` y `?hasta=` (fechas).
- Produces: `services.guardar_bloqueo(dentista, inicio, fin, motivo, bloqueo=None) -> Bloqueo`:
  - Valida que `inicio < fin`.
  - Cuenta las citas `confirmada` del dentista que se traslapan con `[inicio, fin)`. Si hay → `Conflicto(BLOQUEO_CON_CITAS.format(n=...))`.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `test_tiene_alguno_permite_con_cualquiera`.
  - `test_admin_crea_bloqueo_para_cualquier_dentista`.
  - `test_dentista_crea_bloqueo_propio_aunque_mande_otro_dentista`.
  - `test_dentista_no_ve_bloqueo_ajeno_404`.
  - `test_bloqueo_sobre_cita_confirmada_409`: el mensaje incluye «1 citas».
  - `test_bloqueo_sobre_cita_cancelada_permitido`.
  - `test_bloqueo_fin_antes_inicio_400`.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar el permiso, el servicio y el `ModelViewSet` con `get_queryset` filtrado por dueño.
- [ ] **Step 4:** Correr `pytest -q`. Se espera que todo PASE.
- [ ] **Step 5:** Abrir el PR.

### Task 6: Motor de disponibilidad

**Files:**
- Create: `backend/apps/citas/reglas.py`: las constantes, `ahora() -> datetime` (envuelve `timezone.now()`), `fecha_local(dt: datetime) -> date` (la fecha en hora de Costa Rica) y los mensajes de error.
- Create: `backend/apps/citas/disponibilidad.py`: funciones puras.
- Create: `backend/apps/citas/selectors.py`, `backend/apps/citas/{serializers,views,urls}.py`
- Modify: `backend/config/urls.py`: agregar `path("api/v1/", include("apps.citas.urls"))`
- Test: `backend/apps/citas/tests/test_disponibilidad.py` (funciones puras), `test_disponibilidad_api.py`

**Interfaces:**
- Produces (en `disponibilidad.py`, puras y sin acceso a la base de datos):
  - `Intervalo = tuple[datetime, datetime]`.
  - `horas_libres(bloques: list[Intervalo], ocupados: list[Intervalo], duracion: timedelta, desde: datetime, hasta: datetime, paso: timedelta) -> list[datetime]`. Devuelve los inicios candidatos.
- Produces (en `selectors.py`):
  - `HoraLibre = TypedDict("HoraLibre", {"inicio": datetime, "fin": datetime, "dentistas": list[int]})`.
  - `disponibilidad(servicio: Servicio, fecha: date, dentista: Dentista | None = None, excluir_cita: Cita | None = None) -> list[HoraLibre]`.
  - `dias_con_disponibilidad(servicio, desde: date, hasta: date, dentista=None) -> list[date]`.
- Produces (rutas públicas, con throttle `publico`):
  - `GET /api/v1/disponibilidad/?servicio=&fecha=&dentista=` → `{"fecha": "YYYY-MM-DD", "horas": [HoraLibre]}`.
    - Si el servicio no existe o está inactivo → 404.
    - Si la `fecha` tiene un formato inválido → 400 con `campos.fecha`.
  - `GET /api/v1/disponibilidad/dias/?servicio=&desde=&hasta=&dentista=` → `{"dias": ["YYYY-MM-DD", ...]}`. El rango se recorta a [hoy, hoy + 60 días].

**Algoritmo de `horas_libres`** (no lo determina la firma):

```python
candidatos = []
for b_ini, b_fin in bloques:
    t = max(b_ini, techo_a_paso(desde, paso))   # alinear a la rejilla de 15 min
    while t + duracion <= min(b_fin, hasta):
        fin = t + duracion
        if not any(t < o_fin and o_ini < fin for o_ini, o_fin in ocupados):
            candidatos.append(t)
        t += paso
return candidatos
```

**El selector `disponibilidad` arma los datos:**
- **Candidatos:** si `dentista` es `None`, entran todos los que hacen el servicio, están activos y son visibles. Si no, solo ese dentista, y debe hacer el servicio; si no lo hace → lista vacía.
- **`bloques`:** los `HorarioSemanal` del `fecha.weekday()`, combinados con la fecha en hora de Costa Rica.
- **`ocupados`:** las citas no canceladas de ese día (menos `excluir_cita`) más los bloqueos que se cruzan con el día.
- **Límites:** `desde = ahora() + ANTICIPACION_MIN`, `hasta = (hoy + ANTICIPACION_MAX_DIAS)` al final del día y `paso = PASO_MIN`.
- **Unión:** se juntan las horas por `inicio`, y `dentistas` lleva los ids de quienes están libres, ordenados.
- **Consultas:** una por tabla (horarios, citas, bloqueos) para todos los candidatos, no una por dentista.

- [ ] **Step 1: Escribir las pruebas que fallan** (`test_disponibilidad.py`, funciones puras)
  - `test_rejilla_de_15_en_un_bloque`: un bloque de 8:00 a 9:00 con un servicio de 30 min da `[8:00, 8:15, 8:30]`.
  - `test_excluye_ocupados_y_permite_pegadas`: con 8:30–9:00 ocupado, el bloque de 8–10 con 30 min no incluye 8:15 ni 8:30, pero sí 8:00 y 9:00.
  - `test_respeta_desde_alineando_a_la_rejilla`: con `desde` a las 8:07, la primera hora es 8:15.
  - `test_servicio_mas_largo_que_el_bloque_no_da_horas`.
- [ ] **Step 2:** Escribir las pruebas que fallan en `test_disponibilidad_api.py`. Usan `time_machine.travel(h(7, 0, dia=1))`, es decir, el domingo anterior.
  - `test_dia_sin_horario_vacio`.
  - `test_lunes_con_horario_devuelve_horas_y_dentista`.
  - `test_excluye_citas_y_bloqueos`.
  - `test_anticipacion_minima_2h`: viajando al lunes a las 9:05, la primera hora es 11:15.
  - `test_mas_de_60_dias_vacio`.
  - `test_cualquiera_une_dentistas`: dos dentistas libres a la misma hora dan `dentistas == [a.id, b.id]`.
  - `test_dentista_inactivo_o_no_visible_no_aparece`.
  - `test_servicio_inactivo_404`.
  - `test_fecha_invalida_400`.
  - `test_dias_con_disponibilidad_en_rango`.
- [ ] **Step 3:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 4:** Implementar `reglas.py`, `disponibilidad.py`, el selector y las vistas.
- [ ] **Step 5:** Correr `pytest -q`. Se espera que todo PASE.
- [ ] **Step 6:** Abrir el PR.

### Task 7: Reserva pública y correo de confirmación

**Files:**
- Create: `backend/apps/citas/{services,asignacion,tokens,correos,formato}.py`
- Modify: `backend/apps/citas/{serializers,views,urls}.py`
- Test: `backend/apps/citas/tests/test_reserva.py`, `test_formato.py`

**Interfaces:**
- Produces (en `tokens.py`): `generar_token() -> tuple[str, str]` devuelve `(token, hash)` con `secrets.token_urlsafe(32)` y SHA-256 en hexadecimal. `hash_token(token: str) -> str`.
- Produces (en `asignacion.py`):
  - El `Protocol EstrategiaAsignacion` con `elegir(candidatos: list[Dentista], dia: date) -> Dentista`.
  - `MenosCitasDelDia`: elige al dentista con menos citas no canceladas ese día; si empatan, al de menor `id`.
- Produces (en `formato.py`):
  - `fecha_hora_es(dt: datetime) -> str` produce, en hora de Costa Rica, textos como «lunes 2 de marzo de 2026, 9:00 a. m.» y «… 1:30 p. m.». Los nombres de días y meses están escritos a mano.
  - `colones(n: int) -> str` produce «₡25 000», con espacio fino como separador de miles: `f"₡{n:,}".replace(",", " ")`.
- Produces: `services.reservar(servicio_id: int, inicio: datetime, paciente: dict, dentista_id: int | None = None, estrategia: EstrategiaAsignacion | None = None, notificador: Notificador | None = None) -> tuple[Cita, str]`. Devuelve la cita y el token en claro. Hace esto:
  1. Calcula `disponibilidad(servicio, fecha_local(inicio), dentista)` y busca la hora con ese `inicio` exacto. Si no está → `ValidationError(HORA_NO_DISPONIBLE)`.
  2. Elige al dentista con la estrategia entre los `dentistas` libres de esa hora (si se pidió uno, es ese).
  3. Hace `update_or_create` del `Paciente` por correo normalizado, actualizando nombre, apellidos y teléfono.
  4. Crea la `Cita` con `fin = inicio + duración` y `precio_colones` del servicio, dentro de `transaction.atomic()`. Si salta la `IntegrityError` de la exclusión → `Conflicto(HORA_OCUPADA)`.
  5. Envía el correo «Tu cita en Sonrisa Viva está confirmada». Lleva el servicio, el dentista, `fecha_hora_es`, el precio y el enlace `{FRONTEND_URL}/cita/{token}`.
- Produces: `POST /api/v1/citas/`, público, con throttle `reservas`.
  - Recibe `{servicio, inicio, dentista?: id|null, paciente: {nombre, apellidos, email, telefono}}`.
  - Responde 201 con `ResumenCita {id, servicio: {id, nombre}, dentista: {id, nombre, apellidos}, inicio, fin, precio_colones, estado, paciente: {nombre, email}}`.
  - **El token no se devuelve:** solo viaja en el correo.
  - El teléfono se valida con el regex `^[0-9+\-\s]{8,20}$`.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `test_fecha_hora_es_manana_y_tarde`.
  - `test_colones_con_separador`.
  - `test_reserva_crea_cita_paciente_y_envia_correo`: el correo contiene `/cita/` y el `token_gestion_hash` es el SHA-256 del token del enlace.
  - `test_reserva_reutiliza_paciente_por_correo_y_actualiza_telefono`.
  - `test_reserva_cualquiera_asigna_dentista_con_menos_citas`.
  - `test_reserva_cualquiera_empate_menor_id`.
  - `test_reserva_hora_inventada_400`: cubre fuera de rejilla, fuera de horario y a menos de 2 h; todas dan `HORA_NO_DISPONIBLE`.
  - `test_reserva_hora_ocupada_concurrente_409`: se parchea el selector de disponibilidad para que diga que está libre mientras ya existe una cita; debe dar `HORA_OCUPADA`.
  - `test_reserva_dentista_que_no_hace_el_servicio_400`.
  - `test_reserva_paciente_invalido_400_con_campos`.
  - `test_respuesta_no_incluye_token`.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar, con los textos de correo en `correos.py`.
- [ ] **Step 4:** Correr `pytest -q`. Se espera que todo PASE.
- [ ] **Step 5:** Abrir el PR.

### Task 8: Gestión de la cita por enlace

**Files:**
- Modify: `backend/apps/citas/{services,serializers,views,urls,correos}.py`
- Test: `backend/apps/citas/tests/test_gestion.py`

**Interfaces:**
- Consumes: `hash_token`, `disponibilidad(..., excluir_cita=)`, `fecha_hora_es`.
- Produces: `/api/v1/citas/gestion/<token>/`, público, con throttle `publico`. La cita se busca por `token_gestion_hash = hash_token(token)`; si no existe → 404.
  - `GET` → `ResumenCita` más `puede_cambiar: bool`, que es `estado == confirmada` y `inicio - ahora() >= LIMITE_CAMBIOS`.
  - `PATCH {inicio}` reprograma: mismo servicio y mismo dentista, con la nueva hora validada contra `disponibilidad(..., excluir_cita=cita)`. Responde 200 con `ResumenCita` y envía el correo «Tu cita fue reprogramada».
  - `DELETE` cancela: pone `estado = cancelada` y envía el correo «Tu cita fue cancelada». Responde 204.
- Produces: `services.reprogramar(cita, nuevo_inicio, notificador=None) -> Cita` y `services.cancelar_por_paciente(cita, notificador=None) -> Cita`. Las dos exigen:
  - `estado == confirmada`; si no → `ValidationError("Esta cita ya no se puede modificar.")`.
  - El plazo: si quedan menos de 24 h → `ValidationError(FUERA_DE_PLAZO)`.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `test_ver_cita_por_token`.
  - `test_token_desconocido_404`.
  - `test_reprogramar_a_hora_libre`.
  - `test_reprogramar_solapando_consigo_misma_permitido`: de 9:00 a 9:15 con un servicio de 45 min.
  - `test_reprogramar_a_hora_ocupada_400`.
  - `test_cambios_a_menos_de_24h_400`.
  - `test_cancelar_libera_la_hora`: después de cancelar, esa hora vuelve a aparecer en la disponibilidad.
  - `test_cancelada_no_se_puede_reprogramar_400`.
  - `test_correos_de_cambio_y_cancelacion`.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Correr `pytest -q`. Se espera que todo PASE.
- [ ] **Step 5:** Abrir el PR.

### Task 9: Panel de citas

**Files:**
- Modify: `backend/apps/citas/{selectors,services,serializers,views}.py`
- Create: `backend/apps/citas/urls_panel.py`; incluirlo en `config/urls.py` bajo `api/v1/panel/`
- Test: `backend/apps/citas/tests/test_panel_citas.py`

**Interfaces:**
- Produces: `panel/citas/`, con el permiso `tiene_alguno(CITAS_VER_TODAS, CITAS_VER_PROPIAS)`.
  - Admite `GET` (lista paginada y detalle) y `PATCH {notas_internas}`. No hay `POST` ni `DELETE`.
  - Filtros: `?desde=YYYY-MM-DD`, `?hasta=YYYY-MM-DD` (ambos incluidos, en hora local), `?dentista=`, `?estado=`, `?servicio=` y `?q=` (busca por nombre o correo del paciente). Se ordena por `inicio`.
  - **Queryset:** con `CITAS_VER_TODAS` ve todas. Si no, solo las de `request.user.dentista`, así que las de otro dentista dan 404.
  - `CitaPanel`: `{id, inicio, fin, estado, precio_colones, notas_internas, paciente: {id, nombre, apellidos, email, telefono}, dentista: {id, nombre, apellidos}, servicio: {id, nombre, duracion_min}, creado_en}`.
- Produces: `POST panel/citas/{id}/estado/ {estado}` → 200 con `CitaPanel`, mediante `services.cambiar_estado(cita, nuevo: str, hecho_por: Usuario, notificador=None) -> Cita`. Las reglas:
  - **Transiciones:** se validan las de Global Constraints; si no es válida → `TRANSICION_INVALIDA`.
  - **Pasar a `completada` o `no_asistio`:**
    - Exige `CITAS_MARCAR_ASISTENCIA`.
    - El dentista solo puede hacerlo en sus propias citas.
    - Solo cuando `fin <= ahora()`; si no → `CITA_NO_TERMINADA`.
  - **Pasar a `cancelada`:**
    - Exige `CITAS_GESTIONAR_TODAS`; si no la tiene → 403.
    - Avisa al paciente con el correo «Tu cita fue cancelada por la clínica».
- Produces: el selector `citas_panel(usuario, filtros: dict) -> QuerySet[Cita]`, con `select_related` de paciente, dentista con su usuario, y servicio.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `test_admin_ve_todas_dentista_solo_las_suyas`.
  - `test_dentista_cita_ajena_404`.
  - `test_filtros_fecha_estado_dentista_q`.
  - `test_marcar_completada_despues_de_terminar`.
  - `test_marcar_completada_antes_de_terminar_400`.
  - `test_transicion_desde_final_400`: pasar de `completada` a `cancelada` da 400.
  - `test_dentista_no_puede_cancelar_403`.
  - `test_admin_cancela_y_notifica_paciente`.
  - `test_editar_notas_internas`.
  - `test_lista_sin_n_mas_1`: con `django_assert_max_num_queries(5)` y 20 citas.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Correr `pytest -q`. Se espera que todo PASE.
- [ ] **Step 5:** Abrir el PR.

### Task 10: Reportes

**Files:**
- Create: `backend/apps/reportes/{__init__,apps,selectors,views,urls}.py` y `tests/test_reportes.py`
- Modify: `INSTALLED_APPS` y `config/urls.py` (`api/v1/panel/reportes/`)

**Interfaces:**
- Produces: varios `GET`, todos con el permiso `REPORTES_VER` y los parámetros `?desde=&hasta=` (fechas locales, ambas incluidas). Por defecto, `desde` es el primer día del mes de hace 5 meses y `hasta` es hoy.
  - `panel/reportes/citas-por-servicio/` → `[{id, nombre, total, completadas, ingresos_colones}]`, ordenado por `total` de mayor a menor.
  - `panel/reportes/citas-por-categoria/` → `[{id, nombre, total, completadas, ingresos_colones}]`.
  - `panel/reportes/citas-por-dentista/` → `[{id, nombre, apellidos, total, completadas, no_asistio, ingresos_colones}]`.
  - `panel/reportes/citas-por-mes/` → `[{mes: "YYYY-MM", total, completadas, canceladas, no_asistio}]`.
    - Usa `TruncMonth("inicio", tzinfo=CR)` y ordena por mes.
    - Incluye los meses sin citas con ceros, para que el gráfico no tenga huecos.
  - `panel/reportes/tasa-asistencia/` → `{completadas, no_asistio, tasa}`. La fórmula es `tasa = round(completadas / (completadas + no_asistio), 3)`, o `null` si no hay ninguna.
- **Cálculo de los campos:**
  - `total` no cuenta las canceladas.
  - `ingresos_colones` es la suma de `precio_colones` de las `completada`.
  - Todo se calcula con `annotate`, `Count(filter=Q(...))` y `Sum(filter=...)`, en una sola consulta por endpoint.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `test_por_servicio_cuenta_y_suma_ingresos`.
  - `test_por_categoria`.
  - `test_por_dentista`.
  - `test_por_mes_rellena_meses_vacios`.
  - `test_tasa_asistencia_y_null_sin_datos`.
  - `test_rango_fechas_filtra`.
  - `test_dentista_sin_permiso_403`.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar las funciones de `selectors.py`, una por reporte con la firma `(desde: date, hasta: date) -> list[dict] | dict`, y las vistas delgadas.
- [ ] **Step 4:** Correr `pytest -q`. Se espera que todo PASE. Correr además `python manage.py sembrar --reiniciar`, pedir los 5 endpoints con la sesión del admin y comprobar que traen datos.
- [ ] **Step 5:** Abrir el PR. Al fusionar, tachar el Plan 2 en la #1 y cerrar la #12.
