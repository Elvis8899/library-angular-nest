-- CreateEnum
CREATE TYPE "UserRoleEnum" AS ENUM ('admin', 'client');

-- CreateEnum
CREATE TYPE "BookItemStatus" AS ENUM ('rented', 'available', 'lost');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('rented', 'finished');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRoleEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "BookDetails" (
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
    "status" "BookItemStatus" NOT NULL,
    "bookId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "BookRentalDetails" (
    "id" TEXT NOT NULL,
    "rentalStatus" "RentalStatus" NOT NULL,
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overdueDate" TIMESTAMP(3) NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "BookDetails_id_key" ON "BookDetails"("id");

-- CreateIndex
CREATE UNIQUE INDEX "BookItem_id_key" ON "BookItem"("id");

-- CreateIndex
CREATE UNIQUE INDEX "BookRentalDetails_id_key" ON "BookRentalDetails"("id");

-- AddForeignKey
ALTER TABLE "BookItem" ADD CONSTRAINT "BookItem_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "BookDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookRentalDetails" ADD CONSTRAINT "BookRentalDetails_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "BookDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookRentalDetails" ADD CONSTRAINT "BookRentalDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
