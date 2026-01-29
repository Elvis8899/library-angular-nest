import { AllBookInfoEvents } from "@book/domain/events";
import { AllRentalEvents } from "@rental/domain/events";
import { AllUserEvents } from "@user/domain/events";
import { z } from "zod";

export const DomainEvent = z.discriminatedUnion("eventKey", [
  ...AllUserEvents,
  ...AllBookInfoEvents,
  ...AllRentalEvents,
]);

export type DomainEvent = z.infer<typeof DomainEvent>;
