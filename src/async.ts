import { Try } from './try'
import { Monad } from './monad'
import { Lazy } from './lazy'

export type async<T> = Promise<T>

export class Async<T> implements Monad<T> {
  public constructor(public readonly promise: async<T>) {}

  public map<U>(f: (a: T) => U): Async<U> {
    return Async.map(this, f)
  }

  public recover<U>(f: (error: unknown) => U): Async<T | U> {
    return Async.recover(this, f)
  }

  public finally(f: () => void): Async<T> {
    return Async.finally(this, f)
  }

  public flatMap<U>(f: (a: T) => Async<U>): Async<U> {
    return Async.flatMap(this, f)
  }

  public flatRecover<U>(f: (error: unknown) => Async<U>): Async<T | U> {
    return Async.flatRecover(this, f)
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
    return Async.unwrap(this, f, g)
  }

  public static empty(): Async<void> {
    return new Async(Promise.resolve())
  }

  public static of<T>(value: Promise<T>): Async<T> {
    return new Async(value)
  }

  public static ofLazy<T>(value: Lazy<T>): Async<T> {
    return Async.lift(value.eval())
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

  public static recover<S, U>(val: Async<S>, f: (error: unknown) => U): Async<S | U> {
    return new Async(val.promise.catch(f))
  }

  public static flatRecover<S, U>(val: Async<S>, f: (error: unknown) => Async<U>): Async<S | U> {
    return new Async(
      new Promise((resolve, reject) => {
        val.promise.then(resolve).catch((e) => f(e).promise.then(resolve).catch(reject))
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
    return Async.of(val.promise.then((a) => f(a).promise))
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

  /**
   * Flatmaps over an array of request, ignoring their returned values
   * @param requests
   */
  public static chain(...requests: Async<unknown>[]): Async<unknown> {
    const [head, ...tail] = requests
    if (tail.length > 0) {
      return Async.flatMap(head, () => Async.chain(...tail))
    } else {
      return head
    }
  }

  public static async run<T>(val: Async<T>): Promise<Try<T>> {
    try {
      return Try.success(await val.promise)
    } catch (error) {
      if (error instanceof Error) {
        return Try.failure(error)
      }
      return Try.failure(new Error(error))
    }
  }
}
