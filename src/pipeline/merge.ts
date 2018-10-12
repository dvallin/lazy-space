
import { Push2, Source, pushOf, Push } from "./elements"
import { Option, None } from "../option"
import { Stream } from "../lazy"
import { Eval, flattenEvals } from "../eval"

export abstract class Merge<L, R, T> implements Push2<L, R>, Source<T> {

    public constructor(
        protected left: Option<L> = new None(),
        protected right: Option<R> = new None(),
        protected readonly subscriptions: Set<Push<T>> = new Set()
    ) {
    }

    public get pushL(): Push<L> {
        return pushOf(i => {
            this.left = Option.of(i)
            return this.tryPush()
        })
    }
    public get pushR(): Push<R> {
        return pushOf(i => {
            this.right = Option.of(i)
            return this.tryPush()
        })
    }

    public subscribe(p: Push<T>): void {
        this.subscriptions.add(p)
    }

    protected abstract merge(): Option<T>

    private tryPush(): Eval<void> {
        const t = this.merge()
        return flattenEvals(t.toStream().flatMap(o => {
            this.reset()
            return Stream.iterator(this.subscriptions.values()).map(s => s.push(o))
        })).orElse(() => Eval.noop())
    }

    private reset(): void {
        this.left = new None()
        this.right = new None()
    }
}
