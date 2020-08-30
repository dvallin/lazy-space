import { Source } from '../source'

export class Drop<T> {
  public constructor(private readonly source: Source<T>, private readonly amount: number) {}

  left = this.amount

  public apply(): Source<T> {
    return {
      next: () => {
        if (this.left > 0) {
          this.left--
          return this.source.next().flatMap(this.apply().next)
        }
        return this.source.next()
      },
    }
  }
}
