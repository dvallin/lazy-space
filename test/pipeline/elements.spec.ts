import { pushOf, Push } from "../../src/pipeline/elements"
import { Stream } from "../../src/lazy"

describe("pushOf", () => {

    it("constructs a push from a function", () => {
        const effect = jest.fn()
        const effectTimes = (n: number) => Stream.interval(0, n).map(i => effect(i))
        const p: Push<number> = pushOf<number>(effectTimes)

        Stream.evaluate(p.push(2))

        expect(effect).toHaveBeenCalledTimes(3)
    })
})
