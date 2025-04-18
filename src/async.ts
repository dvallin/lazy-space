import { Lazy } from './lazy'
import { List } from './list'
import type { Monad } from './monad'
import { Option } from './option'
import { Try } from './try'

export type async<T> = Promise<T>

export class Async<T> implements Monad<T> {
  public constructor(public readonly promise: async<T>) {}

  public map<U>(f: (a: T) => U | Promise<U>): Async<U> {
    return Async.map(this, f)
  }

  public with(f: (a: T) => unknown): Async<T> {
    return Async.with(this, f)
  }

  // biome-ignore lint/suspicious/noExplicitAny: FIXME
  public recover<U>(f: (error: any) => U | Promise<U>): Async<T | U> {
    return Async.recover(this, f)
  }

  // biome-ignore lint/suspicious/noExplicitAny: FIXME
  public onError(f: (error: any) => never): Async<T> {
    return Async.onError(this, f)
  }

  public finally(f: () => unknown): Async<T> {
    return Async.finally(this, f)
  }

  public flatMap<U>(f: (a: T) => Async<U>): Async<U> {
    return Async.flatMap(this, f)
  }

  public optionMap<U>(f: (a: T) => Option<Async<U>>): Async<Option<U>> {
    return Async.optionMap(this, f)
  }

  // biome-ignore lint/suspicious/noExplicitAny: FIXME
  public flatRecover<U>(f: (error: any) => Async<U>): Async<T | U> {
    return Async.flatRecover(this, f)
  }

  public join<U>(value: Async<Async<U>>): Async<U> {
    return Async.join(value)
  }

  public lift<U>(value: U): Async<U> {
    return Async.lift(value)
  }

  public toVoid(): Async<void> {
    return Async.toVoid(this)
  }

  public run(): Promise<Try<T>> {
    return Async.run(this)
  }

  public static empty(): Async<void> {
    return new Async(Promise.resolve())
  }

  public static of<T>(value: Promise<T> | T): Async<T> {
    return new Async(Promise.resolve(value))
  }

  public static ofLazy<T>(value: Lazy<T>): Async<T> {
    return Async.lift(value.eval())
  }

  public static resolve<T>(value: T): Async<T> {
    return new Async(Promise.resolve(value))
  }

  public static reject<T, E = Error>(value?: E): Async<T> {
    return new Async(Promise.reject(value))
  }

  public static delay(ms = 0): Async<void> {
    return new Async(new Promise(resolve => setTimeout(resolve, ms)))
  }

  public static throttle(ms: number): Lazy<Async<void>> {
    let last = 0
    return Lazy.of(() => {
      const now = Date.now()
      if (last + ms < now) {
        last = now
        return Async.empty()
      }
      return Async.reject('throttled')
    })
  }

  public static debounce(ms: number): Lazy<Async<void>> {
    let timeout: NodeJS.Timeout
    return Lazy.of(() => {
      clearTimeout(timeout)
      return Async.of(
        new Promise(resolve => {
          timeout = setTimeout(() => {
            clearTimeout(timeout)
            resolve()
          }, ms)
        }),
      )
    })
  }

  public static lift<T>(value: T): Async<T> {
    return new Async(Promise.resolve(value))
  }

  public static map<S, T>(val: Async<S>, f: (a: S) => T | Promise<T>): Async<T> {
    return new Async(val.promise.then(f))
  }

  public static with<S>(val: Async<S>, f: (a: S) => unknown): Async<S> {
    return val.map(a => {
      f(a)
      return a
    })
  }

  // biome-ignore lint/suspicious/noExplicitAny: FIXME
  public static recover<S, U>(val: Async<S>, f: (error: any) => U | Promise<U>): Async<S | U> {
    return new Async(val.promise.catch(f))
  }

  // biome-ignore lint/suspicious/noExplicitAny: FIXME
  public static onError<S>(val: Async<S>, f: (error: any) => never): Async<S> {
    return new Async(val.promise.catch(f))
  }

  // biome-ignore lint/suspicious/noExplicitAny: FIXME
  public static flatRecover<S, U>(val: Async<S>, f: (error: any) => Async<U>): Async<S | U> {
    return val.recover(e => f(e).promise)
  }

  public static finally<S>(val: Async<S>, f: () => unknown): Async<S> {
    return new Async(val.promise.finally(f))
  }

  public static toVoid<T>(val: Async<T>): Async<void> {
    return Async.map(val, () => undefined)
  }

  public static flatMap<S, T>(val: Async<S>, f: (a: S) => Async<T>): Async<T> {
    return Async.of(val.promise.then(a => f(a).promise))
  }

  public static optionMap<S, T>(val: Async<S>, f: (a: S) => Option<Async<T>>): Async<Option<T>> {
    return val.flatMap(a =>
      f(a).unwrap(
        value => value.map(Option.of),
        () => Async.lift(Option.none()),
      ),
    )
  }

  public static join<T>(val: Async<Async<T>>): Async<T> {
    return new Async(val.promise.then(i => i.promise))
  }

  public static race<T>(values: Async<T>[]): Async<T> {
    return new Async(Promise.race(values.map(v => v.promise)))
  }

  public static any<T>(values: Async<T>[]): Async<T> {
    return new Async(
      new Promise((resolve, reject) => {
        let resolved = false
        let resolvable = values.length
        values.map(a =>
          a
            .map(v => {
              if (!resolved) {
                resolved = true
                resolve(v)
              }
            })
            .recover(() => {
              if (--resolvable === 0) {
                reject(new Error('all rejected'))
              }
            }),
        )
      }),
    )
  }

  public static both<S, T>(value1: Async<S>, value2: Async<T>): Async<[S, T]> {
    return Async.zip(value1, value2)
  }

  public static zip<T1, T2>(value1: Async<T1>, value2: Async<T2>): Async<[T1, T2]>
  public static zip<T1, T2, T3>(value1: Async<T1>, value2: Async<T2>, value3: Async<T3>): Async<[T1, T2, T3]>
  public static zip<T1, T2, T3, T4>(
    value1: Async<T1>,
    value2: Async<T2>,
    value3: Async<T3>,
    value4: Async<T4>,
  ): Async<[T1, T2, T3, T4]>
  public static zip<T1, T2, T3, T4, T5>(
    value1: Async<T1>,
    value2: Async<T2>,
    value3: Async<T3>,
    value4: Async<T4>,
    value5: Async<T5>,
  ): Async<[T1, T2, T3, T4, T5]>
  public static zip<T1, T2, T3, T4, T5, T6>(
    value1: Async<T1>,
    value2: Async<T2>,
    value3: Async<T3>,
    value4: Async<T4>,
    value5: Async<T5>,
    value6: Async<T6>,
  ): Async<[T1, T2, T3, T4, T5, T6]>
  public static zip<T1, T2, T3, T4, T5, T6, T7>(
    value1: Async<T1>,
    value2: Async<T2>,
    value3: Async<T3>,
    value4: Async<T4>,
    value5: Async<T5>,
    value6: Async<T6>,
    value7: Async<T7>,
  ): Async<[T1, T2, T3, T4, T5, T6, T7]>
  public static zip<T1, T2, T3, T4, T5, T6, T7, T8>(
    value1: Async<T1>,
    value2: Async<T2>,
    value3: Async<T3>,
    value4: Async<T4>,
    value5: Async<T5>,
    value6: Async<T6>,
    value7: Async<T7>,
    value8: Async<T8>,
  ): Async<[T1, T2, T3, T4, T5, T6, T7, T8]>
  public static zip<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    value1: Async<T1>,
    value2: Async<T2>,
    value3: Async<T3>,
    value4: Async<T4>,
    value5: Async<T5>,
    value6: Async<T6>,
    value7: Async<T7>,
    value8: Async<T8>,
    value9: Async<T9>,
  ): Async<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>
  public static zip(...args: Async<unknown>[]): Async<unknown[]> {
    return Async.all(args.filter(a => a !== undefined))
  }

  public static all<T>(values: Async<T>[]): Async<T[]> {
    return new Async(Promise.all(values.map(v => v.promise)))
  }

  public static fold<T>(values: List<Async<T>>): Async<List<T>> {
    return values.foldr(
      () => Async.resolve(List.empty()),
      (l, r) => r.flatMap(v => l().map(list => list.prepend(v))),
    )
  }

  /**
   * Flatmaps over an array of request, ignoring their returned values
   * @param requests
   */
  public static chain(...requests: Lazy<Async<unknown>>[]): Async<unknown> {
    const [head, ...tail] = requests
    if (tail.length > 0) {
      return Async.flatMap(head.eval(), () => Async.chain(...tail))
    }
    return head.eval()
  }

  public static async run<T>(val: Async<T>): Promise<Try<T>> {
    try {
      return Try.success(await val.promise)
    } catch (error) {
      if (error === undefined || typeof error === 'string') {
        return Try.failure(new Error(error))
      }
      if(error instanceof Error) {
        return Try.failure(error)
      }
      return Try.failure(new Error("unkown error"))
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: FIXME
  public static execute<T>(executor: (resolve: (v: T) => void, reject: (e?: any) => void) => void): Async<T> {
    return new Async(new Promise((resolve, reject) => Try.run(() => executor(resolve, reject)).recover(e => reject(e))))
  }
}
