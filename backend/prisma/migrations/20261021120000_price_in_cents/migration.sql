-- Prices are stored in centavos, so a book can cost R$ 12,50
ALTER TABLE "BookInfo" RENAME COLUMN "price" TO "priceCents";
UPDATE "BookInfo" SET "priceCents" = "priceCents" * 100;
