import { Monad } from './monad'
import { Reader } from './reader'
import { Async } from './async'
import { Try } from './try'
import { Lazy } from './lazy'

export class Request<C, T> implements Monad<T> {
  constructor(private readonly request: Reader<C, Async<T>>) {}

  read(context: C): Async<T> {
    return Request.read(this, context)
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

  static both<C, S, T>(request1: Request<C, S>, request2: Request<C, T>): Request<C, [S, T]> {
    return new Request(Reader.lift((c) => Async.both(request1.read(c), request2.read(c))))
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

  /**
   * Flatmaps over an array of request, ignoring their returned values
   * @param requests
   */
  static chain<C>(...requests: Request<C, unknown>[]): Request<C, unknown> {
    const [head, ...tail] = requests
    if (tail.length > 0) {
      return Request.flatMap(head, () => Request.chain(...tail))
    } else {
      return head
    }
  }

  static toVoid<C, T>(v: Request<C, T>): Request<C, void> {
    return new Request(v.request.map((a) => a.toVoid()))
  }
}
