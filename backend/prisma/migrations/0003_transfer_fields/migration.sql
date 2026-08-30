-- AlterTable
ALTER TABLE "public"."transactions" ADD COLUMN "transferId" TEXT;

-- AlterTable
ALTER TABLE "public"."transactions" ADD COLUMN "isTransfer" BOOLEAN NOT NULL DEFAULT false;
