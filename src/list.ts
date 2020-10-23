import { Option } from './option'
import { Monad } from './monad'
import { Lazy, lazy } from './lazy'

export class List<T> implements Monad<T> {
  public constructor(public readonly _head: Option<Lazy<T>>, public readonly _tail: lazy<List<T>>) {}

  public head(): Option<T> {
    return List.head(this)
  }

  public tail(): List<T> {
    return List.tail(this)
  }

  public map<U>(f: (a: T) => U, memoized = false): List<U> {
    return List.map(this, f, memoized)
  }

  public flatMap<U>(f: (a: T) => List<U>): List<U> {
    return List.flatMap(this, f)
  }

  public lift<U>(value: U): List<U> {
    return List.lift(value)
  }

  public join<U>(value: List<List<U>>): List<U> {
    return List.join(value)
  }

  public take(amount = 1): List<T> {
    return List.take(this, amount)
  }

  public at(index = 0): Option<T> {
    return List.at(this, index)
  }

  public drop(amount = 1): List<T> {
    return List.drop(this, amount)
  }

  public takeWhile(predicate: (v: T) => boolean): List<T> {
    return List.takeWhile(this, predicate)
  }

  public dropWhile(predicate: (v: T) => boolean): List<T> {
    return List.dropWhile(this, predicate)
  }

  public forEach(f: (a: T) => void): void {
    List.forEach(this, f)
  }

  public fold<S>(initial: S, combine: (l: S, r: T) => S): S {
    return List.fold(this, initial, combine)
  }

  public scan<S>(initial: S, combine: (l: S, r: T) => S): List<S> {
    return List.scan(this, initial, combine)
  }

  public foldr<S>(initial: () => S, combine: (l: () => S, r: T) => S): S {
    return List.foldr(this, initial, combine)
  }

  public append(value: T): List<T> {
    return List.append(this, value)
  }

  public prepend(value: T): List<T> {
    return List.prepend(this, value)
  }

  public concat(other: () => List<T>): List<T> {
    return List.concat(this, other)
  }

  public intersperse(item: T): List<T> {
    return List.intersperse(this, item)
  }

  public seek(predicate: (v: T) => boolean): List<T> {
    return List.seek(this, predicate)
  }

  public find(predicate: (v: T) => boolean): Option<T> {
    return List.find(this, predicate)
  }

  public filterType<U extends T = T>(predicate: (v: T) => v is U): List<U> {
    return List.filterType(this, predicate)
  }

  public filter(predicate: (v: T) => boolean): List<T> {
    return List.filterType(this, (v): v is T => predicate(v))
  }

  public some(predicate: (v: T) => boolean): boolean {
    return List.some(this, predicate)
  }

  public all(predicate: (v: T) => boolean): boolean {
    return List.all(this, predicate)
  }

  public reverse(): List<T> {
    return List.reverse(this)
  }

  public size(): number {
    return List.size(this)
  }

  public isEmpty(): boolean {
    return List.isEmpty(this)
  }

  public batch(length: number, step: number = length): List<T[]> {
    return List.batch(this, length, step)
  }

  public toArray(): T[] {
    return List.toArray(this)
  }

  public eval(): void {
    return List.eval(this)
  }

  public static lift<T>(val: T, tail: () => List<T> = List.empty): List<T> {
    return new List<T>(Option.of(val).map(Lazy.lift), tail)
  }

  public static ofNative<T>(val: () => Generator<T>): List<T> {
    return List.ofGenerator(new Lazy(val, true))
  }

  public static ofGenerator<T>(generator: Lazy<Generator<T>>): List<T> {
    const next = generator.eval().next()
    if (next.done) {
      return List.empty()
    }
    return new List(Option.lift(Lazy.lift(next.value)), () => List.ofGenerator(generator))
  }

  public static of<T>(val: T[], start = 0): List<T> {
    return List.lift(val[start], () => List.of(val, start + 1))
  }

  public static ofLazies<T>(val: Lazy<T>[], start = 0): List<T> {
    return new List(Option.of(val[start]), () => List.ofLazies(val, start + 1))
  }

  public static map<S, T>(val: List<S>, f: (a: S) => T, memoized = false): List<T> {
    return new List(
      val._head.map((a) => a.map(f, memoized)),
      () => val._tail().map(f)
    )
  }

  public static flatMap<S, T>(val: List<S>, f: (s: S) => List<T>): List<T> {
    return val.foldr(List.empty, (t: () => List<T>, h) => f(h).concat(t))
  }

  public static prepend<T>(list: List<T>, value: T): List<T> {
    return this.lift(value, () => list)
  }

  public static append<T>(list: List<T>, value: T): List<T> {
    return list.concat(() => List.lift(value))
  }

  public static concat<T>(left: List<T>, right: () => List<T>): List<T> {
    return left.foldr(right, (t, h) => List.lift(h, t))
  }

  public static intersperse<T>(left: List<T>, item: T): List<T> {
    return left.flatMap((a) => List.of([item, a])).drop()
  }

  public static join<T>(val: List<List<T>>): List<T> {
    return List.flatMap(val, (v) => v)
  }

  public static head<T>(val: List<T>): Option<T> {
    return val._head.strictMap((v) => v.eval())
  }

  public static tail<T>(val: List<T>): List<T> {
    return val._tail()
  }

  public static forEach<T>(val: List<T>, f: (a: T) => void): void {
    val.map(f).eval()
  }

  public static take<T>(val: List<T>, amount = 1): List<T> {
    return new List(val._head, () => (amount > 1 ? val._tail().take(amount - 1) : List.empty()))
  }

  public static at<T>(val: List<T>, index = 0): Option<T> {
    return List.drop(val, index).take(1).head()
  }

  public static drop<T>(val: List<T>, amount = 1): List<T> {
    return amount > 0 ? val._tail().drop(amount - 1) : val
  }

  public static takeWhile<T>(val: List<T>, predicate: (v: T) => boolean): List<T> {
    return val._head.unwrap(
      (h) => (predicate(h.eval()) ? new List(val._head, () => val._tail().takeWhile(predicate)) : List.empty()),
      () => List.empty()
    )
  }

  public static dropWhile<T>(val: List<T>, predicate: (v: T) => boolean): List<T> {
    return val._head.unwrap(
      (h) => (predicate(h.eval()) ? val._tail().dropWhile(predicate) : val),
      () => List.empty()
    )
  }

  public static fold<S, T>(val: List<S>, initial: T, combine: (l: T, r: S) => T): T {
    let aggregate = initial
    let current = val
    while (true) {
      if (current._head.isSome()) {
        aggregate = combine(aggregate, current._head.value.eval())
        current = current._tail()
      } else {
        break
      }
    }
    return aggregate
  }

  public static scan<S, T>(val: List<S>, initial: T, combine: (l: T, r: S) => T): List<T> {
    return val._head.unwrap(
      (h) => {
        const head = combine(initial, h.eval())
        return List.lift(head, () => val.tail().scan(head, combine))
      },
      () => List.empty()
    )
  }

  public static foldr<S, T>(val: List<S>, initial: () => T, combine: (l: () => T, r: S) => T): T {
    return val._head.unwrap(
      (h) => combine(() => val._tail().foldr(initial, combine), h.eval()),
      () => initial()
    )
  }

  public static seek<T>(val: List<T>, predicate: (v: T) => boolean): List<T> {
    let current = val
    while (true) {
      if (current._head.isSome()) {
        if (predicate(current._head.value.eval())) {
          return current
        }
        current = current._tail()
      } else {
        break
      }
    }
    return List.empty()
  }

  public static find<T>(val: List<T>, predicate: (v: T) => boolean): Option<T> {
    return val.seek(predicate)._head.strictMap((v) => v.eval())
  }

  public static filterType<T, U extends T>(val: List<T>, predicate: (v: T) => v is U): List<U> {
    const found = val.seek(predicate)
    return new List(found._head as Option<Lazy<U>>, () => found._tail().filterType(predicate))
  }

  public static some<T>(val: List<T>, predicate: (v: T) => boolean): boolean {
    return List.find(val, predicate).isSome()
  }

  public static all<T>(val: List<T>, predicate: (v: T) => boolean): boolean {
    return List.find(val, (v) => !predicate(v)).isNone()
  }

  public static batch<T>(val: List<T>, length: number, step: number = length): List<T[]> {
    if (val._head.isSome()) {
      return new List(Option.some(new Lazy(() => val.take(length).toArray())), () => val.drop(step).batch(length, step))
    }
    return List.empty()
  }

  public static toArray<T>(val: List<T>): T[] {
    return val.fold([], (l: T[], r) => {
      l.push(r)
      return l
    })
  }

  public static eval<T>(val: List<T>): void {
    let current = val
    while (current._head.isSome()) {
      current._head.value.eval()
      current = current._tail()
    }
  }

  public static repeat<T>(value: T): List<T> {
    return new List<T>(Option.of(Lazy.lift(value)), () => List.repeat(value))
  }

  public static empty<T>(): List<T> {
    return new List<T>(Option.none(), List.empty)
  }

  public static natural(start = 1): List<number> {
    return List.lift(start, () => List.natural(start + 1))
  }

  public static reverse<T>(list: List<T>): List<T> {
    return List.fold(list, List.empty(), (l, r) => List.lift(r, () => l))
  }

  public static size<T>(list: List<T>): number {
    return List.fold(list, 0, (l, _r) => l + 1)
  }

  public static isEmpty<T>(list: List<T>): boolean {
    return list._head.isRight()
  }

  public static flattenOptionals<T>(list: List<Option<T>>): List<T> {
    return list.filterType(Option.isSome).map((v) => v.value)
  }

  public static product<T>(lists: List<List<T>>): List<List<T>> {
    return lists.foldr(
      () => List.lift(List.empty()),
      (l, r) => r.flatMap((a) => l().map((b) => List.lift(a).concat(() => b)))
    )
  }
}
