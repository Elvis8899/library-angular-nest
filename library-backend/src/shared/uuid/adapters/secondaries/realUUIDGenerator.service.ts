import { Injectable } from "@nestjs/common";
import { UUID } from "@src/shared/uuid/entities/uuid";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class RealUUIDGeneratorService {
  generateUUID = () => UUID.parse(uuidv4());
}
