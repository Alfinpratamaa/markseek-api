-- CreateEnum
CREATE TYPE "LoginType" AS ENUM ('email', 'google');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "loginType" TEXT DEFAULT 'email';
