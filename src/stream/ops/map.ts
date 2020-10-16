import { Option } from '../../option'
import { Source } from '../source'

export class Map<I, O> {
  public constructor(private readonly source: Source<I>, public readonly f: (v: I) => Promise<O> | O) {}

  public apply(): Source<O> {
    return {
      next: () =>
        this.source
          .next()
          .map((n) => n.unwrap((v) => this.f(v), Promise.reject))
          .map((o) => Option.of(o))
          .recover(() => Option.none()),
    }
  }
}
