import { RESOURCE_CHANGED, Resource, ResourceChange } from "@library/contracts";
import { z } from "zod";

// The resources and the event's name are the contracts' (liveUpdates.ts),
// which the frontend listens with
export {
  RESOURCE_CHANGED,
  Resource,
  type ResourceChange,
} from "@library/contracts";

/**
 * Tells the clients that see a resource that it changed, so they reload it
 * through its REST route. It carries no data: the route's guards decide what
 * each client may read. Sent by the socket gateway to the admins' room for
 * their resources, to everyone otherwise.
 */
export const ResourceChangedEvent = z.object({
  eventKey: z.literal(RESOURCE_CHANGED),
  payload: z.object({
    resource: z.enum(Resource),
    // What changed within it, such as an id
    key: z.string().optional(),
  }),
});

export type ResourceChangedEvent = z.infer<typeof ResourceChangedEvent>;

export const resourceChanged = (
  change: ResourceChange,
): ResourceChangedEvent => ({ eventKey: RESOURCE_CHANGED, payload: change });
