import { Either, isLeft, Left } from './either'

export type Try<S> = Either<S, Error>

export function isSuccess<T>(option: Try<T>): option is Left<T> {
    return isLeft(option)
}

export function success<T>(value: T): Try<T> {
    return { type: 'left', value }
}

export function failure<T>(value: Error): Try<T> {
    return { type: 'right', value }
}
