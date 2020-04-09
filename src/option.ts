import { Either, left, right } from './either'

export type Option<T> = Either<T, undefined>

export function isSome<T>(option: Option<T>): boolean {
    return option.isLeft()
}

export function none<T>(): Option<T> {
    return right(undefined)
}

export function some<T>(value: T): Option<T> {
    return left(value)
}

export function of<T>(value: T | undefined): Option<T> {
    return value !== undefined ? left(value) : right(undefined)
}
