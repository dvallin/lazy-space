import { Async } from './async'
import { Lazy } from './lazy'
import { List } from './list'
import { Monad } from './monad'
import { Option } from './option'

interface Source<T> {
  next(): Async<Option<T>>
}

export function empty<T>(): Source<T> {
  return {
    next: () => Async.lift(Option.none()),
  }
}

export function repeat<T>(value: T): Source<T> {
  return {
    next: () => Async.lift(Option.of(value)),
  }
}

export function once<T>(value: T): Source<T> {
  let done = false
  return {
    next: () => {
      if (!done) {
        done = true
        return Async.lift(Option.of(value))
      } else {
        return Async.lift(Option.none())
      }
    },
  }
}
export function natural(from: number): Source<number> {
  let current = from
  return {
    next: () => Async.lift(Option.of(current++)),
  }
}

export function range(from: number, to: number): Source<number> {
  const n = natural(from)
  return {
    next: () => n.next().map((o) => o.filter((i) => i <= to)),
  }
}

export class MapOp<I, O> {
  public constructor(private readonly source: Source<I>, public readonly f: (v: I) => O) {}

  public apply(): Source<O> {
    return {
      next: () => this.source.next().map((n) => n.map((v) => this.f(v))),
    }
  }
}

export class FlatMapOp<I, O> {
  public constructor(private readonly source: Source<I>, private readonly f: (v: I) => Source<O>) {}

  current: Option<Async<Option<Source<O>>>> = Option.none()

  public apply(): Source<O> {
    return {
      next: () => {
        if (this.current.isNone()) {
          this.current = Option.some(this.source.next().map((o) => o.map(this.f)))
        }
        return Async.join(
          this.current.getOrThrow(new Error('')).map((s) =>
            s.unwrap(
              (currentSource) =>
                currentSource.next().flatMap((head) => {
                  if (head.isNone()) {
                    this.current = Option.none()
                    return this.apply().next()
                  }
                  return Async.resolve(head)
                }),
              () => {
                this.current = Option.none()
                return Async.resolve(Option.none())
              }
            )
          )
        )
      },
    }
  }
}

export class BracketOp<T> {
  public constructor(public readonly source: Source<T>, public readonly close: () => void) {}

  public apply(): Source<T> {
    return {
      next: () =>
        this.source
          .next()
          .map((n) => {
            if (n.isNone()) {
              this.close()
            }
            return n
          })
          .onError((e) => {
            this.close()
            throw e
          }),
    }
  }
}

export class Stream<T> implements Monad<T> {
  public constructor(private readonly source: Source<T>) {}

  public map<U>(f: (a: T) => U): Stream<U> {
    return new Stream(new MapOp(this.source, f).apply())
  }

  public flatMap<U>(f: (a: T) => Stream<U>): Stream<U> {
    return new Stream(new FlatMapOp(this.source, (a) => f(a).source).apply())
  }

  public lift<U>(v: U): Stream<U> {
    return new Stream(once(v))
  }

  public join<U>(v: Stream<Stream<U>>): Stream<U> {
    return v.flatMap((i) => i)
  }

  public bracket(close: () => void): Stream<T> {
    return new Stream(new BracketOp(this.source, close).apply())
  }

  public static of<T>(source: Lazy<Async<Option<T>>>): Stream<T> {
    return new Stream({
      next: () => source.eval(),
    })
  }

  public static empty<T>(): Stream<T> {
    return new Stream(empty())
  }

  public static range(from: number, to: number): Stream<number> {
    return new Stream(range(from, to))
  }

  public collect(): Async<T[]> {
    return Async.join(
      this.source.next().map((n) =>
        n.unwrap(
          (v) => this.collect().map((tail) => [v, ...tail]),
          () => Async.resolve<T[]>([])
        )
      )
    )
  }

  public collectToList(): Async<List<T>> {
    return Async.join(
      this.source.next().map((n) =>
        n.unwrap(
          (v) => this.collectToList().map((tail) => tail.prepend(v)),
          () => Async.resolve(List.empty<T>())
        )
      )
    )
  }
}
