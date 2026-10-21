import { FakeRefreshSessionRepository } from "@auth/database/fakeRefreshSession.repository";
import { RefreshSessionRepository } from "@auth/database/refreshSession.repository.port";
import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { FakeBookInfoRepository } from "@book/database/fakeBookInfo.repository";
import { ModuleMetadata, Provider } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { BookRentalRepository } from "@rental/database/bookRental.repository.port";
import { FakeBookRentalRepository } from "@rental/database/fakeBookRental.repository";
import { DomainEventPublisherModule } from "@shared/domainEventPublisher/domainEventPublisher.module";
import { FakeLoggerService } from "@shared/logger/adapters/fake/fakeLogger.service";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { FakeUserRepository } from "@user/database/fakeUser.repository";
import { UserRepository } from "@user/database/user.repository.port";
import { PinoLogger } from "nestjs-pino";

/**
 * A testing module for command and query handlers: every repository bound to
 * its in-memory fake, a silent logger, real UUIDs and the domain event
 * publisher. Pass the handlers under test; a provider given here replaces the
 * default for its token, as the last binding wins.
 */
export const createHandlerModule = (
  providers: Provider[],
  imports: ModuleMetadata["imports"] = [],
): Promise<TestingModule> =>
  Test.createTestingModule({
    imports: [DomainEventPublisherModule, ...imports],
    providers: [
      RealUUIDGeneratorService,
      { provide: UserRepository, useClass: FakeUserRepository },
      { provide: BookInfoRepository, useClass: FakeBookInfoRepository },
      { provide: BookRentalRepository, useClass: FakeBookRentalRepository },
      {
        provide: RefreshSessionRepository,
        useClass: FakeRefreshSessionRepository,
      },
      { provide: PinoLogger, useClass: FakeLoggerService },
      ...providers,
    ],
  }).compile();
