-- Admins without a CPF stored "", which a unique index would allow only
-- once; NULL, which it ignores, now stands for "no CPF".
UPDATE "User" SET "cpf" = NULL WHERE "cpf" = '';

-- CreateIndex
-- Fails if two users already share a CPF: find them with
--   SELECT "cpf" FROM "User" GROUP BY "cpf" HAVING count(*) > 1;
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");
