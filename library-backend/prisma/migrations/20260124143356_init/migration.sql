-- CreateEnum
CREATE TYPE "UserRoleEnum" AS ENUM ('admin', 'client');

-- CreateEnum
CREATE TYPE "BookItemStatus" AS ENUM ('rented', 'available');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('rented', 'finished');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "cpf" TEXT,
    "role" "UserRoleEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "BookInfo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "BookItem" (
    "id" TEXT NOT NULL,
    "status" "BookItemStatus" NOT NULL DEFAULT 'available',
    "bookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "BookRentalDetails" (
    "id" TEXT NOT NULL,
    "rentalStatus" "RentalStatus" NOT NULL,
    "bookItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overdueDate" TIMESTAMP(3) NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BookInfo_id_key" ON "BookInfo"("id");

-- CreateIndex
CREATE UNIQUE INDEX "BookItem_id_key" ON "BookItem"("id");

-- CreateIndex
CREATE UNIQUE INDEX "BookRentalDetails_id_key" ON "BookRentalDetails"("id");

-- AddForeignKey
ALTER TABLE "BookItem" ADD CONSTRAINT "BookItem_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "BookInfo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookRentalDetails" ADD CONSTRAINT "BookRentalDetails_bookItemId_fkey" FOREIGN KEY ("bookItemId") REFERENCES "BookItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookRentalDetails" ADD CONSTRAINT "BookRentalDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
