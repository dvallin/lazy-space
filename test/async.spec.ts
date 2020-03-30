import { Async, runAsync, map, bind, just, then, join } from '../src/async'
import { success, failure, isSuccess } from '../src/try'

describe('Async', () => {
    describe('map', () => {
        it('maps on resolve', () => {
            const value = map(just(Promise.resolve('1')), (s) => Number(s))
            return expect(value).resolves.toEqual(1)
        })

        it('does not map on reject', () => {
            const value = map(just(Promise.reject('1')), (s) => Number(s))
            return expect(value).rejects.toEqual('1')
        })
    })

    describe('bind', () => {
        it('binds on resolve', () => {
            const value = bind(just(Promise.resolve('1')), (s) => Promise.resolve(Number(s)))
            return expect(value).resolves.toEqual(1)
        })

        it('does not bind on reject', () => {
            const value = bind(just(Promise.reject('1')), (s) => Promise.resolve(Number(s)))
            return expect(value).rejects.toEqual('1')
        })
    })

    describe('then', () => {
        it('chains on resolve', () => {
            const value = then(
                (a: string) => just(Promise.resolve(a)),
                (b) => Promise.resolve(Number('2' + b))
            )
            return expect(value('1')).resolves.toEqual(21)
        })

        it('does not chain on reject', () => {
            const value = then(
                (a: string) => just(Promise.reject(a)),
                (b) => Promise.resolve(Number('2' + b))
            )
            return expect(value('1')).rejects.toEqual('1')
        })
    })

    describe('join', () => {
        it('flattens promises', () => {
            const b: Async<Async<string>> = just(Promise.resolve<Async<string>>(just(Promise.resolve('1'))))
            const value = join(b)
            return expect(value).resolves.toEqual('1')
        })
    })

    describe('runAsync', () => {
        const error = new Error('error')

        it('unwraps resolved promises', async () => {
            const value = await runAsync(just(Promise.resolve(1)))
            expect(isSuccess(value)).toBeTruthy()
            expect(value).toEqual(success(1))
        })

        it('unwraps rejected promises', async () => {
            const value = await runAsync(just(Promise.reject(error)))
            expect(isSuccess(value)).toBeFalsy()
            expect(value).toEqual(failure(error))
        })

        it('unwraps thrown errors as rejections', async () => {
            const value = await runAsync(
                just(
                    new Promise((_r) => {
                        throw error
                    })
                )
            )
            expect(isSuccess(value)).toBeFalsy()
            expect(value).toEqual(failure(error))
        })

        it('rejects thrown values that are no errors', () => {
            const value = runAsync(
                just(
                    new Promise((_r) => {
                        throw 1
                    })
                )
            )
            expect(value).rejects.toEqual(1)
        })
    })
})
