import { Source, Push } from "./elements"
import { Eval, flattenEvals } from "../eval"

export abstract class Pipe<I, O> implements Push<I>, Source<O> {

    protected readonly subscriptions: Push<O>[] = []

    public push(input: I): Eval<void> {
        return this.pass(input)
            .map(output => this.subscriptions.map(s => s.push(output)))
            .flatMap(e => flattenEvals(e).orElse(() => Eval.noop()))
    }

    public subscribe(p: Push<O>): void {
        this.subscriptions.push(p)
    }

    protected abstract pass(input: I): Eval<O>
}
