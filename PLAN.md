# Plan de Mejora — BugBoard

## Fase 1: Bugs críticos (prioridad máxima)

- [ ] **requirements.txt vacío** — Agregar dependencias faltantes de Python
- [ ] **metrics.py:15** — Cambiar `BugStatus.OPEN` → `BugStatus.RESOLVED` en la query de bugs resueltos
- [ ] **Enums inconsistentes** — Unificar `BugStatus` frontend/backend: backend usa `"In Progress"`, frontend usa `"In_progress"` → debe ser el mismo valor
- [ ] **metrics.py:54** — `if [0]` es siempre truthy, corregir a `if r[0]`
- [ ] **Memory leak dashboard** — Agregar `clearInterval` en `ngOnDestroy`
- [ ] **.env tracked en git** — Mover credenciales a `.env.example`, agregar `.env` a `.gitignore` y remover del tracking

## Fase 2: Robustez y calidad

- [ ] **Tests backend** — Tests de integración con FastAPI TestClient (CRUD, métricas, clasificación AI mockeada)
- [ ] **Tests frontend** — Tests significativos con Vitest (componentes, servicio HTTP con HttpClientTestingModule)
- [ ] **Error handling backend** — Global exception handler en FastAPI, validación Pydantic para `PATCH /status`
- [ ] **Error handling frontend** — Ruta `**` para 404, interceptor HTTP global con manejo de errores
- [ ] **Interceptor API** — Implementar lógica real (logging, errores, tokens) o eliminarlo
- [ ] **Actualizar README** — Que refleje el estado real del proyecto
- [ ] **Limpiar boilerplate** — Eliminar `app.html` y `app.scss` no usados

## Fase 3: Infraestructura y DX

- [ ] **Docker Compose** — `docker-compose.yml` con backend + frontend + PostgreSQL + Ollama
- [ ] **Dockerfile backend** — Multi-stage build con dependencias
- [ ] **Dockerfile frontend** — NGINX para servir el SPA
- [ ] **Angular environments** — Mover `apiUrl` a `environment.ts` con variable de entorno

## Fase 4: Mejoras y features

- [ ] **Autenticación básica** — Al menos API key o JWT simple
- [ ] **Paginación en dashboard** — Cargar bugs con paginación en lugar de todos de golpe
- [ ] **Polling inteligente** — Reemplazar `setInterval` ciego con WebSocket o polling condicional
- [ ] **Prompt polishing** — Corregir typo "Operative System" → "Operating System", unificar idioma a inglés
- [ ] **Rate limiting** — Proteger endpoints de creación de bugs
- [ ] **Cobertura de tests > 70%** — Meta final de calidad

---

## Prioridades

1. **Fase 1** — Bugs que rompen funcionalidad o son riesgos de seguridad
2. **Fase 2** — Tests y error handling para producción
3. **Fase 3** — Docker y DX para desarrollo consistente
4. **Fase 4** — Features adicionales
