import { Lazy } from "../../src/lazy"

describe("lazy", () => {

    it("returns the result of the function", () => {
        expect(Lazy.lazy(() => 1)()).toEqual(1)
    })

    it("caches the result of the function", () => {
        let invoked = 0
        const l = Lazy.lazy(() => {
            if (invoked > 0) {
                throw Error()
            }
            return invoked++
        })
        expect(l()).toEqual(0)
        expect(l()).toEqual(0)
    })
})
