import { Option, invalid, isValid, just as justOption } from './option'

export type List<T> = Iterable<T>

export function just<T>(val: T[]): List<T> {
    return val
}

export function* map<S, T>(val: List<S>, f: (a: S) => T): List<T> {
    for (const v of val) {
        yield f(v)
    }
}

export function* bind<S, T>(val: List<S>, f: (s: S) => List<T>): List<T> {
    for (const v of val) {
        for (const inner of f(v)) {
            yield inner
        }
    }
}

export function then<S, T, U>(left: (s: S) => List<T>, right: (t: T) => List<U>): (s: S) => List<U> {
    return (s) => bind(left(s), right)
}

export function join<T>(val: List<List<T>>): List<T> {
    return bind(val, (v) => v)
}

export function head<T>(val: List<T>): Option<T> {
    for (const v of val) {
        return justOption(v)
    }
    return invalid()
}

export function tail<T>(val: List<T>): List<T> {
    return drop(val, 1)
}

export function* takeWhile<T>(val: List<T>, check: (v: T, index: number) => boolean): List<T> {
    let index = 0
    for (const v of val) {
        if (!check(v, index)) {
            break
        }
        index++
        yield v
    }
}

export function* dropWhile<T>(val: List<T>, check: (v: T, index: number) => boolean): List<T> {
    let index = 0
    for (const v of val) {
        if (check(v, index)) {
            index++
            continue
        }
        yield v
    }
}

export function take<T>(val: List<T>, amount = 1): List<T> {
    return takeWhile(val, (_v, index) => index < amount)
}

export function drop<T>(val: List<T>, amount = 1): List<T> {
    return dropWhile(val, (_v, index) => index < amount)
}

export function fold<S, T>(val: List<S>, initial: T, combine: (l: S, r: T) => T): T {
    let result = initial
    for (const v of val) {
        result = combine(v, result)
    }
    return result
}

export function find<T>(val: List<T>, check: (v: T) => boolean): Option<T> {
    for (const v of val) {
        if (check(v)) {
            return justOption(v)
        }
    }
    return invalid()
}

export function some<T>(val: List<T>, check: (v: T) => boolean): boolean {
    return isValid(find(val, check))
}

export function all<T>(val: List<T>, check: (v: T) => boolean): boolean {
    return !isValid(find(val, (v) => !check(v)))
}

export function toArray<T>(val: List<T>): T[] {
    const array: T[] = []
    for (const v of val) {
        array.push(v)
    }
    return array
}

export function* repeat<T>(value: T): List<T> {
    while (true) {
        yield value
    }
}

export function empty(): List<number> {
    return just([])
}

export function* natural(start = 1): List<number> {
    let i = start
    while (true) {
        yield i
        i++
    }
}
