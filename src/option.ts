import { Either } from './either'

export class Option<T> extends Either<T, undefined> {
    public static isSome<T>(option: Option<T>): boolean {
        return option.isLeft()
    }

    public static none<T>(): Option<T> {
        return Either.right(undefined)
    }

    public static some<T>(value: T): Option<T> {
        return Either.left(value)
    }

    public static of<T>(value: T | undefined): Option<T> {
        return value !== undefined ? Either.left(value) : Either.right(undefined)
    }
}
