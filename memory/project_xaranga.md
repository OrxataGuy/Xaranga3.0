---
name: Proyecto Xaranga
description: App NextJS para charanga/banda de calle - gestión de peticiones de canciones en tiempo real
type: project
---

App de peticiones musicales en tiempo real para una charanga valenciana (Fallas).

**Stack:** Next.js 16 App Router, MongoDB (mongoose), iron-session (cookies 10 min), SSE para tiempo real, Tailwind CSS inline styles.

**Rutas clave:**
- `/` — vista pública para falleros/clientes
- `/admin` — panel admin con PIN (NEXT_PUBLIC_ADMIN_PIN en .env.local)
- `/api/songs` — GET lista ordenada por votos, POST añadir canción (rate limit sesión)
- `/api/songs/[id]/vote` — POST voto
- `/api/admin/play/[id]` — POST resetea votos a 0 (canción tocada)
- `/api/admin/songs/[id]` — DELETE eliminar canción
- `/api/sse` — Server-Sent Events, actualiza cada 3s

**Variables de entorno (.env.local):**
- MONGODB_URI
- SESSION_SECRET (mínimo 32 chars)
- NEXT_PUBLIC_ADMIN_PIN

**Why:** Uso en directo en la calle durante las Fallas, usuarios pueden estar bebidos, diseño oscuro mobile-first con botones grandes.

**How to apply:** Cualquier cambio debe mantener simplicidad extrema. Botones grandes, alto contraste, sin fricciones.
