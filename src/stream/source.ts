import { Async } from '../async'
import { Lazy } from '../lazy'
import { Option } from '../option'

export interface Source<T> {
  next(): Async<Option<T>>
}

export function empty<T>(): Source<T> {
  return {
    next: () => Async.lift(Option.none()),
  }
}

export function repeat<T>(value: T): Source<T> {
  return {
    next: () => Async.lift(Option.some(value)),
  }
}

export function ofNative<T>(iterator: () => AsyncGenerator<T>): Source<T> {
  const generator = Lazy.of(iterator, true)
  return {
    next: () => Async.of(generator.eval().next()).map((result) => (result.done ? Option.none() : Option.some(result.value))),
  }
}

export function once<T>(value: T): Source<T> {
  let done = false
  return {
    next: () => {
      if (!done) {
        done = true
        return Async.lift(Option.of(value))
      } else {
        return Async.lift(Option.none())
      }
    },
  }
}

export function natural(from: number): Source<number> {
  let current = from
  return {
    next: () => Async.lift(Option.of(current++)),
  }
}

export function range(from: number, to: number): Source<number> {
  const n = natural(from)
  return {
    next: () => n.next().map((o) => o.filter((i) => i <= to)),
  }
}
