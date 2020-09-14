import { Async } from '../../async'
import { Option } from '../../option'
import { Source } from '../source'

export class Merge<T> {
  public constructor(private readonly sources: Source<T>[]) {}

  cache: Async<Option<T>>[] = []

  public apply(): Source<T> {
    return {
      next: () => {
        this.sources.map((source, i) => {
          if (this.cache[i] === undefined) {
            this.cache[i] = source.next()
          }
        })
        let emitted = false
        return Async.any(
          this.cache.map((a, i) =>
            a
              .flatMap((h) => (h.isNone() ? Async.reject<Option<T>, Error>() : Async.resolve(h)))
              .map((h) => {
                if (h.isSome() && !emitted) {
                  delete this.cache[i]
                }
                emitted = true
                return h
              })
          )
        ).recover(() => Option.none())
      },
    }
  }
}
