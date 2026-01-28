import { Global, Module } from "@nestjs/common";
import { LoggerModule as PinoLoggerModule } from "nestjs-pino";
import { stdTimeFunctions } from "pino";
import { v4 as uuidv4 } from "uuid";
import { logConfig } from "@src/shared/logger/logger.config";
import { GenReqId, Options } from "pino-http";

declare module "http" {
  interface IncomingMessage {
    requestId: string;
  }
}

export const getGenReqId: GenReqId = (req) => req.requestId || uuidv4();

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        name: "library",
        level: logConfig.level,
        transport: logConfig.transport,
        genReqId: getGenReqId,
        formatters: { bindings: () => ({}) },
        // redact
        timestamp: stdTimeFunctions.isoTime,
      } as Options,
    }),
  ],
})
export class LoggerModule {}
