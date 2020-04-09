import { Try, success, failure } from './try'
import { Monad } from './monad'

export class Async<T> implements Monad<T> {
    public constructor(public readonly promise: Promise<T>) {}

    public map<U>(f: (a: T) => U): Async<U> {
        return map(this, f)
    }

    public flatMap<U>(f: (a: T) => Async<U>): Async<U> {
        return flatMap(this, f)
    }

    public pipe<U>(f: (a: T) => Async<U>): Async<U> {
        return pipe(() => this, f)(null)
    }

    public run(): Promise<Try<T>> {
        return run(this)
    }
}

export function just<T>(value: T): Async<T> {
    return new Async(Promise.resolve(value))
}

export function lift<T>(value: Promise<T>): Async<T> {
    return new Async(value)
}

export function map<S, T>(val: Async<S>, f: (a: S) => T): Async<T> {
    return new Async(val.promise.then(f))
}

export function flatMap<S, T>(val: Async<S>, f: (a: S) => Async<T>): Async<T> {
    return join(new Async(val.promise.then(f)))
}

export function pipe<S, T, U>(left: (s: S) => Async<T>, right: (t: T) => Async<U>): (s: S) => Async<U> {
    return (s) => flatMap(left(s), right)
}

export function join<T>(val: Async<Async<T>>): Async<T> {
    return new Async(val.promise.then((i) => i.promise))
}

export function race<T>(values: Async<T>[]): Async<T> {
    return new Async(Promise.race(values.map((v) => v.promise)))
}

export function all<T>(values: Async<T>[]): Async<T[]> {
    return new Async(Promise.all(values.map((v) => v.promise)))
}

export async function run<T>(val: Async<T>): Promise<Try<T>> {
    try {
        return success(await val.promise)
    } catch (error) {
        if (error instanceof Error) {
            return failure(error)
        }
        throw error
    }
}
