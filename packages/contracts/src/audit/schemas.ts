import { z } from "zod";
import { Id, optionalParam, page, Timestamp } from "../common.js";
import { contract } from "../registry.js";

const Text = (max: number) => z.string().trim().min(1).max(max);

// Requests

/** The audit screen's filters: the person, part of the operation's name,
 * the record and the period (from included, before excluded). */
export const AuditQuery = z
  .object({
    userId: optionalParam(Id).describe("Quem fez"),
    useCase: optionalParam(Text(80)).describe(
      "Parte do nome da operação, sem diferenciar maiúsculas",
    ),
    recordId: optionalParam(Text(64)).describe("O registro alterado (id)"),
    from: optionalParam(Timestamp).describe("Desde este instante (ISO)"),
    before: optionalParam(Timestamp).describe(
      "Antes deste instante, excluído (ISO)",
    ),
  })
  .refine(({ from, before }) => !from || !before || from < before, {
    message: "O início do período deve ser antes do fim",
    path: ["from"],
  });
export type AuditQuery = z.input<typeof AuditQuery>;

// Responses

export const AuditEntry = contract(
  z.object({
    id: Id,
    userId: Id.nullable(),
    userName: z
      .string()
      .nullable()
      .describe("O nome de quem fez; null sem conta (login, script)"),
    useCase: z.string().describe("A operação, como UpdateUser"),
    recordId: z.string().nullable(),
    input: z
      .unknown()
      .describe(
        "O que a operação recebeu, sem senhas nem tokens; uma grande demais vem como { truncated: true, length }",
      ),
    recordedAt: Timestamp,
  }),
  { id: "AuditEntry", description: "Quem alterou o quê" },
);
export type AuditEntry = z.input<typeof AuditEntry>;

export const AuditEntryPage = contract(page(AuditEntry), {
  id: "AuditEntryPage",
});
export type AuditEntryPage = z.input<typeof AuditEntryPage>;
