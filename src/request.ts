import { Monad } from './monad'
import { Reader } from './reader'
import { Async } from './async'
import { Try } from './try'
import { Lazy } from './lazy'
import { List } from './list'

export class Request<C, T> implements Monad<T> {
  constructor(private readonly request: Reader<C, Async<T>>) {}

  read(context: C): Async<T> {
    return Request.read(this, context)
  }

  run(context: C): Async<T> {
    return Request.run(this, context)
  }

  map<U>(f: (a: T) => U): Request<C, U> {
    return Request.map(this, f)
  }

  /**
   * recovers from failure
   * @param f
   */
  recover<U>(f: (error: unknown) => U): Request<C, T | U> {
    return Request.recover(this, f)
  }

  flatMap<U>(f: (a: T) => Request<C, U>): Request<C, U> {
    return Request.flatMap(this, f)
  }

  /**
   * Runs the request and flatmaps over results
   * @param f
   */
  runFlatmap<U>(f: (value: Try<T>) => Request<C, U>): Request<C, U> {
    return Request.runFlatmap(this, f)
  }

  /**
   * Flatmaps over failed requests (a recover that returns a request)
   * @param f
   */
  flatRecover<U>(f: (error: unknown) => Request<C, U>): Request<C, T | U> {
    return Request.flatRecover(this, f)
  }

  lift<U>(v: U): Monad<U> {
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

  static map<C, T, U>(value: Request<C, T>, f: (a: T) => U): Request<C, U> {
    return new Request(value.request.map((a) => a.map(f)))
  }

  static recover<C, T, U>(value: Request<C, T>, f: (error: unknown) => U): Request<C, T | U> {
    return new Request(value.request.map((a) => a.recover(f)))
  }

  static flatMap<C, T, U>(value: Request<C, T>, f: (a: T) => Request<C, U>): Request<C, U> {
    return new Request(Reader.lift((context) => value.read(context).flatMap((a) => f(a).read(context))))
  }

  static runFlatmap<C, T, U>(value: Request<C, T>, f: (value: Try<T>) => Request<C, U>): Request<C, U> {
    const r: Request<C, Request<C, U>> = new Request(Reader.lift((context) => Async.of(value.read(context).run()).map(f)))
    return Request.join(r)
  }

  static flatRecover<C, T, U>(value: Request<C, T>, f: (error: unknown) => Request<C, U>): Request<C, T | U> {
    return new Request(Reader.lift((context) => value.read(context).flatRecover((e) => f(e).read(context))))
  }

  static join<C, U>(v: Request<C, Request<C, U>>): Request<C, U> {
    return new Request(Reader.lift((context) => v.read(context).flatMap((a) => a.read(context))))
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
  static chain<C>(...requests: Request<C, unknown>[]): Request<C, unknown> {
    const [r1, r2, r3, r4, r5, r6, r7, r8, r9] = requests
    if (r2 !== undefined) {
      return Request.flatMap(r1, () => Request.chain(r2, r3, r4, r5, r6, r7, r8, r9))
    } else {
      return r1
    }
  }

  static chainN<C>(...requests: Request<C, unknown>[]): Request<C, unknown> {
    const [head, ...tail] = requests
    if (tail.length > 0) {
      return Request.flatMap(head, () => Request.chainN(...tail))
    } else {
      return head
    }
  }

  static toVoid<C, T>(v: Request<C, T>): Request<C, void> {
    return new Request(v.request.map((a) => a.toVoid()))
  }
}
