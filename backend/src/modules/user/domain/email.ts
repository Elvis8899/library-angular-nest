import { Email } from "@library/contracts";
import { z } from "zod";

// Lowercase, so the case used at sign-up or login doesn't matter
export { Email } from "@library/contracts";

export type Email = z.infer<typeof Email>;
