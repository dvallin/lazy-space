import { Merge } from "../../src/pipeline/merge"
import { Option, Some, None } from "../../src/option"
import { Empty } from "../../src/lazy"
import { pushOf } from "../../src/pipeline/elements"

const merge = jest.fn()

class Concat extends Merge<string, number, string> {

    protected merge(): Option<string> {
        merge(this.left, this.right)
        return this.left.flatMap(left => this.right.map(right => left + right))
    }
}

describe("Merge", () => {

    let concat: Concat

    beforeEach(() => {
        jest.resetAllMocks()
        concat = new Concat()
    })

    describe("pushL", () => {

        it("sets left for merging", () => {
            concat.pushL.push("test")

            expect(merge).toHaveBeenCalledWith(new Some("test"), new None())
        })

        it("overrides left for merging", () => {
            concat.pushL.push("test")
            concat.pushL.push("test2")

            expect(merge).toHaveBeenCalledWith(new Some("test"), new None())
            expect(merge).toHaveBeenCalledWith(new Some("test2"), new None())
        })
    })

    describe("pushR", () => {

        it("sets right for merging", () => {
            concat.pushR.push(2)

            expect(merge).toHaveBeenCalledWith(new None(), new Some(2))
        })

        it("overrides right for merging", () => {
            concat.pushR.push(2)
            concat.pushR.push(3)

            expect(merge).toHaveBeenCalledWith(new None(), new Some(2))
            expect(merge).toHaveBeenCalledWith(new None(), new Some(3))
        })
    })

    describe("merging", () => {

        it("returns empty if only one push has happened", () => {
            expect(new Concat().pushL.push("someText")).toEqual(new Empty())
            expect(new Concat().pushR.push(2)).toEqual(new Empty())
        })

        it("resets right when both merges have happened", () => {
            concat.pushL.push("someText")
            concat.pushR.push(2)
            concat.pushL.push("newText")

            expect(merge).toHaveBeenCalledWith(new Some("someText"), new None())
            expect(merge).toHaveBeenCalledWith(new Some("someText"), new Some(2))
            expect(merge).toHaveBeenCalledWith(new Some("newText"), new None())
        })

        it("resets left when both merges have happened", () => {
            concat.pushL.push("someText")
            concat.pushR.push(2)
            concat.pushR.push(3)

            expect(merge).toHaveBeenCalledWith(new Some("someText"), new None())
            expect(merge).toHaveBeenCalledWith(new Some("someText"), new Some(2))
            expect(merge).toHaveBeenCalledWith(new None(), new Some(3))
        })
    })

    describe("subscriptions", () => {

        it("calls subscriptions", () => {
            const sub1 = jest.fn(() => new Empty())
            const sub2 = jest.fn(() => new Empty())
            concat.subscribe(pushOf(i => sub1(i)))
            concat.subscribe(pushOf(i => sub2(i)))

            concat.pushL.push("someText")
            concat.pushR.push(2)

            expect(sub1).toHaveBeenCalledWith("someText2")
            expect(sub2).toHaveBeenCalledWith("someText2")
        })
    })
})
