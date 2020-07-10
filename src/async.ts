import { Try } from './try'
import { Monad } from './monad'
import { Identity } from './identity'

export type async<T> = Promise<T>

export class Async<T> implements Monad<T> {
  public constructor(public readonly promise: async<T>) {}

  public map<U>(f: (a: T) => U): Async<U> {
    return Async.map(this, f)
  }

  public recover(f: () => T): Async<T> {
    return Async.recover(this, f)
  }

  public flatMap<U>(f: (a: T) => Async<U>): Async<U> {
    return Async.flatMap(this, f)
  }

  public join<U>(value: Async<Async<U>>): Async<U> {
    return Async.join(value)
  }

  public lift<U>(value: U): Async<U> {
    return Async.lift(value)
  }

  public liftMap<U>(f: (a: T) => async<U>): Async<U> {
    return Async.liftMap(this, f)
  }

  public run(): Promise<Try<T>> {
    return Async.run(this)
  }

  public static empty(): Async<void> {
    return new Async(Promise.resolve())
  }

  public static of<T>(value: Promise<T>): Async<T> {
    return new Async(value)
  }

  public static resolve<T>(value: T): Async<T> {
    return new Async(Promise.resolve(value))
  }

  public static reject<T, E>(value?: E): Async<T> {
    return new Async(Promise.reject(value))
  }

  public static lift<T>(value: T): Async<T> {
    return new Async(Promise.resolve(value))
  }

  public static map<S, T>(val: Async<S>, f: (a: S) => T): Async<T> {
    return new Async(val.promise.then(f))
  }

  public static recover<S>(val: Async<S>, f: () => S): Async<S> {
    return new Async(val.promise.catch(f))
  }

  public static flatMap<S, T>(val: Async<S>, f: (a: S) => Async<T>): Async<T> {
    return Async.join(new Async(val.promise.then(f)))
  }

  public static liftMap<S, T>(val: Async<S>, f: (a: S) => async<T>): Async<T> {
    return Async.flatMap(val, (v) => Async.of(f(v)))
  }

  public static join<T>(val: Async<Async<T>>): Async<T> {
    return new Async(val.promise.then((i) => i.promise))
  }

  public static race<T>(values: Async<T>[]): Async<T> {
    return new Async(Promise.race(values.map((v) => v.promise)))
  }

  public static all<T>(values: Async<T>[]): Async<T[]> {
    return new Async(Promise.all(values.map((v) => v.promise)))
  }

  public static async run<T>(val: Async<T>): Promise<Try<T>> {
    try {
      return Try.success(await val.promise)
    } catch (error) {
      return Try.failure(error)
    }
  }
}

export class AsyncT<T, M extends Monad<T>> implements Monad<T> {
  public constructor(public readonly value: Async<M>) {}

  public map<U, N extends Monad<U>>(f: (a: T) => U): AsyncT<U, N> {
    return AsyncT.map(this, f)
  }

  public flatMap<U, N extends Monad<U>>(f: (a: T) => AsyncT<U, N>): AsyncT<U, N> {
    return AsyncT.flatMap(this, f)
  }

  public of(m: M): AsyncT<T, M> {
    return AsyncT.of(m)
  }

  public lift<U>(v: U): AsyncT<U, Identity<U>> {
    return AsyncT.lift(v)
  }

  public getValue(): Async<M> {
    return this.value
  }

  public join<U, M extends Monad<AsyncT<U, N>>, N extends Monad<U>>(v: AsyncT<AsyncT<U, N>, M>): AsyncT<U, N> {
    return AsyncT.join(v)
  }

  public static map<T, U, M extends Monad<T>, N extends Monad<U>>(t: AsyncT<T, M>, f: (a: T) => U): AsyncT<U, N> {
    return new AsyncT(t.value.map((m) => m.map(f))) as AsyncT<U, N>
  }

  public static flatMap<T, U, M extends Monad<T>, N extends Monad<U>>(t: AsyncT<T, M>, f: (a: T) => AsyncT<U, N>): AsyncT<U, N> {
    return new AsyncT(
      Async.of(
        new Promise<Monad<U>>((resolve, reject) => {
          t.value.map((m) => m.map((a) => f(a).value.promise.then(resolve).catch(reject)))
        })
      )
    ) as AsyncT<U, N>
  }

  public static of<U, N extends Monad<U>>(v: N): AsyncT<U, N> {
    return new AsyncT(Async.lift(v))
  }

  public static lift<U>(v: U): AsyncT<U, Identity<U>> {
    return new AsyncT(Async.lift(Identity.lift(v)))
  }

  public static join<U, M extends Monad<AsyncT<U, N>>, N extends Monad<U>>(v: AsyncT<AsyncT<U, N>, M>): AsyncT<U, N> {
    return v.flatMap((i) => i)
  }
}
