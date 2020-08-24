import { lazy, Lazy } from './lazy'
import { Async } from './async'
import { Option } from './option'
import { List } from './list'

export interface Cursor<T> {
  next(): Async<T>
  close(): Async<void>
}

export class Stream<T> {
  public constructor(
    public readonly _head: Option<Lazy<Async<T>>>,
    public readonly _tail: lazy<Stream<T>>,
    public readonly _close: () => void
  ) {}

  public static fromCursor<T>(cursor: Cursor<T>, autoClose = true): Stream<T> {
    return new Stream(
      Option.some(Lazy.of(cursor.next)),
      () => Stream.fromCursor(cursor, false),
      () => autoClose && cursor.close()
    )
  }

  public collectToList(): Async<List<T>> {
    return Stream.collectToList(this)
  }

  public static collectToList<T>(val: Stream<T>): Async<List<T>> {
    return val._head
      .unwrap(
        (h) =>
          h
            .eval()
            .flatMap((a) =>
              val
                ._tail()
                .collectToList()
                .map((l) => l.prepend(a))
            )
            .recover(() => List.empty<T>()),
        () => Async.lift(List.empty<T>())
      )
      .finally(() => val._close())
  }

  public take(amount = 1): Stream<T> {
    return Stream.take(this, amount)
  }

  public static head<T>(val: Stream<T>): Option<Async<T>> {
    return val._head.map((h) => h.eval())
  }

  public static tail<T>(val: Stream<T>): Stream<T> {
    return val._tail()
  }

  public static take<T>(val: Stream<T>, amount = 1): Stream<T> {
    return new Stream(val._head, () => (amount > 1 ? val._tail().take(amount - 1) : Stream.empty()), val._close)
  }

  public static empty<T>(): Stream<T> {
    return new Stream<T>(Option.none(), Stream.empty, () => undefined)
  }
}
