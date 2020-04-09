import { Monad } from './monad'

type Left<T> = { left: T; type: 'left' }
type Right<T> = { right: T; type: 'right' }

export class Either<S, T> implements Monad<S> {
    public constructor(public readonly value: Left<S> | Right<T>) {}

    public map<U>(f: (a: S) => U): Either<U, T> {
        return Either.map(this, f)
    }

    public flatMap<U>(f: (s: S) => Either<U, T>): Either<U, T> {
        return Either.flatMap(this, f)
    }

    public pipe<U>(f: (s: S) => Either<U, T>): Either<U, T> {
        return Either.pipe(() => this, f)(null)
    }

    public unwrap<U, V>(f: (s: S) => U, g: (t: T) => V): U | V {
        return Either.unwrap(this, f, g)
    }

    public recover<U>(f: (error: T) => U): S | U {
        return Either.recover(this, f)
    }

    public or(other: Either<S, T>): Either<S, T> {
        return Either.or(this, other)
    }

    public and(other: Either<S, T>): Either<S, T> {
        return Either.and(this, other)
    }

    public isLeft(): boolean {
        return this.value.type === 'left'
    }
    public static left<S, T>(value: S): Either<S, T> {
        return new Either({ left: value, type: 'left' })
    }

    public static right<S, T>(value: T): Either<S, T> {
        return new Either({ right: value, type: 'right' })
    }

    public static unwrap<S, T, U, V>(val: Either<S, T>, f: (s: S) => U, g: (t: T) => V): U | V {
        return val.value.type === 'left' ? f(val.value.left) : g(val.value.right)
    }

    public static map<S, T, U>(val: Either<S, T>, f: (a: S) => U): Either<U, T> {
        return Either.unwrap(
            val,
            (u) => Either.left(f(u)),
            (v) => Either.right(v)
        )
    }

    public static flatMap<S, T, U>(val: Either<S, T>, f: (s: S) => Either<U, T>): Either<U, T> {
        return Either.unwrap(
            val,
            (u) => f(u),
            (v) => Either.right(v)
        )
    }

    public static pipe<S, T, U, V>(left: (s: S) => Either<U, T>, right: (u: U) => Either<V, T>): (s: S) => Either<V, T> {
        return (s) => Either.flatMap(left(s), right)
    }

    public static join<S, T>(val: Either<Either<S, T>, T>): Either<S, T> {
        return Either.unwrap(
            val,
            (u) => u,
            (v) => Either.right(v)
        )
    }

    public static recover<S, T, U>(val: Either<S, T>, f: (error: T) => U): S | U {
        return Either.unwrap(
            val,
            (u) => u,
            (v) => f(v)
        )
    }

    public static or<S, T, U>(left: Either<S, T>, right: Either<U, T>): Either<S | U, T> {
        return left.value.type === 'left' ? left : right
    }

    public static and<S, T, U>(left: Either<S, T>, right: Either<S, T>): Either<S | U, T> {
        return left.value.type === 'right' ? left : right
    }
}
