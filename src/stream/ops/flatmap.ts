import { Async } from '../../async'
import { Option } from '../../option'
import { Source } from '../source'

export class FlatMap<I, O> {
  public constructor(private readonly source: Source<I>, private readonly f: (v: I) => Source<O>) {}

  current: Option<Async<Option<Source<O>>>> = Option.none()

  public apply(): Source<O> {
    return {
      next: () => {
        if (this.current.isNone()) {
          this.current = Option.some(this.source.next().map((o) => o.map(this.f)))
        }
        return Async.join(
          this.current.getOrThrow(new Error('')).map((s) =>
            s.unwrap(
              (currentSource) =>
                currentSource.next().flatMap((head) => {
                  if (head.isNone()) {
                    this.current = Option.none()
                    return this.apply().next()
                  }
                  return Async.resolve(head)
                }),
              () => {
                this.current = Option.none()
                return Async.resolve(Option.none())
              }
            )
          )
        )
      },
    }
  }
}
