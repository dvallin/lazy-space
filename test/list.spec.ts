import { join, pipe, natural, take, toArray, just, List, empty, repeat, drop } from '../src/list'
import { some, none } from '../src/option'

describe('List', () => {
    describe('map', () => {
        it('works on infinite lists', () => {
            // when
            const nx2 = natural().map((v) => v * 2)

            // then
            expect(toArray(take(nx2, 3))).toEqual([2, 4, 6])
        })

        it('can take very long lists', () => {
            // when
            const nx2 = natural().map((v) => v * 2)

            // then
            expect(toArray(take(nx2, 6000))).toHaveLength(6000)
        })
    })

    describe('bind', () => {
        it('works on finite lists', () => {
            const list = just([3, 3]).flatMap((s) => just([2 * s, 2 * s]))

            // then
            expect(toArray(list)).toEqual([6, 6, 6, 6])
        })

        it('works on infinite lists', () => {
            // when
            const nxn = natural().flatMap((x) => natural().map((y) => ({ x, y })))

            // then
            expect(toArray(take(nxn, 3))).toEqual([
                { x: 1, y: 1 },
                { x: 1, y: 2 },
                { x: 1, y: 3 },
            ])
        })

        it('can take very long lists', () => {
            // when
            const nxn = natural().flatMap((x) => natural().map((y) => ({ x, y })))

            // then
            expect(toArray(take(nxn, 6000))).toHaveLength(6000)
        })
    })

    describe('then', () => {
        it('works on finite lists', () => {
            const list = pipe(
                (s: number) => just([s, s]),
                (s) => just([2 * s, 2 * s])
            )

            // then
            expect(toArray(take(list(3), 5))).toEqual([6, 6, 6, 6])
        })

        it('works on infinite lists', () => {
            const n = pipe(natural, natural)

            // then
            expect(toArray(take(n(0), 3))).toEqual([0, 1, 2])
        })
    })

    describe('join', () => {
        it('flattens lists', () => {
            const listOfLists: List<List<number>> = just([just([2, 2]), just([2, 2])])
            const list = join(listOfLists)

            // then
            expect(toArray(take(list, 5))).toEqual([2, 2, 2, 2])
        })

        it('works on infinite lists', () => {
            const doubles = join(natural().map((n) => just([n, n])))

            // then
            expect(toArray(take(doubles, 5))).toEqual([1, 1, 2, 2, 3])
        })

        it('can join very long lists', () => {
            // when
            const doubles = join(natural().map((n) => just([n, n])))

            // then
            expect(toArray(take(doubles, 6000))).toHaveLength(6000)
        })
    })

    describe('head', () => {
        it('takes first', () => {
            expect(natural().head).toEqual(some(1))
        })

        it('takes first twice', () => {
            const n = natural()
            expect(n.head).toEqual(some(1))
            expect(n.head).toEqual(some(1))
            expect(n.tail().head).toEqual(some(2))
        })

        it('is invalid on empty lists', () => {
            expect(empty().head).toEqual(none())
        })
    })

    describe('tail', () => {
        it('takes tail', () => {
            expect(natural().tail().head).toEqual(some(2))
        })
    })

    describe('takeWhile', () => {
        it('takes', () => {
            expect(toArray(natural().takeWhile((n) => n < 2))).toEqual([1])
        })
    })

    describe('dropWhile', () => {
        it('drops', () => {
            expect(
                toArray(
                    natural()
                        .dropWhile((n) => n < 2)
                        .take()
                )
            ).toEqual([2])
        })
    })

    describe('take', () => {
        it('takes', () => {
            expect(toArray(natural().take(1))).toEqual([1])
            expect(toArray(take(natural()))).toEqual([1])
        })
    })

    describe('drop', () => {
        it('drops', () => {
            expect(toArray(natural().drop().take(1))).toEqual([2])
            expect(toArray(drop(natural()).take(1))).toEqual([2])
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
            expect(natural().find((v) => v === 6000)).toEqual(some(6000))
        })

        it('works on undefines', () => {
            expect(repeat(undefined).find((v) => v === undefined)).toEqual(some(undefined))
        })

        it('returns invalid if cannot find element', () => {
            expect(
                natural()
                    .take(5)
                    .find((v) => v === 6)
            ).toEqual(none())
        })
    })

    describe('append', () => {
        it('finds', () => {
            expect(toArray(just([1, 1]).append(() => just([2, 2])))).toEqual([1, 1, 2, 2])
        })
    })
})
