import { Injectable } from "@nestjs/common";
import {
  BusinessDate,
  businessDateOf,
} from "@shared/utils/domain/businessDate";

/**
 * The time, injected so rules never read `new Date()` themselves and tests
 * can fix "now" and "today".
 */
export abstract class Clock {
  now!: () => Date;
  /** Today in America/Sao_Paulo, the business's day. */
  today!: () => BusinessDate;
}

@Injectable()
export class SystemClock implements Clock {
  now = (): Date => new Date();
  today = (): BusinessDate => businessDateOf(this.now());
}
