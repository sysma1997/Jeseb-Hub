-- Store the selected account and optional category on each debt payment.
ALTER TABLE "debt_payments"
ADD COLUMN "idAccount" TEXT,
ADD COLUMN "category" TEXT;

-- A transaction belongs to at most one debt payment. Deleting the payment
-- detaches, rather than deletes, the transaction so debt deletion preserves
-- the financial ledger.
ALTER TABLE "transactions"
ADD COLUMN "debtPaymentId" TEXT;

CREATE UNIQUE INDEX "transactions_debtPaymentId_key"
ON "transactions"("debtPaymentId");

ALTER TABLE "debt_payments"
ADD CONSTRAINT "debt_payments_idAccount_fkey"
FOREIGN KEY ("idAccount") REFERENCES "accounts"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_debtPaymentId_fkey"
FOREIGN KEY ("debtPaymentId") REFERENCES "debt_payments"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
