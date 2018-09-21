import { Option, Some, None } from "./option"
import { Predicate } from "./predicate"

export interface Try<A, B = Error> {

    isSuccess(): boolean

    success(): Option<A>
    error(): Option<B>

    map<T>(f: (a: A) => T): Try<T, B>
    flatMap<T>(f: (a: A) => Try<T, B>): Try<T, B>

    recover<T>(f: (b: B) => T): Try<T | A, B>
    flatRecover<T>(f: (b: B) => Try<T, B>): Try<T | A, B>

    filter(f: Predicate<A>): Try<A, B | Error>
}

export class Success<A, B> implements Try<A, B> {

    public constructor(
        private readonly value: A
    ) { }

    public isSuccess(): boolean {
        return true
    }

    public success(): Option<A> {
        return new Some(this.value)
    }

    public error(): Option<B> {
        return new None()
    }

    public map<T>(f: (a: A) => T): Try<T, B> {
        return new Success<T, B>(f(this.value))
    }

    public flatMap<T>(f: (a: A) => Try<T, B>): Try<T, B> {
        return f(this.value)
    }

    public recover(): Try<A, B> {
        return this
    }

    public flatRecover(): Try<A, B> {
        return this
    }

    public filter(f: (a: A) => boolean): Try<A, B | Error> {
        if (f(this.value)) {
            return this
        }
        return new Failure(new Error("element not found"))
    }
}

export class Failure<A, B> implements Try<A, B> {

    public constructor(
        private readonly value: B
    ) { }

    public isSuccess(): boolean {
        return false
    }

    public success(): Option<A> {
        return new None()
    }

    public error(): Option<B> {
        return new Some(this.value)
    }

    public map<T>(): Failure<T, B> {
        return new Failure(this.value)
    }

    public flatMap<T>(): Failure<T, B> {
        return new Failure(this.value)
    }

    public recover<T>(f: (b: B) => T): Try<T, B> {
        return new Success(f(this.value))
    }

    public flatRecover<T>(f: (b: B) => Try<T, B>): Try<T, B> {
        return f(this.value)
    }

    public filter(): Failure<A, B> {
        return this
    }
}

export namespace Try {

    export function of<A>(throwingProvider: () => A): Try<A> {
        try {
            return new Success(throwingProvider())
        } catch (e) {
            return new Failure(e)
        }
    }
}
