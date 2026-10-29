import "@shared/utils/config/dotenv";
import { get } from "env-var";

/** The S3-compatible bucket the files are kept in. */
export interface StorageConfig {
  // Unset for AWS S3; a self-hosted server's URL otherwise
  endpoint: string | undefined;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  // Self-hosted servers address buckets by path, not by host name
  forcePathStyle: boolean;
}

/** Read when the storage is created, so each test worker gets its bucket. */
export const storageConfig = (): StorageConfig => ({
  endpoint: get("S3_ENDPOINT").asUrlString(),
  region: get("S3_REGION").default("us-east-1").asString(),
  bucket: get("S3_BUCKET").required().asString(),
  accessKeyId: get("S3_ACCESS_KEY_ID").required().asString(),
  secretAccessKey: get("S3_SECRET_ACCESS_KEY").required().asString(),
  forcePathStyle: get("S3_FORCE_PATH_STYLE").default("false").asBool(),
});
