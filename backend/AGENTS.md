# Backend — AGENTS.md

## Alcance y stack

Esta aplicación implementa la API de Jeseb con Node.js (usa Node 22 o superior), TypeScript en modo `strict`, Express 5 y Prisma 7 sobre PostgreSQL. Usa pnpm; el esquema y las migraciones están en `prisma/` y el cliente generado se escribe en `src/generated/prisma/`.

Librerías principales presentes en `package.json`: `@prisma/client`, `@prisma/adapter-pg`, `express`, `express-rate-limit`, `cors`, `dotenv`, `jsonwebtoken`, `bcryptjs`, `multer`, `resend` y `uuid`. Para fechas se usa dayjs; las pruebas usan Jest, ts-jest y jest-mock-extended.

## Arquitectura y organización

- Los módulos funcionales viven en `src/core/<módulo>/` (por ejemplo `account`, `category`, `transaction`, `user` y `reports`).
- `domain/` contiene reglas, entidades, tipos y puertos/repositorios definidos por el dominio.
- `application/` orquesta casos de uso cuando el módulo los necesita.
- `infrastructure/` implementa adaptadores externos, como controladores Express, repositorios Prisma, autenticación y almacenamiento.
- `src/core/shared/` contiene componentes transversales. Mantén las reglas de negocio fuera de controladores y repositorios Prisma; depende de interfaces del dominio para invertir dependencias.
- El ensamblado de dependencias y rutas de la aplicación está en `src/index.ts`.
- Los tests están en `src/__tests__/`, organizados por módulo o propósito. Sigue la estructura y las herramientas de los tests existentes.

## Reglas importantes

- Toda consulta o modificación de datos financieros debe quedar limitada al `idUser` autenticado. Usa `UserAuthenticate` en rutas protegidas y verifica que los repositorios mantengan el aislamiento por usuario.
- Los importes persistidos usan `Decimal` de PostgreSQL/Prisma. Para operaciones en TypeScript utiliza `src/core/shared/domain/Money.ts` y centavos enteros; no conviertas a `number` antes de necesitar la representación externa.
- Conserva las migraciones existentes y no edites el cliente Prisma generado directamente. Si cambia el esquema, actualiza el schema/migración según el flujo de Prisma del proyecto y regenera el cliente.
- El backend usa traducciones en `src/core/shared/infrastructure/i18next/locales/{en,es}.json`; mantén ambas cuando añadas mensajes visibles o de API.
- No registres contraseñas, tokens, secretos, códigos de verificación ni datos sensibles. Respeta las protecciones de autenticación, sesiones, rate limiting y acciones sensibles existentes.

## Comandos

Desde `backend/` (instala dependencias con `pnpm install`):

```bash
pnpm dev             # servidor de desarrollo con nodemon
pnpm build           # compilación TypeScript a dist/
pnpm start           # ejecuta dist/index.js
pnpm test            # suite Jest
pnpm storage:studio  # Prisma Studio
```

La API necesita las variables configuradas en `backend/.env` (consulta `.env.example`) y una base PostgreSQL accesible. No compartas ni sobrescribas archivos `.env`.

## Validación del cambio

Ejecuta al menos `pnpm test` y `pnpm build` para cambios de código; para cambios de esquema o consultas incluye las pruebas de repositorio relevantes. No afirmes que una prueba pasó si no la ejecutaste.
