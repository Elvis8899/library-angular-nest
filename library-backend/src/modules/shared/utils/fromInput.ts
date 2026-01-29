import { FPF, RE } from "@shared/functional/monads";
import { loggerOnLeftR, loggerOnRightR } from "@shared/utils/handleLog";
import { validateWith } from "@shared/utils/validateWith";
import { PinoLogger } from "nestjs-pino";
import { z } from "zod";

export const fromInputRE = <Validator extends z.ZodType>(
  validator: Validator,
  dataKind: string,
): (<U extends { logger: PinoLogger }>(
  data: z.input<Validator>,
) => RE.ReaderEither<U, Error, z.output<Validator>>) =>
  FPF.flow(
    RE.fromEitherK(validateWith(validator, dataKind)),
    RE.tapError(
      RE.fromReaderK(loggerOnLeftR(`${dataKind} corrupted or outdated`)),
    ),
    RE.tapReader(loggerOnRightR(`${dataKind} parsed successfully.`)),
  );
