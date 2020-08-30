import { Source } from '../source'

export class Map<I, O> {
  public constructor(private readonly source: Source<I>, public readonly f: (v: I) => O) {}

  public apply(): Source<O> {
    return {
      next: () => this.source.next().map((n) => n.map((v) => this.f(v))),
    }
  }
}
