import type { Monad } from './monad'
import { Option } from './option'

export class Identity<T> implements Monad<T> {
  public constructor(public readonly value: T) {}

  public map<U>(f: (a: T) => U): Identity<U> {
    return Identity.map(this, f)
  }

  public with(f: (a: T) => unknown): Identity<T> {
    return Identity.with(this, f)
  }

  public flatMap<U>(f: (a: T) => Identity<U>): Identity<U> {
    return Identity.flatMap(this, f)
  }

  public optionMap<U>(f: (a: T) => Option<Identity<U>>): Identity<Option<U>> {
    return Identity.optionMap(this, f)
  }

  public lift<U>(v: U): Identity<U> {
    return Identity.lift(v)
  }

  public join<U>(v: Identity<Identity<U>>): Identity<U> {
    return Identity.join(v)
  }

  public static map<S, U>(m: Identity<S>, f: (a: S) => U): Identity<U> {
    return new Identity(f(m.value))
  }

  public static with<S>(m: Identity<S>, f: (a: S) => unknown): Identity<S> {
    return m.map(a => {
      f(a)
      return a
    })
  }

  public static optionMap<T, U>(value: Identity<T>, f: (a: T) => Option<Identity<U>>): Identity<Option<U>> {
    return value.flatMap(a =>
      f(a).unwrap(
        value => value.map(Option.of),
        () => Identity.lift(Option.none()),
      ),
    )
  }

  public static flatMap<S, U>(m: Identity<S>, f: (a: S) => Identity<U>): Identity<U> {
    return f(m.value)
  }

  public static lift<U>(v: U): Identity<U> {
    return new Identity(v)
  }

  public static join<U>(v: Identity<Identity<U>>): Identity<U> {
    return v.value
  }
}
