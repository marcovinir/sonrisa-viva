# Sonrisa Viva — Diseño

**Fecha:** 2026-11-19 · **Estado:** borrador para aprobación · **Repo:** `marcovinir/sonrisa-viva` (público)

## 1. Intención

Proyecto de **portafolio** de Marco: el sitio de una clínica dental ficticia, **«Clínica Dental Sonrisa Viva»**, donde un visitante conoce la clínica y **agenda una cita con disponibilidad real**, y donde el personal gestiona todo desde un **panel propio en `/panel`**.

No hay prisa: se prefiere un proyecto **completo y bien hecho** antes que uno rápido. Tiene que lucir ante un reclutador en dos frentes: una interfaz pulida y una **lógica de backend real** (disponibilidad de horarios, sin choques de citas, roles y permisos, reportes).

## 2. Objetivos, no-objetivos y anti-objetivos

**Objetivos**
- Una landing de una sola página con scroll. Arriba, un **header fijo** con el logo, un menú que lleva a cada sección (Inicio, Nosotros, Servicios, Equipo, Contacto) y el botón «Agenda tu cita»; en móvil, el menú se vuelve hamburguesa. Las secciones: hero, quiénes somos y misión, servicios, equipo, testimonios y contacto. Abajo, un **footer** con datos de contacto, horario, redes y un enlace discreto «Acceso personal» a `/panel/login`.
- Un flujo de reserva **sin cuenta de paciente**: servicio → dentista (o «cualquiera») → día → hora libre → datos → confirmación.
- Un correo de confirmación con un **enlace para cancelar o reprogramar** la cita, sin necesidad de iniciar sesión.
- Un `/panel` en React con inicio de sesión personalizado y roles **Admin** y **Dentista**.
- Para el admin: CRUD de usuarios, servicios, categorías, dentistas, horarios y bloqueos; vista de todas las citas; reportes con gráficos.
- Para el dentista: su propia agenda y el cambio de estado de sus citas.
- Activación de cuentas por correo (el admin crea al dentista → le llega un enlace → el dentista define su contraseña) y recuperación de contraseña.
- Desplegado con una URL pública, datos de ejemplo y un README de portafolio.

**No-objetivos (fuera de alcance)**
- Pagos en línea, cuentas de pacientes, recordatorios automáticos por SMS o WhatsApp, varias sucursales, idiomas aparte del español y app móvil nativa.
- La gestión de testimonios y de los textos de la landing desde el panel: ese contenido es estático en el frontend.
- El admin de Django: queda desactivado en producción.

**Anti-objetivos (sería un fracaso aunque funcione)**
- Que se puedan reservar dos citas que se traslapan para el mismo dentista, incluso con dos peticiones simultáneas.
- Que la página parezca una plantilla genérica o que el panel se vea «técnico».
- Que un dentista pueda ver o tocar la agenda de otro.
- Mostrar horas «libres» que luego fallan al reservar.

## 3. Restricciones

- **Stack:** React + Django + PostgreSQL.
- **Hospedaje gratuito:**
  - Frontend y backend en **Vercel**, como dos proyectos (a Marco ya no le quedan servicios en el plan gratuito de Render).
  - Base de datos en **Supabase Postgres**: hay que usar la URL del **pooler**, porque la conexión directa es solo IPv6.
  - El proyecto gratuito de Supabase se pausa tras ~7 días sin uso, y eso debe quedar anotado en el README.
- **Sin Docker en local:** Marco tiene PostgreSQL 18 instalado en Windows (`postgresql-x64-18`). En CI se usa el servicio de Postgres de GitHub Actions.
- **Base de datos en 3FN, ORM de Django** (nada de SQL a mano salvo las restricciones de exclusión), **principios SOLID** en el backend y **heurísticas de Nielsen** en el frontend.
- **Idioma y región:** español, precios en colones (₡), zona horaria `America/Costa_Rica`. Las fechas se guardan en UTC y se muestran en hora de Costa Rica.
- **Flujo de trabajo:**
  - Todo vive como **issues autosuficientes en GitHub**, con una issue #1 «Hoja de ruta» como punto de entrada, para que otro agente pueda retomar con solo decir «haz las issues».
  - Cada issue se resuelve en **su propio PR**, y `main` queda protegida.

## 4. Enfoques considerados

1. **Un repo con `frontend/` y `backend/`, dos proyectos en Vercel, y `/api` reenviado (rewrite) desde el frontend al backend; sesión con cookies de Django.** ← **elegido**
   Para el navegador todo es el mismo origen, así que funcionan las cookies `HttpOnly` + CSRF de Django sin pelear con CORS. Es más seguro que guardar tokens en `localStorage` y se puede explicar en una entrevista. El costo: depende del rewrite de Vercel y las cookies requieren configurar bien `SameSite` y CSRF.
2. **El mismo repo, pero con JWT.** Es portable y común en tutoriales. Se descartó porque el token termina expuesto en el navegador y Marco ya practicó JWT en reservas-app.
3. **Django sirve también el build de React, en un solo despliegue.** Es simple en Render, pero forzado en Vercel y mezcla las capas. Se descartó.

## 5. Arquitectura

Es un modelo **cliente-servidor en tres capas**:

```
 Navegador (SPA React)  ──HTTPS──▶  Vercel: proyecto frontend (estáticos)
        │  /api/*  (rewrite, mismo origen)
        ▼
 Vercel: proyecto backend (Django + DRF, función Python)
        │  ORM de Django
        ▼
 Supabase Postgres (pooler, puerto 6543)
        ▲
 Proveedor de correo (SMTP de Brevo; backend de consola en local)
```

- **Cliente:** una SPA con React que solo presenta y valida la forma de los datos. Las reglas de negocio **nunca** dependen del cliente.
- **Servidor:** una API REST con Django REST Framework. Concentra toda la lógica: disponibilidad, permisos y estados.
- **Datos:** Postgres con restricciones en la base de datos (unicidad, checks y exclusión de traslapes) como última línea de defensa.
- **Ajustes por correr en Vercel serverless con el pooler de Supabase:**
  - `CONN_MAX_AGE=0` y `DISABLE_SERVER_SIDE_CURSORS=True`.
  - Las migraciones se corren a mano o desde CI, nunca en cada arranque.
  - Sin archivos subidos: las fotos de los dentistas son URLs, y los avatares de ejemplo van en `frontend/public/`.
- **Dominio sugerido:** `sonrisa.marcovinir.dev` apuntando al proyecto frontend.

## 6. Modelo de datos (3FN)

Todas las tablas tienen PK `id` (bigint) y `creado_en` / `actualizado_en` cuando aplica. Los nombres van en español, en `snake_case`.

| Tabla | Campos principales | Notas |
|---|---|---|
| `rol` | `nombre` (único), `descripcion` | Semillas: `admin`, `dentista`. Escalable a `recepcion` sin tocar el código. |
| `permiso` | `codigo` (único, p. ej. `citas.ver_todas`), `descripcion` | Catálogo de permisos. |
| `rol_permiso` | `rol_id`, `permiso_id` | M:N, único `(rol_id, permiso_id)`. |
| `usuario` | `email` (único, login), `nombre`, `apellidos`, `rol_id`, `is_active`, `password`, `last_login` | Usuario personalizado (`AbstractBaseUser`); nace con `is_active=False` hasta activarse. |
| `categoria_servicio` | `nombre` (único), `orden` | Preventiva, Estética, Ortodoncia, etc. Son los «tipos» de los reportes. |
| `servicio` | `categoria_id`, `nombre`, `slug` (único), `descripcion`, `duracion_min`, `precio_colones`, `activo` | Checks: `duracion_min > 0` y múltiplo de 15; `precio_colones >= 0`. |
| `dentista` | `usuario_id` (único, 1:1), `especialidad`, `biografia`, `foto_url`, `visible_en_web` | Perfil profesional separado de la cuenta. |
| `dentista_servicio` | `dentista_id`, `servicio_id` | M:N: qué servicios hace cada dentista. |
| `horario_semanal` | `dentista_id`, `dia_semana` (0–6), `hora_inicio`, `hora_fin` | Check `hora_inicio < hora_fin`; sin traslapes por dentista y día (se valida en el servicio). Permite turnos partidos. |
| `bloqueo` | `dentista_id`, `inicio`, `fin`, `motivo` | Vacaciones o ausencias puntuales. |
| `paciente` | `nombre`, `apellidos`, `email` (único), `telefono` | Sin cuenta. Si el correo ya existe se reutiliza y se actualizan el nombre y el teléfono. |
| `cita` | `paciente_id`, `dentista_id`, `servicio_id`, `inicio`, `fin`, `precio_colones`, `estado`, `notas_internas`, `token_gestion_hash`, `creado_en` | `estado`: `confirmada`, `cancelada`, `completada`, `no_asistio`. |

**Sobre 3FN en `cita`:** `fin` y `precio_colones` parecen derivables del servicio, pero son una **instantánea histórica**: si mañana cambian la duración o el precio del servicio, la cita ya agendada no debe cambiar. Por eso **no** son dependencias transitivas, sino hechos propios de la cita. Esto se documenta en el README.

**Integridad contra choques:**
- Habrá una `ExclusionConstraint` de Postgres (`btree_gist`) sobre `(dentista_id WITH =, tstzrange(inicio, fin) WITH &&)` con la condición `estado <> 'cancelada'`.
- Aunque dos personas reserven la misma hora al mismo tiempo, la base de datos rechaza la segunda, y la API responde `409` con el mensaje «Esa hora acaba de ocuparse, elige otra».
- La extensión `btree_gist` se activa en una migración. Supabase la soporta.

**Tokens:**
- La activación de cuenta y la recuperación de contraseña usan `default_token_generator` de Django, así que no necesitan tabla.
- El enlace de gestión de cita es un token aleatorio de 32 bytes. Se guarda **solo su hash** (SHA-256) en `cita.token_gestion_hash`.

## 7. Reglas de negocio de la agenda

- **Rejilla de 15 minutos.** Una hora es válida si la cita completa (`duración del servicio`) cabe dentro de un bloque de `horario_semanal` del dentista y no se cruza con citas no canceladas ni con bloqueos.
- **Anticipación:** como mínimo 2 horas y como máximo 60 días.
- **Dentista «cualquiera»:** se muestra la unión de horas libres de los dentistas que hacen ese servicio. Al reservar se asigna el que tenga **menos citas ese día**, y si empatan, el de menor `id`. La regla vive detrás de una interfaz `EstrategiaAsignacion` para poder cambiarla.
- **Cancelar o reprogramar** con el enlace: se permite hasta **24 h antes**. Reprogramar = mover la misma cita a otra hora libre, con la misma validación.
- **Transiciones de estado:**
  - `confirmada → cancelada | completada | no_asistio`.
  - Los otros tres estados son finales.
  - El dentista solo puede pasar a `completada` o `no_asistio` sus propias citas, y solo cuando ya pasaron.
- **Correos:** confirmación al reservar, aviso al cancelar o reprogramar, activación de cuenta y recuperación de contraseña. En local se usa el backend de consola.

## 8. Roles y permisos

| Permiso (código) | Admin | Dentista |
|---|---|---|
| `usuarios.gestionar` | ✔ | |
| `catalogo.gestionar` (servicios, categorías) | ✔ | |
| `dentistas.gestionar` (perfiles, horarios, bloqueos) | ✔ | solo sus bloqueos |
| `citas.ver_todas` / `citas.gestionar_todas` | ✔ | |
| `citas.ver_propias` / `citas.marcar_asistencia` | ✔ | ✔ |
| `reportes.ver` | ✔ | |

- DRF aplica los permisos con una clase genérica `TienePermiso("codigo")` que consulta los permisos del rol del usuario.
- Además, los *querysets* del dentista se filtran siempre por su perfil, no solo los botones de la interfaz.
- Las reglas de usuarios:
  - Un admin no puede desactivarse a sí mismo.
  - Siempre debe quedar al menos un admin activo.

## 9. API (resumen)

Todo cuelga de `/api/v1/`.

- **Público:**
  - `GET servicios/` y `GET dentistas/`.
  - `GET disponibilidad/?servicio=&dentista=&fecha=` devuelve las horas libres.
  - `POST citas/` reserva una cita.
  - `GET|PATCH|DELETE citas/gestion/{token}/` consulta, reprograma o cancela con el enlace.
  - Los endpoints públicos tienen *throttling*.
- **Autenticación:**
  - `GET auth/csrf/`, `POST auth/login/`, `POST auth/logout/` y `GET auth/yo/` (devuelve el usuario, el rol y los permisos).
  - `POST auth/activar/` y `POST auth/recuperar/` + `POST auth/restablecer/`.
- **Panel:**
  - CRUD de `panel/usuarios/`, `panel/categorias/`, `panel/servicios/`, `panel/dentistas/` (con horarios y bloqueos anidados) y `panel/citas/`.
  - `panel/citas/` admite filtros por fecha, dentista, estado y servicio.
  - `panel/citas/{id}/estado/` cambia el estado de una cita.
- **Reportes:**
  - `panel/reportes/citas-por-servicio`, `…/citas-por-categoria`, `…/citas-por-dentista`, `…/citas-por-mes` y `…/tasa-asistencia`.
  - Todos aceptan un rango de fechas y se calculan con agregaciones del ORM (`annotate`, `TruncMonth`).
- **Paginación y errores:** paginación estándar; los errores se devuelven siempre como `{ "detalle": "...", "campos": {...} }`.

## 10. Estructura del backend y SOLID

```
backend/
  config/            settings/{base,local,produccion}.py, urls.py, wsgi.py
  apps/
    cuentas/         usuario, rol, permiso; login, activación, recuperación
    clinica/         categorías, servicios, dentistas, horarios, bloqueos
    citas/           pacientes, citas, disponibilidad, gestión por enlace
    reportes/        consultas agregadas (sin modelos propios)
    comun/           permisos DRF, paginación, manejo de errores, notificaciones
  # cada app: models.py, serializers.py, views.py, urls.py,
  #           services.py (escrituras y reglas), selectors.py (lecturas), tests/
  manage.py, requirements.txt, pyproject.toml (ruff, pytest)
```

- **S (responsabilidad única):**
  - Las vistas solo traducen HTTP.
  - `services.py` decide (reservar, cancelar, activar) y `selectors.py` consulta.
  - Los serializers solo validan la forma de los datos.
- **O (abierto/cerrado):**
  - `EstrategiaAsignacion` (menos citas del día) y `Notificador` (correo SMTP o consola) son interfaces.
  - Se agregan implementaciones nuevas sin tocar quién las usa.
- **L (sustitución de Liskov):** cualquier `Notificador` (el real o el falso de las pruebas) cumple el mismo contrato.
- **I (segregación de interfaces):** hay serializers separados para el público y para el panel, y el paciente nunca ve `notas_internas`.
- **D (inversión de dependencias):** los servicios reciben el `Notificador` y la estrategia por parámetro, con valores por defecto desde la configuración. Así las pruebas inyectan dobles.

## 11. Estructura del frontend

React 18 + **Vite + TypeScript**.
- **Navegación y datos:** React Router, TanStack Query para el estado del servidor y React Hook Form + Zod para los formularios.
- **Estilos y gráficos:** Tailwind CSS para los estilos y Recharts para los reportes.

```
frontend/
  src/
    app/             router (rutas públicas, /cita/:token, /panel/*), providers, layout
    features/
      landing/       hero, quienes-somos, servicios, equipo, testimonios, contacto
      reserva/       asistente por pasos + calendario de horas
      gestion-cita/  ver, cancelar y reprogramar por enlace
      auth/          login, activar cuenta, recuperar contraseña, ruta protegida
      panel-citas/   agenda (día y semana), lista con filtros, cambio de estado
      panel-usuarios/ panel-servicios/ panel-dentistas/ (horarios y bloqueos)
      reportes/      tarjetas KPI + gráficos
    shared/          ui/ (botón, input, modal, toast, tabla, skeleton), api/ (cliente con CSRF), lib/ (fechas CR, colones)
```

Cada *feature* tiene `components/`, `api/` (hooks de TanStack Query), `pages/` y su `schemas.ts`.

**Heurísticas de Nielsen, aplicadas:**
1. **Visibilidad del estado:** una barra de pasos en la reserva, *skeletons* y toasts, y el estado de cada cita con color y texto.
2. **Lenguaje del usuario:** se dice «Agenda tu cita» y «Hora disponible», nada de «slot» ni de mensajes técnicos.
3. **Control y libertad:** se puede volver al paso anterior sin perder datos, cancelar desde el enlace y deshacer en un toast las acciones reversibles del panel.
4. **Consistencia:** un sistema de diseño único y los mismos verbos y posiciones de botones en todo el panel.
5. **Prevención de errores:** solo se ofrecen horas válidas, se pide confirmación antes de cancelar o desactivar y los campos se validan en línea.
6. **Reconocer antes que recordar:** un resumen visible de la cita durante toda la reserva y los filtros activos a la vista.
7. **Flexibilidad:** un atajo «Agendar» en cada tarjeta de servicio, que entra a la reserva con el servicio ya elegido; vistas de día y semana en la agenda.
8. **Diseño minimalista:** una acción principal por pantalla.
9. **Ayudar con los errores:** mensajes que dicen qué pasó y cómo seguir (p. ej. el 409 por choque de hora).
10. **Ayuda:** textos de ayuda junto a los campos y una sección de preguntas frecuentes en contacto.

**Accesibilidad:** contraste AA, navegación completa con teclado, `aria-live` en los toasts y el calendario usable sin ratón. Diseño responsive con *mobile first*.

## 12. Mockups (Claude Design)

Antes de escribir el frontend se hacen mockups con **Claude Design**:
- **Landing:** escritorio y móvil.
- **Flujo de reserva** completo.
- **Gestión de la cita** por enlace.
- **Login** del panel.
- **Agenda del dentista.**
- **Lista de citas** del admin.
- **Un CRUD** típico.
- **Reportes.**

Marco los aprueba, y los enlaces quedan en la issue de mockups y en el README. La identidad visual (paleta clínica cálida, tipografía y logotipo de texto) se define ahí.

## 13. Calidad y flujo de trabajo

- **Pruebas del backend:** `pytest` + `pytest-django` contra Postgres real (local y CI), porque la restricción de exclusión no existe en SQLite.
  - Las prioridades son el cálculo de disponibilidad, los choques simultáneos, las transiciones de estado, los permisos por rol y la activación de cuentas.
- **Pruebas del frontend:** Vitest + Testing Library para los componentes y la lógica. Al final, **Playwright** E2E para la reserva completa y el login del panel.
- **Calidad del código:** `ruff` (lint + formato), ESLint + Prettier.
- **CI con GitHub Actions** en cada PR: lint + pruebas del backend con el servicio de Postgres, y lint + pruebas + build del frontend.
- **Git:**
  - `main` protegida y una rama por issue (`feat/12-disponibilidad`).
  - Cada PR lleva `Closes #N`, y el CI debe pasar en verde antes de fusionar.
- **Issues:**
  - La **#1 «Hoja de ruta y convenciones»** manda el orden y tiene casillas.
  - Cada issue es autosuficiente: contexto, rutas a tocar, decisiones tomadas, criterios de aceptación y dependencias.
  - Etiquetas: `backend`, `frontend`, `diseño`, `infra`, `docs`.
- **Datos de ejemplo:** un comando `python manage.py sembrar` que crea las categorías, unos 10 servicios, 4 dentistas con horarios, el admin de demostración y unas 200 citas repartidas en los últimos 6 meses para que los reportes tengan qué mostrar.

## 14. Fases (borrador del orden de las issues)

0. Repo, README inicial, CI, protección de `main`, esqueleto del backend y del frontend.
1. Mockups en Claude Design (landing, reserva, panel) y la identidad visual.
2. Backend: modelos, migraciones, restricciones y semillas.
3. Backend: autenticación del panel (sesión, CSRF, login, activación, recuperación) y permisos.
4. Backend: CRUDs del panel.
5. Backend: disponibilidad, reserva pública, gestión por enlace y correos.
6. Backend: reportes.
7. Frontend: sistema de diseño (`shared/ui`) y landing.
8. Frontend: flujo de reserva y gestión de la cita.
9. Frontend: login y estructura del panel, agenda del dentista y citas del admin.
10. Frontend: CRUDs del panel y reportes con gráficos.
11. Despliegue (Vercel ×2 + Supabase + correo), dominio, E2E con Playwright y README de portafolio con capturas.

## 15. Decisiones que tomé yo (revisar)

- El nombre «Sonrisa Viva» y el repo `sonrisa-viva`.
- Tablas de **rol / permiso / rol_permiso** en vez de un campo fijo, para escalar y siguiendo tu preferencia de proyectos anteriores.
- TypeScript, Tailwind, TanStack Query y Recharts en el frontend.
- Brevo por SMTP para los correos: permite enviar sin dominio propio verificado. Si prefieres Resend, se usaría con `marcovinir.dev`.
- Las reglas de la agenda: rejilla de 15 min, anticipación de 2 h a 60 días, cancelación hasta 24 h antes y asignación de «cualquiera» al dentista con menos citas del día.
- Los testimonios y los textos de la landing van estáticos (sin CRUD).
- El admin de Django queda desactivado en producción.

## 16. Lo que queda a criterio de quien implemente

- Las versiones exactas de las librerías.
- Los nombres internos de los componentes y las funciones.
- Los textos de marketing de la landing.
- Las paletas concretas: salen de los mockups.
- El formato de las plantillas de correo (HTML sencillo).
- Los detalles del *throttling*.
