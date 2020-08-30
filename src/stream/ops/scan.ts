import { Source } from '../source'

export class Scan<I, O> {
  public constructor(private readonly source: Source<I>, public readonly initial: O, public readonly combine: (l: O, r: I) => O) {}

  current = this.initial

  public apply(): Source<O> {
    return {
      next: () =>
        this.source.next().map((a) =>
          a.map((head) => {
            this.current = this.combine(this.current, head)
            return this.current
          })
        ),
    }
  }
}
