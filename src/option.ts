import { Either, Left, Right, EitherT } from './either'

export type option<T> = T | undefined
export class Option<T> extends Either<T, undefined> {
  public static isSome<T>(option: Option<T>): option is Option<T> & Left<T> {
    return option.isLeft()
  }

  public static isNone<T>(option: Option<T>): option is Option<T> & Right<undefined> {
    return option.isRight()
  }

  public static none<T>(): Option<T> {
    return new Option<T>('right', undefined)
  }

  public static some<T>(value: T): Option<T> {
    return new Option<T>('left', value)
  }

  public static of<T>(value: T | undefined | null): Option<T> {
    return value !== undefined && value !== null ? Option.some(value) : Option.none()
  }

  public static filter<T>(val: Option<T>, f: (a: T) => boolean): Option<T> {
    return Either.unwrap(
      val,
      (u) => (f(u) ? val : Option.none()),
      () => Option.none()
    )
  }

  public static ofMap<T, U>(val: Option<T>, f: (a: T) => option<U>): Option<U> {
    return Either.unwrap(
      val,
      (u) => Option.of(f(u)),
      () => Option.none()
    )
  }
}

export class OptionT<T> extends EitherT<T, undefined> {}
