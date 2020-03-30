import { left, map, bind, right, then, join, or, and } from '../src/either'

describe('either', () => {
    describe('map', () => {
        it('maps left value', () => {
            expect(map(left<string, Error>('1'), Number)).toEqual(left(1))
        })
        it('does not map right value', () => {
            expect(map(right<string, Error>(new Error()), Number)).toEqual(right(new Error()))
        })
    })

    describe('bind', () => {
        it('binds to the left value', () => {
            expect(bind(left<string, Error>('1'), (s) => left(Number(s)))).toEqual(left(1))
        })
        it('binds to the right value', () => {
            expect(bind(left<string, Error>('1'), (s) => right(new Error(s)))).toEqual(right(new Error('1')))
        })
    })

    describe('then', () => {
        it('chains lefts', () => {
            expect(
                then(
                    (s: string) => left<string, Error>(s),
                    (s) => left(Number(s))
                )('1')
            ).toEqual(left(1))
        })
        it('does not chain rights', () => {
            expect(
                then(
                    (_s) => right<string, Error>(new Error()),
                    (s) => left(Number(s))
                )('1')
            ).toEqual(right(new Error()))
        })
    })

    describe('join', () => {
        it('flattens lefts', () => {
            expect(join(left(left('1')))).toEqual(left('1'))
        })
        it('does not flatten rights', () => {
            expect(join(right(left('1')))).toEqual(right(left('1')))
        })
    })

    describe('or', () => {
        it('gets first left', () => {
            expect(or(left(1), left(2))).toEqual(left(1))
            expect(or(right(1), left(2))).toEqual(left(2))
        })
        it('gets last right', () => {
            expect(or(right(1), right(2))).toEqual(right(2))
        })
    })

    describe('and', () => {
        it('gets first right', () => {
            expect(and(right(1), right(2))).toEqual(right(1))
            expect(and(left(1), right(2))).toEqual(right(2))
        })
        it('gets last left', () => {
            expect(and(left(1), left(2))).toEqual(left(2))
        })
    })
})
