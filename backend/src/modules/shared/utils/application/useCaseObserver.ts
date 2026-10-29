/** What a use case's run did. */
export type UseCaseRun = {
  name: string;
  command: boolean;
  succeeded: boolean;
  // The keys of the domain events it published, in order
  published: readonly string[];
  // A command that wrote nothing on purpose (nothingChangedRTE)
  changedNothing: boolean;
};

/**
 * Told of every run, after it ends. The app's does nothing; specs bind one
 * that checks every command that succeeded told its screens
 * (test/util/screenChanges.ts).
 */
export abstract class UseCaseObserver {
  abstract ran(run: UseCaseRun): void;
}
