import { Monad } from './monad'
import { Identity } from './identity'

export type reader<C, T> = (context: C) => T
export class Reader<C, T> implements Monad<T> {
  public constructor(public readonly read: reader<C, T>) {}

  public map<U>(f: (t: T) => U): Reader<C, U> {
    return Reader.map(this, f)
  }

  public flatMap<C2, U>(f: (t: T) => Reader<C2, U>): Reader<C & C2, U> {
    return Reader.flatMap(this, f)
  }

  public lift<U>(read: U): Reader<C, U> {
    // REALLY?
    return Reader.just(read)
  }

  public join<C1, C2, U>(val: Reader<C1, Reader<C2, U>>): Reader<C1 & C2, U> {
    return Reader.join(val)
  }

  public with(f: (c: C) => void): Reader<C, T> {
    return Reader.lift((c) => {
      const r = this.read(c)
      f(c)
      return r
    })
  }

  public mapContext<C2>(f: (c: C2) => C): Reader<C2, T> {
    return Reader.mapContext(this, f)
  }

  public static lift<C, T>(read: (context: C) => T): Reader<C, T> {
    return new Reader(read)
  }

  public static just<C, T>(value: T): Reader<C, T> {
    return new Reader(() => value)
  }

  public static map<C, T, U>(val: Reader<C, T>, f: (t: T) => U): Reader<C, U> {
    return new Reader((c) => f(val.read(c)))
  }

  public static flatMap<C1, C2, S, T>(val: Reader<C1, S>, f: (s: S) => Reader<C2, T>): Reader<C1 & C2, T> {
    return new Reader((c) => f(val.read(c)).read(c))
  }

  public static mapContext<C1, C2, S>(reader: Reader<C1, S>, f: (c: C2) => C1): Reader<C2, S> {
    return new Reader((c) => reader.read(f(c)))
  }

  public static join<C1, C2, T>(val: Reader<C1, Reader<C2, T>>): Reader<C1 & C2, T> {
    return new Reader((c) => val.read(c).read(c))
  }

  public static empty<C>(): Reader<C, void> {
    return new Reader(() => {
      //
    })
  }
}

export class ReaderT<C, T, M extends Monad<T>> implements Monad<T> {
  public constructor(public readonly value: Reader<C, M>) {}

  public map<U, N extends Monad<U>>(f: (a: T) => U): ReaderT<C, U, N> {
    return ReaderT.map(this, f)
  }

  public flatMap<U, N extends Monad<U>>(f: (a: T) => ReaderT<C, U, N>): ReaderT<C, U, N> {
    return ReaderT.flatMap(this, f)
  }

  public lift<U>(v: U): ReaderT<C, U, Identity<U>> {
    return ReaderT.lift(v)
  }

  public join<U, M extends Monad<ReaderT<C, U, N>>, N extends Monad<U>>(v: ReaderT<C, ReaderT<C, U, N>, M>): ReaderT<C, U, N> {
    return ReaderT.join(v)
  }

  public static map<C, T, U, M extends Monad<T>, N extends Monad<U>>(t: ReaderT<C, T, M>, f: (a: T) => U): ReaderT<C, U, N> {
    return new ReaderT(t.value.map((m) => m.map(f))) as ReaderT<C, U, N>
  }

  public static flatMap<C, T, U, M extends Monad<T>, N extends Monad<U>>(
    t: ReaderT<C, T, M>,
    f: (a: T) => ReaderT<C, U, N>
  ): ReaderT<C, U, N> {
    return new ReaderT(Reader.lift((c) => t.value.read(c).flatMap((a) => f(a).value.read(c)))) as ReaderT<C, U, N>
  }

  public static lift<C, U>(v: U): ReaderT<C, U, Identity<U>> {
    return new ReaderT(Reader.lift(() => Identity.lift(v)))
  }

  public static join<C, U, M extends Monad<ReaderT<C, U, N>>, N extends Monad<U>>(v: ReaderT<C, ReaderT<C, U, N>, M>): ReaderT<C, U, N> {
    return v.flatMap((i) => i)
  }
}
