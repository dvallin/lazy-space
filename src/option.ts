export interface Option<A> {

    isPresent(): boolean

    get<B>(defaultValue: B): A | B

    map<B>(f: (a: A) => B): Option<B>
    flatMap<B>(f: (a: A) => Option<B>): Option<B>

    or<B>(other: Option<B>): Option<A | B>
    and<B>(other: Option<B>): Option<A | B>

    filter(f: (a: A) => boolean): Option<A>
}

export class Some<A> implements Option<A> {

    constructor(
        private readonly value: A
    ) { }

    public isPresent(): boolean {
        return true
    }

    public map<B>(f: (a: A) => B): Option<B> {
        const value = f(this.value)
        if (value === undefined) {
            return new None()
        } else {
            return new Some(value)
        }
    }

    public flatMap<B>(f: (a: A) => Option<B>): Option<B> {
        return f(this.value)
    }

    public get(): A {
        return this.value
    }

    public or(): Some<A> {
        return this
    }

    public and<B>(other: Option<B>): Option<B> {
        return other
    }

    public filter(f: (a: A) => boolean): Option<A> {
        if (f(this.value)) {
            return this
        } else {
            return new None()
        }
    }
}

export class None<A> implements Option<A> {

    public isPresent(): boolean {
        return false
    }

    public map<B>(): None<B> {
        return new None()
    }

    public flatMap<B>(): None<B> {
        return new None()
    }

    public get<B>(defaultValue: B): B {
        return defaultValue
    }

    public or<B>(other: Option<B>): Option<B> {
        return other
    }

    public and(): None<A> {
        return this
    }

    public filter(): None<A> {
        return this
    }
}

export namespace Option {

    export function of<A>(value: A | undefined | null): Option<A> {
        return (value === undefined || value === null) ? new None() : new Some(value)
    }
}
