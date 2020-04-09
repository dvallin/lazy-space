import { Monad } from './monad'

type Left<T> = { left: T; type: 'left' }
type Right<T> = { right: T; type: 'right' }

export class Either<S, T> implements Monad<S> {
    public constructor(public readonly value: Left<S> | Right<T>) {}

    public map<U>(f: (a: S) => U): Either<U, T> {
        return map(this, f)
    }

    public flatMap<U>(f: (s: S) => Either<U, T>): Either<U, T> {
        return flatMap(this, f)
    }

    public pipe<U>(f: (s: S) => Either<U, T>): Either<U, T> {
        return pipe(() => this, f)(null)
    }

    public unwrap<U, V>(f: (s: S) => U, g: (t: T) => V): U | V {
        return unwrap(this, f, g)
    }

    public recover<U>(f: (error: T) => U): S | U {
        return recover(this, f)
    }

    public or(other: Either<S, T>): Either<S, T> {
        return or(this, other)
    }

    public and(other: Either<S, T>): Either<S, T> {
        return and(this, other)
    }

    public isLeft(): boolean {
        return this.value.type === 'left'
    }
}

export function left<S, T>(value: S): Either<S, T> {
    return new Either({ left: value, type: 'left' })
}

export function right<S, T>(value: T): Either<S, T> {
    return new Either({ right: value, type: 'right' })
}

export function unwrap<S, T, U, V>(val: Either<S, T>, f: (s: S) => U, g: (t: T) => V): U | V {
    return val.value.type === 'left' ? f(val.value.left) : g(val.value.right)
}

export function map<S, T, U>(val: Either<S, T>, f: (a: S) => U): Either<U, T> {
    return unwrap(
        val,
        (u) => left(f(u)),
        (v) => right(v)
    )
}

export function flatMap<S, T, U>(val: Either<S, T>, f: (s: S) => Either<U, T>): Either<U, T> {
    return unwrap(
        val,
        (u) => f(u),
        (v) => right(v)
    )
}

export function pipe<S, T, U, V>(left: (s: S) => Either<U, T>, right: (u: U) => Either<V, T>): (s: S) => Either<V, T> {
    return (s) => flatMap(left(s), right)
}

export function join<S, T>(val: Either<Either<S, T>, T>): Either<S, T> {
    return unwrap(
        val,
        (u) => u,
        (v) => right(v)
    )
}

export function recover<S, T, U>(val: Either<S, T>, f: (error: T) => U): S | U {
    return unwrap(
        val,
        (u) => u,
        (v) => f(v)
    )
}

export function or<S, T, U>(left: Either<S, T>, right: Either<U, T>): Either<S | U, T> {
    return left.value.type === 'left' ? left : right
}

export function and<S, T, U>(left: Either<S, T>, right: Either<S, T>): Either<S | U, T> {
    return left.value.type === 'right' ? left : right
}
