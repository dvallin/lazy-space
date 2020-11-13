import { Async } from '../async'
import { Lazy } from '../lazy'
import { List } from '../list'
import { Monad } from '../monad'
import { Option } from '../option'
import { Try } from '../try'
import { empty, natural, ofNative, once, range, repeat, Source, onError } from './source'

export class Stream<T> implements Monad<T> {
  public constructor(private readonly source: Source<T>) {}

  public map<U>(f: (a: T) => U | Promise<U>): Stream<U> {
    return Stream.map(this, f)
  }

  public with(f: (a: T) => unknown): Stream<T> {
    return Stream.with(this, f)
  }

  public onError(f: (e: Error) => unknown): Stream<T> {
    return Stream.onError(this, f)
  }

  public flatMap<U>(f: (a: T) => Stream<U>): Stream<U> {
    return Stream.flatMap(this, f)
  }

  public asyncMap<U>(f: (a: T) => Async<U>): Stream<U> {
    return Stream.asyncMap(this, f)
  }

  public lift<U>(v: U): Stream<U> {
    return Stream.lift(v)
  }

  public filter(f: (a: T) => boolean): Stream<T> {
    return Stream.filter(this, f)
  }

  public filterType<U extends T>(predicate: (v: T) => v is U): Stream<U> {
    return Stream.filterType(this, predicate)
  }

  public scan<U>(initial: U, combine: (l: U, r: T) => U): Stream<U> {
    return Stream.scan(this, initial, combine)
  }

  public take(amount = 1): Stream<T> {
    return Stream.take(this, amount)
  }

  public takeWhile(predicate: (a: T) => boolean): Stream<T> {
    return Stream.takeWhile(this, predicate)
  }

  public drop(amount = 1): Stream<T> {
    return Stream.drop(this, amount)
  }

  public dropWhile(predicate: (a: T) => boolean): Stream<T> {
    return Stream.dropWhile(this, predicate)
  }

  public join<U>(v: Stream<Stream<U>>): Stream<U> {
    return Stream.join(v)
  }

  public bracket(close: () => void): Stream<T> {
    return Stream.bracket(this, close)
  }

  public static ofNative<T>(generator: () => AsyncGenerator<T>): Stream<T> {
    return new Stream(ofNative(generator))
  }

  public static of<T>(source: Lazy<Async<Option<T>>>): Stream<T> {
    return new Stream({
      next: () => source.eval(),
      onError,
    })
  }

  public static merge<T>(streams: Stream<T>[]): Stream<T> {
    const cache: Async<Option<T>>[] = []
    return new Stream({
      next: () => {
        streams.map((source, i) => {
          if (cache[i] === undefined) {
            cache[i] = source.source.next()
          }
        })
        let emitted = false
        return Async.any(
          cache.map((a, i) =>
            a
              .flatMap((h) => (h.isNone() ? Async.reject<Option<T>, Error>() : Async.resolve(h)))
              .map((h) => {
                if (h.isSome() && !emitted) {
                  delete cache[i]
                }
                emitted = true
                return h
              })
          )
        ).recover(() => Option.none())
      },
      onError: (e) => {
        streams.map((source) => Try.run(() => source.source.onError(e)))
        throw e
      },
    })
  }

  public static empty<T>(): Stream<T> {
    return new Stream(empty())
  }

  public static range(from: number, to: number): Stream<number> {
    return new Stream(range(from, to))
  }

  public static natural(start = 1): Stream<number> {
    return new Stream(natural(start))
  }

  public static repeat<T>(v: T): Stream<T> {
    return new Stream(repeat(v))
  }

  public static map<T, U>(val: Stream<T>, f: (a: T) => U | Promise<U>): Stream<U> {
    return new Stream({
      next: () =>
        val.source
          .next()
          .flatMap((n) =>
            n.unwrap(
              (v) => Async.of(f(v)).map((a) => Option.some(a)),
              () => Async.lift(Option.none<U>())
            )
          )
          .onError((e) => {
            val.source.onError(e)
          }),
      onError: val.source.onError,
    })
  }

  public static with<T>(val: Stream<T>, f: (a: T) => unknown): Stream<T> {
    return Stream.map(val, (a) => {
      f(a)
      return a
    })
  }

  public static flatMap<T, U>(val: Stream<T>, f: (a: T) => Stream<U>): Stream<U> {
    let current: Option<Async<Option<Stream<U>>>> = Option.none()
    const next = (): Async<Option<U>> => {
      if (current.isNone()) {
        current = Option.some(val.source.next().map((o) => o.map(f)))
      }
      return current.getOrThrow(new Error('')).flatMap((s) =>
        s.unwrap(
          (currentStream) =>
            currentStream.source
              .next()
              .flatMap((head) => {
                if (head.isNone()) {
                  current = Option.none()
                  return next()
                }
                return Async.resolve(head)
              })
              .onError((error) => {
                val.source.onError(error)
              }),
          () => Async.resolve(Option.none())
        )
      )
    }
    return new Stream({
      next,
      onError: (e) => {
        Try.run(() => current.map((c) => c.map((s) => s.map((stream) => stream.source.onError(e)))))
        val.source.onError(e)
      },
    })
  }

  public static asyncMap<T, U>(val: Stream<T>, f: (v: T) => Async<U>): Stream<U> {
    return Stream.map(val, (v) => f(v).promise)
  }

  public static lift<U>(v: U): Stream<U> {
    return new Stream(once(v))
  }

  public static onError<U>(val: Stream<U>, f: (e: Error) => unknown): Stream<U> {
    return new Stream({
      next: val.source.next,
      onError: (e) => {
        f(e)
        val.source.onError(e)
      },
    })
  }

  public static filter<T>(val: Stream<T>, f: (a: T) => boolean): Stream<T> {
    return val.filterType((a): a is T => f(a))
  }

  public static filterType<T, U extends T>(val: Stream<T>, predicate: (v: T) => v is U): Stream<U> {
    const next = (): Async<Option<U>> =>
      Async.join(
        val.source.next().map((a) =>
          a.unwrap(
            (head) => (predicate(head) ? Async.resolve(Option.of(head)) : next()),
            () => Async.resolve(Option.none<U>())
          )
        )
      )
    return new Stream({ next, onError: val.source.onError })
  }

  public static scan<T, U>(val: Stream<T>, initial: U, combine: (l: U, r: T) => U): Stream<U> {
    let current = initial
    return new Stream({
      next: () =>
        val.source.next().map((a) =>
          a.map((head) => {
            current = combine(current, head)
            return current
          })
        ),
      onError: val.source.onError,
    })
  }

  public static take<T>(val: Stream<T>, amount = 1): Stream<T> {
    let left = amount
    return new Stream({
      next: () => {
        if (left > 0) {
          left--
          return val.source.next()
        }
        return Async.resolve(Option.none())
      },
      onError: val.source.onError,
    })
  }

  public static takeWhile<T>(val: Stream<T>, predicate: (a: T) => boolean): Stream<T> {
    const next = (): Async<Option<T>> =>
      val.source.next().flatMap((a) => (a.map((head) => predicate(head)).getOrElse(false) ? Async.lift(a) : Async.lift(Option.none())))
    return new Stream({ next, onError: val.source.onError })
  }

  public static drop<T>(val: Stream<T>, amount = 1): Stream<T> {
    let left = amount
    const next = (): Async<Option<T>> => {
      if (left > 0) {
        left--
        return val.source.next().flatMap(next)
      }
      return val.source.next()
    }
    return new Stream({ next, onError: val.source.onError })
  }

  public static dropWhile<T>(val: Stream<T>, predicate: (a: T) => boolean): Stream<T> {
    const next = (): Async<Option<T>> =>
      val.source.next().flatMap((a) => (a.map((head) => predicate(head)).getOrElse(false) ? next() : Async.lift(a)))
    return new Stream({ next, onError: val.source.onError })
  }

  public static join<U>(v: Stream<Stream<U>>): Stream<U> {
    return v.flatMap((i) => i)
  }

  public static bracket<T>(val: Stream<T>, close: () => void): Stream<T> {
    return new Stream({
      next: () =>
        val.source
          .next()
          .map((n) => {
            if (n.isNone()) {
              close()
            }
            return n
          })
          .onError((e) => {
            close()
            throw e
          }),
      onError: (e) => {
        close()
        val.source.onError(e)
      },
    })
  }

  public static fromList<T>(list: List<T>): Stream<T> {
    let current = list
    return new Stream({
      next: () => {
        const head = current.head()
        current = current.tail()
        return Async.resolve(head)
      },
      onError,
    })
  }

  public forEach(f: (v: T) => void): Async<void> {
    return this.source.next().flatMap((n) =>
      n.unwrap(
        (head) => {
          f(head)
          return this.forEach(f)
        },
        () => Async.resolve(undefined)
      )
    )
  }

  public fold<U>(initial: U, combine: (l: U, r: T) => U): Async<U> {
    return this.source.next().flatMap((n) =>
      n.unwrap(
        (v) => this.fold(initial, combine).map((l) => combine(l, v)),
        () => Async.lift(initial)
      )
    )
  }

  public collect(): Async<T[]> {
    return this.fold<T[]>([], (tail, head) => [head, ...tail])
  }

  public collectToList(): Async<List<T>> {
    return this.fold(List.empty<T>(), (tail, head) => tail.prepend(head))
  }
}
