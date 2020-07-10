export interface Applicative<T> {
  map<U>(f: (a: T) => U): Applicative<U>
  lift<U>(v: U): Applicative<U>
}
