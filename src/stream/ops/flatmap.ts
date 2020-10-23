import { Async } from '../../async'
import { Option } from '../../option'
import { Source } from '../source'

export class FlatMap<I, O> {
  public constructor(private readonly source: Source<I>, private readonly f: (v: I) => Source<O>) {}

  current: Option<Async<Option<Source<O>>>> = Option.none()

  public apply(): Source<O> {
    const next = (): Async<Option<O>> => {
      if (this.current.isNone()) {
        this.current = Option.some(this.source.next().map((o) => o.map(this.f)))
      }
      return this.current.getOrThrow(new Error('')).flatMap((s) =>
        s.unwrap(
          (currentSource) =>
            currentSource.next().flatMap((head) => {
              if (head.isNone()) {
                this.current = Option.none()
                return next()
              }
              return Async.resolve(head)
            }),
          () => Async.resolve(Option.none())
        )
      )
    }
    return { next }
  }
}
