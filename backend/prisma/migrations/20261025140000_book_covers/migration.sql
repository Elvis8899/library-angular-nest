-- Covers are uploaded files now (FileStorage); the old URLs aren't kept
ALTER TABLE "BookInfo" DROP COLUMN "image",
ADD COLUMN     "cover" TEXT;
