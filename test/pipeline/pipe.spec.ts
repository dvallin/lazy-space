import { Pipe, pushOf, Eval, PromiseEval } from "../../src"

const pass = jest.fn()
class ToString<T> extends Pipe<T, string> {

    public pass(input: T): Eval<string> {
        pass(input)
        return new PromiseEval(Promise.resolve(input.toString()))
    }
}

describe("Merge", () => {

    let toString: ToString<number>

    beforeEach(() => {
        jest.resetAllMocks()
        toString = new ToString()
    })

    describe("push", () => {

        it("passes input to the pass function", () => {
            toString.push(2)
            expect(pass).toHaveBeenCalledWith(2)
        })
    })

    describe("subscriptions", () => {

        it("calls subscriptions", async () => {
            const sub1 = jest.fn(() => Eval.noop())
            const sub2 = jest.fn(() => Eval.noop())
            toString.subscribe(pushOf(i => sub1(i)))
            toString.subscribe(pushOf(i => sub2(i)))

            await toString.push(2).toPromise()

            expect(sub1).toHaveBeenCalledWith("2")
            expect(sub2).toHaveBeenCalledWith("2")
        })
    })
})
