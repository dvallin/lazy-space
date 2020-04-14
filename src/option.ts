import { Either, Left, Right } from './either'

export class Option<T> extends Either<T, undefined> {
    public static isSome<T>(option: Option<T>): option is Option<T> & Left<T> {
        return option.isLeft()
    }

    public static isNone<T>(option: Option<T>): option is Option<T> & Right<undefined> {
        return option.isRight()
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
