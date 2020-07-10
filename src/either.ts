import { Monad } from './monad'
import { Identity } from './identity'

export interface Left<T> {
  type: 'left'
  value: T
}
export interface Right<T> {
  type: 'right'
  value: T
}

export type either<S, T> = S | T

export class Either<S, T> implements Monad<S> {
  public constructor(public readonly type: 'left' | 'right', public readonly value: either<S, T>) {}

  public map<U>(f: (a: S) => U): Either<U, T> {
    return Either.map(this, f)
  }

  public flatMap<U>(f: (s: S) => Either<U, T>): Either<U, T> {
    return Either.flatMap(this, f)
  }

  public lift<U>(v: U): Either<U, T> {
    return Either.lift(v)
  }

  public join<U>(v: Either<Either<U, T>, T>): Either<U, T> {
    return Either.join(v)
  }

  public get(): S {
    return Either.get(this)
  }

  public unwrap<U, V>(f: (s: S) => U, g: (t: T) => V): U | V {
    return Either.unwrap(this, f, g)
  }

  public recover<U>(f: (error: T) => U): S | U {
    return Either.recover(this, f)
  }

  public or(other: Either<S, T>): Either<S, T> {
    return Either.or(this, other)
  }

  public and(other: Either<S, T>): Either<S, T> {
    return Either.and(this, other)
  }

  public isLeft(): this is Left<S> {
    return this.type === 'left'
  }

  public isRight(): this is Right<T> {
    return this.type === 'right'
  }

  public static lift<S, T>(value: S): Either<S, T> {
    return Either.left(value)
  }

  public static left<S, T>(value: S): Either<S, T> {
    return new Either<S, T>('left', value)
  }

  public static right<S, T>(value: T): Either<S, T> {
    return new Either<S, T>('right', value)
  }

  public static get<S, T>(val: Either<S, T>): S {
    return val.recover<S>((e) => {
      throw e
    })
  }

  public static unwrap<S, T, U, V>(val: Either<S, T>, f: (s: S) => U, g: (t: T) => V): U | V {
    if (val.isLeft()) {
      return f(val.value)
    } else {
      return g(val.value as T)
    }
  }

  public static map<S, T, U>(val: Either<S, T>, f: (a: S) => U): Either<U, T> {
    return Either.unwrap(
      val,
      (u) => Either.left(f(u)),
      (v) => Either.right(v)
    )
  }

  public static flatMap<S, T, U>(val: Either<S, T>, f: (s: S) => Either<U, T>): Either<U, T> {
    return Either.unwrap(
      val,
      (u) => f(u),
      (v) => Either.right(v)
    )
  }

  public static join<S, T>(val: Either<Either<S, T>, T>): Either<S, T> {
    return Either.unwrap(
      val,
      (u) => u,
      (v) => Either.right(v)
    )
  }

  public static recover<S, T, U>(val: Either<S, T>, f: (error: T) => U): S | U {
    return Either.unwrap(
      val,
      (u) => u,
      (v) => f(v)
    )
  }

  public static or<S, T, U>(left: Either<S, T>, right: Either<U, T>): Either<S | U, T> {
    return left.isLeft() ? left : right
  }

  public static and<S, T, U>(left: Either<S, T>, right: Either<S, T>): Either<S | U, T> {
    return left.isRight() ? left : right
  }
}

export class EitherT<S, T, M extends Monad<Either<S, T>>> implements Monad<S> {
  public constructor(public readonly value: M) {}

  public map<U, N extends Monad<Either<U, T>>>(f: (a: S) => U): EitherT<U, T, N> {
    return EitherT.map(this, f)
  }

  public flatMap<U, N extends Monad<Either<U, T>>>(f: (a: S) => EitherT<U, T, N>): EitherT<U, T, N> {
    return EitherT.flatMap(this, f)
  }

  public lift<U>(v: U): EitherT<U, T, Identity<Either<U, T>>> {
    return EitherT.lift(v)
  }

  public join<U, N extends Monad<Either<EitherT<U, T, M>, T>>, M extends Monad<Either<U, T>>>(
    v: EitherT<EitherT<U, T, M>, T, N>
  ): EitherT<U, T, M> {
    return EitherT.join(v)
  }

  public static map<S, T, U, M extends Monad<Either<S, T>>, N extends Monad<Either<U, T>>>(
    t: EitherT<S, T, M>,
    f: (a: S) => U
  ): EitherT<U, T, N> {
    return new EitherT(t.value.map((m) => m.map(f))) as EitherT<U, T, N>
  }

  public static flatMap<S, T, U, M extends Monad<Either<S, T>>, N extends Monad<Either<U, T>>>(
    t: EitherT<S, T, M>,
    f: (a: S) => EitherT<U, T, N>
  ): EitherT<U, T, N> {
    return new EitherT(
      t.value.flatMap(
        (either) =>
          either.unwrap(
            (s) => f(s).value,
            (right) => t.value.lift(right)
          ) as Monad<Either<U, T>>
      )
    ) as EitherT<U, T, N>
  }

  public static lift<T, U>(v: U): EitherT<U, T, Identity<Either<U, T>>> {
    return new EitherT(Identity.lift(Either.lift(v)))
  }

  public static join<T, U, N extends Monad<Either<EitherT<U, T, M>, T>>, M extends Monad<Either<U, T>>>(
    v: EitherT<EitherT<U, T, M>, T, N>
  ): EitherT<U, T, M> {
    return v.flatMap((i) => i)
  }
}
