import { Injectable } from "@nestjs/common";
import { Clock } from "@shared/clock/clock";
import {
  BusinessDate,
  businessDateOf,
} from "@shared/utils/domain/businessDate";

/** A clock stopped at a fixed instant, which specs can move with `set`. */
@Injectable()
export class FakeClock implements Clock {
  private instant = new Date("2026-10-21T12:00:00Z");

  set(instant: Date | string): this {
    this.instant = new Date(instant);
    return this;
  }

  now = (): Date => new Date(this.instant);
  today = (): BusinessDate => businessDateOf(this.instant);
}
