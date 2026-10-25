import {
  loggerOnLeftR,
  loggerOnRightR,
} from "@shared/utils/application/handleLog";
import { E, FPF, RE, RTE, TE } from "@shared/utils/application/monads";
import { validateWith } from "@shared/utils/application/validateWith";
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

/** A value to parse: its schema, its name in the logs and errors, the value. */
type InputField = readonly [
  validator: z.ZodType,
  dataKind: string,
  data: unknown,
];

/**
 * A handler's inputs parsed at once, each with `fromInputRE` (all are parsed
 * and logged; the first that fails, in order, is the error):
 *
 *   inputsRTE({
 *     id: [UUID, "id", command.id],
 *     input: [ChoiceInput, "Choice", command.props],
 *   })
 */
export const inputsRTE = <Fields extends Record<string, InputField>>(
  fields: Fields & {
    [K in keyof Fields]: readonly [Fields[K][0], string, z.input<Fields[K][0]>];
  },
): RTE.ReaderTaskEither<
  { logger: PinoLogger },
  Error,
  { [K in keyof Fields]: z.output<Fields[K][0]> }
> =>
  FPF.flow(
    (env) =>
      Object.entries(fields).map(([key, [validator, dataKind, data]]) =>
        FPF.pipe(
          fromInputRE(validator, dataKind)(data)(env),
          E.map((value) => [key, value] as const),
        ),
      ),
    E.sequenceArray,
    E.map((entries) =>
      FPF.unsafeCoerce<
        Record<string, unknown>,
        { [K in keyof Fields]: z.output<Fields[K][0]> }
      >(Object.fromEntries(entries)),
    ),
    TE.fromEither,
  );
