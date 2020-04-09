import { Option } from './option'
import { Monad } from './monad'

export class List<T> implements Monad<T> {
    public constructor(public readonly head: Option<T>, public readonly tail: () => List<T>) {}

    public map<U>(f: (a: T) => U): List<U> {
        return List.map(this, f)
    }

    public flatMap<U>(f: (a: T) => List<U>): List<U> {
        return List.flatMap(this, f)
    }

    public pipe<U>(f: (a: T) => List<U>): List<U> {
        return List.pipe(() => this, f)(null)
    }

    public take(amount = 1): List<T> {
        return List.take(this, amount)
    }

    public drop(amount = 1): List<T> {
        return List.drop(this, amount)
    }

    public takeWhile(check: (v: T) => boolean): List<T> {
        return List.takeWhile(this, check)
    }

    public dropWhile(check: (v: T) => boolean): List<T> {
        return List.dropWhile(this, check)
    }

    public fold<S>(initial: S, combine: (l: S, r: T) => S): S {
        return List.fold(this, initial, combine)
    }

    public foldr<S>(initial: () => S, combine: (l: () => S, r: T) => S): S {
        return List.foldr(this, initial, combine)
    }

    public append(other: () => List<T>): List<T> {
        return List.append(this, other)
    }

    public find(check: (v: T) => boolean): Option<T> {
        return List.find(this, check)
    }

    public some(check: (v: T) => boolean): boolean {
        return List.some(this, check)
    }

    public all(check: (v: T) => boolean): boolean {
        return List.all(this, check)
    }

    public static just<T>(val: T[]): List<T> {
        return new List(Option.of(val[0]), () => List.just(val.splice(1)))
    }

    public static map<S, T>(val: List<S>, f: (a: S) => T): List<T> {
        return new List(val.head.map(f), () => val.tail().map(f))
    }

    public static flatMap<S, T>(val: List<S>, f: (s: S) => List<T>): List<T> {
        return val.foldr(List.empty, (t: () => List<T>, h) => f(h).append(t))
    }

    public static append<T>(left: List<T>, right: () => List<T>): List<T> {
        return left.foldr(right, (t, h) => new List(Option.some(h), t))
    }

    public static pipe<S, T, U>(left: (s: S) => List<T>, right: (t: T) => List<U>): (s: S) => List<U> {
        return (s) => List.flatMap(left(s), right)
    }

    public static join<T>(val: List<List<T>>): List<T> {
        return List.flatMap(val, (v) => v)
    }

    public static head<T>(val: List<T>): Option<T> {
        return val.head
    }

    public static tail<T>(val: List<T>): List<T> {
        return val.tail()
    }

    public static takeWhile<T>(val: List<T>, check: (v: T) => boolean): List<T> {
        return val.head.unwrap(
            (h) => new List(val.head, () => (check(h) ? List.empty() : val.tail().takeWhile(check))),
            () => List.empty()
        )
    }

    public static dropWhile<T>(val: List<T>, check: (v: T) => boolean): List<T> {
        return val.head.unwrap(
            (h) => (check(h) ? val.tail().dropWhile(check) : val),
            () => List.empty()
        )
    }

    public static take<T>(val: List<T>, amount = 1): List<T> {
        return new List(val.head, () => (amount > 1 ? val.tail().take(amount - 1) : List.empty()))
    }

    public static drop<T>(val: List<T>, amount = 1): List<T> {
        if (amount > 0) {
            return val.head.unwrap(
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
            if (Option.isSome(current.head)) {
                const head = current.head.recover(() => undefined) as S
                aggregate = combine(aggregate, head)
                current = current.tail()
            } else {
                break
            }
        }
        return aggregate
    }

    public static foldr<S, T>(val: List<S>, initial: () => T, combine: (l: () => T, r: S) => T): T {
        return val.head.unwrap(
            (h) => combine(() => val.tail().foldr(initial, combine), h),
            () => initial()
        )
    }

    public static find<T>(val: List<T>, check: (v: T) => boolean): Option<T> {
        let current = val
        while (true) {
            if (Option.isSome(current.head)) {
                const head = current.head.recover(() => undefined) as T
                if (check(head)) {
                    return current.head
                }
                current = current.tail()
            } else {
                break
            }
        }
        return Option.none()
    }

    public static some<T>(val: List<T>, check: (v: T) => boolean): boolean {
        return Option.isSome(List.find(val, check))
    }

    public static all<T>(val: List<T>, check: (v: T) => boolean): boolean {
        return !Option.isSome(List.find(val, (v) => !check(v)))
    }

    public static toArray<T>(val: List<T>): T[] {
        return val.fold([], (l: T[], r) => {
            l.push(r)
            return l
        })
    }

    public static repeat<T>(value: T): List<T> {
        return new List(Option.some(value), () => List.repeat(value))
    }

    public static empty<T>(): List<T> {
        return List.just([])
    }

    public static natural(start = 1): List<number> {
        return new List(Option.some(start), () => List.natural(start + 1))
    }
}
