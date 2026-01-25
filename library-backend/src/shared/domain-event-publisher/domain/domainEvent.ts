import { AllBookInfoEvents } from "@src/modules/book/domain/events";
import { AllRentalEvents } from "@src/modules/rental/domain/events";
import { AllUserEvents } from "@src/modules/user/domain/events";
import { z } from "zod";

export const DomainEvent = z.discriminatedUnion("eventKey", [
  ...AllUserEvents,
  ...AllBookInfoEvents,
  ...AllRentalEvents,
]);

export type DomainEvent = z.infer<typeof DomainEvent>;
