import { OnEvent } from "@nestjs/event-emitter";
import { DomainEvent } from "@shared/domainEventPublisher/domainEvent";

/** An event's name: a key of DomainEvent. */
export type EventKey = DomainEvent["eventKey"];

/** What the event named `K` carries. */
export type PayloadOf<K extends EventKey> = Extract<
  DomainEvent,
  { eventKey: K }
>["payload"];

/**
 * Subscribes the method to a domain event, which DomainEventPublisher waits
 * for (its errors are logged, not returned). The key must be one of
 * DomainEvent's, and the method must take that event's payload:
 * `@OnDomainEvent(WORKER_DEACTIVATED) handle({ id }:
 * WorkerDeactivatedEvent["payload"])`.
 */
export const OnDomainEvent =
  <K extends EventKey>(key: K) =>
  <M extends (payload: PayloadOf<K>) => void | Promise<void>>(
    target: object,
    property: string | symbol,
    descriptor: TypedPropertyDescriptor<M>,
  ): void => {
    OnEvent(key)(target, property, descriptor);
  };
