import { FPF } from "@shared/utils/application/monads";
import { DomainError } from "@shared/utils/domain/shared.errors";
import {
  domainErrorStatuses,
  toHttpException,
} from "@shared/utils/http/domainError.filter";
import { readdirSync } from "node:fs";
import { join } from "node:path";

// Every module's errors: src/modules/<module>/domain/*.errors.ts
const modulesDir = join(__dirname, "..", "..", "..", "src", "modules");
const errorFiles = readdirSync(modulesDir).flatMap((module) => {
  const domain = join(modulesDir, module, "domain");
  try {
    return readdirSync(domain)
      .filter((file) => file.endsWith(".errors.ts"))
      .map((file) => join(domain, file));
  } catch {
    return [];
  }
});

type ErrorClass = (new () => DomainError) & { code: string; kind: string };

const isErrorClass = (value: unknown): value is ErrorClass =>
  typeof value === "function" && value.prototype instanceof DomainError;

const exportsOf = async (file: string): Promise<[string, unknown][]> =>
  Object.entries(
    FPF.unsafeCoerce<unknown, Record<string, unknown>>(await import(file)),
  );

// Whatever a factory takes (an id, a row, a list): any field or call of it
// is itself, so the factory builds its details from it
const anything: unknown = new Proxy(() => anything, {
  get: (_, key) => (key === Symbol.toPrimitive ? () => "x" : anything),
  apply: () => anything,
});

/**
 * Every domain error against its own declaration, so a new one needs no case
 * here: `domainError(kind, code, message)` answers the kind's status with the
 * code, and every factory builds an error. The frontend translates errors by
 * code (errors.<code> in its pt-BR.ts; translationKeys.spec.ts checks each
 * has one), and contractErrorCodes.unit-spec.ts that each listed code is used.
 */
describe("[Unit] Domain errors", () => {
  it("Should find every module's errors", () => {
    // auth, book, rental and user
    expect(errorFiles.length).toBeGreaterThanOrEqual(4);
  });

  it.each(errorFiles)(
    "Should answer each error of %s with its kind's status and its code",
    async (file) => {
      const classes = (await exportsOf(file)).filter(
        (entry): entry is [string, ErrorClass] => isErrorClass(entry[1]),
      );
      expect(classes.length).toBeGreaterThan(0);
      for (const [name, ErrorClass] of classes) {
        const error = new ErrorClass();
        const exception = toHttpException(error);
        const status = domainErrorStatuses[error.kind];

        expect([error.kind, error.code], name).toEqual([
          ErrorClass.kind,
          ErrorClass.code,
        ]);
        expect(exception.getResponse(), name).toMatchObject({
          statusCode: status,
          code: ErrorClass.code,
          message: exception.message,
        });
        expect(exception.getResponse(), name).toHaveProperty("error");
        expect(exception.getStatus(), name).toBe(status);
        // The message stays readable for other clients
        expect(exception.message, name).not.toBe(ErrorClass.code);
      }
    },
  );

  it.each(errorFiles)(
    "Should build an error with every factory of %s",
    async (file) => {
      for (const [name, factory] of await exportsOf(file)) {
        if (typeof factory !== "function" || isErrorClass(factory)) continue;
        const args = Array.from({ length: factory.length }, () => anything);
        const build = FPF.unsafeCoerce<
          typeof factory,
          (...args: unknown[]) => unknown
        >(factory);
        expect(build(...args), name).toBeInstanceOf(DomainError);
      }
    },
  );

  it("Should give each error its own code", async () => {
    const codes = (await Promise.all(errorFiles.map(exportsOf)))
      .flat()
      .flatMap(([, value]) => (isErrorClass(value) ? [value.code] : []));
    expect(
      codes.filter((code, index) => codes.indexOf(code) !== index),
    ).toEqual([]);
  });
});
