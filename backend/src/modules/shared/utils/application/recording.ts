import { Clock } from "@shared/clock/clock";
import { BusinessDate } from "@shared/utils/domain/businessDate";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/uuid";

/**
 * Who records a change, and when: what a rule needs to stamp the rows it
 * makes, so it stays pure. Ids for new rows come from `newId`.
 */
export type Recording = {
  newId: () => UUID;
  recordedById: string;
  today: BusinessDate;
  now: Date;
};

/** A recording from a clock and UUIDs, read once: handlers take theirs
 * from `UseCaseHandler.recordingBy`. */
export const recordingOf = (
  clock: Clock,
  uuids: RealUUIDGeneratorService,
  recordedById: string,
): Recording => ({
  newId: uuids.generateUUID,
  recordedById,
  today: clock.today(),
  now: clock.now(),
});
