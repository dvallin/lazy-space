import { Async } from '../../async'
import { Source } from '../source'

export class DropWhile<T> {
  public constructor(private readonly source: Source<T>, private readonly predicate: (a: T) => boolean) {}

  public apply(): Source<T> {
    return {
      next: () =>
        this.source.next().flatMap((a) => (a.map((head) => this.predicate(head)).getOrElse(false) ? this.apply().next() : Async.lift(a))),
    }
  }
}