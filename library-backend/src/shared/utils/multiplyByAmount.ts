import { FPF } from "../functional/monads";

export const getEntityAmount = <Entity extends object>(
  entity: Entity,
): number =>
  "amount" in entity && typeof entity.amount === "number" ? entity.amount : 1;

export const multiplyByAmount = <Entity extends object, Result extends number>(
  fn: (entity: Entity) => Result,
) => FPF.flow((entity: Entity) => getEntityAmount(entity) * fn(entity));
