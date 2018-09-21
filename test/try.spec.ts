import { Success, Failure, Try } from "../src/try"
import { None, Some } from "../src/option"

describe("map", () => {

    it("maps using the function", () => {
        const t = new Success(1).map(v => v.toString())
        expect(t.success()).toEqual(new Some("1"))
        expect(t.error()).toEqual(new None())
    })

    it("maps undefined to success", () => {
        const t = new Success(1).map(() => undefined)
        expect(t.success()).toEqual(new Some(undefined))
        expect(t.error()).toEqual(new None())
    })

    it("maps none to none", () => {
        expect(new Failure(new Error()).map().success()).toEqual(new None())
        expect(new Failure(new Error()).map().error()).toEqual(new Some(new Error()))
    })
})

describe("flatMap", () => {

    it("flatMaps using the function", () => {
        const t = Try.of(() => 3).flatMap(() => new Success(2))
        expect(t.success()).toEqual(new Some(2))
        expect(t.error()).toEqual(new None())
    })

    it("flatmaps none to none", () => {
        const t = Try.of(() => {
            throw new Error("error")
        }).flatMap(() => Try.of(() => 4))
        expect(t.success()).toEqual(new None())
    })
})

describe("recover", () => {

    it("recovers using the function", () => {
        const t = Try.of(() => {
            throw new Error("error")
        }).recover(v => v.toString())
        expect(t.success()).toEqual(new Some("Error: error"))
        expect(t.error()).toEqual(new None())
    })

    it("does not recover success", () => {
        const t = Try.of(() => 2).recover(() => 3)
        expect(t.success()).toEqual(new Some(2))
    })
})

describe("flatRecover", () => {

    it("recovers using the function", () => {
        const t = Try.of(() => {
            throw new Error("error")
        }).flatRecover(v => Try.of(() => v.toString()))
        expect(t.success()).toEqual(new Some("Error: error"))
        expect(t.error()).toEqual(new None())
    })

    it("tries to recover but it may not succeed", () => {
        const t = Try.of(() => {
            throw new Error("error")
        }).flatRecover(v => Try.of(() => {
            throw new Error(v.message + "2")
        }))
        expect(t.success()).toEqual(new None())
        expect(t.error()).toEqual(new Some(new Error("error2")))
    })

    it("does not recover success", () => {
        const t = Try.of(() => 2).flatRecover(() => Try.of(() => 3))
        expect(t.success()).toEqual(new Some(2))
    })
})

describe("flatRecover", () => {

    it("does not succeed if filter is not matched", () => {
        const t = Try.of(() => 2).filter(n => n > 2)
        expect(t.error()).toEqual(new Some(new Error("element not found")))
    })

    it("does succeed if filter is matched", () => {
        const t = Try.of(() => 2).filter(n => n === 2)
        expect(t.success()).toEqual(new Some(2))
    })

    it("does not succeed on failure", () => {
        const t = Try.of<number>(() => {
            throw new Error("some error")
        }).filter(n => n === 2)
        expect(t.error()).toEqual(new Some(new Error("some error")))
    })
})
