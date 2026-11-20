# Sonrisa Viva 🦷

Sitio de una **clínica dental ficticia** hecho como proyecto de portafolio: una landing donde el visitante conoce la clínica y **agenda una cita con disponibilidad real**, y un **panel propio en `/panel`** donde el personal gestiona citas, servicios, dentistas, usuarios y reportes.

> Estado: 🚧 en construcción. La hoja de ruta vive en la issue #1.

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Django + Django REST Framework (sesión con cookies + CSRF)
- **Base de datos:** PostgreSQL (Supabase en producción) — modelo en 3FN con restricción de exclusión para evitar citas traslapadas
- **Despliegue:** Vercel (frontend y backend) + Supabase

## Documentación

- [Diseño](docs/superpowers/specs/2026-11-19-sonrisa-viva-design.md)
- [Plan 1 — Cimientos](docs/superpowers/plans/2026-11-19-plan-1-cimientos.md)
