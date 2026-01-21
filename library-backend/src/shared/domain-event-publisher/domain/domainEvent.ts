import { AllUserEvents } from "@src/modules/user/domain/events";
import { z } from "zod";

export const DomainEvent = z.discriminatedUnion("eventKey", [...AllUserEvents]);

export type DomainEvent = z.infer<typeof DomainEvent>;
