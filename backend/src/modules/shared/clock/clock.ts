import { Injectable } from "@nestjs/common";

/**
 * The time, injected so rules never read `new Date()` themselves and tests
 * can fix "now".
 */
export abstract class Clock {
  now!: () => Date;
}

@Injectable()
export class SystemClock implements Clock {
  now = (): Date => new Date();
}
