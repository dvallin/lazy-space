import { Empty } from "../../src/lazy"
import { Pipe } from "../../src/pipeline/pipe"
import { pushOf } from "../../src/pipeline/elements"

const pass = jest.fn()
class ToString<T> extends Pipe<T, string> {

    public pass(input: T): string {
        pass(input)
        return input.toString()
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

        it("calls subscriptions", () => {
            const sub1 = jest.fn(() => new Empty())
            const sub2 = jest.fn(() => new Empty())
            toString.subscribe(pushOf(i => sub1(i)))
            toString.subscribe(pushOf(i => sub2(i)))

            toString.push(2)

            expect(sub1).toHaveBeenCalledWith("2")
            expect(sub2).toHaveBeenCalledWith("2")
        })
    })
})
