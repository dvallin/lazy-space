import { Async } from '../src/async'
import { Try } from '../src/try'

describe('Async', () => {
    describe('map', () => {
        it('maps on resolve', () => {
            const value = Async.resolve('1').map((s) => Number(s))
            return expect(value.promise).resolves.toEqual(1)
        })

        it('maps empty', () => {
            const value = Async.empty().map((s) => Number(s))
            return expect(value.promise).resolves.toEqual(Number.NaN)
        })

        it('does not map on reject', () => {
            const value = Async.reject('1').map((s) => Number(s))
            return expect(value.promise).rejects.toEqual('1')
        })
    })

    describe('flatMap', () => {
        it('flatmaps on resolve', () => {
            const value = Async.resolve('1').flatMap((s) => Async.resolve(Number(s)))
            return expect(value.promise).resolves.toEqual(1)
        })

        it('flatmaps empty', () => {
            const value = Async.empty().flatMap((s) => Async.resolve(Number(s)))
            return expect(value.promise).resolves.toEqual(Number.NaN)
        })

        it('does not flatmap on reject', () => {
            const value = Async.reject('1').flatMap((s) => Async.resolve(Number(s)))
            return expect(value.promise).rejects.toEqual('1')
        })
    })

    describe('pipe', () => {
        it('chains on resolve', () => {
            const value = Async.pipe(
                (a: string) => Async.resolve(a),
                (b) => Async.resolve(Number('2' + b))
            )
            return expect(value('1').promise).resolves.toEqual(21)
        })

        it('does not chain on reject', () => {
            const value = Async.pipe(
                (a: string) => Async.lift(Promise.reject(a)),
                (b) => Async.resolve(Number('2' + b))
            )
            return expect(value('1').promise).rejects.toEqual('1')
        })
    })

    describe('join', () => {
        it('flattens promises', () => {
            const value = Async.join(Async.resolve(Async.resolve('1')))
            return expect(value.promise).resolves.toEqual('1')
        })
    })

    describe('runAsync', () => {
        const error = new Error('error')

        it('unwraps resolved promises', async () => {
            const value = await Async.resolve(1).run()
            expect(Try.isSuccess(value)).toBeTruthy()
            expect(value).toEqual(Try.success(1))
        })

        it('unwraps rejected promises', async () => {
            const value = await Async.empty()
                .flatMap(() => Async.reject(error))
                .run()
            expect(Try.isSuccess(value)).toBeFalsy()
            expect(value).toEqual(Try.failure(error))
        })

        it('unwraps thrown errors as rejections', async () => {
            const value = await Async.lift(
                new Promise((_r) => {
                    throw error
                })
            ).run()
            expect(Try.isSuccess(value)).toBeFalsy()
            expect(value).toEqual(Try.failure(error))
        })
    })
})
