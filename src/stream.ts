import { lazy, Lazy } from './lazy'
import { Async } from './async'
import { Option } from './option'
import { List } from './list'
import { Monad } from './monad'

export interface Cursor<T> {
  next(): Async<Option<T>>
  close(): Async<void>
}

export interface StreamNode<T> {
  head: Option<T>
  tail: lazy<Stream<T>>
}

export class Stream<T> implements Monad<T> {
  public constructor(public readonly _node: Lazy<Async<StreamNode<T>>>, public readonly _close: () => void) {}

  public static fromCursor<T>(cursor: Cursor<T>, autoClose = true): Stream<T> {
    const node: Lazy<Async<StreamNode<T>>> = Lazy.of(cursor.next, true).map((n) =>
      n.map((head) => ({ head, tail: () => this.fromCursor(cursor, false) }))
    )
    return new Stream(node, () => autoClose && cursor.close())
  }

  public collectToList(): Async<List<T>> {
    return Stream.collectToList(this)
  }

  public map<U>(f: (a: T) => U): Stream<U> {
    return Stream.map(this, f)
  }

  public lift<U>(v: U): Stream<U> {
    return Stream.lift(v)
  }

  public flatMap<U>(f: (a: T) => Stream<U>): Stream<U> {
    return Stream.flatMap(this, f)
  }

  public concat(other: () => Stream<T>): Stream<T> {
    return Stream.concat(this, other)
  }

  public foldr<S>(initial: () => Async<S>, combine: (l: () => Async<S>, r: T) => Async<S>): Async<S> {
    return Stream.foldr(this, initial, combine)
  }

  public static flatMap<T, U>(val: Stream<T>, f: (a: T) => Stream<U>): Stream<U> {
    let close = new Lazy(val._close)
    return new Stream(
      new Lazy(() =>
        val.foldr(
          () => Stream.empty<U>()._node.eval(),
          (t, h) => {
            const stream = f(h)
            close = close.map(stream._close)
            return stream.concat(() => new Stream(new Lazy(t), () => undefined))._node.eval()
          }
        )
      ),
      () => close.eval()
    )
  }

  public static concat<T>(left: Stream<T>, right: () => Stream<T>): Stream<T> {
    const r = new Lazy(right, true)
    return new Stream(
      new Lazy(() => {
        return left.foldr(
          () => r.eval()._node.eval(),
          (t, h) => Async.resolve({ head: Option.some(h), tail: () => new Stream(new Lazy(t), () => undefined) })
        )
      }),
      () => {
        left._close()
        r.eval()._close()
      }
    )
  }

  public static foldr<S, T>(val: Stream<S>, initial: () => Async<T>, combine: (l: () => Async<T>, r: S) => Async<T>): Async<T> {
    return val._node.eval().flatMap((node) =>
      node.head.unwrap(
        (head) => combine(() => node.tail().foldr(initial, combine), head),
        () => initial()
      )
    )
  }

  public join<U>(v: Stream<Stream<U>>): Stream<U> {
    return v.flatMap((i) => i)
  }

  public static collectToList<T>(val: Stream<T>): Async<List<T>> {
    return val._node
      .eval()
      .flatMap((node) =>
        node.head.unwrap(
          (h) =>
            node
              .tail()
              .collectToList()
              .map((tail) => tail.prepend(h)),
          () => Async.resolve(List.empty<T>())
        )
      )
      .finally(() => val._close())
  }

  public static map<T, U>(val: Stream<T>, f: (a: T) => U): Stream<U> {
    return new Stream(
      val._node.map((n) => n.map((h) => ({ head: h.head.map(f), tail: () => h.tail().map(f) }))),
      val._close
    )
  }

  public static lift<U>(v: U): Stream<U> {
    return Stream.lift(v)
  }

  public take(amount = 1): Stream<T> {
    return Stream.take(this, amount)
  }

  public drop(amount = 1): Stream<T> {
    return Stream.drop(this, amount)
  }

  public static head<T>(val: Stream<T>): Async<Option<T>> {
    return val._node.eval().map((n) => n.head)
  }

  public static tail<T>(val: Stream<T>): Async<Stream<T>> {
    return val._node.eval().map((n) => n.tail())
  }

  public static take<T>(val: Stream<T>, amount = 1): Stream<T> {
    return amount <= 0
      ? Stream.empty()
      : new Stream(
          val._node.map((n) =>
            n.map((h) => ({
              head: h.head,
              tail: () => h.tail().take(amount - 1),
            }))
          ),
          val._close
        )
  }

  public static drop<T>(val: Stream<T>, amount = 1): Stream<T> {
    return amount > 0
      ? new Stream(
          val._node.map((a) =>
            a.flatMap((n) =>
              n
                .tail()
                .drop(amount - 1)
                ._node.eval()
            )
          ),
          val._close
        )
      : val
  }

  public static empty<T>(): Stream<T> {
    return new Stream<T>(
      Lazy.lift(
        Async.resolve({
          head: Option.none(),
          tail: () => Stream.empty(),
        })
      ),
      () => undefined
    )
  }
}
