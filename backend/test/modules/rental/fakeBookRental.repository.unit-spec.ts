import { FakeBookRentalRepository } from "@modules/rental/database/fakeBookRental.repository";
import { RentalStatusEnum } from "@modules/rental/domain/bookRental.entity";
import { BookRentalFinishedException } from "@modules/rental/domain/bookRental.errors";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookRentalBuilder } from "@test/modules/rental/bookRentalBuilder";

describe("[Unit] Fake BookRental repository", () => {
  let repository: FakeBookRentalRepository;

  beforeEach(() => {
    repository = new FakeBookRentalRepository();
  });

  it("Should not finish a rental that was finished meanwhile", async () => {
    // Given a rental finished after the handler read it as active
    const builder = new BookRentalBuilder();
    await executeTask(
      repository.save(builder.withStatus(RentalStatusEnum.Finished).build()),
    );

    // When finishing it again
    const result = executeTask(repository.finish(builder.build()));

    // Then it's refused, like the real repository's conditional update
    await expect(result).rejects.toBeInstanceOf(BookRentalFinishedException);
  });
});
