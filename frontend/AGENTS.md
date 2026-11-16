# Frontend — AGENTS.md

## Alcance y stack

Esta aplicación es el dashboard de Jeseb: Astro 5, TypeScript, React 19 mediante `@astrojs/react` y Chart.js 4 para visualizaciones. Usa pnpm. dayjs se usa para fechas; PapaParse para datos CSV. El proyecto también usa `astro-icon`/Iconify y CSS propio.

## Arquitectura y organización

- `src/pages/` define las rutas Astro, incluidas las rutas localizadas bajo `[lang]`.
- `src/layouts/` y `src/components/` contienen layouts y componentes visuales Astro/React.
- `src/core/<módulo>/domain/` contiene los contratos/modelos del frontend y sus interfaces de repositorio; `infrastructure/` contiene adaptadores HTTP.
- `src/scripts/` contiene la lógica de interacción del navegador; los módulos de páginas con lógica más amplia pueden dividirse en subdirectorios, como `scripts/reports/`.
- `src/styles/` contiene CSS modular del proyecto. No asumas que Bulma está instalado: el diseño actual usa estilos propios.
- Mantén Astro como renderizado por defecto y reserva React/hidratación para interacciones que lo necesiten. No conviertas páginas estáticas en islas React sin una razón concreta.

## Reglas importantes

- El backend es la fuente de verdad de los contratos HTTP. Al cambiar un endpoint, actualiza el adaptador del frontend y conserva el manejo de errores de `src/core/shared/infrastructure/Api.ts`.
- El proyecto soporta inglés y español. Mantén sincronizados `src/core/shared/infrastructure/i18n/locales/en.json` y `es.json` para el dashboard.
- Mantén exactitud en valores financieros y coherencia con el formato decimal recibido por la API. Usa `Money` y `FormatNumber` compartidos en vez de duplicar conversiones o formato.
- Usa UTC para enviar o interpretar fechas de API cuando corresponda. Respeta la convención de fechas del módulo que modificas.
- Accesibilidad y responsive: conserva etiquetas, estados, foco y semántica de los controles existentes; evita depender únicamente del color para comunicar estados.
- No añadas librerías de UI/CSS ni dupliques componentes/utilidades existentes sin necesidad.

## Comandos

Desde `frontend/` (instala dependencias con `pnpm install`):

```bash
pnpm dev      # Astro dev server (puerto 8000 por defecto)
pnpm build    # build de producción
pnpm preview  # previsualiza el build
pnpm test     # suite Vitest
```

Configura `PUBLIC_BACKEND_URL` según `.env.example`/Compose para comunicarte con la API. No guardes secretos en variables públicas `PUBLIC_*`.

## Validación del cambio

Ejecuta los tests relevantes con `pnpm test` y `pnpm build`. Para cambios de UI, verifica además las rutas/idiomas afectados en el navegador si el entorno está disponible.
