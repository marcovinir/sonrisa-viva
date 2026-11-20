# Sonrisa Viva 🦷

Sitio de una **clínica dental ficticia** hecho como proyecto de portafolio: una landing donde el visitante conoce la clínica y **agenda una cita con disponibilidad real**, y un **panel propio en `/panel`** donde el personal gestiona citas, servicios, dentistas, usuarios y reportes.

> Estado: 🚧 en construcción. La hoja de ruta vive en la issue #1.

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Django + Django REST Framework (sesión con cookies + CSRF)
- **Base de datos:** PostgreSQL (Supabase en producción) — modelo en 3FN con restricción de exclusión para evitar citas traslapadas
- **Despliegue:** Vercel (frontend y backend) + Supabase

## Desarrollo local

Requiere Python 3.12, Node 24 y PostgreSQL (sin Docker).

```bash
# Backend
cd backend
py -3.12 -m venv .venv
.venv/Scripts/python -m pip install -r requirements-dev.txt
cp .env.example .env            # ajusta DATABASE_URL si hace falta
.venv/Scripts/python manage.py migrate
.venv/Scripts/python manage.py sembrar
.venv/Scripts/python -X utf8 manage.py runserver 8000   # -X utf8: en Windows, para que los correos de consola con «₡» no fallen

# Frontend (otra terminal)
cd frontend
npm install
npm run dev                     # reenvía /api a http://localhost:8000
```

Pruebas: `pytest -q` en `backend/` y `npm test` en `frontend/`.

## Documentación

- [Diseño](docs/superpowers/specs/2026-11-19-sonrisa-viva-design.md)
- [Plan 1 — Cimientos](docs/superpowers/plans/2026-11-19-plan-1-cimientos.md)
