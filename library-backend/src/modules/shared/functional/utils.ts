import { A, FPF, O } from "@shared/functional/monads";
import { number } from "fp-ts";

export const foldArrayToOption =
  <Item>(items: Item[]) =>
  <Res>(mapper: (item: Item) => O.Option<Res>) =>
    A.reduce(O.none, (res: O.Option<Res>, item: Item) =>
      O.orElse(res, () => mapper(item)),
    )(items);

export const avarageNonZeroNumberArray = <U extends number>(numbers: U[]) =>
  FPF.pipe(
    numbers,
    A.filter((x: U) => x > 0),
    (values: U[]) =>
      A.foldMap(number.MonoidSum)((val: U) => val / values.length)(values),
    FPF.unsafeCoerce<number, U>,
  );

// export const minimumValue = <U extends number>(...numbers: U[]) =>
//   FPF.pipe(Math.min(...numbers), FPF.unsafeCoerce<number, U>);

export const maximumValue = <U extends number>(...numbers: U[]) =>
  FPF.pipe(Math.max(...numbers), FPF.unsafeCoerce<number, U>);
