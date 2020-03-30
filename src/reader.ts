export type Reader<C, T> = (Reader: C) => T

export function just<C, T>(f: Reader<C, T>): Reader<C, T> {
    return f
}

export function map<C, T, U>(val: Reader<C, T>, f: (t: T) => U): Reader<C, U> {
    return (c) => f(val(c))
}

export function bind<C, S, T>(val: Reader<C, S>, f: (s: S) => Reader<C, T>): Reader<C, T> {
    return (c) => f(val(c))(c)
}

export function then<C, S, T, U>(left: (s: S) => Reader<C, T>, right: (t: T) => Reader<C, U>): (s: S) => Reader<C, U> {
    return (s) => bind(left(s), right)
}

export function join<C, T>(val: Reader<C, Reader<C, T>>): Reader<C, T> {
    return (c) => val(c)(c)
}
