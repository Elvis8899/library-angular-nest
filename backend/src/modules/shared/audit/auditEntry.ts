import { DateType } from "@shared/utils/domain/dateType";
import { UUID } from "@shared/uuid/uuid";
import { z } from "zod";

/** A larger input is kept as `{ truncated: true, length }`. */
export const AUDIT_INPUT_MAX = 16_000;

/**
 * Who changed what: one per write command that succeeded, with the
 * handler's name, the record it named and what it logs of the command
 * (never passwords or tokens).
 */
export const AuditEntry = z.object({
  id: UUID,
  userId: z.string().nullable(),
  useCase: z.string().min(1),
  recordId: z.string().nullable(),
  input: z.unknown().nullable(),
  recordedAt: DateType,
});
export type AuditEntry = z.infer<typeof AuditEntry>;

/** An entry to store; the store gives it its id and time. */
export type NewAuditEntry = Omit<AuditEntry, "id" | "recordedAt">;

const Named = z.looseObject({
  id: z.string().max(64).optional().catch(undefined),
});

// The fields a command or its result names: an object's, or a lone id
const namedIn = (value: unknown): z.infer<typeof Named> => {
  if (typeof value === "string") return namedIn({ id: value });
  const named = Named.safeParse(value);
  return named.success ? named.data : {};
};

// Plain JSON (dates as strings), cut when too large or not serializable
const storedInput = (input: unknown): unknown => {
  if (input === undefined) return null;
  try {
    const json = JSON.stringify(input);
    return json.length > AUDIT_INPUT_MAX
      ? { truncated: true, length: json.length }
      : JSON.parse(json);
  } catch {
    return { truncated: true };
  }
};

/**
 * The entry for a command that succeeded: the record its input names (`id`,
 * or the id it is), or the id of what it returned (a record it created).
 */
export const auditEntryOf = (
  useCase: string,
  input: unknown,
  result: unknown,
  userId: string | null,
): NewAuditEntry => {
  return {
    userId,
    useCase,
    recordId: namedIn(input).id ?? namedIn(result).id ?? null,
    input: storedInput(input),
  };
};
