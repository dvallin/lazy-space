import { Try } from './try'
import { Monad } from './monad'

export class Async<T> implements Monad<T> {
    public constructor(public readonly promise: Promise<T>) {}

    public map<U>(f: (a: T) => U): Async<U> {
        return Async.map(this, f)
    }

    public flatMap<U>(f: (a: T) => Async<U>): Async<U> {
        return Async.flatMap(this, f)
    }

    public pipe<U>(f: (a: T) => Async<U>): Async<U> {
        return Async.pipe(() => this, f)(null)
    }

    public run(): Promise<Try<T>> {
        return Async.run(this)
    }

    public static just<T>(value: T): Async<T> {
        return new Async(Promise.resolve(value))
    }

    public static lift<T>(value: Promise<T>): Async<T> {
        return new Async(value)
    }

    public static map<S, T>(val: Async<S>, f: (a: S) => T): Async<T> {
        return new Async(val.promise.then(f))
    }

    public static flatMap<S, T>(val: Async<S>, f: (a: S) => Async<T>): Async<T> {
        return Async.join(new Async(val.promise.then(f)))
    }

    public static pipe<S, T, U>(left: (s: S) => Async<T>, right: (t: T) => Async<U>): (s: S) => Async<U> {
        return (s) => Async.flatMap(left(s), right)
    }

    public static join<T>(val: Async<Async<T>>): Async<T> {
        return new Async(val.promise.then((i) => i.promise))
    }
    public static race<T>(values: Async<T>[]): Async<T> {
        return new Async(Promise.race(values.map((v) => v.promise)))
    }

    public static all<T>(values: Async<T>[]): Async<T[]> {
        return new Async(Promise.all(values.map((v) => v.promise)))
    }

    public static async run<T>(val: Async<T>): Promise<Try<T>> {
        try {
            return Try.success(await val.promise)
        } catch (error) {
            if (error instanceof Error) {
                return Try.failure(error)
            }
            throw error
        }
    }
}
