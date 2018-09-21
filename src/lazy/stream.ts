import { Option, Some, None } from "../option"
import { Lazy } from "../lazy"
import { Predicate } from "../predicate"

export type Accumulator<A, B> = (accumulate: B, result: A) => B
export type LazyAccumulator<A, B> = (result: A, accumulate: () => B) => B

export interface Stream<A> {

    isEmpty(): boolean

    head(): Option<A>
    tail(): Stream<A>

    take(n: number): Stream<A>
    drop(n: number): Stream<A>
    takeWhile(f: Predicate<A>): Stream<A>
    dropWhile(f: Predicate<A>): Stream<A>

    fold<B>(initial: B, f: Accumulator<A, B>): B
    foldRight<B>(initial: () => B, combine: LazyAccumulator<A, B>): B

    map<B>(f: (a: A) => B): Stream<B>
    filter(f: (a: A) => boolean): Stream<A>
    flatMap<B>(f: (a: A) => Stream<B>): Stream<B>
    append(other: () => Stream<A>): Stream<A>
}

export class Empty<A> implements Stream<A> {

    public isEmpty(): boolean {
        return true
    }

    public head(): Option<A> {
        return new None()
    }

    public tail(): Stream<A> {
        return this
    }

    public take(): Empty<A> {
        return this
    }

    public drop(): Empty<A> {
        return this
    }

    public takeWhile(): Empty<A> {
        return this
    }

    public dropWhile(): Empty<A> {
        return this
    }

    public fold<B>(initial: B): B {
        return initial
    }

    public foldRight<B>(initial: () => B): B {
        return initial()
    }

    public map<B>(): Empty<B> {
        return new Empty()
    }

    public filter(): Empty<A> {
        return new Empty()
    }

    public flatMap<B>(): Empty<B> {
        return new Empty()
    }

    public append<B>(other: () => Stream<B>): Stream<B> {
        return other()
    }
}

export class Cons<A> implements Stream<A> {

    constructor(
        readonly headFunction: () => A,
        readonly tailFunction: () => Stream<A>
    ) { }

    public isEmpty(): boolean {
        return false
    }

    public head(): Option<A> {
        return new Some(this.headFunction())
    }

    public tail(): Stream<A> {
        return this.tailFunction()
    }

    public take(n: number): Stream<A> {
        if (n > 0) {
            return new Cons(this.headFunction, () => this.tailFunction().take(n - 1))
        }
        return new Empty()
    }

    public drop(n: number): Stream<A> {
        if (n > 0) {
            return this.tailFunction().drop(n - 1)
        }
        return this
    }

    public takeWhile(f: Predicate<A>): Stream<A> {
        if (f(this.headFunction())) {
            return new Cons(this.headFunction, () => this.tailFunction().takeWhile(f))
        }
        return new Empty()
    }

    public dropWhile(f: Predicate<A>): Stream<A> {
        if (f(this.headFunction())) {
            return this.tailFunction().dropWhile(f)
        }
        return this
    }

    public fold<B>(initial: B, combine: Accumulator<A, B>): B {
        const accumulate = combine(initial, this.headFunction())
        return this.tailFunction().fold(accumulate, combine)
    }

    public foldRight<B>(initial: () => B, combine: LazyAccumulator<A, B>): B {
        return combine(this.headFunction(), () => this.tailFunction().foldRight(initial, combine))
    }

    public map<B>(f: (a: A) => B): Stream<B> {
        return new Cons(() => f(this.headFunction()), () => this.tailFunction().map(f))
    }

    public filter(f: (a: A) => boolean): Stream<A> {
        if (f(this.headFunction())) {
            return new Cons(this.headFunction, () => this.tailFunction().filter(f))
        }
        return this.tailFunction().filter(f)
    }

    public flatMap<B>(f: (a: A) => Stream<B>): Stream<B> {
        return this.foldRight(() => new Empty() as Stream<B>, (head, tail) => f(head).append(tail))
    }

    public append(other: () => Stream<A>): Stream<A> {
        return this.foldRight(other, (head, tail) => new Cons(() => head, tail))
    }
}

export namespace Stream {

    export function cachedStream<A>(head: () => A, tail: () => Stream<A>): Stream<A> {
        return new Cons(Lazy.lazy(head), Lazy.lazy(tail))
    }

    export function directStream<A>(head: () => A, tail: () => Stream<A>): Stream<A> {
        return new Cons(head, tail)
    }

    export function of<A>(
        values: (() => A)[],
        streamConstructor: (head: () => A, tail: () => Stream<A>) => Stream<A> = cachedStream
    ): Stream<A> {
        if (values.length === 0) {
            return new Empty()
        }
        return streamConstructor(values[0], () => of(values.slice(1)))
    }

    export function just<A>(values: A[]): Stream<A> {
        return of(values.map(a => () => a), directStream)
    }

    export function constant(c: number = 1): Stream<number> {
        return unfold(c, (state) => new Some({ value: state, state }))
    }

    export function natural(start: number = 1): Stream<number> {
        return unfold(start, (state) => new Some({ value: state, state: state + 1 }))
    }

    export function interval(from: number, to: number): Stream<number> {
        return natural(from).take(to - from + 1)
    }

    export function fib(a0: number = 0, a1: number = 1): Stream<number> {
        return unfold({ a0, a1 }, (state) => {
            const a2 = state.a0 + state.a1
            return new Some({
                value: state.a0,
                state: { a0: state.a1, a1: a2 }
            })
        })
    }

    export function unfold<A, S>(currentState: S, f: (state: S) => Option<{ value: A, state: S }>): Stream<A> {
        const current = f(currentState).get(undefined)
        if (current !== undefined) {
            return directStream(() => current.value, () => unfold(current.state, f))
        }
        return new Empty()
    }

    export function iterator<A>(iter: IterableIterator<A>): Stream<A> {
        return unfold({}, () => {
            const next = iter.next()
            if (next.done) {
                return new None()
            } else {
                return new Some({
                    value: next.value,
                    state: {}
                })
            }
        })
    }

    export function exists<A>(stream: Stream<A>, f: Predicate<A>): boolean {
        return stream.foldRight(() => false, (result, accumulate) => f(result) || accumulate())
    }

    export function all<A>(stream: Stream<A>, f: Predicate<A>): boolean {
        return stream.foldRight(() => true, (result, accumulate) => f(result) && accumulate())
    }

    export function find<A>(stream: Stream<A>, f: (a: A) => boolean): Option<A> {
        return stream.foldRight(() => new None() as Option<A>, (result, accumulate) => f(result) ? new Some(result) : accumulate())
    }

    export function evaluate<A>(stream: Stream<A>): A[] {
        const initial: A[] = []
        return stream.fold(initial, (accumulate, result) => {
            accumulate.push(result)
            return accumulate
        })
    }

}
