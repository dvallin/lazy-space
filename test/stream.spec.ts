import { of, just, Stream, directStream, constant, natural, fib, unfold } from "../src/stream"
import { None, Some } from "../src/option"

describe("of", () => {

    it("wraps empty lists in a stream", () => {
        expect(of([]).evaluate()).toEqual([])
    })

    it("wraps elements into a stream", () => {
        expect(of([() => 1, () => 2, () => 3]).evaluate()).toEqual([1, 2, 3])
    })

    it("creates a caching stream by default", () => {
        let invokes = 0
        const stream: Stream<number> = of([() => invokes++])
        stream.evaluate()
        stream.evaluate()
        expect(invokes).toEqual(1)
    })

    it("can create a non caching stream", () => {
        let invokes = 0
        const stream: Stream<number> = of([() => invokes++], directStream)
        stream.evaluate()
        stream.evaluate()
        expect(invokes).toEqual(2)
    })
})

describe("just", () => {

    it("wraps empty lists in a stream", () => {
        expect(just([]).evaluate()).toEqual([])
    })

    it("wraps elements into a stream", () => {
        expect(just([1, 2, 3]).evaluate()).toEqual([1, 2, 3])
    })
})

describe("head", () => {

    it("returns none if no head exists", () => {
        expect(of([]).head()).toEqual(new None())
    })

    it("returns head if it exists", () => {
        expect(of([() => 1]).head()).toEqual(new Some(1))
    })
})

describe("take", () => {

    it("takes from empty", () => {
        expect(just([]).take(5).evaluate()).toEqual([])
    })

    it("takes 0", () => {
        expect(constant().take(0).evaluate()).toEqual([])
    })

    it("takes 10 fibonacci numbers", () => {
        expect(fib().take(10).evaluate()).toEqual([0, 1, 1, 2, 3, 5, 8, 13, 21, 34])
    })
})

describe("takeWhile", () => {

    it("takes from empty", () => {
        expect(just([]).takeWhile(() => true).evaluate()).toEqual([])
    })

    it("takes while small enough", () => {
        expect(natural().takeWhile(n => n <= 5).evaluate()).toEqual([1, 2, 3, 4, 5])
    })
})

describe("dropWhile", () => {

    it("drops from empty", () => {
        expect(just([]).dropWhile(() => true).evaluate()).toEqual([])
    })

    it("takes while small enough", () => {
        expect(natural().dropWhile(n => n <= 5).take(5).evaluate()).toEqual([6, 7, 8, 9, 10])
    })
})

describe("drop", () => {

    it("drops from empty", () => {
        expect(just([]).drop(0).evaluate()).toEqual([])
    })

    it("drops 0", () => {
        expect(natural().drop(0).take(1).evaluate()).toEqual([1])
    })

    it("drops 5", () => {
        expect(natural().drop(5).take(5).evaluate()).toEqual([6, 7, 8, 9, 10])
    })
})

describe("exists", () => {

    it("does not find anything in empty stream", () => {
        expect(just([]).exists(() => true)).toEqual(false)
    })

    it("finds a number greater than 5 in all natual numbers", () => {
        expect(natural().exists(a => a > 5)).toEqual(true)
    })

    it("does not find a number greater than 5 in a stream of ones", () => {
        expect(constant().take(5).exists(a => a > 5)).toEqual(false)
    })
})

describe("all", () => {

    it("asserts true for every statement about empty streams", () => {
        expect(just([]).all(() => true)).toEqual(true)
    })

    it("does not assert that all numbers are smaller than 5", () => {
        expect(natural().all(a => a < 5)).toEqual(false)
    })

    it("asserts that at least the first ones are all ones", () => {
        expect(constant().take(5).all(a => a === 1)).toEqual(true)
    })
})

describe("map", () => {

    it("maps empty streams", () => {
        expect(just([]).map(() => true).evaluate()).toEqual([])
    })

    it("maps numbers", () => {
        expect(constant().map(n => n.toString()).take(5).evaluate()).toEqual(["1", "1", "1", "1", "1"])
    })
})

describe("filter", () => {

    it("filters empty streams", () => {
        expect(just([]).filter(() => true).evaluate()).toEqual([])
    })

    it("filters numbers", () => {
        expect(natural().filter(n => n % 2 === 0).take(5).evaluate()).toEqual([2, 4, 6, 8, 10])
    })
})

describe("filterMap", () => {

    it("filter maps empty streams", () => {
        expect(just([]).filterMap(() => new Some({})).evaluate()).toEqual([])
    })

    it("filter maps numbers", () => {
        expect(natural().filterMap(n => n % 2 === 0 ? new Some(n) : new None()).take(5).evaluate()).toEqual([2, 4, 6, 8, 10])
    })
})

describe("flatmap", () => {

    it("flattens empty streams", () => {
        expect(just([]).flatMap(() => just([])).evaluate()).toEqual([])
    })

    it("can flatmap on infinite streams", () => {
        expect(natural().flatMap(n => constant(n).take(2)).take(5).evaluate()).toEqual([1, 1, 2, 2, 3])
    })
})

describe("append", () => {

    it("can append streams together", () => {
        expect(just([] as number[]).append(() => just([1, 2])).evaluate()).toEqual([1, 2])
        expect(just([1, 2]).append(() => just([] as number[])).evaluate()).toEqual([1, 2])
    })
})

describe("unfold", () => {

    it("unfolds to Empty if only None is given", () => {
        expect(unfold({}, () => new None()).evaluate()).toEqual([])
    })

    it("unfolds until None Stream until None is given", () => {
        expect(unfold({ c: 5 }, (state) => state.c === 0 ? new None() : new Some(
            {
                state: { c: state.c - 1 },
                value: state.c
            }
        )).evaluate()).toEqual([5, 4, 3, 2, 1])
    })
})
