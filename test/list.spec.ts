import { List, Option } from '../src'
import { testMonad } from './monad.tests'

const { pipe, of, take, natural, join, repeat, drop } = List

describe('List', () => {
    testMonad(List.empty(), async (a, b) => expect(a.toArray()).toEqual(b.toArray()))

    describe('map', () => {
        it('works on infinite lists', () => {
            const nx2 = natural().map((v) => v * 2)
            expect(List.toArray(take(nx2, 3))).toEqual([2, 4, 6])
        })

        it('can take very long lists', () => {
            const nx2 = natural().map((v) => v * 2)
            expect(List.toArray(take(nx2, 6000))).toHaveLength(6000)
        })
    })

    describe('bind', () => {
        it('works on finite lists', () => {
            const list = of([3, 3]).flatMap((s) => of([2 * s, 2 * s]))
            expect(List.toArray(list)).toEqual([6, 6, 6, 6])
        })

        it('works on infinite lists', () => {
            const nxn = natural().flatMap((x) => natural().map((y) => ({ x, y })))
            expect(List.toArray(take(nxn, 3))).toEqual([
                { x: 1, y: 1 },
                { x: 1, y: 2 },
                { x: 1, y: 3 },
            ])
        })

        it('can take very long lists', () => {
            const nxn = natural().flatMap((x) => natural().map((y) => ({ x, y })))
            expect(List.toArray(take(nxn, 6000))).toHaveLength(6000)
        })
    })

    describe('then', () => {
        it('works on finite lists', () => {
            const list = of([3, 3]).pipe((s) => of([2 * s, 2 * s]))
            expect(List.toArray(take(list, 5))).toEqual([6, 6, 6, 6])
        })

        it('works on infinite lists', () => {
            const n = pipe(natural, natural)
            expect(List.toArray(take(n(0), 3))).toEqual([0, 1, 2])
        })
    })

    describe('join', () => {
        it('flattens lists', () => {
            const listOfLists: List<List<number>> = of([of([2, 2]), of([2, 2])])
            const list = join(listOfLists)

            // then
            expect(List.toArray(take(list, 5))).toEqual([2, 2, 2, 2])
        })

        it('works on infinite lists', () => {
            const doubles = join(natural().map((n) => of([n, n])))

            // then
            expect(List.toArray(take(doubles, 5))).toEqual([1, 1, 2, 2, 3])
        })

        it('can join very long lists', () => {
            // when
            const doubles = join(natural().map((n) => of([n, n])))

            // then
            expect(List.toArray(take(doubles, 6000))).toHaveLength(6000)
        })
    })

    describe('head', () => {
        it('takes first', () => {
            expect(List.head(natural())).toEqual(Option.some(1))
            expect(natural().head).toEqual(Option.some(1))
        })

        it('takes first twice', () => {
            const n = natural()
            expect(n.head).toEqual(Option.some(1))
            expect(n.head).toEqual(Option.some(1))
            expect(n.tail().head).toEqual(Option.some(2))
        })

        it('is invalid on empty lists', () => {
            expect(List.empty().head).toEqual(Option.none())
        })
    })

    describe('tail', () => {
        it('takes tail', () => {
            expect(List.tail(natural()).head).toEqual(Option.some(2))
            expect(natural().tail().head).toEqual(Option.some(2))
        })
    })

    describe('takeWhile', () => {
        it('takes on infinite lists', () => {
            expect(List.toArray(natural().takeWhile((n) => n < 2))).toEqual([1])
        })

        it('takes full lists', () => {
            expect(List.toArray(of([1, 2, 3]).takeWhile((n) => n < 100))).toEqual([1, 2, 3])
        })
    })

    describe('dropWhile', () => {
        it('drops', () => {
            expect(
                List.toArray(
                    natural()
                        .dropWhile((n) => n < 2)
                        .take()
                )
            ).toEqual([2])
        })

        it('drops full lists', () => {
            expect(List.toArray(of([1, 2, 3]).dropWhile((n) => n < 100))).toEqual([])
        })

        it('drops finite lists', () => {
            expect(List.toArray(of([1, 2, 3]).dropWhile((n) => n < 2))).toEqual([2, 3])
        })
    })

    describe('take', () => {
        it('takes', () => {
            expect(List.toArray(natural().take(1))).toEqual([1])
            expect(List.toArray(take(natural()))).toEqual([1])
        })

        it('takes empty', () => {
            expect(List.empty().take().head).toEqual(Option.none())
        })
    })

    describe('drop', () => {
        it('drops', () => {
            expect(List.toArray(natural().drop().take(1))).toEqual([2])
            expect(List.toArray(drop(natural()).take(1))).toEqual([2])
        })

        it('drops empty', () => {
            expect(List.empty().drop().head).toEqual(Option.none())
        })
    })

    describe('fold', () => {
        it('reduces', () => {
            expect(
                repeat(1)
                    .take(5)
                    .fold(3, (l, r) => l + r)
            ).toEqual(8)
        })

        it('reduces very long lists', () => {
            expect(
                repeat(1)
                    .take(6000)
                    .fold(3, (l, r) => l + r)
            ).toEqual(6003)
        })
    })

    describe('all', () => {
        it('is true if all are true', () => {
            expect(
                natural()
                    .take(5)
                    .all((v) => v < 6)
            ).toBeTruthy()
        })

        it('works on undefines', () => {
            expect(
                repeat(undefined)
                    .take(5)
                    .all((v) => v === undefined)
            ).toBeTruthy()
        })

        it('is false if at least one is false', () => {
            expect(natural().all((v) => v < 6)).toBeFalsy()
        })
    })

    describe('some', () => {
        it('is true if at least one is true', () => {
            expect(natural().some((v) => v > 4)).toBeTruthy()
        })

        it('works on undefines', () => {
            expect(repeat(undefined).some((v) => v === undefined)).toBeTruthy()
        })

        it('is false if none is true', () => {
            expect(
                natural()
                    .take(5)
                    .some((v) => v > 5)
            ).toBeFalsy()
        })
    })

    describe('find', () => {
        it('finds', () => {
            expect(natural().find((v) => v === 6000)).toEqual(Option.some(6000))
        })

        it('works on undefines', () => {
            expect(repeat(undefined).find((v) => v === undefined)).toEqual(Option.some(undefined))
        })

        it('returns invalid if cannot find element', () => {
            expect(
                natural()
                    .take(5)
                    .find((v) => v === 6)
            ).toEqual(Option.none())
        })
    })

    describe('filter', () => {
        it('filters', () => {
            expect(
                natural()
                    .filter((v) => v % 2 === 0)
                    .take(3)
                    .toArray()
            ).toEqual([2, 4, 6])
        })

        it('works on undefines', () => {
            expect(
                repeat(undefined)
                    .filter((v) => v === undefined)
                    .take(2)
                    .toArray()
            ).toEqual([undefined, undefined])
        })

        it('filters to empty list (on finite lists)', () => {
            expect(
                natural()
                    .take(5)
                    .filter((v) => v === 6)
                    .size()
            ).toEqual(0)
        })
    })

    describe('filterType', () => {
        it('filters', () => {
            expect(
                natural()
                    .map((i) => (i % 2 === 0 ? i : 'this is not an even number'))
                    .filterType((v): v is number => typeof v === 'number')
                    .take(3)
                    .toArray()
            ).toEqual([2, 4, 6])
        })
    })

    describe('concat', () => {
        it('concats whole lists', () => {
            expect(
                of([1, 2])
                    .concat(() => of([3, 4]))
                    .toArray()
            ).toEqual([1, 2, 3, 4])
        })
    })

    describe('append', () => {
        it('appends single values', () => {
            expect(List.lift(1).append(2).append(3).toArray()).toEqual([1, 2, 3])
        })
    })

    describe('batch', () => {
        it('batches lists according to given window', () => {
            expect(of([1, 2, 3, 4, 5]).batch(1).toArray()).toEqual([[1], [2], [3], [4], [5]])
            expect(of([1, 2, 3, 4, 5]).batch(2).toArray()).toEqual([[1, 2], [3, 4], [5]])
            expect(of([1, 2, 3, 4, 5]).batch(2, 1).toArray()).toEqual([[1, 2], [2, 3], [3, 4], [4, 5], [5]])
            expect(of([1, 2, 3, 4, 5]).batch(3, 4).toArray()).toEqual([[1, 2, 3], [5]])
        })
    })

    describe('prepend', () => {
        it('prepends single values', () => {
            expect(List.lift(1).prepend(2).prepend(3).toArray()).toEqual([3, 2, 1])
        })
    })

    describe('size', () => {
        it('takes size', () => {
            expect(of([1, 1]).size()).toEqual(2)
        })
    })

    describe('isEmpty', () => {
        it('true on empty', () => {
            expect(of([]).isEmpty()).toBeTruthy()
        })
        it('false on finite', () => {
            expect(of([1, 1]).isEmpty()).toBeFalsy()
        })
        it('false on infinite', () => {
            expect(repeat(1).isEmpty()).toBeFalsy()
        })
    })

    describe('reverses', () => {
        it('takes size', () => {
            expect(List.toArray(of([1, 2, 3]).reverse())).toEqual([3, 2, 1])
        })
    })
})
