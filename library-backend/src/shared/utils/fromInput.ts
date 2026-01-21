import { PinoLogger } from "nestjs-pino";
import { FPF, RE } from "@shared/functional/monads";
import { z, ZodTypeAny } from "zod";
import { loggerOnLeftR, loggerOnRightR } from "@shared/utils/handleLog";
import { validateWith } from "@shared/utils/validateWith";

export const fromInputRE = <Validator extends ZodTypeAny>(
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
