
import { Push2, Source, pushOf, Push } from "./elements"
import { Option, None } from "../option"
import { Stream } from "../lazy"
import { Eval, flattenEvals } from "../eval"

export abstract class Merge<L, R, T> implements Push2<L, R>, Source<T> {

    protected readonly subscriptions: Set<Push<T>> = new Set()

    protected left: Option<L>
    protected right: Option<R>

    public constructor(
        protected readonly defaultLeft: Option<L> = new None(),
        protected readonly defaultRight: Option<R> = new None()
    ) {
        this.left = defaultLeft
        this.right = defaultRight
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

    protected abstract merge(): Option<Eval<T>>

    private tryPush(): Eval<void> {
        const t = this.merge()
        if (t.isPresent()) {
            this.reset()
        }
        return t.map(e => e.flatMap(o =>
            flattenEvals(this.sendToSubscribers(o))
                .orElse(() => Eval.noop())
        )).orElse(() => Eval.noop())
    }

    private sendToSubscribers(output: T): Stream<Eval<void>> {
        return Stream.iterator(this.subscriptions.values()).map(s => s.push(output))
    }

    private reset(): void {
        this.left = this.defaultLeft
        this.right = this.defaultRight
    }
}
