import { Eval } from "../eval"

export interface Push<I> {
    push(input: I): Eval<void>
}

export interface Push2<L, R> {

    pushL: Push<L>
    pushR: Push<R>
}

export interface Source<O> {
    subscribe(p: Push<O>): void
}

export function pushOf<T>(f: (input: T) => Eval<void>): Push<T> {
    return {
        push(input: T): Eval<void> {
            return f(input)
        }
    }
}
