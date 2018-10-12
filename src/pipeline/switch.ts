
import { Push } from "./elements"
import { Option, None } from "../option"
import { Eval } from "../eval"

export class Switch<I, T> implements Push<I> {

    protected cases: Map<T, Push<I>> = new Map()

    public constructor(
        protected switcher: (input: I) => T,
        protected defaultPush: Option<Push<I>> = new None()
    ) { }

    public push(input: I): Eval<void> {
        return Option
            .of(this.cases.get(this.switcher(input)))
            .or(this.defaultPush)
            .map(p => p.push(input))
            .orElse(() => Eval.noop())
    }

    public add(key: T, push: Push<I>): void {
        this.cases.set(key, push)
    }
}
