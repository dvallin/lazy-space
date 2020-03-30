import { Try, success, failure } from './try'

export type Async<T> = Promise<T>

export function just<T>(val: Promise<T>): Async<T> {
    return val
}

export function map<S, T>(val: Async<S>, f: (a: S) => T): Async<T> {
    return val.then(f)
}

export function bind<S, T>(val: Async<S>, f: (a: S) => Async<T>): Async<T> {
    return val.then(f)
}

export function then<S, T, U>(left: (s: S) => Async<T>, right: (t: T) => Async<U>): (s: S) => Async<U> {
    return (s) => bind(left(s), right)
}

export function join<T>(val: Async<Async<T>>): Async<T> {
    return bind(val, (v) => v)
}

export async function runAsync<T>(val: Async<T>): Promise<Try<T>> {
    try {
        return success(await val)
    } catch (error) {
        if (error instanceof Error) {
            return failure(error)
        }
        throw error
    }
}
