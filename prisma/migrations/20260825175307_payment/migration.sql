/*
  Warnings:

  - You are about to drop the column `refundAmmount` on the `payments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "refundAmmount",
ADD COLUMN     "refundAmount" DECIMAL(10,2);
