/*
  Warnings:

  - You are about to drop the column `banner` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "banner",
ADD COLUMN     "thumbnail" TEXT;
