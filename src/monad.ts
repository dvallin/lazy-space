export interface Monad<T> {
    map<U>(f: (a: T) => U): Monad<U>
    flatMap<U>(f: (a: T) => Monad<U>): Monad<U>
    pipe<U>(f: (a: T) => Monad<U>): Monad<U>
}
