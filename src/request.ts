import { Monad } from './monad'
import { Reader } from './reader'
import { Async } from './async'
import { Lazy } from './lazy'
import { List } from './list'
import { Option } from './option'

export class Request<C, T> implements Monad<T> {
  constructor(private readonly request: Reader<C, Async<T>>) {}

  read(context: C): Async<T> {
    return Request.read(this, context)
  }

  run(context: C): Async<T> {
    return Request.run(this, context)
  }

  /**
   * retry with exponential backoff
   * @param context
   * @param times
   * @param backoffMs
   */
  retry(context: C, times = 1, backoffMs = 100): Async<T> {
    return Request.retry(this, context, times, backoffMs)
  }

  map<U>(f: (a: T, c: C) => U | Promise<U>): Request<C, U> {
    return Request.map(this, f)
  }

  /**
   * recovers from failure
   * @param f
   */
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  recover<U>(f: (error: any, c: C) => U | Promise<U>): Request<C, T | U> {
    return Request.recover(this, f)
  }

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  onError(f: (error: any, c: C) => never): Request<C, T> {
    return Request.onError(this, f)
  }

  flatMap<U>(f: (a: T, c: C) => Request<C, U>): Request<C, U> {
    return Request.flatMap(this, f)
  }

  optionMap<U>(f: (a: T, c: C) => Option<Request<C, U>>): Request<C, Option<U>> {
    return Request.optionMap(this, f)
  }

  /**
   * Flatmaps over failed requests (a recover that returns a request)
   * @param f
   */
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  flatRecover<U>(f: (error: any, c: C) => Request<C, U>): Request<C, T | U> {
    return Request.flatRecover(this, f)
  }

  lift<U>(v: U): Request<C, U> {
    return Request.lift(v)
  }

  join<U>(v: Request<C, Request<C, U>>): Request<C, U> {
    return Request.join(v)
  }

  toVoid(): Request<C, void> {
    return Request.toVoid(this)
  }

  static read<C, T>(v: Request<C, T>, context: C): Async<T> {
    return v.request.read(context)
  }

  static run<C, T>(v: Request<C, T>, context: C): Async<T> {
    return Request.read(v, context)
  }

  static retry<C, T>(v: Request<C, T>, context: C, times = 1, backoffMs = 100): Async<T> {
    return Request.read(v, context).flatRecover((e) =>
      times >= 1 ? Async.delay(backoffMs).flatMap(() => Request.retry(v, context, times - 1, 2 * backoffMs)) : Async.reject(e)
    )
  }

  static empty<C>(): Request<C, void> {
    return new Request(Reader.lift(() => Async.resolve(undefined)))
  }

  static lift<C, U>(v: U): Request<C, U> {
    return new Request(Reader.lift(() => Async.resolve(v)))
  }

  static of<C, T>(request: (context: C) => Async<T>): Request<C, T> {
    return new Request(Reader.lift(request))
  }

  static ofLazy<C, T>(lazy: Lazy<T>): Request<C, T> {
    return new Request(Reader.lift(() => Async.ofLazy(lazy)))
  }

  static ofNative<C, T>(request: (context: C) => Promise<T>): Request<C, T> {
    return new Request(Reader.lift((context) => Async.of(request(context))))
  }

  static map<C, T, U>(value: Request<C, T>, f: (a: T, c: C) => U | Promise<U>): Request<C, U> {
    return new Request(value.request.map((a, c) => a.map((v) => f(v, c))))
  }

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  static recover<C, T, U>(value: Request<C, T>, f: (error: any, c: C) => U | Promise<U>): Request<C, T | U> {
    return new Request(value.request.map((a, c) => a.recover((v) => f(v, c))))
  }

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  static onError<C, T>(value: Request<C, T>, f: (error: any, c: C) => never): Request<C, T> {
    return new Request(value.request.map((a, c) => a.onError((v) => f(v, c))))
  }

  static flatMap<C, T, U>(value: Request<C, T>, f: (a: T, c: C) => Request<C, U>): Request<C, U> {
    return new Request(Reader.lift((c) => value.read(c).flatMap((v) => f(v, c).read(c))))
  }

  static optionMap<C, T, U>(value: Request<C, T>, f: (a: T, c: C) => Option<Request<C, U>>): Request<C, Option<U>> {
    return new Request(
      Reader.lift((c) =>
        value.read(c).flatMap((a) =>
          f(a, c)
            .map((r) => r.read(c).map((u) => Option.of(u)))
            .getOrElse(Async.resolve(Option.none()))
        )
      )
    )
  }

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  static flatRecover<C, T, U>(value: Request<C, T>, f: (error: any, c: C) => Request<C, U>): Request<C, T | U> {
    return new Request(Reader.lift((c) => value.read(c).flatRecover((e) => f(e, c).read(c))))
  }

  static join<C, U>(v: Request<C, Request<C, U>>): Request<C, U> {
    return new Request(Reader.lift((c) => v.read(c).flatMap((a) => a.read(c))))
  }

  /**
   * Executes all requests as a single request returning all results
   * @param request
   */
  static all<C, T>(requests: Request<C, T>[]): Request<C, T[]> {
    return new Request(Reader.lift((c) => Async.all(requests.map((r) => r.read(c)))))
  }

  static fold<C, T>(requests: List<Request<C, T>>): Request<C, List<T>> {
    return new Request(Reader.lift((c) => Async.fold(requests.map((r) => r.read(c)))))
  }

  static both<C, S, T>(request1: Request<C, S>, request2: Request<C, T>): Request<C, [S, T]> {
    return Request.zip(request1, request2)
  }

  public static zip<C, T1, T2>(value1: Request<C, T1>, value2: Request<C, T2>): Request<C, [T1, T2]>
  public static zip<C, T1, T2, T3>(value1: Request<C, T1>, value2: Request<C, T2>, value3: Request<C, T3>): Request<C, [T1, T2, T3]>
  public static zip<C, T1, T2, T3, T4>(
    value1: Request<C, T1>,
    value2: Request<C, T2>,
    value3: Request<C, T3>,
    value4: Request<C, T4>
  ): Request<C, [T1, T2, T3, T4]>
  public static zip<C, T1, T2, T3, T4, T5>(
    value1: Request<C, T1>,
    value2: Request<C, T2>,
    value3: Request<C, T3>,
    value4: Request<C, T4>,
    value5: Request<C, T5>
  ): Request<C, [T1, T2, T3, T4, T5]>
  public static zip<C, T1, T2, T3, T4, T5, T6>(
    value1: Request<C, T1>,
    value2: Request<C, T2>,
    value3: Request<C, T3>,
    value4: Request<C, T4>,
    value5: Request<C, T5>,
    value6: Request<C, T6>
  ): Request<C, [T1, T2, T3, T4, T5, T6]>
  public static zip<C, T1, T2, T3, T4, T5, T6, T7>(
    value1: Request<C, T1>,
    value2: Request<C, T2>,
    value3: Request<C, T3>,
    value4: Request<C, T4>,
    value5: Request<C, T5>,
    value6: Request<C, T6>,
    value7: Request<C, T7>
  ): Request<C, [T1, T2, T3, T4, T5, T6, T7]>
  public static zip<C, T1, T2, T3, T4, T5, T6, T7, T8>(
    value1: Request<C, T1>,
    value2: Request<C, T2>,
    value3: Request<C, T3>,
    value4: Request<C, T4>,
    value5: Request<C, T5>,
    value6: Request<C, T6>,
    value7: Request<C, T7>,
    value8: Request<C, T8>
  ): Request<C, [T1, T2, T3, T4, T5, T6, T7, T8]>
  public static zip<C, T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    value1: Request<C, T1>,
    value2: Request<C, T2>,
    value3: Request<C, T3>,
    value4: Request<C, T4>,
    value5: Request<C, T5>,
    value6: Request<C, T6>,
    value7: Request<C, T7>,
    value8: Request<C, T8>,
    value9: Request<C, T9>
  ): Request<C, [T1, T2, T3, T4, T5, T6, T7, T8, T9]>
  public static zip<C>(...requests: Request<C, unknown>[]): Request<C, unknown[]> {
    return new Request(
      Reader.lift((c) => {
        const [r1, r2, r3, r4, r5, r6, r7, r8, r9] = requests.map((r) => r.read(c))
        return Async.zip(r1, r2, r3, r4, r5, r6, r7, r8, r9)
      })
    )
  }

  /**
   * Executes all requests as a single request returning the first finished result
   * @param request
   */
  static race<C, T>(requests: Request<C, T>[]): Request<C, T> {
    return new Request(Reader.lift((c) => Async.race(requests.map((r) => r.read(c)))))
  }

  static joinAll<C, T>(requests: Request<C, Request<C, T>[]>): Request<C, T[]> {
    return Request.join(requests.map(Request.all))
  }

  public static chain<C, T1, T2>(value1: Request<C, T1>, value2: Request<C, T2>): Request<C, T2>
  public static chain<C, T1, T2, T3>(value1: Request<C, T1>, value2: Request<C, T2>, value3: Request<C, T3>): Request<C, T3>
  public static chain<C, T1, T2, T3, T4>(
    value1: Request<C, T1>,
    value2: Request<C, T2>,
    value3: Request<C, T3>,
    value4: Request<C, T4>
  ): Request<C, T4>
  public static chain<C, T1, T2, T3, T4, T5>(
    value1: Request<C, T1>,
    value2: Request<C, T2>,
    value3: Request<C, T3>,
    value4: Request<C, T4>,
    value5: Request<C, T5>
  ): Request<C, T5>
  public static chain<C, T1, T2, T3, T4, T5, T6>(
    value1: Request<C, T1>,
    value2: Request<C, T2>,
    value3: Request<C, T3>,
    value4: Request<C, T4>,
    value5: Request<C, T5>,
    value6: Request<C, T6>
  ): Request<C, T6>
  public static chain<C, T1, T2, T3, T4, T5, T6, T7>(
    value1: Request<C, T1>,
    value2: Request<C, T2>,
    value3: Request<C, T3>,
    value4: Request<C, T4>,
    value5: Request<C, T5>,
    value6: Request<C, T6>,
    value7: Request<C, T7>
  ): Request<C, T7>
  public static chain<C, T1, T2, T3, T4, T5, T6, T7, T8>(
    value1: Request<C, T1>,
    value2: Request<C, T2>,
    value3: Request<C, T3>,
    value4: Request<C, T4>,
    value5: Request<C, T5>,
    value6: Request<C, T6>,
    value7: Request<C, T7>,
    value8: Request<C, T8>
  ): Request<C, T8>
  public static chain<C, T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    value1: Request<C, T1>,
    value2: Request<C, T2>,
    value3: Request<C, T3>,
    value4: Request<C, T4>,
    value5: Request<C, T5>,
    value6: Request<C, T6>,
    value7: Request<C, T7>,
    value8: Request<C, T8>,
    value9: Request<C, T9>
  ): Request<C, T9>
  /**
   * Flatmaps over an array of request
   * @param requests
   */
  public static chain<C>(...requests: Request<C, unknown>[]): Request<C, unknown> {
    const [r1, r2, r3, r4, r5, r6, r7, r8, r9] = requests
    return r2 === undefined ? r1 : r1.flatMap(() => Request.chain(r2, r3, r4, r5, r6, r7, r8, r9))
  }

  public static chainN<C>(...requests: Request<C, unknown>[]): Request<C, unknown> {
    const [head, ...tail] = requests
    return tail.length === 0 ? head : head.flatMap(() => Request.chainN(...tail))
  }

  public static flow<C, T1, T2>(value1: Request<C, T1>, value2: (i: T1) => Request<C, T2>): Request<C, T2>
  public static flow<C, T1, T2, T3>(
    value1: Request<C, T1>,
    value2: (i: T1) => Request<C, T2>,
    value3: (i: T2) => Request<C, T3>
  ): Request<C, T3>
  public static flow<C, T1, T2, T3, T4>(
    value1: Request<C, T1>,
    value2: (i: T1) => Request<C, T2>,
    value3: (i: T2) => Request<C, T3>,
    value4: (i: T3) => Request<C, T4>
  ): Request<C, T4>
  public static flow<C, T1, T2, T3, T4, T5>(
    value1: Request<C, T1>,
    value2: (i: T1) => Request<C, T2>,
    value3: (i: T2) => Request<C, T3>,
    value4: (i: T3) => Request<C, T4>,
    value5: (i: T4) => Request<C, T5>
  ): Request<C, T5>
  public static flow<C, T1, T2, T3, T4, T5, T6>(
    value1: Request<C, T1>,
    value2: (i: T1) => Request<C, T2>,
    value3: (i: T2) => Request<C, T3>,
    value4: (i: T3) => Request<C, T4>,
    value5: (i: T4) => Request<C, T5>,
    value6: (i: T5) => Request<C, T6>
  ): Request<C, T6>
  public static flow<C, T1, T2, T3, T4, T5, T6, T7>(
    value1: Request<C, T1>,
    value2: (i: T1) => Request<C, T2>,
    value3: (i: T2) => Request<C, T3>,
    value4: (i: T3) => Request<C, T4>,
    value5: (i: T4) => Request<C, T5>,
    value6: (i: T5) => Request<C, T6>,
    value7: (i: T6) => Request<C, T7>
  ): Request<C, T7>
  public static flow<C, T1, T2, T3, T4, T5, T6, T7, T8>(
    value1: Request<C, T1>,
    value2: (i: T1) => Request<C, T2>,
    value3: (i: T2) => Request<C, T3>,
    value4: (i: T3) => Request<C, T4>,
    value5: (i: T4) => Request<C, T5>,
    value6: (i: T5) => Request<C, T6>,
    value7: (i: T6) => Request<C, T7>,
    value8: (i: T7) => Request<C, T8>
  ): Request<C, T8>
  public static flow<C, T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    value1: Request<C, T1>,
    value2: (i: T1) => Request<C, T2>,
    value3: (i: T2) => Request<C, T3>,
    value4: (i: T3) => Request<C, T4>,
    value5: (i: T4) => Request<C, T5>,
    value6: (i: T5) => Request<C, T6>,
    value7: (i: T6) => Request<C, T7>,
    value8: (i: T7) => Request<C, T8>,
    value9: (i: T8) => Request<C, T9>
  ): Request<C, T9>
  public static flow<C>(head: Request<C, unknown>, ...tail: ((i: unknown) => Request<C, unknown>)[]): Request<C, unknown> {
    const [v2, v3, v4, v5, v6, v7, v8, v9] = tail
    return v2 === undefined ? head : head.flatMap((i) => Request.flow(v2(i), v3, v4, v5, v6, v7, v8, v9))
  }

  static toVoid<C, T>(v: Request<C, T>): Request<C, void> {
    return new Request(v.request.map((a) => a.toVoid()))
  }
}
