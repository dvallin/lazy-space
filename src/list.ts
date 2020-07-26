import { Option } from './option'
import { Monad } from './monad'
import { Lazy, lazy } from './lazy'

export class List<T> implements Monad<T> {
  public constructor(public readonly head: Lazy<Option<T>>, public readonly tail: lazy<List<T>>) {}

  public map<U>(f: (a: T) => U, memoized = true): List<U> {
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

  public seek(predicate: (v: T) => boolean): List<T> {
    return List.seek(this, predicate)
  }

  public find(predicate: (v: T) => boolean): Option<T> {
    return List.find(this, predicate)
  }

  public filterType<U extends T = T>(predicate: (v: T) => v is U): List<U> {
    return List.filter(this, predicate)
  }

  public filter(predicate: (v: T) => boolean): List<T> {
    return List.filter(this, (v): v is T => predicate(v))
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

  public consume(): void {
    return List.consume(this)
  }

  public static lift<T>(val: T): List<T> {
    return new List<T>(Lazy.lift(Option.of(val)), List.empty)
  }

  public static of<T>(val: T[], start = 0): List<T> {
    return new List(Lazy.lift(Option.of(val[start])), () => List.of(val, start + 1))
  }

  public static ofLazies<T>(val: Lazy<T>[], start = 0): List<T> {
    return new List(Lazy.lift(Option.of(val[start]).map((v) => v.eval())), () => List.ofLazies(val, start + 1))
  }

  public static map<S, T>(val: List<S>, f: (a: S) => T, memoized = true): List<T> {
    return new List(new Lazy(() => val.head.eval().map(f), memoized), () => val.tail().map(f))
  }

  public static flatMap<S, T>(val: List<S>, f: (s: S) => List<T>): List<T> {
    return val.foldr(List.empty, (t: () => List<T>, h) => f(h).concat(t))
  }

  public static prepend<T>(list: List<T>, value: T): List<T> {
    return new List(Lazy.lift(Option.some(value)), () => list)
  }

  public static append<T>(list: List<T>, value: T): List<T> {
    return list.concat(() => List.lift(value))
  }

  public static concat<T>(left: List<T>, right: () => List<T>): List<T> {
    return left.foldr(right, (t, h) => new List(Lazy.lift(Option.some(h)), t))
  }

  public static join<T>(val: List<List<T>>): List<T> {
    return List.flatMap(val, (v) => v)
  }

  public static head<T>(val: List<T>): Option<T> {
    return val.head.eval()
  }

  public static tail<T>(val: List<T>): List<T> {
    return val.tail()
  }

  public static takeWhile<T>(val: List<T>, predicate: (v: T) => boolean): List<T> {
    return val.head.eval().unwrap(
      (h) => (predicate(h) ? new List(val.head, () => val.tail().takeWhile(predicate)) : List.empty()),
      () => List.empty()
    )
  }

  public static dropWhile<T>(val: List<T>, predicate: (v: T) => boolean): List<T> {
    return val.head.eval().unwrap(
      (h) => (predicate(h) ? val.tail().dropWhile(predicate) : val),
      () => List.empty()
    )
  }

  public static forEach<T>(val: List<T>, f: (a: T) => void): void {
    val.map(f).consume()
  }

  public static take<T>(val: List<T>, amount = 1): List<T> {
    return new List(val.head, () => (amount > 1 ? val.tail().take(amount - 1) : List.empty()))
  }

  public static drop<T>(val: List<T>, amount = 1): List<T> {
    if (amount > 0) {
      return val.head.eval().unwrap(
        () => val.tail().drop(amount - 1),
        () => List.empty()
      )
    }
    return val
  }

  public static fold<S, T>(val: List<S>, initial: T, combine: (l: T, r: S) => T): T {
    let aggregate = initial
    let current = val
    while (true) {
      const head = current.head.eval()
      if (Option.isSome(head)) {
        aggregate = combine(aggregate, head.value)
        current = current.tail()
      } else {
        break
      }
    }
    return aggregate
  }

  public static foldr<S, T>(val: List<S>, initial: () => T, combine: (l: () => T, r: S) => T): T {
    return val.head.eval().unwrap(
      (h) => combine(() => val.tail().foldr(initial, combine), h),
      () => initial()
    )
  }

  public static seek<T>(val: List<T>, predicate: (v: T) => boolean): List<T> {
    let current = val
    while (true) {
      const head = current.head.eval()
      if (Option.isSome(head)) {
        if (predicate(head.value)) {
          return current
        }
        current = current.tail()
      } else {
        break
      }
    }
    return List.empty()
  }

  public static find<T>(val: List<T>, predicate: (v: T) => boolean): Option<T> {
    return val.seek(predicate).head.eval()
  }

  public static filter<T, U extends T>(val: List<T>, predicate: (v: T) => v is U): List<U> {
    const found = val.seek(predicate)
    return new List(found.head as Lazy<Option<U>>, () => found.tail().filterType(predicate))
  }

  public static some<T>(val: List<T>, predicate: (v: T) => boolean): boolean {
    return Option.isSome(List.find(val, predicate))
  }

  public static all<T>(val: List<T>, predicate: (v: T) => boolean): boolean {
    return !Option.isSome(List.find(val, (v) => !predicate(v)))
  }

  public static batch<T>(val: List<T>, length: number, step: number = length): List<T[]> {
    const head = val.take(length).toArray()
    if (head.length > 0) {
      return new List(Lazy.lift(Option.some(head)), () => val.drop(step).batch(length, step))
    }
    return List.empty()
  }

  public static toArray<T>(val: List<T>): T[] {
    return val.fold([], (l: T[], r) => {
      l.push(r)
      return l
    })
  }

  public static consume<T>(val: List<T>): void {
    let current = val
    while (Option.isSome(current.head.eval())) {
      current = current.tail()
    }
  }

  public static repeat<T>(value: T): List<T> {
    return new List(Lazy.lift(Option.some(value)), () => List.repeat(value))
  }

  public static empty<T>(): List<T> {
    return new List<T>(Lazy.lift(Option.none()), List.empty)
  }

  public static natural(start = 1): List<number> {
    return new List(Lazy.lift(Option.some(start)), () => List.natural(start + 1))
  }

  public static reverse<T>(list: List<T>): List<T> {
    return List.fold(list, List.empty(), (l, r) => new List(Lazy.lift(Option.of(r)), () => l))
  }

  public static size<T>(list: List<T>): number {
    return List.fold(list, 0, (l, _r) => l + 1)
  }

  public static isEmpty<T>(list: List<T>): boolean {
    return list.head.eval().isRight()
  }

  public static flattenOptionals<T>(list: List<Option<T>>, memoized = true): List<T> {
    return new List(new Lazy(() => Option.join(list.head.eval()), memoized), () => List.flattenOptionals(list.tail()))
  }
}
