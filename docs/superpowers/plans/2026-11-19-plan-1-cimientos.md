# Plan 1 — Cimientos: implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dejar listo el repo en GitHub con CI, los esqueletos del backend y del frontend, todo el modelo de datos en 3FN con sus restricciones, la autenticación del panel (sesión, activación y recuperación) y los datos de ejemplo.

**Architecture:** es un monorepo con `backend/` (Django + DRF, apps por dominio con capas `services.py` y `selectors.py`) y `frontend/` (Vite + React + TypeScript). El frontend reenvía `/api` al backend, así que la sesión usa cookies de Django + CSRF. En local se trabaja con el Postgres 18 instalado en Windows (sin Docker).

**Tech Stack:**
- Backend: Python 3.12, Django 5.2 LTS, Django REST Framework 3.16, psycopg 3, dj-database-url, python-dotenv, pytest + pytest-django y ruff.
- Frontend: Node 24, Vite (template `react-ts`), Tailwind CSS v4, Vitest + Testing Library, ESLint y Prettier.

**Spec:** `docs/superpowers/specs/2026-11-19-sonrisa-viva-design.md`

**Plan dentro de la serie:**
- **Plan 1 (este):** cimientos.
- **Plan 2:** la lógica del backend (CRUDs, disponibilidad, reservas, correos y reportes).
- **Plan 3:** el frontend público, que necesita los mockups aprobados.
- **Plan 4:** el panel en el frontend.
- **Plan 5:** el despliegue, las pruebas E2E y el README.
- **Fase 1 (mockups en Claude Design):** va en paralelo y no es código.

## Global Constraints

- **Python 3.12** (es lo que soporta Vercel): `py -3.12 -m venv backend/.venv`.
- `LANGUAGE_CODE = "es"`, `TIME_ZONE = "America/Costa_Rica"` y `USE_TZ = True`.
- Los nombres de modelos, campos, tablas, URLs y mensajes van en **español**, en `snake_case`. Las clases en `PascalCase`.
- La base de datos se configura solo con la variable `DATABASE_URL`. Local: `postgres://postgres:<clave>@localhost:5432/sonrisa_viva`, en `backend/.env` (ignorado por git). Se versiona `backend/.env.example`.
- Todas las rutas de la API cuelgan de `/api/v1/`.
- Los errores de la API tienen siempre la forma `{"detalle": str, "campos": {campo: [str]}}`; `campos` puede estar vacío.
- El admin de Django **no** se instala (no va en `INSTALLED_APPS`).
- Los precios en colones son enteros (`PositiveIntegerField`), sin decimales.
- Cada tarea = una issue = una rama `feat/<n>-<slug>` = un PR con `Closes #<n>`. Nada se sube directo a `main` después de la tarea 1.
- Los commits terminan con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Correo con mayúsculas o espacios en el login** (`" Admin@SonrisaViva.test "`): debe iniciar sesión igual. El correo se normaliza a minúsculas y sin espacios al guardar y al autenticar. → prueba en la tarea 8.
2. **Cuenta creada pero sin activar que intenta entrar:** debe dar el mismo mensaje genérico que una contraseña mala, sin revelar que la cuenta existe. → tarea 8.
3. **Enlace de activación usado dos veces:** la segunda vez debe fallar con el mensaje «El enlace no es válido o ya fue usado.». → tarea 9.
4. **«Olvidé mi contraseña» con un correo que no existe:** debe responder 204 igual que si existiera y no enviar nada, para no permitir adivinar correos. → tarea 9.
5. **Citas pegadas** (una termina 10:00 y otra empieza 10:00) y **una cita cancelada en la misma hora:** ninguna de las dos situaciones debe bloquear la reserva. → tarea 6.

---

### Task 1: Repo en GitHub, hoja de ruta e issues

**Files:**
- Create: `README.md`, `.gitignore`, `.editorconfig`, `.gitattributes` (`* text=auto eol=lf`).

- [ ] **Step 1:** Escribir un `README.md` mínimo con el nombre, el párrafo de intención del diseño, el stack y el estado («en construcción»). El `.gitignore` cubre Python (`.venv/`, `__pycache__/`, `.env`, `.pytest_cache/`, `.ruff_cache/`) y Node (`node_modules/`, `dist/`, `.env.local`). Commit en `main`.
- [ ] **Step 2:** Crear el repo público y subir `main`:
  `gh repo create marcovinir/sonrisa-viva --public --source . --push --description "Clínica dental ficticia: landing con citas en línea y panel (React + Django + PostgreSQL)"`.
- [ ] **Step 3:** Crear las etiquetas `backend`, `frontend`, `diseño`, `infra`, `docs` y `requiere-plan`. Esta última marca las issues de planes futuros: no se implementan hasta que su plan esté escrito.
- [ ] **Step 4:** Crear la issue **#1 «Hoja de ruta y convenciones»**, con:
  - Las convenciones de Global Constraints.
  - Los enlaces al diseño y a este plan.
  - Una casilla por cada issue en orden.
  - La regla: «al cerrar una issue, tachar su casilla aquí».
- [ ] **Step 5:** Crear una issue autosuficiente por cada una de las tareas 2 a 10 de este plan. Cada una lleva:
  - El texto de la tarea.
  - Sus archivos y su bloque de interfaces.
  - Sus criterios de aceptación (las pruebas).
  - La línea «Depende de #…».
- [ ] **Step 6:** Crear issues de fase, con la etiqueta `requiere-plan`, para:
  - **Mockups en Claude Design:** etiqueta `diseño`, sin `requiere-plan`. Lleva la lista de pantallas de la sección 12 del diseño.
  - **Plan 2:** backend de negocio.
  - **Plan 3:** frontend público.
  - **Plan 4:** panel.
  - **Plan 5:** despliegue, E2E y README.
- [ ] **Step 7:** Comprobar con `gh issue list` que aparecen la #1 y todas las demás. Actualizar la #1 con los números reales.

### Task 2: Esqueleto del backend

**Files:**
- Create: `backend/requirements.txt`, `backend/requirements-dev.txt`, `backend/pyproject.toml`, `backend/manage.py`, `backend/.env.example`
- Create: `backend/config/__init__.py`, `backend/config/settings/{__init__,base,local,produccion,pruebas}.py`, `backend/config/urls.py`, `backend/config/wsgi.py`
- Create: `backend/apps/__init__.py`, `backend/apps/comun/{__init__,apps,views,urls}.py`
- Test: `backend/apps/comun/tests/test_salud.py`

**Interfaces:**
- Produces: `GET /api/v1/salud/` → `200 {"estado": "ok"}`, sin autenticación.
- Produces: `DJANGO_SETTINGS_MODULE`:
  - `config.settings.local` en `manage.py`.
  - `config.settings.pruebas` en `pyproject.toml`, para pytest.
  - `config.settings.produccion` en Vercel.
- Produces: las apps viven en `apps.<nombre>` con `AppConfig.name = "apps.<nombre>"`.

- [ ] **Step 1: Escribir la prueba que falla**

```python
def test_salud_responde_ok(client):
    r = client.get("/api/v1/salud/")
    assert r.status_code == 200
    assert r.json() == {"estado": "ok"}
```

- [ ] **Step 2:** Crear el venv (`py -3.12 -m venv .venv`) e instalar las dependencias.
  - `requirements.txt`: `Django>=5.2,<5.3`, `djangorestframework>=3.16`, `psycopg[binary]>=3.2`, `dj-database-url`, `python-dotenv`.
  - `requirements-dev.txt`: `-r requirements.txt`, `pytest`, `pytest-django`, `ruff`.
  - Crear la base: `createdb -U postgres sonrisa_viva`.
  - Correr `pytest`. Se espera que FALLE (404 o error de importación).
- [ ] **Step 3:** Escribir la configuración.
  - **`base.py`:**
    - `INSTALLED_APPS`: `contenttypes`, `auth`, `sessions`, `django.contrib.postgres`, `rest_framework`, `apps.comun`.
    - `DATABASES = {"default": dj_database_url.config(conn_max_age=0)}` y `DISABLE_SERVER_SIDE_CURSORS = True`.
    - `REST_FRAMEWORK`: autenticación solo `SessionAuthentication`; permiso por defecto `IsAuthenticated`; renderer solo JSON.
    - Sesión: `SESSION_COOKIE_HTTPONLY=True`, `SESSION_COOKIE_SAMESITE="Lax"`, `CSRF_COOKIE_HTTPONLY=False`.
    - `CSRF_TRUSTED_ORIGINS` y `FRONTEND_URL` salen de variables de entorno.
  - **`local.py`:** carga `backend/.env` con python-dotenv y pone `DEBUG=True`.
  - **`pruebas.py`:** hereda de `local`.
  - **`produccion.py`:** `DEBUG=False`, cookies `Secure` y `SECRET_KEY` obligatoria desde el entorno.
  - **`config/urls.py`:** `path("api/v1/", include("apps.comun.urls"))`.
  - **La vista de salud:** `AllowAny`.
- [ ] **Step 4:** Correr `pytest -q` y `ruff check . && ruff format --check .`. Se espera que todo PASE y que no haya errores de lint.
- [ ] **Step 5:** Commit en `feat/2-esqueleto-backend` y PR `Closes #2`.

### Task 3: Esqueleto del frontend

**Files:**
- Create: `frontend/` (template `npm create vite@latest frontend -- --template react-ts`), `frontend/vite.config.ts`, `frontend/src/App.tsx`, `frontend/src/index.css`, `frontend/.prettierrc`
- Test: `frontend/src/App.test.tsx`

**Interfaces:**
- Produces: los scripts de npm `dev`, `build`, `lint`, `test` (`vitest run`) y `format`.
- Produces: en desarrollo, `/api` se reenvía a `http://localhost:8000` (`server.proxy`), igual que hará el rewrite de Vercel.

- [ ] **Step 1: Escribir la prueba que falla**

```tsx
it("muestra el nombre de la clínica", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /sonrisa viva/i })).toBeInTheDocument();
});
```

- [ ] **Step 2:** Instalar `tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event prettier`. Configurar Vitest (`environment: "jsdom"`, `setupFiles` con jest-dom). Correr `npm test`. Se espera que FALLE.
- [ ] **Step 3:** Reemplazar el demo del template por un `App` que muestre un `<h1>Sonrisa Viva</h1>` y el texto «Sitio en construcción». Agregar `@import "tailwindcss";` en `index.css` y `server.proxy` en `vite.config.ts`.
- [ ] **Step 4:** Correr `npm run lint && npm test && npm run build`. Se espera que todo PASE.
- [ ] **Step 5:** Commit en `feat/3-esqueleto-frontend` y PR `Closes #3`.

### Task 4: CI y protección de `main`

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: dos checks con estos nombres exactos: `backend` y `frontend`. La protección de rama los exige.

- [ ] **Step 1:** Escribir el job **`backend`**:
  - `ubuntu-latest`, servicio `postgres:18` con `POSTGRES_PASSWORD=postgres` y un *healthcheck*.
  - Python 3.12, `working-directory: backend`.
  - `DATABASE_URL=postgres://postgres:postgres@localhost:5432/sonrisa_viva`.
  - `pip install -r requirements-dev.txt`, `ruff check .`, `ruff format --check .` y `pytest -q`.
- [ ] **Step 2:** Escribir el job **`frontend`**: Node 24, `working-directory: frontend`, `npm ci`, `npm run lint`, `npm test` y `npm run build`.
- [ ] **Step 3:** Abrir el PR `Closes #4`. Comprobar con `gh pr checks` que `backend` y `frontend` pasan en verde, y fusionar.
- [ ] **Step 4:** Proteger `main`: exigir PR y los checks `backend` y `frontend`, sin permitir *force push*. Usar `gh api -X PUT repos/marcovinir/sonrisa-viva/branches/main/protection` con `required_status_checks.contexts=["backend","frontend"]`. Comprobar con `gh api .../protection`.

### Task 5: Cuentas: roles, permisos y usuario

**Files:**
- Create: `backend/apps/cuentas/{__init__,apps,models,managers,permisos}.py`
- Create: `backend/apps/cuentas/migrations/0001_initial.py` (generada) y `0002_roles_y_permisos.py` (datos)
- Modify: `backend/config/settings/base.py` (`AUTH_USER_MODEL = "cuentas.Usuario"` y agregar la app)
- Test: `backend/apps/cuentas/tests/test_modelos.py`

**Interfaces:**
- Produces: en `apps/cuentas/permisos.py`:
  - Los roles `ROL_ADMIN = "admin"` y `ROL_DENTISTA = "dentista"`.
  - Los permisos:
    - `USUARIOS_GESTIONAR = "usuarios.gestionar"`
    - `CATALOGO_GESTIONAR = "catalogo.gestionar"`
    - `DENTISTAS_GESTIONAR = "dentistas.gestionar"`
    - `BLOQUEOS_PROPIOS = "dentistas.bloqueos_propios"`
    - `CITAS_VER_TODAS = "citas.ver_todas"`
    - `CITAS_GESTIONAR_TODAS = "citas.gestionar_todas"`
    - `CITAS_VER_PROPIAS = "citas.ver_propias"`
    - `CITAS_MARCAR_ASISTENCIA = "citas.marcar_asistencia"`
    - `REPORTES_VER = "reportes.ver"`
  - `PERMISOS_POR_ROL: dict[str, set[str]]`: el admin tiene todos; el dentista tiene `{CITAS_VER_PROPIAS, CITAS_MARCAR_ASISTENCIA, BLOQUEOS_PROPIOS}`.
- Produces: los modelos `Rol(nombre: unique, descripcion)`, `Permiso(codigo: unique, descripcion)` y `RolPermiso(rol FK CASCADE, permiso FK CASCADE)` con `UniqueConstraint(rol, permiso, name="rol_permiso_unico")`.
- Produces: el modelo `Usuario(AbstractBaseUser)`:
  - Campos: `email` (único), `nombre`, `apellidos`, `rol` (FK PROTECT), `is_active` (por defecto `False`) y `creado_en`.
  - `USERNAME_FIELD="email"` y `REQUIRED_FIELDS=["nombre","apellidos"]`. **No** usa `PermissionsMixin`.
  - `Usuario.codigos_permiso() -> set[str]`: con caché en la instancia.
  - `Usuario.tiene_permiso(codigo: str) -> bool`.
  - La propiedad `Usuario.es_admin -> bool`.
- Produces: `UsuarioManager.crear_usuario(email, nombre, apellidos, rol: Rol | str, password: str | None = None, activo: bool = False) -> Usuario`:
  - Normaliza el correo con `strip().lower()`.
  - Si no hay contraseña, deja una contraseña inutilizable.
  - `create_user` y `create_superuser` delegan aquí; `create_superuser` usa el rol `admin` y `activo=True`.
- Produces: `normalizar_email(email: str) -> str` en `managers.py`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```python
def test_roles_sembrados_con_sus_permisos(db):
    assert set(Rol.objects.values_list("nombre", flat=True)) == {"admin", "dentista"}
    dentista = Rol.objects.get(nombre="dentista")
    assert {rp.permiso.codigo for rp in dentista.rolpermiso_set.all()} == PERMISOS_POR_ROL["dentista"]

def test_crear_usuario_normaliza_email_y_nace_inactivo(db):
    u = Usuario.objects.crear_usuario(" Ana@Clinica.TEST ", "Ana", "Mora", "dentista")
    assert u.email == "ana@clinica.test" and u.is_active is False and not u.has_usable_password()

def test_email_unico(db): ...  # crear dos con el mismo correo → IntegrityError

def test_tiene_permiso_por_rol(db):
    d = Usuario.objects.crear_usuario("d@x.test", "D", "X", "dentista")
    assert d.tiene_permiso("citas.ver_propias") and not d.tiene_permiso("reportes.ver")

def test_create_superuser_es_admin_activo(db):
    a = Usuario.objects.create_superuser("a@x.test", "clave-Segura-123", nombre="A", apellidos="B")
    assert a.es_admin and a.is_active and a.check_password("clave-Segura-123")
```

- [ ] **Step 2:** Correr `pytest apps/cuentas -q`. Se espera que FALLE (no existen los modelos).
- [ ] **Step 3:** Implementar los modelos y el manager. Generar `0001` con `makemigrations`. Escribir `0002` con `RunPython`: siembra los roles y los permisos desde `PERMISOS_POR_ROL` usando los modelos históricos (`apps.get_model`).
- [ ] **Step 4:** Recrear la base local (`dropdb`/`createdb`), porque es la primera migración con `AUTH_USER_MODEL`. Correr `python manage.py migrate` y `pytest -q`. Se espera que todo PASE.
- [ ] **Step 5:** Commit en `feat/5-cuentas` y PR `Closes #5`.

### Task 6: Modelo de la clínica y de las citas

**Files:**
- Create: `backend/apps/clinica/{__init__,apps,models}.py` + migraciones.
- Create: `backend/apps/citas/{__init__,apps,models}.py` + migraciones; la primera incluye `BtreeGistExtension()` antes de crear `Cita`.
- Test: `backend/apps/clinica/tests/test_modelos.py`, `backend/apps/citas/tests/test_modelos.py`

**Interfaces:**
- Produces: los modelos de **`clinica`**, con los campos y checks de la sección 6 del diseño:
  - `CategoriaServicio(nombre unique, orden)`.
  - `Servicio(categoria FK PROTECT, nombre, slug unique, descripcion, duracion_min, precio_colones, activo)`, con estos checks:
    - `servicio_duracion_valida`: `duracion_min > 0` y `duracion_min % 15 == 0`.
    - `servicio_precio_no_negativo`.
  - `Dentista(usuario OneToOne CASCADE, especialidad, biografia, foto_url, visible_en_web, servicios M2M through DentistaServicio)`.
  - `DentistaServicio(dentista, servicio)`, con la restricción única `dentista_servicio_unico`.
  - `HorarioSemanal(dentista FK CASCADE, dia_semana 0–6, hora_inicio, hora_fin)`, con los checks `horario_dia_valido` y `horario_inicio_antes_fin`.
  - `Bloqueo(dentista FK CASCADE, inicio, fin, motivo)`, con el check `bloqueo_inicio_antes_fin`.
- Produces: los modelos de **`citas`**:
  - `Paciente(nombre, apellidos, email unique, telefono)`. El correo se normaliza con `normalizar_email` en `save()`.
  - `EstadoCita(TextChoices)`: `CONFIRMADA="confirmada"`, `CANCELADA="cancelada"`, `COMPLETADA="completada"`, `NO_ASISTIO="no_asistio"`.
  - `Cita(paciente FK PROTECT, dentista FK PROTECT, servicio FK PROTECT, inicio, fin, precio_colones, estado default CONFIRMADA, notas_internas blank, token_gestion_hash CharField(64) unique, creado_en)`.
  - Las restricciones de `Cita`:
    - El check `cita_inicio_antes_fin`.
    - `ExclusionConstraint(name="cita_sin_traslape", expressions=[(TsTzRange("inicio","fin"), RangeOperators.OVERLAPS), ("dentista", RangeOperators.EQUAL)], condition=~Q(estado="cancelada"))`. `TsTzRange` es un `Func` con `function="TSTZRANGE"` y `output_field=DateTimeRangeField()`; el rango por defecto `[)` permite citas pegadas.
  - Índice `(dentista, inicio)`.

- [ ] **Step 1: Escribir las pruebas que fallan** (`citas/tests/test_modelos.py`, con un *fixture* `cita_base` que crea paciente, dentista y servicio, y `crear_cita(inicio, fin, estado=...)`)

```python
def test_cita_traslapada_mismo_dentista_falla(cita_base):
    crear_cita(h(9, 0), h(10, 0))
    with pytest.raises(IntegrityError):
        crear_cita(h(9, 30), h(10, 30))

def test_citas_pegadas_se_permiten(cita_base):
    crear_cita(h(9, 0), h(10, 0)); crear_cita(h(10, 0), h(11, 0))

def test_cita_cancelada_no_bloquea(cita_base):
    crear_cita(h(9, 0), h(10, 0), estado="cancelada"); crear_cita(h(9, 0), h(10, 0))

def test_otro_dentista_misma_hora_se_permite(cita_base): ...
def test_fin_antes_de_inicio_falla(cita_base): ...  # IntegrityError
```

  Más estas pruebas en `clinica` (cada una espera `IntegrityError`):
  - `test_duracion_no_multiplo_de_15_falla`.
  - `test_precio_negativo_falla`.
  - `test_horario_inicio_despues_de_fin_falla`.
  - `test_dentista_servicio_duplicado_falla`.

  La función `h(hh, mm)` arma un `datetime` con zona `America/Costa_Rica` en una fecha fija.
- [ ] **Step 2:** Correr `pytest apps/clinica apps/citas -q`. Se espera que FALLE.
- [ ] **Step 3:** Implementar los modelos, generar las migraciones y anteponer `BtreeGistExtension()` en `citas/0001`. Revisar `sqlmigrate citas 0001`: debe contener `EXCLUDE USING gist`.
- [ ] **Step 4:** Correr `pytest -q`. Se espera que todo PASE.
- [ ] **Step 5:** Commit en `feat/6-modelo-clinica-citas` y PR `Closes #6`.

### Task 7: Piezas comunes: permisos, errores, paginación y notificador

**Files:**
- Create: `backend/apps/comun/{permisos,errores,paginacion,notificaciones}.py`
- Modify: `backend/config/settings/base.py`:
  - `EXCEPTION_HANDLER`, `DEFAULT_PAGINATION_CLASS`.
  - `NOTIFICADOR = "apps.comun.notificaciones.NotificadorCorreo"`.
  - En `pruebas.py`: `NOTIFICADOR = "apps.comun.notificaciones.NotificadorMemoria"`.
  - En local: `EMAIL_BACKEND` de consola.
- Test: `backend/apps/comun/tests/test_permisos.py`, `test_errores.py`, `test_notificaciones.py`

**Interfaces:**
- Produces: `tiene_permiso(codigo: str) -> type[BasePermission]` crea una clase que exige un usuario autenticado con `usuario.tiene_permiso(codigo)`. Se usa así: `permission_classes = [tiene_permiso(USUARIOS_GESTIONAR)]`.
- Produces: `manejador_excepciones(exc, context) -> Response | None`. Convierte cualquier error de DRF a `{"detalle": str, "campos": dict}`:
  - Los `ValidationError` de campo van a `campos`, con `detalle = "Revisa los datos marcados."`.
  - Los demás usan su texto en `detalle` y `campos = {}`.
- Produces: `PaginacionEstandar(PageNumberPagination)` con `page_size=20`, `page_size_query_param="tamano"` y `max_page_size=100`.
- Produces: el `Protocol Notificador` con `enviar(destinatario: str, asunto: str, texto: str, html: str | None = None) -> None`, y sus implementaciones:
  - `NotificadorCorreo`, sobre `django.core.mail.send_mail`.
  - `NotificadorMemoria`, con la lista de clase `enviados: list[dict]` y `limpiar()`.
- Produces: `obtener_notificador() -> Notificador` instancia la clase indicada en `settings.NOTIFICADOR`.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `test_permiso_niega_a_anonimo`, `test_permiso_niega_sin_codigo` y `test_permiso_permite_con_codigo`: usan una vista DRF de prueba con `APIRequestFactory` y `force_authenticate`.
  - `test_error_validacion_tiene_forma_estandar`: la respuesta debe tener `"detalle"` y `campos == {"email": [...]}`.
  - `test_error_404_tiene_forma_estandar`.
  - `test_notificador_memoria_registra_envio`.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar los cuatro módulos y la configuración.
- [ ] **Step 4:** Correr `pytest -q`. Se espera que todo PASE.
- [ ] **Step 5:** Commit en `feat/7-comun` y PR `Closes #7`.

### Task 8: Sesión del panel: csrf, login, logout y yo

**Files:**
- Create: `backend/apps/cuentas/{serializers,views,urls}.py`
- Modify: `backend/config/urls.py`: agregar `path("api/v1/auth/", include("apps.cuentas.urls"))`.
- Modify: `base.py`: `DEFAULT_THROTTLE_RATES = {"login": "10/min"}`.
- Test: `backend/apps/cuentas/tests/test_sesion.py`

**Interfaces:**
- Produces:
  - `GET /api/v1/auth/csrf/` → `204`, con la cookie `csrftoken` (`ensure_csrf_cookie`).
  - `POST /api/v1/auth/login/ {email, password}`:
    - Si es válido → `200`, con un `UsuarioYo`.
    - Si la contraseña está mal, el usuario no existe o está inactivo → `400 {"detalle": "Correo o contraseña incorrectos.", "campos": {}}`.
    - Throttle con scope `login`.
  - `POST /api/v1/auth/logout/` → `204`.
  - `GET /api/v1/auth/yo/` → `200` con un `UsuarioYo`, o `403` si es anónimo.
- Produces: la forma de `UsuarioYo` es `{"id": int, "email": str, "nombre": str, "apellidos": str, "rol": "admin"|"dentista", "permisos": [str ordenados]}`.
- Las pruebas usan `APIClient(enforce_csrf_checks=True)`: piden `csrf/` primero y mandan `X-CSRFToken`.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `test_login_correcto_devuelve_usuario_y_permisos`.
  - `test_login_normaliza_email`: el correo `" Admin@SonrisaViva.TEST "` funciona.
  - `test_login_clave_incorrecta_mensaje_generico`.
  - `test_login_usuario_inactivo_mismo_mensaje`: el mensaje debe ser idéntico al de la prueba anterior.
  - `test_login_sin_csrf_rechazado`: responde `403`.
  - `test_yo_anonimo_403`.
  - `test_logout_cierra_sesion`: después del logout, `yo` responde `403`.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar las vistas con `django.contrib.auth.authenticate/login/logout`, normalizando el correo con `normalizar_email`.
- [ ] **Step 4:** Correr `pytest -q`. Se espera que todo PASE.
- [ ] **Step 5:** Commit en `feat/8-sesion-panel` y PR `Closes #8`.

### Task 9: Activación de cuentas y recuperación de contraseña

**Files:**
- Create: `backend/apps/cuentas/services.py`, `backend/apps/cuentas/correos.py` (los textos)
- Modify: `backend/apps/cuentas/{views,urls,serializers}.py`
- Test: `backend/apps/cuentas/tests/test_activacion.py`

**Interfaces:**
- Produces: `class TokenInvalido(Exception)`.
- Produces: `enlace_para(usuario: Usuario, tipo: Literal["activar","restablecer"]) -> str` devuelve `f"{settings.FRONTEND_URL}/panel/{tipo}/{uid}/{token}"`. Usa `urlsafe_base64_encode(force_bytes(pk))` y `default_token_generator`.
- Produces: `enviar_enlace_activacion(usuario: Usuario, notificador: Notificador | None = None) -> None`. El asunto es «Activa tu cuenta en Sonrisa Viva». El Plan 2 lo usa al crear usuarios.
- Produces: `enviar_enlace_recuperacion(email: str, notificador: Notificador | None = None) -> None`. Solo envía si existe un usuario **activo** con ese correo (normalizado); si no, termina sin hacer nada. El asunto es «Restablece tu contraseña».
- Produces: `establecer_contrasena(uid: str, token: str, password: str) -> Usuario`:
  - Valida con `validate_password`; si falla, lanza `ValidationError` con la clave `password`.
  - Si el token es inválido, lanza `TokenInvalido`.
  - Guarda la contraseña y pone `is_active=True`.
- Produces: los endpoints:
  - `POST auth/activar/` y `POST auth/restablecer/`, con `{uid, token, password}` → `204`. Si el token es inválido → `400 {"detalle": "El enlace no es válido o ya fue usado.", "campos": {}}`.
  - `POST auth/recuperar/ {email}` → siempre `204`. Throttle con scope `login`.

- [ ] **Step 1: Escribir las pruebas que fallan** (con `NotificadorMemoria`)
  - `test_activacion_envia_correo_con_enlace`: el texto contiene `/panel/activar/`.
  - `test_activar_con_enlace_valido_activa_y_permite_login`.
  - `test_enlace_usado_dos_veces_falla`: la segunda vez responde `400` con el mensaje exacto.
  - `test_contrasena_debil_rechazada`: responde `400` con `campos.password`.
  - `test_recuperar_correo_inexistente_204_sin_envio`.
  - `test_recuperar_usuario_inactivo_sin_envio`.
  - `test_restablecer_cambia_contrasena`.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar los servicios y las vistas. Las vistas son delgadas: validan con un serializer, llaman al servicio y traducen `TokenInvalido` a `400`.
- [ ] **Step 4:** Correr `pytest -q`. Se espera que todo PASE.
- [ ] **Step 5:** Commit en `feat/9-activacion-recuperacion` y PR `Closes #9`.

### Task 10: Datos de ejemplo (`sembrar`)

**Files:**
- Create: `backend/apps/comun/management/commands/sembrar.py`, `backend/apps/comun/semillas.py` (los datos como constantes)
- Test: `backend/apps/comun/tests/test_sembrar.py`

**Interfaces:**
- Produces: `python manage.py sembrar [--reiniciar]`:
  - Es idempotente: si ya hay servicios y no se pasa `--reiniciar`, avisa y no hace nada.
  - Con `--reiniciar`, borra las citas, los pacientes, los bloqueos, los horarios, los dentistas, los servicios, las categorías y los usuarios que no son admin.
  - Usa `random.Random(42)` para que los datos salgan siempre iguales.
- Crea:
  - El admin `admin@sonrisaviva.test`, activo, con la contraseña tomada de `SEMILLA_ADMIN_PASSWORD` (por defecto `Demo-Sonrisa-2026`, que se anota en `.env.example`).
  - **Las categorías:** Preventiva, Estética, Ortodoncia, Restauración y Cirugía.
  - **10 servicios**, con nombres, duraciones (múltiplos de 15) y precios en colones realistas.
  - **4 dentistas**, cada uno con su usuario activo, la contraseña de demostración, `foto_url` en `/equipo/<slug>.jpg` y de 3 a 6 servicios.
  - **Los horarios:** de lunes a viernes de 08:00 a 12:00 y de 13:00 a 17:00. Uno de los dentistas trabaja además el sábado de 08:00 a 12:00.
  - **Unas 200 citas** en los 180 días anteriores a hoy, dentro de los horarios y sin traslapes.
    - Se colocan de forma secuencial por dentista y día, avanzando una cita tras otra.
    - Los estados se reparten con pesos: completada 75 %, no_asistio 10 %, cancelada 15 %.
    - Unos 60 pacientes.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `test_sembrar_crea_datos`: `call_command("sembrar")` crea 5 categorías, 10 servicios, 4 dentistas y entre 180 y 220 citas; el admin puede autenticarse.
  - `test_sembrar_dos_veces_no_duplica`.
  - `test_sembrar_reiniciar_regenera`: después de reiniciar, el conteo de citas es el mismo y los admins se conservan.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar el comando dentro de `transaction.atomic()`. La restricción de exclusión de la tarea 6 garantiza que no haya traslapes.
- [ ] **Step 4:** Correr `pytest -q` y además `python manage.py sembrar` contra la base local. Se espera que todo PASE y que el comando imprima un resumen de lo que creó.
- [ ] **Step 5:** Commit en `feat/10-sembrar` y PR `Closes #10`. Al fusionar, tachar todas las casillas del Plan 1 en la issue #1.
