import { Some, None, Option } from "../src"

describe("isPresent", () => {

    it("true for some", () => {
        expect(new Some(1).isPresent()).toBeTruthy()
    })

    it("false for none", () => {
        expect(new None().isPresent()).toBeFalsy()
    })
})


describe("map", () => {

    it("maps using the function", () => {
        expect(new Some(1).map(v => v.toString()).get(undefined)).toEqual("1")
    })

    it("maps undefined to none", () => {
        expect(new Some(1).map(() => undefined)).toEqual(new None())
    })

    it("maps none to none", () => {
        expect(new None().map()).toEqual(new None())
    })
})

describe("flatMap", () => {

    it("maps using the function", () => {
        expect(new Some(1).flatMap(v => new Some(v.toString())).get(undefined)).toEqual("1")
    })

    it("maps none to none", () => {
        expect(new None().flatMap()).toEqual(new None())
    })
})

describe("get", () => {

    it("gets some values", () => {
        expect(new Some(1).get()).toEqual(1)
    })

    it("defaults for none", () => {
        expect(new None().get(1)).toEqual(1)
        expect(new None().get(undefined)).toEqual(undefined)
    })
})

describe("or", () => {

    it("gets left if it is some", () => {
        expect(new Some(1).or().get()).toEqual(1)
    })

    it("gets right if it is none", () => {
        expect(new None().or(new Some(1)).get(undefined)).toEqual(1)
    })
})

describe("and", () => {

    it("gets right if it is some", () => {
        expect(new Some(1).and(new Some(2)).get(undefined)).toEqual(2)
    })

    it("gets none once none is encountered", () => {
        expect(new None().and()).toEqual(new None())
        expect(new Some(1).and(new None())).toEqual(new None())
    })
})

describe("orElse", () => {

    it("gets left if it is some", () => {
        expect(new Some(1).orElse()).toEqual(1)
    })

    it("gets right if it is none", () => {
        expect(new None().orElse(() => 1)).toEqual(1)
    })
})

describe("filter", () => {

    it("retains matching some values", () => {
        expect(new Some(1).filter(a => a === 1).get(undefined)).toEqual(1)
    })

    it("drops not matching some values", () => {
        expect(new Some(1).filter(a => a === 2).get(undefined)).toEqual(undefined)
    })

    it("drops none", () => {
        expect(new None().filter().get(undefined)).toEqual(undefined)
    })
})

describe("of", () => {

    it("is none if undefined", () => {
        expect(Option.of(undefined)).toEqual(new None())
    })

    it("is none if null", () => {
        expect(Option.of(null)).toEqual(new None())
    })

    it("is some in other edge cases", () => {
        expect(Option.of(-1)).toEqual(new Some(-1))
        expect(Option.of(NaN)).toEqual(new Some(NaN))
        expect(Option.of(() => {
            throw new Error()
        }).isPresent()).toBeTruthy()
    })
})
describe("toStream", () => {

    it("maps none to empty stream", () => {
        expect(new None().toStream().isEmpty()).toBeTruthy()
    })

    it("maps some to a stream", () => {
        expect(new Some(2).toStream().head()).toEqual(new Some(2))
    })
})
