import { Success, Failure, Try, None, Some } from "../src"

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
        expect(t).toEqual("Error: error")
    })

    it("does not recover success", () => {
        const t = Try.of(() => 2).recover(() => 3)
        expect(t).toEqual(2)
    })
})

describe("filter", () => {

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

describe("isSuccess", () => {

    it("true for success", async () => {
        expect(new Success(1).isSuccess()).toBeTruthy()
    })

    it("false for failure", async () => {
        expect(new Failure(1).isSuccess()).toBeFalsy()
    })
})

describe("ofPromise", () => {

    it("fails for rejected promise", async () => {
        const error = new Error("hello")
        const t = await Try.ofPromise(Promise.reject(error))
        expect(t.error()).toEqual(new Some(error))
    })

    it("succeeds for successful promise", async () => {
        const t = await Try.ofPromise(Promise.resolve(2))
        expect(t.success()).toEqual(new Some(2))
    })
})
