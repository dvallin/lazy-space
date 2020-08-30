import { Async } from '../../async'
import { Option } from '../../option'
import { Source } from '../source'

export class Take<T> {
  public constructor(private readonly source: Source<T>, private readonly amount: number) {}

  left = this.amount

  public apply(): Source<T> {
    return {
      next: () => {
        if (this.left > 0) {
          this.left--
          return this.source.next()
        }
        return Async.resolve(Option.none())
      },
    }
  }
}
