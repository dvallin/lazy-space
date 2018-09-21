import { of, just, Stream, directStream, constant, natural, fib, unfold, evaluate, exists, all, find } from "../../src/lazy"
import { None, Some } from "../../src/option"

describe("of", () => {

    it("wraps empty lists in a stream", () => {
        expect(evaluate(of([]))).toEqual([])
    })

    it("wraps elements into a stream", () => {
        expect(evaluate(of([() => 1, () => 2, () => 3]))).toEqual([1, 2, 3])
    })

    it("creates a caching stream by default", () => {
        let invokes = 0
        const stream: Stream<number> = of([() => invokes++])
        evaluate(stream)
        evaluate(stream)
        expect(invokes).toEqual(1)
    })

    it("can create a non caching stream", () => {
        let invokes = 0
        const stream: Stream<number> = of([() => invokes++], directStream)
        evaluate(stream)
        evaluate(stream)
        expect(invokes).toEqual(2)
    })
})

describe("just", () => {

    it("wraps empty lists in a stream", () => {
        expect(evaluate(just([]))).toEqual([])
    })

    it("wraps elements into a stream", () => {
        expect(evaluate(just([1, 2, 3]))).toEqual([1, 2, 3])
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
        expect(evaluate(just([]).take(5))).toEqual([])
    })

    it("takes 0", () => {
        expect(evaluate(constant().take(0))).toEqual([])
    })

    it("takes 10 fibonacci numbers", () => {
        expect(evaluate(fib().take(10))).toEqual([0, 1, 1, 2, 3, 5, 8, 13, 21, 34])
    })
})

describe("takeWhile", () => {

    it("takes from empty", () => {
        expect(evaluate(just([]).takeWhile(() => true))).toEqual([])
    })

    it("takes while small enough", () => {
        expect(evaluate(natural().takeWhile(n => n <= 5))).toEqual([1, 2, 3, 4, 5])
    })
})

describe("dropWhile", () => {

    it("drops from empty", () => {
        expect(evaluate(just([]).dropWhile(() => true))).toEqual([])
    })

    it("takes while small enough", () => {
        expect(evaluate(natural().dropWhile(n => n <= 5).take(5))).toEqual([6, 7, 8, 9, 10])
    })
})

describe("drop", () => {

    it("drops from empty", () => {
        expect(evaluate(just([]).drop(0))).toEqual([])
    })

    it("drops 0", () => {
        expect(evaluate(natural().drop(0).take(1))).toEqual([1])
    })

    it("drops 5", () => {
        expect(evaluate(natural().drop(5).take(5))).toEqual([6, 7, 8, 9, 10])
    })
})

describe("exists", () => {

    it("does not find anything in empty stream", () => {
        expect(exists(just([]), () => true)).toEqual(false)
    })

    it("finds a number greater than 5 in all natual numbers", () => {
        expect(exists(natural(), a => a > 5)).toEqual(true)
    })

    it("does not find a number greater than 5 in a stream of ones", () => {
        expect(exists(constant().take(5), a => a > 5)).toEqual(false)
    })
})

describe("all", () => {

    it("asserts true for every statement about empty streams", () => {
        expect(all(just([]), () => true)).toEqual(true)
    })

    it("does not assert that all numbers are smaller than 5", () => {
        expect(all(natural(), a => a < 5)).toEqual(false)
    })

    it("asserts that at least the first ones are all ones", () => {
        expect(all(constant().take(5), a => a === 1)).toEqual(true)
    })
})

describe("map", () => {

    it("maps empty streams", () => {
        expect(evaluate(just([]).map(() => true))).toEqual([])
    })

    it("maps numbers", () => {
        expect(evaluate(constant().map(n => n.toString()).take(5))).toEqual(["1", "1", "1", "1", "1"])
    })
})

describe("filter", () => {

    it("filters empty streams", () => {
        expect(evaluate(just([]).filter(() => true))).toEqual([])
    })

    it("filters numbers", () => {
        expect(evaluate(natural().filter(n => n % 2 === 0).take(5))).toEqual([2, 4, 6, 8, 10])
    })
})

describe("flatmap", () => {

    it("flattens empty streams", () => {
        expect(evaluate(just([]).flatMap(() => just([])))).toEqual([])
    })

    it("can flatmap on infinite streams", () => {
        expect(evaluate(natural().flatMap(n => constant(n).take(2)).take(5))).toEqual([1, 1, 2, 2, 3])
    })
})

describe("append", () => {

    it("can append streams together", () => {
        expect(evaluate(just([] as number[]).append(() => just([1, 2])))).toEqual([1, 2])
        expect(evaluate(just([1, 2]).append(() => just([] as number[])))).toEqual([1, 2])
    })
})

describe("unfold", () => {

    it("unfolds to Empty if only None is given", () => {
        expect(evaluate(unfold({}, () => new None()))).toEqual([])
    })

    it("unfolds until None Stream until None is given", () => {
        expect(evaluate(unfold({ c: 5 }, (state) => state.c === 0 ? new None() : new Some(
            {
                state: { c: state.c - 1 },
                value: state.c
            }
        )))).toEqual([5, 4, 3, 2, 1])
    })
})

describe("find", () => {

    it("can find none on empty stream", () => {
        expect(find(just([]), () => true)).toEqual(new None())
    })

    it("can find none on empty stream", () => {
        expect(find(natural(1), (n) => n === 5)).toEqual(new Some(5))
    })
})
