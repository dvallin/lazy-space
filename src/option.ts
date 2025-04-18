import type { Left, Right } from './either'
import { Identity } from './identity'
import { List } from './list'
import type { Monad } from './monad'

export type option<T> = T | undefined | null
export class Option<T> implements Monad<T> {
  public constructor(
    public readonly type: 'left' | 'right',
    public readonly value: option<T>,
  ) {}

  public map<U>(f: (a: T) => option<U>): Option<U> {
    return Option.map(this, f)
  }

  public with(f: (a: T) => unknown): Option<T> {
    return Option.with(this, f)
  }

  public strictMap<U>(f: (a: T) => U): Option<U> {
    return Option.strictMap(this, f)
  }

  public recover<U>(f: () => U): T | U {
    return Option.recover(this, f)
  }

  public flatMap<U>(f: (s: T) => Option<U>): Option<U> {
    return Option.flatMap(this, f)
  }

  public flatRecover<U>(f: () => Option<U>): Option<T | U> {
    return Option.flatRecover(this, f)
  }

  public lift<U>(v: U): Option<U> {
    return Option.left(v)
  }

  public join<U>(v: Option<Option<U>>): Option<U> {
    return Option.join(v)
  }

  public get(): option<T> {
    return Option.get(this)
  }

  public getOrElse<U>(value: U): T | U {
    return Option.getOrElse(this, value)
  }

  public getOrThrow(error: Error): T {
    return Option.getOrThrow(this, error)
  }

  public unwrap<U, V>(f: (s: T) => U, g: () => V): U | V {
    return Option.unwrap(this, f, g)
  }

  public or(other: Option<T>): Option<T> {
    return Option.or(this, other)
  }

  public and(other: Option<T>): Option<T> {
    return Option.and(this, other)
  }

  public equals(other: Option<T>): boolean {
    return Option.equals(this, other)
  }

  public filterType<S extends T = T>(f: (a: T) => a is S): Option<S> {
    return Option.filterType(this, f)
  }

  public filter(f: (a: T) => boolean): Option<T> {
    return Option.filter(this, f)
  }

  public toList(): List<T> {
    return Option.toList(this)
  }

  public isLeft(): this is Left<T> {
    return Option.isLeft(this)
  }

  public isRight(): this is Right<T> {
    return Option.isRight(this)
  }

  public isSome(): this is Left<T> {
    return Option.isSome(this)
  }

  public isNone(): this is Right<T> {
    return Option.isNone(this)
  }

  public static lift<T>(value: T): Option<T> {
    return Option.left(value)
  }

  public static left<T>(value: T): Option<T> {
    return new Option<T>('left', value)
  }

  public static right<T>(): Option<T> {
    return new Option<T>('right', undefined)
  }

  public static get<T>(val: Option<T>): option<T> {
    return val.value
  }

  public static getOrElse<T, U>(val: Option<T>, value: U): T | U {
    return val.recover(() => value)
  }

  public static getOrThrow<T>(val: Option<T>, error: Error): T {
    return val.recover(() => {
      throw error
    })
  }

  public static unwrap<T, U, V>(val: Option<T>, f: (s: T) => U, g: () => V): U | V {
    if (val.isLeft()) {
      return f(val.value)
    }
    return g()
  }

  public static strictMap<T, U>(val: Option<T>, f: (a: T) => U): Option<U> {
    return Option.unwrap(
      val,
      u => Option.some(f(u)),
      () => Option.right(),
    )
  }

  public static map<T, U>(val: Option<T>, f: (a: T) => option<U>): Option<U> {
    return Option.unwrap(
      val,
      u => Option.of(f(u)),
      () => Option.right(),
    )
  }

  public static with<S>(val: Option<S>, f: (a: S) => unknown): Option<S> {
    return val.map(a => {
      f(a)
      return a
    })
  }

  public static flatMap<T, U>(val: Option<T>, f: (s: T) => Option<U>): Option<U> {
    return Option.unwrap(
      val,
      u => f(u),
      () => Option.right(),
    )
  }

  public static join<T>(val: Option<Option<T>>): Option<T> {
    return Option.unwrap(
      val,
      u => u,
      () => Option.right(),
    )
  }

  public static recover<S, U>(val: Option<S>, f: () => U): S | U {
    return Option.unwrap(
      val,
      u => u,
      () => f(),
    )
  }

  public static flatRecover<S, U>(val: Option<S>, f: () => Option<U>): Option<S | U> {
    return Option.unwrap(
      val,
      u => Option.left(u),
      () => f(),
    )
  }

  public static or<S, U>(left: Option<S>, right: Option<U>): Option<S | U> {
    return left.isLeft() ? left : right
  }

  public static and<S, U>(left: Option<S>, right: Option<U>): Option<S | U> {
    return left.isRight() ? left : right
  }

  public static zip<T1, T2>(value1: Option<T1>, value2: Option<T2>): Option<[T1, T2]>
  public static zip<T1, T2, T3>(value1: Option<T1>, value2: Option<T2>, value3: Option<T3>): Option<[T1, T2, T3]>
  public static zip<T1, T2, T3, T4>(
    value1: Option<T1>,
    value2: Option<T2>,
    value3: Option<T3>,
    value4: Option<T4>,
  ): Option<[T1, T2, T3, T4]>
  public static zip<T1, T2, T3, T4, T5>(
    value1: Option<T1>,
    value2: Option<T2>,
    value3: Option<T3>,
    value4: Option<T4>,
    value5: Option<T5>,
  ): Option<[T1, T2, T3, T4, T5]>
  public static zip<T1, T2, T3, T4, T5, T6>(
    value1: Option<T1>,
    value2: Option<T2>,
    value3: Option<T3>,
    value4: Option<T4>,
    value5: Option<T5>,
    value6: Option<T6>,
  ): Option<[T1, T2, T3, T4, T5, T6]>
  public static zip<T1, T2, T3, T4, T5, T6, T7>(
    value1: Option<T1>,
    value2: Option<T2>,
    value3: Option<T3>,
    value4: Option<T4>,
    value5: Option<T5>,
    value6: Option<T6>,
    value7: Option<T7>,
  ): Option<[T1, T2, T3, T4, T5, T6, T7]>
  public static zip<T1, T2, T3, T4, T5, T6, T7, T8>(
    value1: Option<T1>,
    value2: Option<T2>,
    value3: Option<T3>,
    value4: Option<T4>,
    value5: Option<T5>,
    value6: Option<T6>,
    value7: Option<T7>,
    value8: Option<T8>,
  ): Option<[T1, T2, T3, T4, T5, T6, T7, T8]>
  public static zip<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    value1: Option<T1>,
    value2: Option<T2>,
    value3: Option<T3>,
    value4: Option<T4>,
    value5: Option<T5>,
    value6: Option<T6>,
    value7: Option<T7>,
    value8: Option<T8>,
    value9: Option<T9>,
  ): Option<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>
  public static zip(...args: Option<unknown>[]): Option<unknown[]> {
    return Option.all(args.filter(a => a !== undefined))
  }

  public static all<T>(values: Option<T>[]): Option<T[]> {
    const result: T[] = []
    for (let i = 0; i < values.length; i++) {
      const v = values[i]
      if (v.isSome()) {
        result.push(v.value)
      } else {
        return Option.none()
      }
    }
    return Option.some(result)
  }

  public static equals<S>(left: Option<S>, right: Option<S>): boolean {
    return left.type === right.type && left.value === right.value
  }

  public static isLeft<T>(option: Option<T>): option is Option<T> & Left<T> {
    return option.type === 'left'
  }

  public static isRight<T>(option: Option<T>): option is Option<T> & Right<undefined> {
    return option.type === 'right'
  }

  public static isSome<T>(option: Option<T>): option is Option<T> & Left<T> {
    return Option.isLeft(option)
  }

  public static isNone<T>(option: Option<T>): option is Option<T> & Right<undefined> {
    return Option.isRight(option)
  }

  public static none<T>(): Option<T> {
    return new Option<T>('right', undefined)
  }

  public static some<T>(value: T): Option<T> {
    return new Option<T>('left', value)
  }

  public static of<T>(value: option<T>): Option<T> {
    return value !== undefined && value !== null ? Option.some(value) : Option.none()
  }

  public static filterType<T, S extends T = T>(val: Option<T>, f: (a: T) => a is S): Option<S> {
    return val.flatMap(v => (f(v) ? Option.some(v) : Option.none()))
  }

  public static filter<T>(val: Option<T>, f: (a: T) => boolean): Option<T> {
    return Option.filterType(val, (v): v is T => f(v))
  }

  public static toList<T>(val: Option<T>): List<T> {
    return val.unwrap(
      v => List.lift(v),
      () => List.empty(),
    )
  }
}

export class OptionT<T> implements Monad<T> {
  public constructor(public readonly value: Monad<Option<T>>) {}

  public map<U>(f: (a: T) => U): OptionT<U> {
    return OptionT.map(this, f)
  }

  public flatMap<U>(f: (a: T) => OptionT<U>): OptionT<U> {
    return OptionT.flatMap(this, f)
  }

  public lift<U>(v: U): OptionT<U> {
    return OptionT.lift(v)
  }

  public join<U>(v: OptionT<OptionT<U>>): OptionT<U> {
    return OptionT.join(v)
  }

  public static map<T, U>(t: OptionT<T>, f: (a: T) => U): OptionT<U> {
    return new OptionT(t.value.map(m => m.map(f))) as OptionT<U>
  }

  public static flatMap<T, U>(t: OptionT<T>, f: (a: T) => OptionT<U>): OptionT<U> {
    return new OptionT(
      t.value.flatMap(
        option =>
          option.unwrap(
            s => f(s).value,
            () => t.value.lift(Option.none()),
          ) as Monad<Option<U>>,
      ),
    )
  }

  public static lift<U>(v: U): OptionT<U> {
    return new OptionT(Identity.lift(Option.lift(v)))
  }

  public static join<T>(v: OptionT<OptionT<T>>): OptionT<T> {
    return v.flatMap(i => i)
  }
}
