-- Indices
--
-- transactions y accounts solo tenian su primary key (sobre id), pero todo el codigo
-- filtra por "idUser" y ademas ordena por "date". Sin estos indices cada consulta era
-- un seq scan. El compuesto (idUser, date) cubre a la vez el filtro y el ORDER BY.

CREATE INDEX "accounts_idUser_id_idx" ON "accounts"("idUser", "id");
CREATE INDEX "accounts_idUser_name_idx" ON "accounts"("idUser", "name");
CREATE INDEX "categories_idUser_name_idx" ON "categories"("idUser", "name");
CREATE INDEX "transactions_idUser_date_idx" ON "transactions"("idUser", "date" DESC);
CREATE INDEX "transactions_idUser_transferId_idx" ON "transactions"("idUser", "transferId");

-- Precision
--
-- numeric(65,30) sobreespecificado: el dominio maneja 2 decimales y ninguna fila
-- tenia mas. Los 30 decimales ademas dan una falsa impresion de exactitud infinita
-- que se pierde igual en la frontera, al convertir a number en JS.

ALTER TABLE "accounts" ALTER COLUMN "balance" SET DATA TYPE DECIMAL(65,2);
ALTER TABLE "transactions" ALTER COLUMN "value" SET DATA TYPE DECIMAL(65,2);

-- Fechas con zona
--
-- timestamp WITHOUT TIME ZONE guarda el instante desnudo: no sabe que zona es, asi que
-- si el servidor cambia de zona (o se compara la base entre entornos) todos los datos
-- se reinterpretan y se desplazan a la vez. timestamptz guarda el instante real y
-- convierte al leer.
--
-- El USING explicito es imprescindible: sin el, Postgres interpreta el valor antiguo en
-- la zona de la sesion, no en UTC. Ahora mismo el servidor esta en UTC y por eso
-- coincidiria, pero dejaria el dato correcto por casualidad y no por decision.
-- "AT TIME ZONE 'UTC'" interpreta el valor sin zona como si ya fuera UTC, que es como
-- los escribio el backend (dayjs.utc) y como esta el servidor.

ALTER TABLE "transactions"
    ALTER COLUMN "date" SET DATA TYPE TIMESTAMPTZ(3) USING "date" AT TIME ZONE 'UTC';

ALTER TABLE "users"
    ALTER COLUMN "createAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createAt" AT TIME ZONE 'UTC',
    ALTER COLUMN "lastUpdate" SET DATA TYPE TIMESTAMPTZ(3) USING "lastUpdate" AT TIME ZONE 'UTC';

ALTER TABLE "sessions"
    ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
    ALTER COLUMN "lastSeenAt" SET DATA TYPE TIMESTAMPTZ(3) USING "lastSeenAt" AT TIME ZONE 'UTC',
    ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC',
    ALTER COLUMN "revokedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "revokedAt" AT TIME ZONE 'UTC',
    ALTER COLUMN "rotatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "rotatedAt" AT TIME ZONE 'UTC';