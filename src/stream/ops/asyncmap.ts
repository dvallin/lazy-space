import { Async } from '../../async'
import { Option } from '../../option'
import { Source } from '../source'

export class AsyncMap<I, O> {
  public constructor(private readonly source: Source<I>, public readonly f: (v: I) => Async<O>) {}

  public apply(): Source<O> {
    return {
      next: () =>
        Async.join(this.source.next().map((n) => n.map((v) => this.f(v)).recover(() => Async.reject<O, Error>())))
          .map((o) => Option.some(o))
          .recover(() => Option.none()),
    }
  }
}
