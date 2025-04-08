/*
  Warnings:

  - You are about to drop the column `defaultAdditionalServicesFee` on the `GlobalParameters` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GlobalParameters" DROP COLUMN "defaultAdditionalServicesFee";
