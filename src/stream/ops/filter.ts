import { Async } from '../../async'
import { Option } from '../../option'
import { Source } from '../source'

export class Filter<I, O extends I> {
  public constructor(private readonly source: Source<I>, public readonly f: (v: I) => v is O) {}

  public apply(): Source<O> {
    return {
      next: () =>
        Async.join(
          this.source.next().map((a) =>
            a.unwrap(
              (head) => (this.f(head) ? Async.resolve(Option.of(head)) : this.apply().next()),
              () => Async.resolve(Option.none<O>())
            )
          )
        ),
    }
  }
}
