import { Injectable } from "@nestjs/common";
import { UUID } from "@src/shared/uuid/entities/uuid";
import * as uuid from "uuid";

@Injectable()
export class RealUUIDGeneratorService {
  generateUUID = () => UUID.parse(uuid.v4());
}
