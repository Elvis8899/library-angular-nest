import { Injectable } from "@nestjs/common";
import { FakeRepositoryBase } from "@shared/db/fakeRepository.base";
import { validateFromUnknown } from "@shared/utils/validateWith";
import { BookInfo } from "../domain/bookInfo.entity";
import { BookInfoRepository } from "./bookInfo.repository.port";

@Injectable()
export class FakeBookInfoRepository
  extends FakeRepositoryBase<BookInfo>
  implements BookInfoRepository
{
  baseValidator = validateFromUnknown(BookInfo, "BookInfo");
}
