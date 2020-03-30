import {
    map,
    join,
    then,
    natural,
    take,
    drop,
    toArray,
    bind,
    just,
    List,
    head,
    empty,
    tail,
    fold,
    repeat,
    some,
    all,
    find,
} from '../src/list'
import { invalid, just as justOption } from '../src/option'

describe('List', () => {
    describe('map', () => {
        it('works on infinite lists', () => {
            // given
            const n = natural()

            // when
            const nx2 = map(n, (v) => v * 2)

            // then
            expect(toArray(take(nx2, 3))).toEqual([2, 4, 6])
        })
    })

    describe('bind', () => {
        it('works on finite lists', () => {
            const list = bind(just([3, 3]), (s) => just([2 * s, 2 * s]))

            // then
            expect(toArray(take(list, 5))).toEqual([6, 6, 6, 6])
        })

        it('works on infinite lists', () => {
            // given
            const n = natural()

            // when
            const nxn = bind(n, (x) => map(natural(), (y) => ({ x, y })))

            // then
            expect(toArray(take(nxn, 3))).toEqual([
                { x: 1, y: 1 },
                { x: 1, y: 2 },
                { x: 1, y: 3 },
            ])
        })
    })

    describe('then', () => {
        it('works on finite lists', () => {
            const list = then(
                (s: number) => just([s, s]),
                (s) => just([2 * s, 2 * s])
            )

            // then
            expect(toArray(take(list(3), 5))).toEqual([6, 6, 6, 6])
        })

        it('works on infinite lists', () => {
            const n = then(natural, natural)

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
            const doubles = join(map(natural(), (n) => just([n, n])))

            // then
            expect(toArray(take(doubles, 5))).toEqual([1, 1, 2, 2, 3])
        })
    })

    describe('head', () => {
        it('takes first', () => {
            expect(head(natural())).toEqual(justOption(1))
        })

        it('is invalid on empty lists', () => {
            expect(head(empty())).toEqual(invalid())
        })
    })

    describe('tail', () => {
        it('takes tail', () => {
            expect(head(tail(natural()))).toEqual(justOption(2))
        })
    })

    describe('take', () => {
        it('takes', () => {
            expect(toArray(take(natural()))).toEqual([1])
        })
    })

    describe('drop', () => {
        it('drops', () => {
            expect(toArray(take(drop(natural())))).toEqual([2])
        })
    })

    describe('fold', () => {
        it('reduces', () => {
            expect(fold(take(repeat(1), 5), 3, (l, r) => l + r)).toEqual(8)
        })
    })

    describe('all', () => {
        it('is true if all are true', () => {
            expect(all(take(natural(), 5), (v) => v < 6)).toBeTruthy()
        })

        it('works on undefines', () => {
            expect(all(take(repeat(undefined), 5), (v) => v === undefined)).toBeTruthy()
        })

        it('is false if at least one is false', () => {
            expect(all(natural(), (v) => v < 6)).toBeFalsy()
        })
    })

    describe('some', () => {
        it('is true if at least one is true', () => {
            expect(some(natural(), (v) => v > 4)).toBeTruthy()
        })

        it('works on undefines', () => {
            expect(some(repeat(undefined), (v) => v === undefined)).toBeTruthy()
        })

        it('is false if none is true', () => {
            expect(some(take(natural(), 5), (v) => v > 5)).toBeFalsy()
        })
    })

    describe('find', () => {
        it('finds', () => {
            expect(find(natural(), (v) => v === 6)).toEqual(justOption(6))
        })

        it('works on undefines', () => {
            expect(find(repeat(undefined), (v) => v === undefined)).toEqual(justOption(undefined))
        })

        it('returns invalid if cannot find element', () => {
            expect(find(take(natural(), 5), (v) => v === 6)).toEqual(invalid())
        })
    })
})
