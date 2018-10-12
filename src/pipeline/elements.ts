import { Stream } from "../lazy"

export interface Push<I> {
    push(input: I): Stream<void>
}

export interface Push2<L, R> {

    pushL: Push<L>
    pushR: Push<R>
}

export interface Source<O> {
    subscribe(p: Push<O>): void
}

export function pushOf<T>(f: (input: T) => Stream<void>): Push<T> {
    return {
        push(input: T): Stream<void> {
            return f(input)
        }
    }
}
