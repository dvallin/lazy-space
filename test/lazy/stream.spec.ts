import { Stream } from "../../src/lazy"
import { None, Some } from "../../src/option"

describe("Stream.of", () => {

    it("wraps empty lists in a stream", () => {
        expect(Stream.evaluate(Stream.of([]))).toEqual([])
    })

    it("wraps elements into a stream", () => {
        expect(Stream.evaluate(Stream.of([() => 1, () => 2, () => 3]))).toEqual([1, 2, 3])
    })

    it("creates a caching stream by default", () => {
        let invokes = 0
        const stream: Stream<number> = Stream.of([() => invokes++])
        Stream.evaluate(stream)
        Stream.evaluate(stream)
        expect(invokes).toEqual(1)
    })

    it("can create a non caching stream", () => {
        let invokes = 0
        const stream: Stream<number> = Stream.of([() => invokes++], Stream.directStream)
        Stream.evaluate(stream)
        Stream.evaluate(stream)
        expect(invokes).toEqual(2)
    })
})

describe("isEmpty", () => {

    it("is true for empty streams", () => {
        expect(Stream.just([]).isEmpty()).toBeTruthy()
    })

    it("is false for non-empty streams", () => {
        expect(Stream.just([1]).isEmpty()).toBeFalsy()
    })

    it("is false for infinite streams", () => {
        expect(Stream.natural().isEmpty()).toBeFalsy()
    })
})

describe("head", () => {

    it("is not present for empty stream", () => {
        expect(Stream.just([]).head().isPresent()).toBeFalsy()
    })

    it("is the head value of non-empty stream", () => {
        expect(Stream.just([1]).head().get(undefined)).toEqual(1)
    })
})

describe("tail", () => {

    it("is the empty stream for empty stream", () => {
        expect(Stream.just([]).tail().isEmpty()).toBeTruthy()
    })

    it("is the tail for non-empty streams", () => {
        expect(Stream.natural().tail().head().get(undefined)).toEqual(2)
    })
})

describe("just", () => {

    it("wraps empty lists in a stream", () => {
        expect(Stream.evaluate(Stream.just([]))).toEqual([])
    })

    it("wraps elements into a stream", () => {
        expect(Stream.evaluate(Stream.just([1, 2, 3]))).toEqual([1, 2, 3])
    })
})

describe("head", () => {

    it("returns none if no head Stream.exists", () => {
        expect(Stream.of([]).head()).toEqual(new None())
    })

    it("returns head if it Stream.exists", () => {
        expect(Stream.of([() => 1]).head()).toEqual(new Some(1))
    })
})

describe("take", () => {

    it("takes from empty", () => {
        expect(Stream.evaluate(Stream.just([]).take(5))).toEqual([])
    })

    it("takes 0", () => {
        expect(Stream.evaluate(Stream.constant().take(0))).toEqual([])
    })

    it("takes 10 fibonacci numbers", () => {
        expect(Stream.evaluate(Stream.fib().take(10))).toEqual([0, 1, 1, 2, 3, 5, 8, 13, 21, 34])
    })
})

describe("takeWhile", () => {

    it("takes from empty", () => {
        expect(Stream.evaluate(Stream.just([]).takeWhile(() => true))).toEqual([])
    })

    it("takes while small enough", () => {
        expect(Stream.evaluate(Stream.natural().takeWhile(n => n <= 5))).toEqual([1, 2, 3, 4, 5])
    })
})

describe("dropWhile", () => {

    it("drops from empty", () => {
        expect(Stream.evaluate(Stream.just([]).dropWhile(() => true))).toEqual([])
    })

    it("takes while small enough", () => {
        expect(Stream.evaluate(Stream.natural().dropWhile(n => n <= 5).take(5))).toEqual([6, 7, 8, 9, 10])
    })
})

describe("drop", () => {

    it("drops from empty", () => {
        expect(Stream.evaluate(Stream.just([]).drop(0))).toEqual([])
    })

    it("drops 0", () => {
        expect(Stream.evaluate(Stream.natural().drop(0).take(1))).toEqual([1])
    })

    it("drops 5", () => {
        expect(Stream.evaluate(Stream.natural().drop(5).take(5))).toEqual([6, 7, 8, 9, 10])
    })
})

describe("Stream.exists", () => {

    it("does not find anything in empty stream", () => {
        expect(Stream.exists(Stream.just([]), () => true)).toEqual(false)
    })

    it("finds a number greater than 5 in all natual numbers", () => {
        expect(Stream.exists(Stream.natural(), a => a > 5)).toEqual(true)
    })

    it("does not find a number greater than 5 in a stream Stream.of ones", () => {
        expect(Stream.exists(Stream.constant().take(5), a => a > 5)).toEqual(false)
    })
})

describe("all", () => {

    it("asserts true for every statement about empty streams", () => {
        expect(Stream.all(Stream.just([]), () => true)).toEqual(true)
    })

    it("does not assert that all numbers are smaller than 5", () => {
        expect(Stream.all(Stream.natural(), a => a < 5)).toEqual(false)
    })

    it("asserts that at least the first ones are all ones", () => {
        expect(Stream.all(Stream.constant().take(5), a => a === 1)).toEqual(true)
    })
})

describe("map", () => {

    it("maps empty streams", () => {
        expect(Stream.evaluate(Stream.just([]).map(() => true))).toEqual([])
    })

    it("maps numbers", () => {
        expect(Stream.evaluate(Stream.constant().map(n => n.toString()).take(5))).toEqual(["1", "1", "1", "1", "1"])
    })
})

describe("filter", () => {

    it("filters empty streams", () => {
        expect(Stream.evaluate(Stream.just([]).filter(() => true))).toEqual([])
    })

    it("filters numbers", () => {
        expect(Stream.evaluate(Stream.natural().filter(n => n % 2 === 0).take(5))).toEqual([2, 4, 6, 8, 10])
    })
})

describe("flatmap", () => {

    it("flattens empty streams", () => {
        expect(Stream.evaluate(Stream.just([]).flatMap(() => Stream.just([])))).toEqual([])
    })

    it("can flatmap on infinite streams", () => {
        expect(Stream.evaluate(Stream.natural().flatMap(n => Stream.constant(n).take(2)).take(5))).toEqual([1, 1, 2, 2, 3])
    })
})

describe("append", () => {

    it("can append streams together", () => {
        expect(Stream.evaluate(Stream.just([] as number[]).append(() => Stream.just([1, 2])))).toEqual([1, 2])
        expect(Stream.evaluate(Stream.just([1, 2]).append(() => Stream.just([] as number[])))).toEqual([1, 2])
    })
})

describe("unfold", () => {

    it("unfolds to Empty if only None is given", () => {
        expect(Stream.evaluate(Stream.unfold({}, () => new None()))).toEqual([])
    })

    it("unfolds until None Stream until None is given", () => {
        expect(Stream.evaluate(Stream.unfold({ c: 5 }, (state) => state.c === 0 ? new None() : new Some(
            {
                state: { c: state.c - 1 },
                value: state.c
            }
        )))).toEqual([5, 4, 3, 2, 1])
    })
})

describe("iterator", () => {

    it("constructs a stream from an iterator", () => {
        const s = new Set()
        s.add(1)
        s.add(2)
        s.add(3)

        expect(Stream.evaluate(Stream.iterator(s.values()))).toEqual([1, 2, 3])
    })
})

describe("find", () => {

    it("can find none on empty stream", () => {
        expect(Stream.find(Stream.just([]), () => true)).toEqual(new None())
    })

    it("can find none on empty stream", () => {
        expect(Stream.find(Stream.natural(1), (n) => n === 5)).toEqual(new Some(5))
    })
})

describe("interval", () => {

    it("gives the interval", () => {
        expect(Stream.evaluate(Stream.interval(-14, -12))).toEqual([-14, -13, -12])
    })
})
