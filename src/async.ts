import { Try } from './try'
import { Monad } from './monad'

export type async<T> = Promise<T>

export class Async<T> implements Monad<T> {
  public constructor(public readonly promise: async<T>) {}

  public map<U>(f: (a: T) => U): Async<U> {
    return Async.map(this, f)
  }

  public recover(f: () => T): Async<T> {
    return Async.recover(this, f)
  }

  public finally(f: () => void): Async<T> {
    return Async.finally(this, f)
  }

  public flatMap<U>(f: (a: T) => Async<U>): Async<U> {
    return Async.flatMap(this, f)
  }

  public recoverMap(f: () => Async<T>): Async<T> {
    return Async.recoverMap(this, f)
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

  public toVoid(): Async<void> {
    return Async.toVoid(this)
  }

  public run(): Promise<Try<T>> {
    return Async.run(this)
  }

  public unwrap<U, V>(f: (s: T) => U, g: (error: Error) => V): Async<U | V> {
    return Async.of(this.run()).map((c) => c.unwrap(f, g))
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

  public static recoverMap<S>(val: Async<S>, f: () => Async<S>): Async<S> {
    return new Async(
      new Promise((resolve, reject) => {
        val.promise.then(resolve).catch(() => f().promise.then(resolve).catch(reject))
      })
    )
  }

  public static finally<S>(val: Async<S>, f: () => void): Async<S> {
    return new Async(val.promise.finally(f))
  }

  public static toVoid<T>(val: Async<T>): Async<void> {
    return Async.map(val, () => undefined)
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

  public static unwrap<T, U, V>(val: Async<T>, f: (s: T) => U, g: (error: Error) => V): Async<U | V> {
    return Async.of(val.run()).map((c) => c.unwrap(f, g))
  }

  public static async run<T>(val: Async<T>): Promise<Try<T>> {
    try {
      return Try.success(await val.promise)
    } catch (error) {
      return Try.failure(error)
    }
  }
}
