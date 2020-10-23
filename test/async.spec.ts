import { Async, Try, Lazy, List, Option } from '../src'
import { testMonad } from './monad.tests'

import * as Mockdate from 'mockdate'

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

    it('works on promises', () => {
      const value = Async.resolve('1').map((s) => Promise.resolve(Number(s)))
      return expect(value.promise).resolves.toEqual(1)
    })

    it('catches errors', () => {
      const value = Async.resolve('1').map(() => {
        throw new Error('error')
      })
      return expect(value.promise).rejects.toEqual(new Error('error'))
    })
  })

  describe('with', () => {
    it('makes side effects', async () => {
      const fn = jest.fn()
      const value = await Async.resolve('1').with(fn).run()
      expect(fn).toHaveBeenCalledWith('1')
      expect(value.value).toEqual('1')
    })
  })

  describe('recover', () => {
    it('maps on reject', () => {
      const value = Async.reject('1')
        .recover(() => '1')
        .map((s) => Number(s))
      return expect(value.promise).resolves.toEqual(1)
    })

    it('works on promises', () => {
      const value = Async.reject('1')
        .recover(() => '1')
        .map((s) => Promise.resolve(Number(s)))
      return expect(value.promise).resolves.toEqual(1)
    })
  })

  describe('flatRecover', () => {
    it('does not recover if resolved', () => {
      const value = Async.resolve('1')
        .flatRecover(() => Async.reject('2'))
        .map((s) => Number(s))
      return expect(value.promise).resolves.toEqual(1)
    })

    it('flatmaps on reject', () => {
      const value = Async.reject('1')
        .flatRecover(() => Async.resolve('2'))
        .map((s) => Number(s))
      return expect(value.promise).resolves.toEqual(2)
    })

    it('flatmaps on reject into new reject', () => {
      const value = Async.reject('1')
        .flatRecover(() => Async.reject('2'))
        .map((s) => Number(s))
      return expect(value.promise).rejects.toEqual('2')
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

    it('catches last error', async () => {
      const c = await Async.reject('1')
        .finally(() => {
          throw 'finally'
        })
        .run()
      expect(c.isFailure()).toBeTruthy()
      if (c.isFailure()) {
        expect(c.value.message).toEqual('finally')
      }
    })

    it('catches error', async () => {
      const c = await Async.resolve('1')
        .finally(() => {
          throw 'finally'
        })
        .run()
      expect(c.isFailure()).toBeTruthy()
      if (c.isFailure()) {
        expect(c.value.message).toEqual('finally')
      }
    })
  })

  describe('flatMap', () => {
    it('flatmaps on resolve', () => {
      const value = Async.resolve('1').flatMap((s) => Async.resolve(Number(s)))
      return expect(value.promise).resolves.toEqual(1)
    })

    it('flattens rejects', () => {
      const value = Async.resolve('1').flatMap((s) => Async.reject(Number(s)))
      return expect(value.promise).rejects.toEqual(1)
    })

    it('does not flatmap on reject', () => {
      const value = Async.reject('1').flatMap((s) => Async.resolve(Number(s)))
      return expect(value.promise).rejects.toEqual('1')
    })
  })

  describe('optionMap', () => {
    it('maps on resolve', () => {
      const value = Async.resolve('1').optionMap((s) => Option.of(Async.resolve(Number(s))))
      return expect(value.promise).resolves.toEqual(Option.some(1))
    })

    it('maps empty', () => {
      const value = Async.resolve('1').optionMap(() => Option.none())
      return expect(value.promise).resolves.toEqual(Option.none())
    })

    it('does not map on reject', () => {
      const value = Async.reject('1').optionMap(() => Option.none())
      return expect(value.promise).rejects.toEqual('1')
    })

    it('flattens rejects', () => {
      const value = Async.resolve('1').optionMap(() => Option.of(Async.reject(0)))
      return expect(value.promise).rejects.toEqual(0)
    })
  })

  describe('join', () => {
    it('flattens promises', () => {
      const value = Async.join(Async.resolve(Async.resolve('1')))
      return expect(value.promise).resolves.toEqual('1')
    })
  })

  describe('run', () => {
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

    it('wraps thrown strings in errors', async () => {
      const value = await Async.empty()
        .flatMap(() => Async.reject('error'))
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

  describe('execute', () => {
    it('resolves', () => expect(Async.execute((resolve) => resolve(1)).promise).resolves.toEqual(1))
    it('rejectes', () => expect(Async.execute((_, reject) => reject(new Error('error'))).promise).rejects.toEqual(new Error('error')))
    it('catches exceptions', () =>
      expect(
        Async.execute(() => {
          throw new Error('error')
        }).promise
      ).rejects.toEqual(new Error('error')))
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

  describe('toVoid', () => {
    it('swallows returned value', () => {
      return expect(Async.resolve(1).toVoid().promise).resolves.toBeUndefined()
    })
  })

  describe('fold', () => {
    it('flattens a list of asyncs into a list of values', async () => {
      const result = await Async.fold(List.of([1, 2, 3]).map(Async.lift)).run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value.toArray()).toEqual([1, 2, 3])
      }
    })
  })

  describe('chain', () => {
    it('executes all in order', async () => {
      const executions: string[] = []
      const push = (name: string): Async<void> => Async.ofLazy(Lazy.of(() => executions.push(name))).toVoid()
      const result = await Async.chain(
        Lazy.of(() => push('1')),
        Lazy.of(() => push('2')),
        Lazy.of(() => push('3'))
      ).run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(executions).toEqual(['1', '2', '3'])
    })

    it('fails if a single request fails', async () => {
      const executions: string[] = []
      const push = (name: string): Async<void> => Async.ofLazy(Lazy.of(() => executions.push(name))).toVoid()
      const result = await Async.chain(
        Lazy.of(() => push('1')),
        Lazy.of(() => Async.reject('error')),
        Lazy.of(() => push('3'))
      ).run()
      expect(Try.isFailure(result)).toBeTruthy()
      expect(executions).toEqual(['1'])
    })
  })

  describe('zip', () => {
    it('zips all in order', async () => {
      const result = await Async.zip(Async.lift(1), Async.lift('2'), Async.lift(3)).run()
      expect(Try.isSuccess(result)).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value).toEqual([1, '2', 3])
      }
    })

    it('fails if a single request fails', async () => {
      const result = await Async.both(Async.lift(1), Async.reject('2')).run()
      expect(result.isFailure()).toBeTruthy()
      expect(result.value).toEqual(new Error('2'))
    })
  })

  describe('delay', () => {
    it('delays execution', async () => {
      jest.useFakeTimers()
      const promise = Async.delay().map(() => 42).promise
      jest.runAllTimers()
      const result = await promise
      expect(result).toEqual(42)
    })
  })

  describe('debounce', () => {
    it('debounces execution', async () => {
      const d = Async.debounce(10)
      jest.useFakeTimers()
      const callback = jest.fn()
      d.eval().map(callback)
      d.eval().map(callback)

      const promise = d.eval().map(callback).promise
      jest.runAllTimers()
      await promise

      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('throttle', () => {
    it('throttles execution', async () => {
      Mockdate.set(new Date('2020-07-27T11:44:40.293Z'))
      const d = Async.throttle(10)
      const callback = jest.fn()

      const first = await d.eval().map(callback).run()

      Mockdate.set(new Date('2020-07-27T11:44:40.303Z'))
      const second = await d.eval().map(callback).run()

      Mockdate.set(new Date('2020-07-27T11:44:40.304Z'))
      const third = await d.eval().map(callback).run()

      expect(first.isSuccess()).toBeTruthy()
      expect(callback).toHaveBeenCalledTimes(2)
      expect(second.isFailure()).toBeTruthy()
      expect(third.isSuccess()).toBeTruthy()
    })
  })
})
