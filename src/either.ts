export interface Left<T> {
    type: 'left'
    value: T
}
export interface Right<T> {
    type: 'right'
    value: T
}
export type Either<S, T> = Left<S> | Right<T>

export function left<S, T>(value: S): Either<S, T> {
    return { type: 'left', value }
}

export function right<S, T>(value: T): Either<S, T> {
    return { type: 'right', value }
}

export function isLeft<S, T>(val: Either<S, T>): val is Left<S> {
    return val.type === 'left'
}

export function isRight<S, T>(val: Either<S, T>): val is Right<T> {
    return val.type === 'right'
}

export function map<S, T, U>(val: Either<S, T>, f: (a: S) => U): Either<U, T> {
    return isLeft(val) ? left(f(val.value)) : val
}

export function bind<S, T, U>(val: Either<S, T>, f: (s: S) => Either<U, T>): Either<U, T> {
    return isLeft(val) ? f(val.value) : val
}

export function then<S, T, U, V>(left: (s: S) => Either<U, T>, right: (u: U) => Either<V, T>): (s: S) => Either<V, T> {
    return (s) => bind(left(s), right)
}

export function join<S, T>(val: Either<Either<S, T>, T>): Either<S, T> {
    return isLeft(val) ? val.value : val
}

export function recover<S, T, U>(val: Either<S, T>, f: (error: T) => U): S | U {
    return isLeft(val) ? val.value : f(val.value)
}

export function or<S, T, U>(left: Either<S, T>, right: Either<U, T>): Either<S | U, T> {
    return isLeft(left) ? left : right
}

export function and<S, T, U>(left: Either<S, T>, right: Either<S, T>): Either<S | U, T> {
    return isRight(left) ? left : right
}
