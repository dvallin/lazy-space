export interface Option<A> {

    map<B>(f: (a: A) => B): Option<B>
    flatMap<B>(f: (a: A) => Option<B>): Option<B>
    get<B>(defaultValue: B): A | B
    or<B>(other: Option<B>): Option<A | B>
    filter(f: (a: A) => boolean): Option<A>
}

export class Some<A> implements Option<A> {

    constructor(
        private readonly value: A
    ) { }

    map<B>(f: (a: A) => B): Option<B> {
        const value = f(this.value)
        if (value === undefined) {
            return new None()
        } else {
            return new Some(value)
        }
    }

    flatMap<B>(f: (a: A) => Option<B>): Option<B> {
        return f(this.value)
    }

    get(): A {
        return this.value
    }

    or(): Some<A> {
        return this
    }

    filter(f: (a: A) => boolean): Option<A> {
        if (f(this.value)) {
            return this
        } else {
            return new None()
        }
    }
}

export class None<A> implements Option<A> {

    map<B>(): None<B> {
        return new None()
    }

    flatMap<B>(): None<B> {
        return new None()
    }

    get<B>(defaultValue: B): B {
        return defaultValue
    }

    or<B>(other: Option<B>): Option<B> {
        return other
    }

    filter(): None<A> {
        return this
    }
}

export function of<A>(value: A | undefined): Option<A> {
    return value === undefined ? new None() : new Some(value)
}
