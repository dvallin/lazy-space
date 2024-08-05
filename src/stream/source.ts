import { Async } from '../async'
import { Lazy } from '../lazy'
import { Option } from '../option'

export interface Source<T> {
  next(): Async<Option<T>>
  onError(error: Error): never
}

export const onError = (e: Error): never => {
  throw e
}

export function empty<T>(): Source<T> {
  return {
    next: () => Async.lift(Option.none()),
    onError,
  }
}

export function repeat<T>(value: T): Source<T> {
  return {
    next: () => Async.lift(Option.some(value)),
    onError,
  }
}

export function ofNative<T>(iterator: () => AsyncGenerator<T>): Source<T> {
  const generator = Lazy.of(iterator, true)
  return {
    next: () =>
      Async.of(generator.eval().next()).map(result => (result.done ? Option.none() : Option.some(result.value))),
    onError,
  }
}

export function once<T>(value: T): Source<T> {
  let done = false
  return {
    next: () => {
      if (!done) {
        done = true
        return Async.lift(Option.of(value))
      }
      return Async.lift(Option.none())
    },
    onError,
  }
}

export function natural(from: number): Source<number> {
  let current = from
  return {
    next: () => Async.lift(Option.of(current++)),
    onError,
  }
}

export function range(from: number, to: number): Source<number> {
  const n = natural(from)
  return {
    next: () => n.next().map(o => o.filter(i => i <= to)),
    onError,
  }
}
