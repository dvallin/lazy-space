import { Eval, PromiseEval, TryEval } from "../src"

describe("PromiseEval", () => {

    describe("map", async () => {
        checkLateEval((callback) => new PromiseEval(Promise.resolve("text")).map((v) => callback(v)), "text")
    })

    describe("flatMap", async () => {
        checkLateEval((callback) => new PromiseEval(Promise.resolve("text")).flatMap((v) => new TryEval(() => callback(v))), "text")
    })
})

describe("TryEval", () => {

    describe("map", async () => {
        checkLateEval((callback) => new TryEval(() => "text").map((v) => callback(v)), "text")
    })

    describe("flatMap", async () => {
        checkLateEval((callback) => new TryEval(() => "text").flatMap((v) => new TryEval(() => callback(v))), "text")
    })
})

function checkLateEval<T>(buildEval: (callback: jest.Mock<{}>) => Eval<T>, expected: string): void {

    it("evaluates only on cast to promise", async () => {
        const callback = jest.fn()
        const eMapped = buildEval(callback)
        expect(callback).toHaveBeenCalledTimes(0)
        await eMapped.toPromise()
        expect(callback).toHaveBeenCalled()
        expect(callback).toHaveBeenCalledWith(expected)
    })
}
