import { Async, Try } from '../src'
import { testMonad } from './monad.tests'

describe('Async', () => {
  testMonad(Async.empty(), async (a, b) => expect(await a.promise).toEqual(await b.promise))

  describe('map', () => {
    it('maps on resolve', () => {
      const value = Async.resolve('1').map((s) => Number(s))
      return expect(value.promise).resolves.toEqual(1)
    })

    it('maps twice', () => {
      const value = Async.resolve('1')
        .map((s) => Number(s))
        .map((s) => s + 1)
      return expect(value.promise).resolves.toEqual(2)
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

  describe('recover', () => {
    it('maps on reject', () => {
      const value = Async.reject('1')
        .recover(() => '1')
        .map((s) => Number(s))
      return expect(value.promise).resolves.toEqual(1)
    })
  })

  describe('finally', () => {
    it('all finallies are invoked', async () => {
      const fn1 = jest.fn()
      const fn2 = jest.fn()
      await Async.resolve('1')
        .finally(fn1)
        .map((s) => Number(s))
        .finally(fn2)
        .run()
      expect(fn1).toHaveBeenCalled()
      expect(fn2).toHaveBeenCalled()
    })

    it('all finallies are invoked even on rejection', async () => {
      const fn1 = jest.fn()
      const fn2 = jest.fn()
      await Async.reject('1')
        .finally(fn1)
        .map((s) => Number(s))
        .finally(fn2)
        .run()
      expect(fn1).toHaveBeenCalled()
      expect(fn2).toHaveBeenCalled()
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

  describe('liftMap', () => {
    it('lifts and maps', () => {
      const value = Async.resolve('1').liftMap((s) => Promise.resolve(Number(s)))
      return expect(value.promise).resolves.toEqual(1)
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
      expect(Try.isFailure(value)).toBeTruthy()
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

  describe('unwrap', () => {
    const error = new Error('error')

    it('unwraps resolved promises', async () => {
      const success = jest.fn()
      const failure = jest.fn()
      await Async.resolve(1).unwrap(success, failure).run()
      expect(success).toHaveBeenCalledWith(1)
      expect(failure).not.toHaveBeenCalled()
    })

    it('unwraps rejected promises', async () => {
      const success = jest.fn()
      const failure = jest.fn()
      await Async.reject(error).unwrap(success, failure).run()
      expect(success).not.toHaveBeenCalled()
      expect(failure).toHaveBeenCalledWith(error)
    })
  })

  describe('race', () => {
    it('returns first resolving', () => {
      return expect(Async.race([Async.resolve(1), Async.reject(2), Async.resolve(3)]).promise).resolves.toEqual(1)
    })

    it('returns first rejecting', () => {
      return expect(Async.race([Async.reject(1), Async.reject(2), Async.reject(3)]).promise).rejects.toEqual(1)
    })
  })

  describe('all', () => {
    it('returns array of all resolving if all resolve', () => {
      return expect(Async.all([Async.resolve(1), Async.resolve(2), Async.resolve(3)]).promise).resolves.toEqual([1, 2, 3])
    })

    it('returns first rejecting', () => {
      return expect(Async.all([Async.resolve(1), Async.reject(2), Async.resolve(3)]).promise).rejects.toEqual(2)
    })
  })
})
