import { Success, Failure } from "../src/try"
import { None } from "../src/option"

describe("map", () => {

    it("maps using the function", () => {
        expect(new Success(1).map(v => v.toString()).success().get(undefined)).toEqual("1")
    })

    it("maps undefined to success", () => {
        expect(new Success(1).map(() => undefined).success().get(undefined)).toEqual(undefined)
    })

    it("maps none to none", () => {
        expect(new Failure(new Error()).map().success()).toEqual(new None())
    })
})
