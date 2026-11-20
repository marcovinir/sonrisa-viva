# Plan 3 — Frontend público: implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** el sitio público en React: la landing de una sola página, el asistente de reserva conectado a la API real, la confirmación y la gestión de la cita por enlace, todo con el diseño de los mockups v3 aprobados.

**Architecture:**
- **Código:** una SPA en `frontend/` organizada por *features* (`app/`, `features/<x>/`, `shared/`).
- **Datos del servidor:** viven en TanStack Query.
- **Formularios:** React Hook Form + Zod.
- **API:** un cliente `fetch` propio que maneja CSRF y normaliza los errores `{detalle, campos}`.
- **Estilos y animaciones:** tokens de Tailwind v4 (`@theme`). Las animaciones son CSS bajo `motion-safe`, más un hook `useRevelar` con `IntersectionObserver`, que reemplaza a `animation-timeline` porque así funciona en Safari y Firefox.
- **Pruebas:** Vitest + Testing Library + **MSW**, que simula la API con las formas reales del Plan 2.

**Tech Stack:** React 19, Vite 8, TypeScript, Tailwind CSS 4, React Router 7, TanStack Query 5, React Hook Form 7, Zod 4 con `@hookform/resolvers`, MSW 2 y Vitest 5.

**Spec:** `docs/superpowers/specs/2026-11-19-sonrisa-viva-design.md` (secciones 9, 11 y 12). La **referencia visual** son los mockups v3 aprobados en https://claude.ai/artifact/6ok1WwMMhQtc7DVAstBLS6: los tableros Main, Landing-movil, Reserva-hora, Reserva-datos, Reserva-confirmada y Gestion-cita. La issue #11 tiene la paleta y la lista de animaciones.

## Global Constraints

- Todo lo de los planes anteriores sigue vigente: textos en **español**, una issue = una rama = un PR, TDD y CI en verde (`npm run lint`, `npm run format:check`, `npm test` y `npm run build`).
- **Tokens** en `src/index.css` con `@theme`, con estos valores exactos:
  - Colores: `--color-tinta: #0E2F38`, `--color-petroleo: #13505F`, `--color-arena: #B8935A`, `--color-arena-claro: #D9BC8C`, `--color-dorado-texto: #8A6A3B`, `--color-marfil: #F8F5EF`, `--color-panel: #F4F1EA`, `--color-borde: #E6DED0`, `--color-texto-2: #45555C`, `--color-texto-3: #5C6A70`, `--color-error: #B3261E`, `--color-peligro: #8C1D18`, `--color-exito: #2E6B3A`.
  - Fuentes: `--font-serif: "Cormorant Garamond", serif` y `--font-sans: Manrope, system-ui, sans-serif`, cargadas desde Google Fonts en `index.html`.
  - Movimiento: `--ease-sv: cubic-bezier(.22,1,.36,1)`.
- **Movimiento:** toda animación va dentro de `motion-safe:` o de `@media (prefers-reduced-motion: no-preference)`. Solo se animan `transform`, `opacity` y `clip-path`. Las entradas usan `animation-fill-mode: backwards`, nunca `both`, para no bloquear el hover.
- **Accesibilidad:** contraste AA, `:focus-visible` con anillo `#6FA7B3`, objetivos táctiles de 44 px o más, controles reales (`button`, `a`, `label`+`input`) y errores escritos junto al campo con `aria-invalid` y `aria-describedby`.
- **Iconos:** SVG en línea y nunca emoji. El diente es un solo componente, `Diente`, con el path de los mockups.
- **API:** se llama siempre a rutas relativas `/api/v1/...`. En desarrollo, Vite las reenvía a `:8000`; en producción, el rewrite de Vercel.
- **Fechas:** se muestran en hora de Costa Rica con `Intl.DateTimeFormat('es-CR', { timeZone: 'America/Costa_Rica' })`.
- **Mensajes del backend:** se muestran tal cual (`detalle`) y no se traducen en el cliente.

## Review Focus

1. **Alguien te gana la hora entre elegirla y confirmar** (409 `HORA_OCUPADA`): el asistente vuelve al paso de hora, muestra el mensaje, **refresca las horas libres** y conserva los datos del paciente ya escritos. → tarea 7.
2. **Deep link `/reservar?servicio=99` con un servicio inexistente o inactivo:** no se rompe. Muestra el paso de servicio con el aviso «Ese servicio ya no está disponible.». → tarea 6.
3. **Un día sin horas libres o una API caída:** el estado vacío dice qué hacer («Prueba otro día»), y si hay un error de red aparece el botón «Reintentar». Nunca queda un spinner infinito. → tareas 6 y 8.
4. **Doble clic en «Confirmar la cita»:** se envía un solo POST, porque el botón queda en `aria-busy` y deshabilitado mientras espera. → tarea 7.
5. **Enlace de gestión inválido o cita a menos de 24 h:** el enlace inválido muestra la página «No encontramos esa cita». La cita a menos de 24 h oculta los botones de cambio y explica por qué. → tarea 9.

---

### Task 1: Issues del Plan 3

- [ ] **Step 1:** Crear una issue autosuficiente por cada una de las tareas 2 a 10, con la etiqueta `frontend`. El cuerpo lleva las restricciones globales, la tarea, «Depende de» y el Review Focus en las tareas 6 a 9. Usar el mismo script que en el Plan 2.
- [ ] **Step 2:** En la #1, agregar la sección «Plan 3 — Frontend público». En la #13, quitar la etiqueta `requiere-plan` y comentar el enlace al plan y a las issues.

### Task 2: Base: dependencias, tokens, router, cliente de API y formatos

**Files:**
- Modify: `frontend/package.json` (dependencias), `frontend/index.html` (fuentes, `lang="es"`, título y favicon del diente), `frontend/src/index.css` (`@theme`, base y `:focus-visible`), `frontend/src/main.tsx`
- Create: `frontend/src/app/{App,router,providers}.tsx`, `frontend/src/shared/api/cliente.ts`, `frontend/src/shared/lib/formato.ts`, `frontend/src/test/{setup,servidor}.ts` (MSW), `frontend/public/favicon.svg` (el diente)
- Test: `frontend/src/shared/api/cliente.test.ts`, `frontend/src/shared/lib/formato.test.ts`, `frontend/src/app/App.test.tsx` (reemplaza al actual)

**Interfaces:**
- Produces: `class ApiError extends Error { status: number; detalle: string; campos: Record<string, string[]> }`.
- Produces: `api<T>(ruta: string, opciones?: { metodo?: 'GET'|'POST'|'PATCH'|'DELETE'; cuerpo?: unknown; query?: Record<string, string|number|undefined> }) -> Promise<T>`. Funciona así:
  - Antepone `/api/v1`.
  - En los métodos que no son GET, antes de enviar llama una vez a `GET /auth/csrf/`. Con eso tiene la cookie y la manda en `X-CSRFToken`, leída de `document.cookie`.
  - Usa `credentials: 'same-origin'` y `Content-Type: application/json`.
  - Un `204` devuelve `undefined`.
  - Un error con JSON `{detalle, campos}` se convierte en `ApiError`. Si es un fallo de red, el error es `ApiError(status 0, detalle "No pudimos conectar con la clínica. Revisa tu conexión e intenta de nuevo.")`.
- Produces (en `formato.ts`):
  - `colones(n: number): string`. Por ejemplo, `colones(25000)` → `"₡25 000"` con espacio fino ` `, igual que el backend.
  - `fechaLarga(iso: string): string` → «lunes 2 de marzo».
  - `hora(iso: string): string` → «9:15 a. m.».
  - `isoDia(d: Date): string` → `YYYY-MM-DD` en hora de Costa Rica.
- Produces: las rutas en `router.tsx`:
  - `/` → `LandingPage`.
  - `/reservar` → `ReservaPage`.
  - `/reservar/confirmada` → `ConfirmadaPage`.
  - `/cita/:token` → `GestionPage`.
  - `/panel/*` → un marcador «Panel en construcción», que se reemplaza en el Plan 4.
  - `*` → `NoEncontradaPage`.
- Produces: `crearServidorPrueba(...handlers)` en `test/servidor.ts`, con los *fixtures* `SERVICIOS`, `CATEGORIAS`, `DENTISTAS` y `DISPONIBILIDAD`, que copian los datos de `sembrar`.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `colones formatea con espacio fino`.
  - `fechaLarga y hora en hora de Costa Rica`: `"2026-03-02T15:15:00Z"` da «lunes 2 de marzo» y «9:15 a. m.».
  - `api manda X-CSRFToken en POST tras pedir csrf`.
  - `api convierte {detalle,campos} en ApiError`.
  - `api convierte un fallo de red en ApiError status 0`.
  - `App muestra 404 en ruta desconocida`.
- [ ] **Step 2:** Instalar `react-router@7 @tanstack/react-query@5 react-hook-form@7 zod@4 @hookform/resolvers` y, de desarrollo, `msw@2`. Correr `npm test`. Se espera que FALLE.
- [ ] **Step 3:** Implementar. `providers.tsx` crea el `QueryClient` con `retry: 1` y `staleTime: 30_000`, y lo envuelve junto con `RouterProvider`.
- [ ] **Step 4:** Correr `npm run lint && npm test && npm run build`. Se espera que todo PASE.
- [ ] **Step 5:** Abrir el PR.

### Task 3: Sistema de diseño (`shared/ui`)

**Files:**
- Create: `frontend/src/shared/ui/{Boton,Campo,Chip,Diente,IlustracionServicio,Logo,Esqueleto,Estado}.tsx` y `frontend/src/shared/ui/animaciones.css` (los keyframes, importado en `index.css`)
- Create: `frontend/src/shared/hooks/useRevelar.ts`
- Test: `frontend/src/shared/ui/ui.test.tsx`, `frontend/src/shared/hooks/useRevelar.test.ts`

**Interfaces:**
- **`<Boton variante="primario"|"contorno"|"dorado"|"peligro" cargando? como?="a"|"link" ...>`:**
  - Es una píldora de 44 px como mínimo, con elevación al pasar el cursor y `scale(.97)` al presionar.
  - Con `cargando`, muestra un spinner y el texto `textoCargando` (por defecto «Un momento…»), y queda `disabled` con `aria-busy="true"`.
  - `como="link"` renderiza un `<Link>` de React Router con el mismo estilo.
- **`<Campo id etiqueta error? ayuda? {...inputProps}>`:**
  - Renderiza `label`+`input`.
  - Con `error`, pone `aria-invalid="true"`, borde de error, `aria-describedby` apuntando al mensaje y una animación de temblor bajo `motion-safe`.
  - Acepta `as="textarea"`.
- **`<Chip activo onClick>`:** un botón con `aria-pressed`.
- **`<Diente className tamaño trazo relleno />`:** el SVG del diente (path de los mockups, viewBox 24).
- **`<Logo variante="claro"|"oscuro" />`:** el círculo petróleo con el diente dorado y el texto «Sonrisa Viva / CLÍNICA DENTAL».
- **`<IlustracionServicio slug categoria tamaño="tarjeta"|"miniatura" />`:**
  - Es el diente más un acento elegido por `slug` según este mapa:
    - `lupa`: `valoracion-general`, `valoracion-ortodoncia`.
    - `brillo`: `limpieza-dental`, `blanqueamiento`.
    - `escudo`: `sellantes`.
    - `capa`: `carillas-de-resina`.
    - `brackets`: `control-brackets`.
    - `relleno`: `resina`.
    - `raices`: `endodoncia`.
    - `flecha`: `extraccion-simple`.
    - Cualquier otro slug: `brillo`.
  - El fondo sale de la categoría, con los gradientes de los mockups. Una categoría desconocida usa el de Preventiva.
  - Lleva `role="img"` y `aria-label` («Ilustración: diente con una lupa», etc.).
- **`<Esqueleto className />`:** un bloque con *shimmer* bajo `motion-safe`.
- **`<EstadoVacio titulo texto accion? />`** y **`<EstadoError error onReintentar />`:** este último muestra `error.detalle` y un botón «Reintentar».
- **`useRevelar<T extends HTMLElement>(): RefObject<T>`:**
  - Cuando el elemento entra en pantalla (`IntersectionObserver`, `threshold: .15`, una sola vez), le pone `data-visible="true"`.
  - Si no existe `IntersectionObserver` o el usuario prefiere reducir el movimiento, lo marca visible de inmediato.
  - El CSS es `.revelar{opacity:0;transform:translateY(18px)}` y `.revelar[data-visible=true]{animation: svUp .7s var(--ease-sv) backwards; opacity:1; transform:none}`, todo bajo `no-preference`. Con movimiento reducido, `.revelar` queda visible sin transformar.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `Boton cargando queda deshabilitado con aria-busy y no dispara onClick`.
  - `Campo con error enlaza aria-describedby al mensaje`.
  - `Chip refleja aria-pressed`.
  - `IlustracionServicio elige el acento por slug y tiene aria-label`.
  - `IlustracionServicio con slug desconocido usa brillo`.
  - `EstadoError muestra detalle y llama onReintentar`.
  - `useRevelar marca visible al intersectar`: con un `IntersectionObserver` simulado.
  - `useRevelar sin IntersectionObserver marca visible enseguida`.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar con clases de Tailwind y los tokens, copiando medidas y colores de los mockups.
- [ ] **Step 4:** Correr `npm test`. Se espera que todo PASE.
- [ ] **Step 5:** Abrir el PR.

### Task 4: Landing (parte 1): header, hero, especialidades, pasos y quiénes somos

**Files:**
- Create: `frontend/src/features/landing/pages/LandingPage.tsx`, `frontend/src/features/landing/components/{Encabezado,Hero,Especialidades,Pasos,QuienesSomos,PiePagina}.tsx`
- Test: `frontend/src/features/landing/landing.test.tsx`

**Interfaces:**
- **`Encabezado`:**
  - Es fijo (`sticky`). Cuando `scrollY > 24`, gana sombra y desenfoque (`data-compacto`).
  - El menú tiene anclas a `#inicio`, `#nosotros`, `#servicios`, `#equipo` y `#contacto`, más el `Boton como="link"` «Agenda tu cita» → `/reservar`.
  - Por debajo de `md`, el menú se convierte en un botón hamburguesa con `aria-expanded`, `aria-controls` y la etiqueta «Abrir menú» / «Cerrar menú». El ícono se transforma en «×» y el menú cae con sus enlaces escalonados. `Esc` lo cierra y devuelve el foco al botón.
- **`Hero`:**
  - Copia el texto exacto del mockup.
  - La ilustración del diente se dibuja con `stroke-dashoffset`, con destellos que titilan, el marco dorado y las dos insignias flotantes («Agenda en línea · Sin crear cuenta» y «Valoración desde ₡15 000»).
  - La insignia del precio toma el menor `precio_colones` de los servicios activos de `GET /servicios/`. Mientras carga, o si falla, dice «Valoración con precio claro».
- **`Especialidades`, `Pasos` y `QuienesSomos`:** contenido estático del mockup, con `useRevelar`.
- **`PiePagina`:** datos, horario, redes y «Acceso personal» → `/panel/login`.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `el header lleva a /reservar`.
  - `el menu móvil abre, cierra con Esc y devuelve el foco`.
  - `el hero muestra el precio mínimo real`: con MSW, el texto es «Valoración desde ₡15 000».
  - `el hero sin API muestra el texto de respaldo`.
  - `el pie tiene Acceso personal a /panel/login`.
  - `hay un solo h1`.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Correr `npm test`. Se espera que todo PASE.
- [ ] **Step 5:** Abrir el PR.

### Task 5: Landing (parte 2): servicios, equipo, testimonios y contacto

**Files:**
- Create: `frontend/src/features/landing/api.ts`, `frontend/src/features/landing/components/{Servicios,TarjetaServicio,Equipo,Testimonios,Contacto}.tsx`
- Test: `frontend/src/features/landing/secciones.test.tsx`

**Interfaces:**
- Produces (en `api.ts`):
  - `useServicios()` y `useCategorias()` → `GET /servicios/` y `GET /categorias/`.
  - `useDentistas(servicioId?)` → `GET /dentistas/`.
  - Los tipos `Servicio {id, nombre, slug, descripcion, duracion_min, precio_colones, categoria: {id, nombre}}` y `Dentista {id, nombre, apellidos, especialidad, biografia, foto_url, servicios: number[]}`.
- **`Servicios`:**
  - Chips de filtro: «Todos» más cada categoría. El filtro es local.
  - La grilla `auto-fill minmax(260px,1fr)` muestra `TarjetaServicio`: ilustración, categoría, nombre, descripción, duración, `colones(precio)` y el enlace «Agendar →» a `/reservar?servicio=<id>`.
  - Mientras carga, muestra esqueletos; si falla, `EstadoError`.
  - Lleva la nota «Los precios son aproximados…».
- **`Equipo`:** las tarjetas de dentistas con un retrato en arco. Si `foto_url` está vacío o la imagen falla (`onError`), muestra las iniciales sobre el gradiente arena. El enlace «Agendar con <nombre> →» va a `/reservar?dentista=<id>`.
- **`Testimonios`:**
  - Son 3 testimonios estáticos, con «Paciente de ejemplo».
  - En escritorio van en grilla. En móvil van en carrusel con los botones «Testimonio anterior» / «Testimonio siguiente», el texto «n de 3» y `aria-live="polite"`. No avanza solo.
- **`Contacto`:** los datos marcados como `[ ]`, igual que en el mockup, el botón de WhatsApp, el enlace para agendar, las preguntas frecuentes con `<details>` animado y el espacio para el mapa.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `lista servicios de la API con precio en colones`.
  - `el chip Estética filtra las tarjetas`.
  - `Agendar lleva a /reservar?servicio=<id>`.
  - `error de servicios muestra Reintentar y reintenta`.
  - `equipo usa iniciales si la foto falla`.
  - `Agendar con dentista lleva ?dentista=<id>`.
  - `carrusel avanza, retrocede y anuncia la posición`.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Correr `npm test`. Se espera que todo PASE.
- [ ] **Step 5:** Abrir el PR.

### Task 6: Reserva (parte 1): asistente, servicio y dentista

**Files:**
- Create: `frontend/src/features/reserva/{api.ts,estado.ts}`, `frontend/src/features/reserva/pages/ReservaPage.tsx`, `frontend/src/features/reserva/components/{Pasos,ResumenCita,PasoServicio,PasoDentista}.tsx`
- Test: `frontend/src/features/reserva/asistente.test.tsx`

**Interfaces:**
- Produces (en `estado.ts`): `useAsistente()` sincroniza el estado con los *search params* (`servicio`, `dentista`, `fecha` e `inicio`), así que el botón atrás del navegador y los enlaces profundos funcionan.
  - `dentista` acepta un id o `cualquiera`.
  - Devuelve `{ paso: 'servicio'|'dentista'|'hora'|'datos', servicioId, dentistaId: number|'cualquiera'|null, fecha, inicio, ir(paso), elegir(parcial) }`.
  - `paso` se **deriva**: lo primero que falte, en ese orden.
  - `elegir({servicioId})` borra `dentista`, `fecha` e `inicio`.
- **`Pasos`:** un `<ol>` con `aria-current="step"`. Los pasos hechos llevan ✓ y son enlaces para volver; el actual pulsa.
- **`ResumenCita`:** un `aside` oscuro con el servicio, el dentista («Cualquiera disponible» o el nombre), el día y la hora («Sin elegir» si falta) y el precio aproximado. En móvil va arriba y se puede plegar.
- **`PasoServicio`:**
  - Muestra las tarjetas con miniatura ilustrada y un botón para elegir.
  - Si `servicio` en la URL no es un servicio activo, muestra el aviso «Ese servicio ya no está disponible.» y limpia el parámetro.
- **`PasoDentista`:** la opción «Cualquiera disponible», marcada por defecto, más los dentistas de `useDentistas(servicioId)`.
- **Foco:** al cambiar de paso, el foco va al `h1` del paso (`tabIndex=-1`).

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `sin parámetros empieza en servicio`.
  - `/reservar?servicio=<id> salta a dentista y lo muestra en el resumen`.
  - `/reservar?dentista=<id> sin servicio pide servicio y conserva el dentista si lo hace`.
  - `servicio inexistente muestra aviso y vuelve a servicio`.
  - `elegir cualquiera avanza a hora`.
  - `cambiar de servicio limpia dentista y hora`.
  - `el foco va al título del paso`.
  - `los pasos hechos son enlaces para volver`.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Correr `npm test`. Se espera que todo PASE.
- [ ] **Step 5:** Abrir el PR.

### Task 7: Reserva (parte 2): día y hora, datos y envío

**Files:**
- Create: `frontend/src/features/reserva/components/{Calendario,HorasLibres,PasoHora,PasoDatos}.tsx`, `frontend/src/features/reserva/esquema.ts` (Zod)
- Modify: `frontend/src/features/reserva/api.ts`
- Test: `frontend/src/features/reserva/hora.test.tsx`, `frontend/src/features/reserva/datos.test.tsx`

**Interfaces:**
- Produces (en `api.ts`):
  - `useDiasDisponibles(servicioId, dentista, mes: {anio, mes})` → `GET /disponibilidad/dias/?servicio&desde&hasta[&dentista]`.
  - `useHorasLibres(servicioId, dentista, fecha)` → `GET /disponibilidad/`.
  - `useReservar()` → una mutación `POST /citas/` con `{servicio, inicio, dentista|null, paciente}` que devuelve `ResumenCita`.
- **`Calendario`:**
  - Muestra el mes en curso, con la semana empezando en lunes.
  - Los días con horas libres van resaltados y los demás deshabilitados.
  - Se navega por meses; no se puede ir antes del mes actual ni más allá de hoy + 60 días.
  - Se maneja con teclado: las flechas mueven el foco y Enter elige. Es un `grid` con botones.
  - Los días entran en ola bajo `motion-safe`.
- **`HorasLibres`:**
  - Agrupa las horas en «Mañana» (antes de las 12) y «Tarde».
  - La hora elegida hace *pop* y tiene `aria-pressed`.
  - Si no hay horas, muestra `EstadoVacio` («No quedan horas este día. Prueba otro día.»).
- **`esquema.ts`:** `pacienteEsquema` con Zod:
  - `nombre` y `apellidos`: de 1 a 100 caracteres y de 1 a 150, sin espacios sobrantes.
  - `email`: correo válido, con el mensaje «Escribe un correo válido (por ejemplo, nombre@gmail.com).».
  - `telefono`: `/^[0-9+\-\s]{8,20}$/`, el mismo regex del backend, con el mensaje «Escribe un teléfono válido (solo números, + o -).».
- **`PasoDatos`:**
  - Usa React Hook Form + Zod y valida al salir del campo (`mode: 'onTouched'`).
  - El botón «Confirmar la cita» usa `Boton cargando` con «Confirmando…». Mientras la mutación esté pendiente, un segundo clic no hace nada.
  - Los datos escritos se guardan en `sessionStorage` (`sv-reserva-paciente`) dentro de try/catch, así sobreviven a un 409.
- **Al enviar:**
  - Si sale bien → `navigate('/reservar/confirmada', { state: { cita } })` y se limpia `sessionStorage`.
  - 409, o 400 con `detalle === "Esa hora ya no está disponible."` → `ir('hora')`, invalidar las consultas de horas y días, y mostrar un aviso con `role="alert"` y el `detalle` sobre las horas.
  - 400 con `campos.paciente.*` o `campos.<x>` → cada error va a su campo con `setError`.
  - Otro error → `EstadoError` sobre el botón.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `el calendario resalta solo días con horas`.
  - `no permite ir a meses anteriores`.
  - `flechas mueven el foco entre días`.
  - `elegir día pide horas y agrupa mañana y tarde`.
  - `día sin horas muestra estado vacío`.
  - `elegir hora la muestra en el resumen y avanza a datos`.
  - `validación de correo y teléfono con mensajes en español`.
  - `confirmar envía un solo POST aunque se haga doble clic`.
  - `éxito navega a confirmada con la cita`.
  - `409 vuelve a hora, avisa, refresca horas y conserva los datos`.
  - `errores de campo del backend se muestran en su campo`.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Correr `npm test`. Se espera que todo PASE.
- [ ] **Step 5:** Abrir el PR.

### Task 8: Página de confirmación

**Files:**
- Create: `frontend/src/features/reserva/pages/ConfirmadaPage.tsx`, `frontend/src/shared/lib/calendario.ts`
- Test: `frontend/src/features/reserva/confirmada.test.tsx`

**Interfaces:**
- **`ConfirmadaPage`:**
  - Lee `location.state.cita`, de tipo `ResumenCita`.
  - **Si no hay cita** (la persona recargó o entró directo): muestra «Tu reserva ya fue registrada. Revisa tu correo para ver el detalle.» con el enlace «Volver al inicio». No intenta adivinar.
  - **Animaciones:** el check se dibuja, aparece un halo dorado y el detalle sube escalonado.
- **`descargarIcs(cita: ResumenCita): void`** genera un `.ics` (VEVENT con DTSTART/DTEND en UTC, SUMMARY «Cita: <servicio> · Sonrisa Viva» y LOCATION «Clínica Dental Sonrisa Viva») y lo descarga con un `Blob`. El botón que lo usa es «Agregar al calendario».

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `muestra nombre, servicio, fecha, dentista y precio`.
  - `sin estado muestra el mensaje de respaldo`.
  - `descargarIcs genera un VEVENT con fechas UTC correctas`.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Correr `npm test`. Se espera que todo PASE.
- [ ] **Step 5:** Abrir el PR.

### Task 9: Gestión de la cita por enlace

**Files:**
- Create: `frontend/src/features/gestion-cita/{api.ts}`, `frontend/src/features/gestion-cita/pages/GestionPage.tsx`, `frontend/src/features/gestion-cita/components/{Reprogramar,Cancelar}.tsx`
- Test: `frontend/src/features/gestion-cita/gestion.test.tsx`

**Interfaces:**
- Produces (en `api.ts`):
  - `useCita(token)` → `GET /citas/gestion/<token>/`, que devuelve `ResumenCita & { puede_cambiar: boolean }`.
  - `useReprogramar(token)` → `PATCH {inicio}`.
  - `useCancelar(token)` → `DELETE`.
- **`GestionPage`:**
  - **404:** muestra «No encontramos esa cita» con el texto «El enlace puede estar incompleto o la cita ya no existe.» y el enlace para agendar.
  - **Si existe:** la tarjeta de la cita con la fecha en el cuadro petróleo y la insignia de estado.
  - **Si `puede_cambiar`:** se ven las secciones **Reprogramar** y **Cancelar**.
  - **Si no:** un aviso que explica el porqué. Si está confirmada pero faltan menos de 24 h: «Faltan menos de 24 horas: para cambios escríbenos por WhatsApp.». Si no está confirmada: «Esta cita ya no se puede modificar.».
- **`Reprogramar`:**
  - Reutiliza `Calendario` y `HorasLibres` con el servicio y el **dentista de la cita**.
  - El botón dice «Mover a las <hora>».
  - Limitación conocida: el endpoint público de disponibilidad no excluye la propia cita, así que no se ofrecen las horas que se traslapan con ella (por ejemplo, de 9:00 a 9:15). Se acepta: el backend sí lo permitiría por `PATCH`.
  - Si sale bien: un aviso con `role="status"` y la tarjeta actualizada. Si da 400: el `detalle` y las horas refrescadas.
- **`Cancelar`:**
  - Abre una confirmación en línea (`role="alertdialog"`) con «Sí, cancelar» y «No, mantenerla». Al abrirse, el foco va a «No, mantenerla».
  - Si sale bien: la insignia pasa a «Cancelada» y se muestra el enlace «Agendar otra cita».

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `token desconocido muestra No encontramos esa cita`.
  - `muestra la cita y su estado`.
  - `sin puede_cambiar oculta acciones y explica por qué`.
  - `reprogramar a otra hora actualiza la tarjeta`.
  - `reprogramar con 400 muestra el mensaje`.
  - `cancelar pide confirmación con foco en mantenerla`.
  - `cancelar confirmado cambia a Cancelada`.
- [ ] **Step 2:** Correr las pruebas. Se espera que FALLEN.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Correr `npm test`. Se espera que todo PASE.
- [ ] **Step 5:** Abrir el PR.

### Task 10: Prueba contra el backend real y pulido

**Files:**
- Create: `.claude/launch.json`, con las configuraciones `backend` (`backend/.venv/Scripts/python manage.py runserver 8000`) y `frontend` (`npm run dev` en `frontend/`, puerto 5173)
- Modify: lo que salga de la revisión

- [ ] **Step 1:** `python manage.py sembrar --reiniciar`, levantar `backend` y `frontend` y abrir `http://localhost:5173`.
- [ ] **Step 2:** Recorrer a mano en el navegador, comparando con los mockups:
  - La landing en 1440 px y en 390 px.
  - Una reserva completa con «cualquiera»; revisar en la consola del backend el correo con el enlace.
  - Abrir el enlace `/cita/<token>`, reprogramar y cancelar.
  - Activar «reducir movimiento» en las DevTools y comprobar que no se anima nada.
- [ ] **Step 3:** Revisar con **ui-ux-pro-max** el checklist previo a la entrega de su `references/pro-rules.md` (foco, contraste, 44 px, sin emojis y movimiento reducido). Corregir lo que aparezca, con su prueba cuando aplique.
- [ ] **Step 4:** Correr `npm run lint && npm run format:check && npm test && npm run build`. Se espera que todo PASE. Abrir el PR con las capturas de escritorio y móvil. Al fusionarlo, tachar el Plan 3 en la #1 y cerrar la #13.
