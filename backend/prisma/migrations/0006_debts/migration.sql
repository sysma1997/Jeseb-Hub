-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL,
    "idUser" TEXT NOT NULL,
    "person" TEXT NOT NULL,
    "type" BOOLEAN NOT NULL,
    "amount" DECIMAL(65,2) NOT NULL,
    "date" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMPTZ(3),
    "description" TEXT,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_payments" (
    "id" TEXT NOT NULL,
    "idUser" TEXT NOT NULL,
    "idDebt" TEXT NOT NULL,
    "date" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(65,2) NOT NULL,
    "description" TEXT,

    CONSTRAINT "debt_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "debts_idUser_date_idx" ON "debts"("idUser", "date" DESC);

-- CreateIndex
CREATE INDEX "debts_idUser_person_idx" ON "debts"("idUser", "person");

-- CreateIndex
CREATE INDEX "debts_idUser_dueDate_idx" ON "debts"("idUser", "dueDate");

-- CreateIndex
CREATE INDEX "debt_payments_idUser_idDebt_date_idx" ON "debt_payments"("idUser", "idDebt", "date" DESC);

-- CreateIndex
CREATE INDEX "debt_payments_idUser_date_idx" ON "debt_payments"("idUser", "date" DESC);

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_idDebt_fkey" FOREIGN KEY ("idDebt") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
