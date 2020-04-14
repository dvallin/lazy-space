import { Either, Right, Left } from './either'

export class Try<S> extends Either<S, Error> {
    public static isSuccess<T>(value: Try<T>): value is Either<T, Error> & Left<T> {
        return value.isLeft()
    }

    public static isFailure<T>(value: Try<T>): value is Either<T, Error> & Right<Error> {
        return value.isRight()
    }

    public static success<T>(value: T): Try<T> {
        return Either.left(value)
    }

    public static failure<T>(value: Error): Try<T> {
        return Either.right(value)
    }
}
