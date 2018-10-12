import { Source, Push } from "./elements"
import { Stream } from "../lazy"
import { Eval, flattenEvals } from "../eval"

export abstract class Pipe<I, O> implements Push<I>, Source<O> {

    public constructor(
        protected readonly subscriptions: Set<Push<O>> = new Set()
    ) { }

    public push(input: I): Eval<void> {
        return this.pass(input)
            .map(output => Stream.iterator(this.subscriptions.values()).map(s => s.push(output)))
            .flatMap(e => flattenEvals(e).orElse(() => Eval.noop()))
    }

    public subscribe(p: Push<O>): void {
        this.subscriptions.add(p)
    }

    protected abstract pass(input: I): Eval<O>
}
