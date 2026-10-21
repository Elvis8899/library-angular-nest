-- The ids were unique indexes, not primary keys. The foreign keys depend on
-- those indexes, so they are dropped first and recreated unchanged after
-- the primary keys replace the indexes.

-- DropForeignKey
ALTER TABLE "BookItem" DROP CONSTRAINT "BookItem_bookId_fkey";
ALTER TABLE "BookRentalDetails" DROP CONSTRAINT "BookRentalDetails_bookItemId_fkey";
ALTER TABLE "BookRentalDetails" DROP CONSTRAINT "BookRentalDetails_userId_fkey";
ALTER TABLE "RefreshSession" DROP CONSTRAINT "RefreshSession_userId_fkey";

-- AlterTable
ALTER TABLE "BookInfo" ADD CONSTRAINT "BookInfo_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "BookInfo_id_key";

-- AlterTable
ALTER TABLE "BookItem" ADD CONSTRAINT "BookItem_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "BookItem_id_key";

-- AlterTable
ALTER TABLE "BookRentalDetails" ADD CONSTRAINT "BookRentalDetails_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "BookRentalDetails_id_key";

-- AlterTable
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "User_id_key";

-- AddForeignKey
ALTER TABLE "BookItem" ADD CONSTRAINT "BookItem_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "BookInfo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookRentalDetails" ADD CONSTRAINT "BookRentalDetails_bookItemId_fkey" FOREIGN KEY ("bookItemId") REFERENCES "BookItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookRentalDetails" ADD CONSTRAINT "BookRentalDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
