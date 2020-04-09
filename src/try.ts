import { Either } from './either'

export class Try<S> extends Either<S, Error> {
    public static isSuccess<T>(value: Try<T>): boolean {
        return value.isLeft()
    }

    public static success<T>(value: T): Try<T> {
        return Either.left(value)
    }

    public static failure<T>(value: Error): Try<T> {
        return Either.right(value)
    }
}
