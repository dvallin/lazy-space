import { Either, isLeft, Left, left, right } from './either'

export type Option<T> = Either<T, undefined>

export function isValid<T>(option: Option<T>): option is Left<T> {
    return isLeft(option)
}

export function invalid<T>(): Option<T> {
    return right(undefined)
}

export function just<T>(value: T): Option<T> {
    return left(value)
}

export function of<T>(value: T | undefined): Option<T> {
    return value !== undefined ? left(value) : right(undefined)
}
