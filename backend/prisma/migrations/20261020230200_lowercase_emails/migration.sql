-- Emails are stored and looked up in lowercase. Fails on the unique index
-- if two users' emails differ only by case: find them with
--   SELECT lower("email") FROM "User" GROUP BY 1 HAVING count(*) > 1;
UPDATE "User" SET "email" = lower("email") WHERE "email" <> lower("email");
