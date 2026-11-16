# Landing — AGENTS.md

## Alcance y stack

Sitio público de Jeseb, independiente del dashboard. Usa Astro 5 y TypeScript con pnpm, más `@astrojs/sitemap`. La configuración define inglés y español (`en`/`es`), genera sitemap para `https://jeseb.com` y sirve localmente en el puerto 8080 por defecto.

## Arquitectura y organización

- `src/pages/` contiene las páginas Astro y sus rutas localizadas.
- `src/components/` contiene secciones y piezas de la landing.
- `src/layouts/` contiene el layout compartido.
- `src/i18n/` y `src/i18n/locales/{en,es}.json` contienen la localización del sitio.
- `src/styles/` contiene estilos propios.
- Mantén la landing ligera, mayormente estática y separada del frontend autenticado. No agregues React u otras dependencias de cliente sin una necesidad clara.

## Reglas importantes

- Mantén las traducciones inglesa y española sincronizadas, así como los enlaces de navegación y llamados a la acción en ambos idiomas.
- Conserva los metadatos SEO, canonical/sitemap, semántica HTML, accesibilidad y diseño responsive.
- No expongas credenciales. `PUBLIC_*` es información visible en el navegador y no debe contener secretos.
- Sigue los componentes y estilos existentes antes de incorporar un sistema visual o librería nueva.

## Comandos

Desde `landing/` (instala dependencias con `pnpm install`):

```bash
pnpm dev      # servidor Astro (puerto 8080)
pnpm build    # build de producción y sitemap
pnpm preview  # previsualiza el build
pnpm check    # Astro check
```

La landing usa `PUBLIC_LANDING_FRONTEND_URL` para el enlace al dashboard cuando aplica.

## Validación del cambio

Ejecuta `pnpm check` y `pnpm build` para cambios de contenido, rutas, estilos o configuración. Comprueba las páginas en inglés y español y que los enlaces/SEO afectados sigan siendo correctos.
