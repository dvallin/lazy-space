import { Async } from '../async'
import { Lazy } from '../lazy'
import { List } from '../list'
import { Monad } from '../monad'
import { Option } from '../option'
import * as Op from './ops'
import { empty, natural, ofNative, once, range, repeat, Source } from './source'

export class Stream<T> implements Monad<T> {
  public constructor(private readonly source: Source<T>) {}

  public map<U>(f: (a: T) => U): Stream<U> {
    return Stream.map(this, f)
  }

  public flatMap<U>(f: (a: T) => Stream<U>): Stream<U> {
    return Stream.flatMap(this, f)
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
    })
  }

  public static merge<T>(streams: Stream<T>[]): Stream<T> {
    return new Stream(new Op.Merge(streams.map((s) => s.source)).apply())
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

  public static map<T, U>(val: Stream<T>, f: (a: T) => U): Stream<U> {
    return new Stream(new Op.Map(val.source, f).apply())
  }

  public static flatMap<T, U>(val: Stream<T>, f: (a: T) => Stream<U>): Stream<U> {
    return new Stream(new Op.FlatMap(val.source, (a) => f(a).source).apply())
  }

  public static lift<U>(v: U): Stream<U> {
    return new Stream(once(v))
  }

  public static filter<T>(val: Stream<T>, f: (a: T) => boolean): Stream<T> {
    return val.filterType((a): a is T => f(a))
  }

  public static filterType<T, U extends T>(val: Stream<T>, predicate: (v: T) => v is U): Stream<U> {
    return new Stream(new Op.Filter(val.source, predicate).apply())
  }

  public static scan<T, U>(val: Stream<T>, initial: U, combine: (l: U, r: T) => U): Stream<U> {
    return new Stream(new Op.Scan(val.source, initial, combine).apply())
  }

  public static take<T>(val: Stream<T>, amount = 1): Stream<T> {
    return new Stream(new Op.Take(val.source, amount).apply())
  }

  public static takeWhile<T>(val: Stream<T>, predicate: (a: T) => boolean): Stream<T> {
    return new Stream(new Op.TakeWhile(val.source, predicate).apply())
  }

  public static drop<T>(val: Stream<T>, amount = 1): Stream<T> {
    return new Stream(new Op.Drop(val.source, amount).apply())
  }

  public static dropWhile<T>(val: Stream<T>, predicate: (a: T) => boolean): Stream<T> {
    return new Stream(new Op.DropWhile(val.source, predicate).apply())
  }

  public static join<U>(v: Stream<Stream<U>>): Stream<U> {
    return v.flatMap((i) => i)
  }

  public static bracket<T>(val: Stream<T>, close: () => void): Stream<T> {
    return new Stream(new Op.Bracket(val.source, close).apply())
  }

  public static fromList<T>(list: List<T>): Stream<T> {
    let current = list
    return new Stream({
      next: () => {
        const head = current.head()
        current = current.tail()
        return Async.resolve(head)
      },
    })
  }

  public forEach<U>(f: (v: T) => U): Async<void> {
    return this.source
      .next()
      .flatMap((n) =>
        n.unwrap(
          (head) => {
            f(head)
            return this.forEach(f)
          },
          () => Async.resolve(undefined)
        )
      )
      .toVoid()
  }

  public fold<U>(initial: U, combine: (l: U, r: T) => U): Async<U> {
    return Async.join(
      this.source.next().map((n) =>
        n.unwrap(
          (v) => this.fold(initial, combine).map((l) => combine(l, v)),
          () => Async.lift(initial)
        )
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
