import { Monad } from './monad'
import { Option } from './option'

export type lazy<T> = () => T

export class Lazy<T> implements Monad<T> {
  private memory: T | undefined = undefined
  public constructor(public readonly value: lazy<T>, private readonly memoized: boolean = false) {}

  public map<U>(f: (a: T) => U, memoized = false): Lazy<U> {
    return Lazy.map(this, f, memoized)
  }

  public optionMap<U>(f: (a: T) => Option<Lazy<U>>): Lazy<Option<U>> {
    return Lazy.optionMap(this, f)
  }

  public with(f: (a: T) => unknown): Lazy<T> {
    return Lazy.with(this, f)
  }

  public flatMap<U>(f: (a: T) => Lazy<U>, memoized = false): Lazy<U> {
    return Lazy.flatMap(this, f, memoized)
  }

  public lift<U>(v: U): Lazy<U> {
    return Lazy.lift(v)
  }

  public join<U>(v: Lazy<Lazy<U>>): Lazy<U> {
    return Lazy.join(v)
  }

  public eval(): T {
    if (this.memoized) {
      this.memory = this.memory === undefined ? this.value() : this.memory
      return this.memory
    }
    return this.value()
  }

  public static of<T>(value: () => T, memoized = false): Lazy<T> {
    return new Lazy(value, memoized)
  }

  public static map<S, U>(value: Lazy<S>, f: (a: S) => U, memoized = false): Lazy<U> {
    return new Lazy(() => f(value.eval()), memoized)
  }

  static optionMap<T, U>(value: Lazy<T>, f: (a: T) => Option<Lazy<U>>): Lazy<Option<U>> {
    return value.flatMap((a) =>
      f(a).unwrap(
        (value) => value.map(Option.of),
        () => Lazy.lift(Option.none())
      )
    )
  }

  public static with<S>(value: Lazy<S>, f: (a: S) => unknown): Lazy<S> {
    return value.map((a) => {
      f(a)
      return a
    })
  }

  public static flatMap<S, U>(value: Lazy<S>, f: (a: S) => Lazy<U>, memoized = false): Lazy<U> {
    return new Lazy(() => f(value.eval()).eval(), memoized)
  }

  public static lift<U>(v: U): Lazy<U> {
    return new Lazy(() => v)
  }

  public static join<U>(v: Lazy<Lazy<U>>): Lazy<U> {
    return v.eval()
  }
}
