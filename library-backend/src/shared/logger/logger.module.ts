import { Global, Module } from "@nestjs/common";
import { LoggerModule as PinoLoggerModule } from "nestjs-pino";
import { stdTimeFunctions } from "pino";
import * as uuid from "uuid";
import { logConfig } from "@configs/logger.config";
import { GenReqId } from "pino-http";

declare module "http" {
  interface IncomingMessage {
    requestId: string;
  }
}

export const getGenReqId: GenReqId = (req) => req.requestId || uuid.v4();

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        name: "library",
        level: "debug", //logConfig.level,
        transport: logConfig.transport,
        genReqId: getGenReqId,
        formatters: { bindings: () => ({}) },

        // redact
        timestamp: stdTimeFunctions.isoTime,
      },
    }),
  ],
})
export class LoggerModule {}
