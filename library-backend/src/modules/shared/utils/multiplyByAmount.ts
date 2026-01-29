import { FPF } from "@shared/functional/monads";

export const getEntityAmount = (entity: object): number =>
  "amount" in entity && typeof entity.amount === "number" ? entity.amount : 1;

export const multiplyByAmount = (fn: (entity: object) => number) =>
  FPF.flow((entity: object) => getEntityAmount(entity) * fn(entity));
