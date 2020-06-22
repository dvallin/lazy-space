import { Monad } from './monad'

export type lazy<T> = () => T

export class Lazy<T> implements Monad<T> {
    public constructor(private readonly value: lazy<T>) {}

    public map<U>(f: (a: T) => U): Lazy<U> {
        return Lazy.map(this, f)
    }
    public flatMap<U>(f: (a: T) => Lazy<U>): Lazy<U> {
        return Lazy.flatMap(this, f)
    }
    public pipe<U>(f: (a: T) => Lazy<U>): Lazy<U> {
        return Lazy.pipe(() => this, f)(null)
    }
    public lift<U>(v: U): Lazy<U> {
        return Lazy.lift(v)
    }
    public join<U>(v: Lazy<Lazy<U>>): Lazy<U> {
        return Lazy.join(v)
    }

    public eval(): T {
        return this.value()
    }

    public static map<S, U>(value: Lazy<S>, f: (a: S) => U): Lazy<U> {
        return new Lazy(() => f(value.eval()))
    }
    public static flatMap<S, U>(value: Lazy<S>, f: (a: S) => Lazy<U>): Lazy<U> {
        return f(value.eval())
    }
    public static pipe<S, T, U>(left: (s: S) => Lazy<T>, right: (t: T) => Lazy<U>): (s: S) => Lazy<U> {
        return (s) => Lazy.flatMap(left(s), right)
    }
    public static lift<U>(v: U): Lazy<U> {
        return new Lazy(() => v)
    }
    public static join<U>(v: Lazy<Lazy<U>>): Lazy<U> {
        return v.eval()
    }
}
