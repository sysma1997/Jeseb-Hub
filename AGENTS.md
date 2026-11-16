# AGENTS.md

## Propósito del repositorio

Jeseb Hub es una suite profesional de gestión de finanzas personales. Ayuda a las personas a tomar control de su vida financiera desde un solo lugar: permite administrar cuentas y saldos, registrar y categorizar ingresos y gastos, y comprender la actividad financiera mediante analíticas visuales e informes. También contempla importar y exportar transacciones en CSV.

El proyecto prioriza la privacidad y la independencia financiera: puede desplegarse en infraestructura propia con Docker, manteniendo los datos bajo el control de quien lo administra. Al trabajar en funcionalidades relacionadas con seguridad o datos personales, conserva este enfoque y no asumas que el despliegue debe depender de servicios externos.

El repositorio es un monorepo compuesto por tres aplicaciones independientes:

- `backend/`: API REST y lógica financiera.
- `frontend/`: aplicación web autenticada para usuarios.
- `landing/`: sitio público de marketing.

Lee también el `AGENTS.md` de la aplicación que vayas a modificar; sus instrucciones complementan esta guía.

## Arquitectura

- El backend sigue Arquitectura Hexagonal (Ports & Adapters) con conceptos de Domain-Driven Design. Los módulos de `backend/src/core/` se organizan por área funcional y pueden contener `domain/`, `application/` e `infrastructure/`. Mantén las dependencias dirigidas hacia el dominio: Prisma, Express y servicios externos son adaptadores, no lógica de dominio.
- El frontend es una aplicación Astro con React para las islas interactivas. Separa páginas y presentación de contratos de dominio y adaptadores HTTP en `src/core/`.
- La landing es una aplicación Astro independiente, orientada a contenido público y generación estática.
- No introduzcas dependencias entre las tres aplicaciones ni des por hecho que comparten tipos en un paquete común.

## Convenciones del proyecto

- Sigue el estilo y la organización del módulo vecino antes de crear patrones nuevos. Mantén el alcance del cambio acotado y evita refactors no solicitados.
- No añadas dependencias si las herramientas existentes resuelven la necesidad. Actualiza el lockfile de la aplicación correspondiente si una dependencia realmente es necesaria.
- La aplicación está localizada en inglés y español (`en`/`es`): añade o actualiza ambas traducciones cuando cambies texto visible.
- Trata los datos financieros con exactitud: en el backend usa `Money` para aritmética monetaria en centavos enteros y conserva el formato decimal del contrato/API donde corresponda. No hagas cálculos financieros con coma flotante sin conversión explícita.
- Interpreta y serializa fechas de forma coherente con UTC, como en los módulos existentes.
- En operaciones con datos de usuarios, aplica siempre el alcance por usuario autenticado. No expongas secretos, credenciales ni datos personales en logs, respuestas o archivos versionados.
- No edites artefactos generados de Prisma a mano; modifica el esquema o la fuente correspondiente y usa el flujo existente de generación.
- No sobrescribas cambios locales que no formen parte de tu tarea.

## Verificación

Ejecuta las pruebas y compilación de la aplicación modificada; los comandos específicos están en los `AGENTS.md` de `backend/`, `frontend/` y `landing/`. Para levantar el conjunto con Docker Compose se usa `docker compose up --build`; requiere las variables del entorno y la red externa configurada en `compose.yaml`.

## Contexto de reportes

Las notas de diseño y las invariantes específicas del módulo Reportes se conservan en [`docs/REPORTS.md`](docs/REPORTS.md). Antes de implementar una mejora allí, verifica su estado en el código actual: esa nota distingue objetivos de comportamiento ya comprobado.
