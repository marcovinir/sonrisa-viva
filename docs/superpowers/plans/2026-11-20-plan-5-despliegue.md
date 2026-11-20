# Plan 5 — Despliegue, E2E y README de portafolio: implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** publicar Sonrisa Viva en `https://sonrisa.marcovinir.dev` con datos de ejemplo, correo real, pruebas E2E y un README de portafolio.

**Architecture:**
- **Dos proyectos en Vercel** (spec §5):
  - `frontend/`: estáticos de Vite, con un *rewrite* `/api/*` → el proyecto backend y *fallback* de la SPA a `index.html`.
  - `backend/`: Django como función Python (`api/index.py` → `config.wsgi.app`).
- **Mismo origen:** para el navegador todo vive en el dominio del frontend. Las cookies de sesión y CSRF de Django funcionan sin CORS.
- **Base de datos:** Supabase Postgres.
  - La app usa el **pooler en modo transacción** (puerto 6543).
  - Las migraciones van por el **pooler en modo sesión** (puerto 5432), desde un workflow manual de GitHub Actions. Nunca en el arranque.
- **Correo:** SMTP de Brevo.
- **Datos de ejemplo:** un workflow programado corre `sembrar --reiniciar` dos veces por semana. Así deja la demo limpia y Supabase no se pausa por inactividad.

**Tech Stack:** el de los planes 1–4, más `@playwright/test` (tarea 6) y GitHub Actions para migrar y resembrar.

**Spec:** `docs/superpowers/specs/2026-11-19-sonrisa-viva-design.md` (§3 restricciones, §5 arquitectura, §11 pruebas, §12 fase 11). Los **pendientes** están en el cuerpo y los comentarios de la issue #15.

## Global Constraints

- **Valores fijados por el spec y la #15:**
  - Dominio `sonrisa.marcovinir.dev`, que apunta al proyecto frontend.
  - Supabase por el **pooler**.
  - `CONN_MAX_AGE=0` y `DISABLE_SERVER_SIDE_CURSORS=True`, que ya están en `base.py`.
  - Sin archivos subidos.
  - Correo por **Brevo SMTP**.
  - El README avisa que Supabase gratis se pausa tras ~7 días sin uso.
  - El admin de Django no existe en producción: `django.contrib.admin` no está en `INSTALLED_APPS` ni en `urls.py`, y así se queda.
- **Variables de entorno del backend en producción:**
  - `SECRET_KEY`, `DATABASE_URL` (pooler 6543) y `ALLOWED_HOSTS` (el host `*.vercel.app` del backend).
  - `CSRF_TRUSTED_ORIGINS=https://sonrisa.marcovinir.dev` y `FRONTEND_URL=https://sonrisa.marcovinir.dev`.
  - `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` y `DEFAULT_FROM_EMAIL`.
  - `SEMILLA_ADMIN_PASSWORD`.
  - `DJANGO_SETTINGS_MODULE=config.settings.produccion`, que ya es el valor por defecto en `wsgi.py`.
- **Cuentas y secretos:** todo lo que crea cuentas o escribe secretos (Supabase, Brevo, Vercel, DNS, *secrets* de GitHub) lo hace **Marco**. El ejecutor nunca ve ni escribe contraseñas ni claves. Los pasos marcados **(Marco)** se piden y se esperan.
- **Cómo se trabaja:** una issue = una rama = un PR con «Closes #N». TDD donde haya código. Textos en español.
- **Lo que no cambia:** las pruebas existentes (178 backend, 159 frontend) siguen en verde y CI sigue siendo la puerta de `main`.

## Review Focus

1. **Login tras el *rewrite*:** Django compara el `Origin` (el dominio del frontend) con su host (el del backend). Sin `CSRF_TRUSTED_ORIGINS` correcto, el login responde 403. → tarea 5 lo verifica en vivo. La tarea 3 hace que falte la variable sea un error al arrancar, no un 403 silencioso.
2. **Enlaces de los correos:** salen de `FRONTEND_URL`. Si falta, los pacientes reciben enlaces a `localhost`. → tarea 3: en producción la variable es obligatoria. La tarea 5 revisa un correo real.
3. **Pooler en modo transacción:** no admite las sentencias preparadas de psycopg 3. Sin `prepare_threshold=None`, aparecen errores intermitentes «prepared statement … already exists». → tarea 3, con una prueba sobre la configuración.
4. **Límites de peticiones en serverless:** con la caché en memoria, cada instancia de Vercel cuenta por su lado y el límite de 10 logins por minuto deja de valer. → tarea 3: `DatabaseCache` en producción.
5. **Rutas profundas:** recargar `/panel/agenda` o abrir `/cita/<token>` desde un correo da 404 sin el *fallback* de la SPA. → tarea 2 (`vercel.json`) y tarea 6 (E2E que recarga una ruta profunda).

---

### Task 1: Issues del Plan 5

- [ ] **Step 1:** Crear una issue autosuficiente por cada tarea 2–7 (objetivo, archivos, pruebas y «hecho cuando») y enlazarlas en la #1 bajo «Plan 5».
- [ ] **Step 2:** Comentar en la #15 la lista de issues.

Expected: `gh issue list` muestra las 6 issues nuevas.

### Task 2: Pendientes menores de la #15 y archivos de Vercel

**Files:**
- Modify: `backend/apps/comun/errores.py`, `frontend/src/features/reserva/components/PasoDatos.tsx`, `frontend/src/features/reserva/components/Calendario.tsx`
- Create: `backend/api/index.py`, `backend/vercel.json`, `backend/.python-version`, `frontend/vercel.json`
- Test: `backend/apps/comun/tests/test_errores.py`, `frontend/src/features/reserva/datos.test.tsx`, `frontend/src/features/reserva/hora.test.tsx`

**Interfaces:**
- **Errores anidados:** `manejador_excepciones` aplana `{"paciente": {"email": [...]}}` como `campos["paciente.email"] = [...]`. Es recursivo; los campos de primer nivel quedan igual.
- **Formulario de datos:** `PasoDatos` lee tanto `campos.email` como `campos["paciente.email"]` (y lo mismo con `nombre`, `apellidos` y `telefono`).
- **`frontend/vercel.json`:** dos `rewrites`.
  - `/api/:ruta*` → `https://<backend>.vercel.app/api/:ruta*`. El host se fija cuando exista el proyecto (tarea 5); hasta entonces, el valor de ejemplo `sonrisa-viva-api.vercel.app`.
  - `/(.*)` → `/index.html`.
- **`backend/vercel.json`:** un `rewrite` de `/(.*)` → `/api/index`.
- **`backend/api/index.py`:** `from config.wsgi import app`.
- **`backend/.python-version`:** `3.12`.

- [ ] **Step 1: Pruebas que fallan**
  - `test_errores.py::test_error_anidado_se_aplana_con_punto`: un `ValidationError({"paciente": {"email": ["Correo inválido."]}})` da `campos == {"paciente.email": ["Correo inválido."]}`.
  - `datos.test.tsx`, `correo inválido anidado se ve en el campo`: el backend responde `campos: {"paciente.email": ["Ese correo no se puede usar."]}` y el texto aparece junto al campo Correo.
  - `hora.test.tsx`, `los días del calendario miden al menos 44 px`: cada botón de día lleva la clase `min-h-11`. jsdom no mide, así que se comprueba la clase.
- [ ] **Step 2:** `pytest -q apps/comun` y `npm test -- reserva` → FALLAN.
- [ ] **Step 3:** Implementar. En el calendario: `min-h-11` y `gap-0.5` para que 7 columnas quepan en 375 px.
- [ ] **Step 4:** Toda la suite de los dos lados → PASA. A 375 px, el script de objetivos táctiles da 0 en `/reservar`.
- [ ] **Step 5:** PR.

### Task 3: Configuración de producción

**Files:**
- Modify: `backend/config/settings/produccion.py`, `.github/workflows/ci.yml`
- Test: `backend/apps/comun/tests/test_produccion.py`

**Interfaces** (`produccion.py`):
- **Variables obligatorias:** `FRONTEND_URL`, `CSRF_TRUSTED_ORIGINS` y `ALLOWED_HOSTS` se leen con `os.environ["…"]`. Si falta alguna, el arranque falla con `KeyError`.
- **Base de datos:** `DATABASES["default"]["OPTIONS"]["prepare_threshold"] = None`, por el pooler en modo transacción.
- **Caché:** `CACHES = {"default": {"BACKEND": "django.core.cache.backends.db.DatabaseCache", "LOCATION": "cache_django"}}`.
- **Correo:** `EMAIL_BACKEND` SMTP con `EMAIL_HOST="smtp-relay.brevo.com"`, `EMAIL_PORT=587` y `EMAIL_USE_TLS=True`. Usuario, clave y remitente salen de las variables de entorno.
- **Seguridad:** `SECURE_HSTS_SECONDS=31536000`, `SECURE_CONTENT_TYPE_NOSNIFF=True` y `SESSION_COOKIE_SAMESITE="Lax"`, que se hereda.

- [ ] **Step 1: Pruebas que fallan** (`test_produccion.py`)

  Cargan el módulo con `importlib` y las variables simuladas con `monkeypatch.setenv`, en un proceso aparte con `subprocess` para no contaminar los settings de las pruebas.
  - `test_produccion_exige_frontend_url`: sin `FRONTEND_URL`, el proceso termina con error y la salida menciona `FRONTEND_URL`.
  - `test_produccion_desactiva_sentencias_preparadas`: `DATABASES["default"]["OPTIONS"]["prepare_threshold"] is None`.
  - `test_produccion_usa_cache_en_base`: el backend de caché es `DatabaseCache`.
  - `test_produccion_envia_por_smtp_de_brevo`: el host y el puerto son los de Brevo.
- [ ] **Step 2:** `pytest -q apps/comun/tests/test_produccion.py` → FALLAN.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Agregar al job `backend` de CI un paso `python manage.py check --deploy --fail-level WARNING`, con `DJANGO_SETTINGS_MODULE=config.settings.produccion` y valores de ejemplo para las variables obligatorias. Corregir lo que reporte.
- [ ] **Step 5:** Suite completa y `ruff` → PASA. PR.

### Task 4: Workflows de migración y de datos de ejemplo

**Files:**
- Create: `.github/workflows/migrar.yml`, `.github/workflows/resembrar.yml`

**Interfaces:**
- **`migrar.yml`:** se lanza a mano (`workflow_dispatch`), con la entrada `sembrar: boolean`.
  - Usa el *secret* `DATABASE_URL_MIGRACIONES` (pooler 5432) y `SEMILLA_ADMIN_PASSWORD`.
  - Corre `migrate`, `createcachetable` y, si se pide, `sembrar --reiniciar`.
  - Lleva `DJANGO_SETTINGS_MODULE=config.settings.produccion` y variables de ejemplo para las obligatorias que no tocan la base.
- **`resembrar.yml`:** `schedule: cron "0 9 * * 1,4"` (lunes y jueves a las 3:00 de Costa Rica), más `workflow_dispatch`. Corre `sembrar --reiniciar` con los mismos *secrets*.

- [ ] **Step 1:** Escribir los dos workflows.
- [ ] **Step 2:** Validarlos: `gh workflow view` tras fusionarlos. La primera corrida real va en la tarea 5.
- [ ] **Step 3:** PR.

### Task 5: Puesta en marcha (Marco + ejecutor)

Sin código nuevo, salvo fijar el host real del backend en `frontend/vercel.json`.

- [ ] **Step 1 (Marco):** crear el proyecto de Supabase (región `us-east-1`) y copiar las dos URL del pooler: transacción 6543 y sesión 5432.
- [ ] **Step 2 (Marco):** crear la cuenta de Brevo, verificar el remitente (p. ej. `citas@marcovinir.dev`) y generar la clave SMTP.
- [ ] **Step 3 (Marco):** en GitHub → *Settings* → *Secrets*: `DATABASE_URL_MIGRACIONES` y `SEMILLA_ADMIN_PASSWORD`.
- [ ] **Step 4 (ejecutor):** lanzar `migrar.yml` con `sembrar: true`. Expected: termina en verde y su log muestra «Listo: 10 servicios, 4 dentistas…».
- [ ] **Step 5 (Marco):** crear los dos proyectos en Vercel desde el repo.
  - `sonrisa-viva-api`: raíz `backend`.
  - `sonrisa-viva`: raíz `frontend`.
  - Cargar las variables de las *Global Constraints* en el backend.
- [ ] **Step 6 (ejecutor):** fijar el host real en `frontend/vercel.json` y abrir un PR. Al fusionarlo, Vercel despliega.
- [ ] **Step 7 (Marco):** dominio `sonrisa.marcovinir.dev` → proyecto frontend (CNAME según indique Vercel).
- [ ] **Step 8 (ejecutor), verificación en vivo:**
  - `curl https://sonrisa.marcovinir.dev/api/v1/servicios/` → 200 con 10 servicios.
  - Login del panel con el admin de demo → entra a Agenda, sin 403.
  - Recargar `/panel/agenda` → la página carga, sin 404.
  - Reserva real con el correo personal de Marco (él escribe sus datos) → llega el correo de Brevo con el enlace a `https://sonrisa.marcovinir.dev/cita/…`. Abrirlo carga la gestión.
  - 11 intentos de login fallidos seguidos → el 11.º responde 429.
- [ ] **Step 9:** comentar los resultados en la issue y cerrarla.

### Task 6: E2E con Playwright

**Files:**
- Modify: `frontend/package.json` (+ `@playwright/test`, script `e2e`), `frontend/vite.config.ts` (`preview.proxy` igual al de `server`), `.github/workflows/ci.yml` (job `e2e`)
- Create: `frontend/playwright.config.ts`, `frontend/e2e/reserva.spec.ts`, `frontend/e2e/panel.spec.ts`

**Interfaces:**
- **`baseURL`:** `process.env.E2E_URL ?? "http://localhost:4173"` (`vite preview`).
- **Job `e2e` de CI:**
  - Postgres 18, `migrate` y `sembrar`.
  - `runserver 8000` con `config.settings.local` en segundo plano.
  - `npm run build && npm run preview` en segundo plano.
  - `npx playwright install --with-deps chromium` y `npm run e2e`.
  - Sube el reporte HTML como artefacto si falla.

- [ ] **Step 1: Escribir las pruebas** (fallan hasta tener la configuración)
  - `reserva.spec.ts`, `reserva completa de principio a fin`: elegir «Limpieza dental», el primer día con horas, la primera hora y escribir datos de prueba (`e2e+<timestamp>@sonrisaviva.test`). Confirmar → «¡Listo!» con el resumen.
  - `panel.spec.ts`:
    - `login del panel y recarga de ruta profunda`: entrar como el admin de demo (clave desde `process.env.SEMILLA_ADMIN_PASSWORD ?? "Demo-Sonrisa-2026"`) → «Agenda». Navegar a `/panel/citas`, recargar y que siga en «Citas».
    - `el dentista solo ve su agenda`: entrar como `laura.vargas@sonrisaviva.test` → la barra muestra «Mi agenda» y «Mis citas», y nada más.
- [ ] **Step 2:** Configuración y job de CI. Correr en local → PASAN.
- [ ] **Step 3:** Prueba de humo contra producción: `E2E_URL=https://sonrisa.marcovinir.dev npm run e2e -- panel.spec.ts` → PASA. Es solo el panel, para no crear citas en producción desde la máquina local.
- [ ] **Step 4:** PR (el job `e2e` en verde).

### Task 7: README de portafolio

**Files:**
- Modify: `README.md`
- Create: `docs/capturas/*.png` (con un script `frontend/e2e/capturas.spec.ts` que se corre aparte con `--grep @capturas`)

**Contenido del README:**
- **Arriba:** el enlace a la demo, la tarjeta «Pruébalo» con los usuarios de demo (admin y dentista, con la clave de ejemplo) y la nota de que los datos se reinician lunes y jueves.
- **Capturas:** landing, reserva, agenda del dentista, citas, reportes, y la landing a 375 px.
- **Stack y arquitectura**, con el diagrama del spec §5.
- **Decisiones técnicas que se pueden defender:**
  - Mismo origen con *rewrite* y cookies `HttpOnly` + CSRF.
  - Modelo 3FN, y por qué `fin` y `precio_colones` son una instantánea.
  - Concurrencia: la `ExclusionConstraint` `cita_sin_traslape` y `bloquear_agenda` con `SELECT … FOR UPDATE`.
  - Permisos por código y no por rol.
  - Capas del backend: modelos, selectores, servicios, serializadores y vistas.
  - Accesibilidad: WCAG, 44 px y movimiento reducido.
  - Paleta de reportes validada para daltonismo.
- **Enlaces** a los mockups v3 y a los planes.
- **Pruebas:** cuántas hay y cómo correrlas, incluidos los E2E.
- **Limitaciones:** Supabase gratis se pausa tras ~7 días sin uso (el resembrado lo evita), funciones en frío de Vercel y sin cuenta de paciente.
- **Desarrollo local:** lo que ya existe.

- [ ] **Step 1:** Generar las capturas contra producción.
- [ ] **Step 2:** Escribir el README; quitar «🚧 en construcción».
- [ ] **Step 3:** PR. Al fusionar: cerrar la #15, tachar el Plan 5 en la #1 y actualizar la memoria.
