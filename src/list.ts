import { Option, none, isSome, of, some as optionSome } from './option'
import { Monad } from './monad'

export class List<T> implements Monad<T> {
    public constructor(public readonly head: Option<T>, public readonly tail: () => List<T>) {}

    public map<U>(f: (a: T) => U): List<U> {
        return map(this, f)
    }

    public flatMap<U>(f: (a: T) => List<U>): List<U> {
        return flatMap(this, f)
    }

    public pipe<U>(f: (a: T) => List<U>): List<U> {
        return pipe(() => this, f)(null)
    }

    public take(amount = 1): List<T> {
        return take(this, amount)
    }

    public drop(amount = 1): List<T> {
        return drop(this, amount)
    }

    public takeWhile(check: (v: T) => boolean): List<T> {
        return takeWhile(this, check)
    }

    public dropWhile(check: (v: T) => boolean): List<T> {
        return dropWhile(this, check)
    }

    public fold<S>(initial: S, combine: (l: S, r: T) => S): S {
        return fold(this, initial, combine)
    }

    public foldr<S>(initial: () => S, combine: (l: () => S, r: T) => S): S {
        return foldr(this, initial, combine)
    }

    public append(other: () => List<T>): List<T> {
        return append(this, other)
    }

    public find(check: (v: T) => boolean): Option<T> {
        return find(this, check)
    }

    public some(check: (v: T) => boolean): boolean {
        return some(this, check)
    }

    public all(check: (v: T) => boolean): boolean {
        return all(this, check)
    }
}

export function just<T>(val: T[]): List<T> {
    return new List(of(val[0]), () => just(val.splice(1)))
}

export function map<S, T>(val: List<S>, f: (a: S) => T): List<T> {
    return new List(val.head.map(f), () => val.tail().map(f))
}

export function flatMap<S, T>(val: List<S>, f: (s: S) => List<T>): List<T> {
    return val.foldr(empty, (t: () => List<T>, h) => f(h).append(t))
}

export function append<T>(left: List<T>, right: () => List<T>): List<T> {
    return left.foldr(right, (t, h) => new List(optionSome(h), t))
}

export function pipe<S, T, U>(left: (s: S) => List<T>, right: (t: T) => List<U>): (s: S) => List<U> {
    return (s) => flatMap(left(s), right)
}

export function join<T>(val: List<List<T>>): List<T> {
    return flatMap(val, (v) => v)
}

export function head<T>(val: List<T>): Option<T> {
    return val.head
}

export function tail<T>(val: List<T>): List<T> {
    return val.tail()
}

export function takeWhile<T>(val: List<T>, check: (v: T) => boolean): List<T> {
    return val.head.unwrap(
        (h) => new List(val.head, () => (check(h) ? empty() : val.tail().takeWhile(check))),
        () => empty()
    )
}

export function dropWhile<T>(val: List<T>, check: (v: T) => boolean): List<T> {
    return val.head.unwrap(
        (h) => (check(h) ? val.tail().dropWhile(check) : val),
        () => empty()
    )
}

export function take<T>(val: List<T>, amount = 1): List<T> {
    return new List(val.head, () => (amount > 1 ? val.tail().take(amount - 1) : empty()))
}

export function drop<T>(val: List<T>, amount = 1): List<T> {
    if (amount > 0) {
        return val.head.unwrap(
            () => val.tail().drop(amount - 1),
            () => empty()
        )
    }
    return val
}

export function fold<S, T>(val: List<S>, initial: T, combine: (l: T, r: S) => T): T {
    let aggregate = initial
    let current = val
    while (true) {
        if (isSome(current.head)) {
            const head = current.head.recover(() => undefined) as S
            aggregate = combine(aggregate, head)
            current = current.tail()
        } else {
            break
        }
    }
    return aggregate
}

export function foldr<S, T>(val: List<S>, initial: () => T, combine: (l: () => T, r: S) => T): T {
    return val.head.unwrap(
        (h) => combine(() => val.tail().foldr(initial, combine), h),
        () => initial()
    )
}

export function find<T>(val: List<T>, check: (v: T) => boolean): Option<T> {
    let current = val
    while (true) {
        if (isSome(current.head)) {
            const head = current.head.recover(() => undefined) as T
            if (check(head)) {
                return current.head
            }
            current = current.tail()
        } else {
            break
        }
    }
    return none()
}

export function some<T>(val: List<T>, check: (v: T) => boolean): boolean {
    return isSome(find(val, check))
}

export function all<T>(val: List<T>, check: (v: T) => boolean): boolean {
    return !isSome(find(val, (v) => !check(v)))
}

export function toArray<T>(val: List<T>): T[] {
    return val.fold([], (l: T[], r) => {
        l.push(r)
        return l
    })
}

export function repeat<T>(value: T): List<T> {
    return new List(optionSome(value), () => repeat(value))
}

export function empty<T>(): List<T> {
    return just([])
}

export function natural(start = 1): List<number> {
    return new List(optionSome(start), () => natural(start + 1))
}
