import { Either, left, right } from './either'

export type Try<S> = Either<S, Error>

export function isSuccess<T>(value: Try<T>): boolean {
    return value.isLeft()
}

export function success<T>(value: T): Try<T> {
    return left(value)
}

export function failure<T>(value: Error): Try<T> {
    return right(value)
}
