import { User } from "@modules/user/domain/user.entity";
import { z } from "zod";

export const USER_DELETED = "user.deleted";

export const UserDeletedEvent = z.object({
  eventKey: z.literal(USER_DELETED),
  payload: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export type UserDeletedEvent = z.infer<typeof UserDeletedEvent>;

export const userDeleted = (
  user: Pick<User, "id" | "name">,
): UserDeletedEvent => ({
  eventKey: USER_DELETED,
  payload: { id: user.id, name: user.name },
});
