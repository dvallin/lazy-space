import { Source } from '../source'

export class Bracket<T> {
  public constructor(public readonly source: Source<T>, public readonly close: () => void) {}

  public apply(): Source<T> {
    return {
      next: () =>
        this.source
          .next()
          .map((n) => {
            if (n.isNone()) {
              this.close()
            }
            return n
          })
          .onError((e) => {
            this.close()
            throw e
          }),
    }
  }
}
