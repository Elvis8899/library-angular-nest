import { AllBookInfoEvents } from "@modules/book/domain/events";
import { AllRentalEvents } from "@modules/rental/domain/events";
import { AllUserEvents } from "@modules/user/domain/events";
import { ResourceChangedEvent } from "@shared/domainEventPublisher/resourceChanged.event";
import { z } from "zod";

export const DomainEvent = z.discriminatedUnion("eventKey", [
  ...AllUserEvents,
  ResourceChangedEvent,
  // Lending example
  ...AllBookInfoEvents,
  ...AllRentalEvents,
]);

export type DomainEvent = z.infer<typeof DomainEvent>;
