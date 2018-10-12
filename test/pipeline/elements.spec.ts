import { pushOf, Push, PromiseEval } from "../../src"

describe("pushOf", () => {

    it("constructs a push from a function", async () => {
        const effect = jest.fn()
        const effectTimes = (n: number) => new PromiseEval(Promise.resolve(effect(n)))
        const p: Push<number> = pushOf<number>(effectTimes)

        await p.push(42)

        expect(effect).toHaveBeenCalledTimes(1)
        expect(effect).toHaveBeenCalledWith(42)
    })
})
