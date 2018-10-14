import { Stream } from "./lazy"
import { Option, Some, None } from "./option"

export interface Eval<A> {

    map<T>(f: (v: A) => T): Eval<T>
    flatMap<T>(f: (v: A) => Eval<T>): Eval<T>

    toPromise(): Promise<A>
    run(): Promise<A>
}

export class PromiseEval<A> implements Eval<A>  {

    public constructor(
        protected readonly p: Promise<A>
    ) { }

    public map<T>(f: (v: A) => T): PromiseEval<T> {
        return new PromiseEval(this.p.then(v => f(v)))
    }

    public flatMap<T>(f: (v: A) => Eval<T>): Eval<T> {
        return new PromiseEval(this.p.then(v => f(v).toPromise()))
    }

    public toPromise(): Promise<A> {
        return this.p
    }

    public async run(): Promise<A> {
        return await this.p
    }
}

export class TryEval<A> implements Eval<A>  {

    public constructor(
        protected readonly f: () => A
    ) { }

    public map<T>(f: (v: A) => T): TryEval<T> {
        return new TryEval(() => f(this.f()))
    }

    public flatMap<T>(f: (v: A) => Eval<T>): Eval<T> {
        return f(this.f())
    }

    public toPromise(): Promise<A> {
        return Promise.resolve(this.f())
    }

    public async run(): Promise<A> {
        return this.f()
    }
}

export function flattenEvals<T>(effects: Eval<T>[]): Option<Eval<T>> {
    if (effects.length === 0) {
        return new None()
    }
    return new Some(effects.reduce((e1: Eval<T>, e2: Eval<T>) => {
        return e1.flatMap(() => e2)
    }))
}

export function flattenStream<T>(effects: Stream<Eval<T>>): Option<Eval<T>> {
    return effects.flatten((e1: Eval<T>, e2: Eval<T>) => {
        return e1.flatMap(() => e2)
    })
}

export namespace Eval {

    export function noop(): Eval<void> {
        return new TryEval(() => { return })
    }
}
