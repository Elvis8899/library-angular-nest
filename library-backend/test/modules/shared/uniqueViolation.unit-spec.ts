import { Prisma } from "@db/generated/client";
import { O } from "@shared/utils/application/monads";
import {
  mapUniqueViolations,
  violatedUniqueIndex,
} from "@shared/utils/database/uniqueViolation";
import { unknownException } from "@shared/utils/domain/shared.errors";

// What the pg adapter reports for a write that broke a unique constraint
const uniqueViolation = (index: string) =>
  unknownException(
    new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "7.10.1",
      meta: {
        modelName: "User",
        driverAdapterError: {
          cause: { kind: "UniqueConstraintViolation", constraint: { index } },
        },
      },
    }),
  );

describe("[Unit] Unique violations", () => {
  const emailTaken = new Error("email taken");
  const mapUserViolations = mapUniqueViolations({
    User_email_key: () => emailTaken,
  });

  it("Should read the broken index from a failed write", () => {
    expect(violatedUniqueIndex(uniqueViolation("User_email_key"))).toEqual(
      O.some("User_email_key"),
    );
  });

  it("Should find no index in other errors", () => {
    expect(violatedUniqueIndex(unknownException(new Error("boom")))).toEqual(
      O.none,
    );
  });

  it("Should replace a mapped violation with its domain error", () => {
    expect(mapUserViolations(uniqueViolation("User_email_key"))).toBe(
      emailTaken,
    );
  });

  it("Should keep the 500 for an unmapped index or another error", () => {
    const otherIndex = uniqueViolation("User_cpf_key");
    const otherError = unknownException(new Error("boom"));

    expect(mapUserViolations(otherIndex)).toBe(otherIndex);
    expect(mapUserViolations(otherError)).toBe(otherError);
  });
});
