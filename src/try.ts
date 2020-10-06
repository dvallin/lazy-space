import { Left, Right } from './either'
import { Monad } from './monad'
import { Identity } from './identity'
import { Option } from './option'

export type tryable<T> = T | Error
export class Try<T> implements Monad<T> {
  public constructor(public readonly type: 'left' | 'right', public readonly value: tryable<T>) {}

  public map<U>(f: (a: T) => U): Try<U> {
    return Try.map(this, f)
  }

  public recover<U>(f: (error: Error) => U): T | U {
    return Try.recover(this, f)
  }

  public flatMap<U>(f: (s: T) => Try<U>): Try<U> {
    return Try.flatMap(this, f)
  }

  public flatRecover<U>(f: (error: Error) => Try<U>): Try<T | U> {
    return Try.flatRecover(this, f)
  }

  public result(): Option<T> {
    return Try.result(this)
  }

  public error(): Option<Error> {
    return Try.error(this)
  }

  public lift<U>(v: U): Try<U> {
    return Try.left(v)
  }

  public liftRight<U>(error: Error): Try<U> {
    return Try.right(error)
  }

  public join<U>(v: Try<Try<U>>): Try<U> {
    return Try.join(v)
  }

  public get(): T | Error {
    return Try.get(this)
  }

  public getOrElse<U>(value: U): T | U {
    return Try.getOrElse(this, value)
  }

  public getOrThrow(error: Error): T {
    return Try.getOrThrow(this, error)
  }

  public unwrap<U, V>(f: (s: T) => U, g: (error: Error) => V): U | V {
    return Try.unwrap(this, f, g)
  }

  public or(other: Try<T>): Try<T> {
    return Try.or(this, other)
  }

  public and(other: Try<T>): Try<T> {
    return Try.and(this, other)
  }

  public equals(other: Try<T>): boolean {
    return Try.equals(this, other)
  }

  public filterType<S extends T = T>(f: (a: T) => a is S): Try<S> {
    return Try.filterType(this, f)
  }

  public filter(f: (a: T) => boolean): Try<T> {
    return Try.filter(this, f)
  }

  public isLeft(): this is Left<T> {
    return Try.isLeft(this)
  }

  public isRight(): this is Right<Error> {
    return Try.isRight(this)
  }

  public isSuccess(): this is Left<T> {
    return Try.isSuccess(this)
  }

  public isFailure(): this is Right<Error> {
    return Try.isFailure(this)
  }

  public static lift<T>(value: T): Try<T> {
    return Try.left(value)
  }

  public static left<T>(value: T): Try<T> {
    return new Try<T>('left', value)
  }

  public static right<T>(error: Error): Try<T> {
    return new Try<T>('right', error)
  }

  public static result<T>(value: Try<T>): Option<T> {
    return value.unwrap(
      (s) => Option.some(s),
      () => Option.none()
    )
  }

  public static error<T>(value: Try<T>): Option<Error> {
    return value.unwrap(
      () => Option.none(),
      (e) => Option.some(e)
    )
  }

  public static get<T>(val: Try<T>): T {
    return val.unwrap(
      (v) => v,
      (e) => {
        throw e
      }
    )
  }

  public static getOrElse<T, U>(val: Try<T>, value: U): T | U {
    return val.recover(() => value)
  }

  public static getOrThrow<T>(val: Try<T>, error: Error): T {
    return val.recover(() => {
      throw error
    })
  }

  public static unwrap<T, U, V>(val: Try<T>, f: (s: T) => U, g: (e: Error) => V): U | V {
    if (val.isLeft()) {
      return f(val.value)
    } else {
      return g(val.value as Error)
    }
  }

  public static map<T, U>(val: Try<T>, f: (a: T) => U): Try<U> {
    return Try.unwrap(
      val,
      (u) => Try.run(() => f(u)),
      (e) => Try.right(e)
    )
  }

  public static flatMap<T, U>(val: Try<T>, f: (s: T) => Try<U>): Try<U> {
    return Try.unwrap(
      val,
      (u) => f(u),
      (e) => Try.right(e)
    )
  }

  public static join<T>(val: Try<Try<T>>): Try<T> {
    return Try.unwrap(
      val,
      (u) => u,
      (e) => Try.right(e)
    )
  }

  public static recover<S, U>(val: Try<S>, f: (error: Error) => U): S | U {
    return Try.unwrap(
      val,
      (u) => u,
      (e) => f(e)
    )
  }

  public static flatRecover<S, U>(val: Try<S>, f: (error: Error) => Try<U>): Try<S | U> {
    return Try.unwrap(
      val,
      (u) => Try.left(u),
      (e) => f(e)
    )
  }

  public static or<S, U>(left: Try<S>, right: Try<U>): Try<S | U> {
    return left.isLeft() ? left : right
  }

  public static and<S, U>(left: Try<S>, right: Try<U>): Try<S | U> {
    return left.isRight() ? left : right
  }

  public static equals<S>(left: Try<S>, right: Try<S>): boolean {
    return left.type === right.type && left.value === right.value
  }

  public static isLeft<T>(result: Try<T>): result is Try<T> & Left<T> {
    return result.type === 'left'
  }

  public static isRight<T>(result: Try<T>): result is Try<T> & Right<Error> {
    return result.type === 'right'
  }

  public static isSuccess<T>(result: Try<T>): result is Try<T> & Left<T> {
    return Try.isLeft(result)
  }

  public static isFailure<T>(result: Try<T>): result is Try<T> & Right<Error> {
    return Try.isRight(result)
  }

  public static failure<T>(error: Error): Try<T> {
    return new Try<T>('right', error)
  }

  public static success<T>(value: T): Try<T> {
    return new Try<T>('left', value)
  }

  public static of<T>(value: tryable<T>): Try<T> {
    return value instanceof Error ? Try.failure(value) : Try.success(value)
  }

  public static filterType<T, S extends T = T>(val: Try<T>, f: (a: T) => a is S): Try<S> {
    return val.flatMap((v) => (f(v) ? Try.success(v) : Try.failure(new Error('filtered out'))))
  }

  public static filter<T>(val: Try<T>, f: (a: T) => boolean): Try<T> {
    return Try.filterType(val, (v): v is T => f(v))
  }

  public static run<T>(f: () => T): Try<T> {
    try {
      return Try.success(f())
    } catch (error) {
      if (error === undefined || typeof error === 'string') {
        return Try.failure(new Error(error))
      }
      return Try.failure(error)
    }
  }
}

export class TryT<T> implements Monad<T> {
  public constructor(public readonly value: Monad<Try<T>>) {}

  public map<U>(f: (a: T) => U): TryT<U> {
    return TryT.map(this, f)
  }

  public flatMap<U>(f: (a: T) => TryT<U>): TryT<U> {
    return TryT.flatMap(this, f)
  }

  public lift<U>(v: U): TryT<U> {
    return TryT.lift(v)
  }

  public join<U>(v: TryT<TryT<U>>): TryT<U> {
    return TryT.join(v)
  }

  public static map<T, U>(t: TryT<T>, f: (a: T) => U): TryT<U> {
    return new TryT(t.value.map((m) => m.map(f))) as TryT<U>
  }

  public static flatMap<T, U>(t: TryT<T>, f: (a: T) => TryT<U>): TryT<U> {
    return new TryT(
      t.value.flatMap(
        (v) =>
          v.unwrap(
            (s) => f(s).value,
            (e) => t.value.lift(v.liftRight(e))
          ) as Monad<Try<U>>
      )
    )
  }

  public static lift<U>(v: U): TryT<U> {
    return new TryT(Identity.lift(Try.lift(v)))
  }

  public static join<T>(v: TryT<TryT<T>>): TryT<T> {
    return v.flatMap((i) => i)
  }
}
