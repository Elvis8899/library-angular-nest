import { RequestJWTPayload } from "@modules/auth/guards/authenticatedRequest";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  Resource,
  ResourceChange,
} from "@shared/domainEventPublisher/resourceChanged.event";

// Who manages accounts: the admins
const adminsRoom = "admins";

// Read only by the admins
const adminResources: ReadonlySet<Resource> = new Set([Resource.Users]);

/** The rooms a client joins, from its access token: the admins' for an
 * admin. */
export const roomsOf = (user: Pick<RequestJWTPayload, "role">): string[] =>
  user.role === UserRoleEnum.Admin ? [adminsRoom] : [];

/** The rooms a change goes to: the admins' for their resources; `null` for
 * everyone. */
export const roomsFor = (change: ResourceChange): string[] | null =>
  adminResources.has(change.resource) ? [adminsRoom] : null;
