import { RESOURCE_CHANGED } from "@shared/domainEventPublisher/resourceChanged.event";
import {
  UseCaseObserver,
  UseCaseRun,
} from "@shared/utils/application/useCaseObserver";

/** The commands that change no screen: sessions only. */
export const changesNoScreen: readonly string[] = [
  "LoginCommand",
  "LogoutCommand",
  "RefreshTokenCommand",
];

// The commands of the current test that succeeded without telling a screen
const silent: string[] = [];

/**
 * The specs' UseCaseObserver: a command that succeeded must have published
 * a resource.changed (`changedRTE`), or the screens showing what it wrote
 * stay stale; a branch that writes nothing says so with nothingChangedRTE. Every command's success path runs in some spec (coverage is
 * 100%), so a forgotten one fails there, after the test (setup file).
 */
export class ScreenChangeCheck extends UseCaseObserver {
  ran({
    name,
    command,
    succeeded,
    published,
    changedNothing,
  }: UseCaseRun): void {
    if (
      command &&
      succeeded &&
      !changedNothing &&
      !published.includes(RESOURCE_CHANGED) &&
      !changesNoScreen.includes(name)
    )
      silent.push(name);
  }
}

afterEach(() => {
  expect(
    silent.splice(0),
    "commands that succeeded without publishing resource.changed",
  ).toEqual([]);
});
