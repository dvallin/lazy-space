import { Async } from '../../async'
import { Option } from '../../option'
import { Source } from '../source'

export class TakeWhile<T> {
  public constructor(private readonly source: Source<T>, private readonly predicate: (a: T) => boolean) {}

  public apply(): Source<T> {
    return {
      next: () =>
        this.source
          .next()
          .flatMap((a) => (a.map((head) => this.predicate(head)).getOrElse(false) ? Async.lift(a) : Async.lift(Option.none()))),
    }
  }
}
