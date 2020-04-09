import { Monad } from './monad'

export class Reader<C, T> implements Monad<T> {
    public constructor(public readonly read: (context: C) => T) {}

    public map<U>(f: (t: T) => U): Reader<C, U> {
        return map(this, f)
    }

    public flatMap<U>(f: (t: T) => Reader<C, U>): Reader<C, U> {
        return flatMap(this, f)
    }

    public pipe<U>(f: (t: T) => Reader<C, U>): Reader<C, U> {
        return pipe(() => this, f)(null)
    }

    public then(f: (c: C) => void): Reader<C, T> {
        return lift((c) => {
            const r = this.read(c)
            f(c)
            return r
        })
    }

    mapContext<C2>(f: (c: C2) => C): Reader<C2, T> {
        return new Reader((c) => this.read(f(c)))
    }
}

export function lift<C, T>(read: (context: C) => T): Reader<C, T> {
    return new Reader(read)
}

export function just<C, T>(value: T): Reader<C, T> {
    return new Reader(() => value)
}

export function map<C, T, U>(val: Reader<C, T>, f: (t: T) => U): Reader<C, U> {
    return new Reader((c) => f(val.read(c)))
}

export function flatMap<C, S, T>(val: Reader<C, S>, f: (s: S) => Reader<C, T>): Reader<C, T> {
    return new Reader((c) => f(val.read(c)).read(c))
}

export function pipe<C, S, T, U>(left: (s: S) => Reader<C, T>, right: (t: T) => Reader<C, U>): (s: S) => Reader<C, U> {
    return (s) => flatMap(left(s), right)
}

export function join<C, T>(val: Reader<C, Reader<C, T>>): Reader<C, T> {
    return new Reader((c) => val.read(c).read(c))
}
