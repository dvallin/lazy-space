import { Merge, Option, Some, None, Empty, pushOf, Eval, TryEval } from "../../src"

const merge = jest.fn()

class Concat extends Merge<string, number, string> {

    protected merge(): Option<Eval<string>> {
        merge(this.left, this.right)
        return this.left.flatMap(left => this.right.map(right => new TryEval(() => left + right)))
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

        it("resets right when both merges have happened", () => {
            concat.pushL.push("someText")
            concat.pushR.push(2)
            concat.pushL.push("newText")

            expect(merge).toHaveBeenCalledWith(new Some("someText"), new None())
            expect(merge).toHaveBeenCalledWith(new Some("someText"), new Some(2))
            expect(merge).toHaveBeenCalledWith(new Some("newText"), new None())
        })

        it("resets right to predefined default", () => {
            concat = new Concat(new None(), new Some(42))
            concat.pushL.push("someText")
            concat.pushL.push("newText")
            concat.pushR.push(2)
            concat.pushL.push("newText")
            expect(merge).toHaveBeenCalledWith(new Some("someText"), new Some(42))
            expect(merge).toHaveBeenCalledWith(new Some("newText"), new Some(42))
            // here the 2 gets set for the next input of left:
            expect(merge).toHaveBeenCalledWith(new None(), new Some(2))
            expect(merge).toHaveBeenCalledWith(new Some("newText"), new Some(2))
        })

        it("resets left when both merges have happened", () => {
            concat.pushL.push("someText")
            concat.pushR.push(2)
            concat.pushR.push(3)

            expect(merge).toHaveBeenCalledWith(new Some("someText"), new None())
            expect(merge).toHaveBeenCalledWith(new Some("someText"), new Some(2))
            expect(merge).toHaveBeenCalledWith(new None(), new Some(3))
        })

        it("resets left to predefined default", () => {
            concat = new Concat(new Some("defaultValue"))
            concat.pushL.push("someText")
            concat.pushR.push(2)
            concat.pushR.push(3)

            expect(merge).toHaveBeenCalledWith(new Some("someText"), new None())
            expect(merge).toHaveBeenCalledWith(new Some("someText"), new Some(2))
            expect(merge).toHaveBeenCalledWith(new Some("defaultValue"), new Some(3))
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
