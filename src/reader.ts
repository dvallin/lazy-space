import { Monad } from './monad'

export class Reader<C, T> implements Monad<T> {
    public constructor(public readonly read: (context: C) => T) {}

    public map<U>(f: (t: T) => U): Reader<C, U> {
        return Reader.map(this, f)
    }

    public flatMap<C2, U>(f: (t: T) => Reader<C2, U>): Reader<C & C2, U> {
        return Reader.flatMap(this, f)
    }

    public pipe<C2, U>(f: (t: T) => Reader<C2, U>): Reader<C & C2, U> {
        return Reader.pipe(() => this, f)(null)
    }

    public lift<U>(read: U): Reader<C, U> {
        // REALLY?
        return Reader.just(read)
    }

    public join<C1, C2, U>(val: Reader<C1, Reader<C2, U>>): Reader<C1 & C2, U> {
        return Reader.join(val)
    }

    public with(f: (c: C) => void): Reader<C, T> {
        return Reader.lift((c) => {
            const r = this.read(c)
            f(c)
            return r
        })
    }

    public mapContext<C2>(f: (c: C2) => C): Reader<C2, T> {
        return Reader.mapContext(this, f)
    }

    public static lift<C, T>(read: (context: C) => T): Reader<C, T> {
        return new Reader(read)
    }

    public static just<C, T>(value: T): Reader<C, T> {
        return new Reader(() => value)
    }

    public static map<C, T, U>(val: Reader<C, T>, f: (t: T) => U): Reader<C, U> {
        return new Reader((c) => f(val.read(c)))
    }

    public static flatMap<C1, C2, S, T>(val: Reader<C1, S>, f: (s: S) => Reader<C2, T>): Reader<C1 & C2, T> {
        return new Reader((c) => f(val.read(c)).read(c))
    }

    public static pipe<C1, C2, S, T, U>(left: (s: S) => Reader<C1, T>, right: (t: T) => Reader<C2, U>): (s: S) => Reader<C1 & C2, U> {
        return (s) => Reader.flatMap(left(s), right)
    }

    public static mapContext<C1, C2, S>(reader: Reader<C1, S>, f: (c: C2) => C1): Reader<C2, S> {
        return new Reader((c) => reader.read(f(c)))
    }

    public static join<C1, C2, T>(val: Reader<C1, Reader<C2, T>>): Reader<C1 & C2, T> {
        return new Reader((c) => val.read(c).read(c))
    }

    public static empty<C>(): Reader<C, void> {
        return new Reader(() => {
            //
        })
    }
}
