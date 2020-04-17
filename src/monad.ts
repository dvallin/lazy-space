export interface Monad<T> {
    map<U>(f: (a: T) => U): Monad<U>
    flatMap<U>(f: (a: T) => Monad<U>): Monad<U>
    pipe<U>(f: (a: T) => Monad<U>): Monad<U>
    lift<U>(v: U): Monad<U>
    join<U>(v: Monad<Monad<U>>): Monad<U>
}
