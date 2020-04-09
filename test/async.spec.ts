import { just, pipe, join, lift } from '../src/async'
import { success, failure, isSuccess } from '../src/try'

describe('Async', () => {
    describe('map', () => {
        it('maps on resolve', () => {
            const value = just(Promise.resolve('1')).map((s) => Number(s))
            return expect(value.promise).resolves.toEqual(1)
        })

        it('does not map on reject', () => {
            const value = just(Promise.reject('1')).map((s) => Number(s))
            return expect(value.promise).rejects.toEqual('1')
        })
    })

    describe('flatMap', () => {
        it('binds on resolve', () => {
            const value = just(Promise.resolve('1')).flatMap((s) => just(Number(s)))
            return expect(value.promise).resolves.toEqual(1)
        })

        it('does not bind on reject', () => {
            const value = just(Promise.reject('1')).flatMap((s) => just(Number(s)))
            return expect(value.promise).rejects.toEqual('1')
        })
    })

    describe('pipe', () => {
        it('chains on resolve', () => {
            const value = pipe(
                (a: string) => just(a),
                (b) => just(Number('2' + b))
            )
            return expect(value('1').promise).resolves.toEqual(21)
        })

        it('does not chain on reject', () => {
            const value = pipe(
                (a: string) => lift(Promise.reject(a)),
                (b) => just(Number('2' + b))
            )
            return expect(value('1').promise).rejects.toEqual('1')
        })
    })

    describe('join', () => {
        it('flattens promises', () => {
            const value = join(just(just('1')))
            return expect(value.promise).resolves.toEqual('1')
        })
    })

    describe('runAsync', () => {
        const error = new Error('error')

        it('unwraps resolved promises', async () => {
            const value = await just(1).run()
            expect(isSuccess(value)).toBeTruthy()
            expect(value).toEqual(success(1))
        })

        it('unwraps rejected promises', async () => {
            const value = await lift(Promise.reject(error)).run()
            expect(isSuccess(value)).toBeFalsy()
            expect(value).toEqual(failure(error))
        })

        it('unwraps thrown errors as rejections', async () => {
            const value = await lift(
                new Promise((_r) => {
                    throw error
                })
            ).run()
            expect(isSuccess(value)).toBeFalsy()
            expect(value).toEqual(failure(error))
        })

        it('rejects thrown values that are no errors', () => {
            const value = lift(
                new Promise((_r) => {
                    throw 1
                })
            ).run()
            expect(value).rejects.toEqual(1)
        })
    })
})
