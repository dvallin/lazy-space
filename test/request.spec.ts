import { Async, Try, Request, Lazy, List, Option } from '../src'
import { testMonad } from './monad.tests'

const context = { some: 'context' }

const one = Request.lift(1)
const two = Request.of(() => Async.resolve(2))
const fail = Request.ofNative(() => Promise.reject('failure'))

describe('Request', () => {
  testMonad(one, async (a, b) => expect(await a.read(context).promise).toEqual(await b.read(context).promise))

  describe('map', () => {
    it('maps successful requests', async () => {
      const result = await one
        .map((a) => a + 1)
        .run(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual(2)
    })
    it('does not map failed requests', async () => {
      const result = await fail
        .map((a) => a + 1)
        .run(context)
        .run()
      expect(Try.isFailure(result)).toBeTruthy()
    })

    it('works on promises', async () => {
      const result = await one
        .map((a) => Promise.resolve(a + 1))
        .run(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual(2)
    })

    it('catches errors', async () => {
      const result = await one
        .map(() => {
          throw new Error('error')
        })
        .run(context)
        .run()
      expect(Try.isFailure(result)).toBeTruthy()
      expect(result.value).toEqual(new Error('error'))
    })
  })

  describe('with', () => {
    it('makes side effects', async () => {
      const fn = jest.fn()
      const value = await Request.lift('1').with(fn).read(context).run()
      expect(fn).toHaveBeenCalledWith('1', context)
      expect(value.value).toEqual('1')
    })
  })

  describe('recover', () => {
    it('does nothing on successful request', async () => {
      const result = await one
        .recover(() => 2)
        .run(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual(1)
    })

    it('recovers failed requests', async () => {
      const result = await fail
        .recover(() => 2)
        .run(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual(2)
    })

    it('works on promises', async () => {
      const result = await fail
        .recover(() => Promise.resolve(2))
        .run(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual(2)
    })
  })

  describe('onError', () => {
    it('does not pass onError on success', async () => {
      const onError = jest.fn()
      await one.onError(onError).run(context).run()
      expect(onError).not.toHaveBeenCalled()
    })
    it('passes errors into onError', async () => {
      const onError = jest.fn()
      await fail.onError(onError).run(context).run()
      expect(onError).toHaveBeenCalledWith('failure', { some: 'context' })
    })
  })

  describe('flatMap', () => {
    it('flatmaps successful requests', async () => {
      const result = await one
        .flatMap((a) => Request.lift(a + 1))
        .read(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual(2)
    })
    it('does not flatmap failed requests', async () => {
      const result = await fail
        .flatMap((a) => Request.lift(a + 1))
        .read(context)
        .run()
      expect(Try.isFailure(result)).toBeTruthy()
    })
  })

  describe('flatRecover', () => {
    it('does nothing on successful requests', async () => {
      const result = await one
        .flatRecover(() => Request.lift(2))
        .run(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual(1)
    })
    it('recovers and flattens failed requests', async () => {
      const result = await fail
        .flatRecover(() => Request.lift(2))
        .run(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual(2)
    })
  })

  describe('optionMap', () => {
    it('maps some requests to some', async () => {
      const result = await one
        .optionMap((a) => Option.some(Request.lift(a)))
        .run(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual(Option.some(1))
    })

    it('maps none requests to none', async () => {
      const result = await one
        .optionMap((_a) => Option.none())
        .run(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual(Option.none())
    })
  })

  describe('toVoid', () => {
    it('swallows returned value', () => {
      return expect(one.toVoid().read(context).promise).resolves.toBeUndefined()
    })
  })

  describe('empty', () => {
    it('returns undefined', () => {
      return expect(Request.empty().read(context).promise).resolves.toBeUndefined()
    })
  })

  describe('both', () => {
    it('returns successful requests', async () => {
      const result = await Request.both(one, two).read(context).run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual([1, 2])
    })

    it('fails if a single request fails', async () => {
      const result = await Request.both(one, fail).read(context).run()
      expect(Try.isFailure(result)).toBeTruthy()
    })
  })

  describe('all', () => {
    it('returns successful requests', async () => {
      const result = await Request.all([one, two]).read(context).run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual([1, 2])
    })

    it('fails if a single request fails', async () => {
      const result = await Request.all([one, fail]).read(context).run()
      expect(Try.isFailure(result)).toBeTruthy()
    })

    it('eagerly executes all', async () => {
      const executions: string[] = []
      const push = (name: string): Request<unknown, void> => Request.ofLazy(Lazy.of(() => executions.push(name))).toVoid()
      const result = await Request.all([push('1'), fail, push('2')])
        .read(context)
        .run()
      expect(Try.isFailure(result)).toBeTruthy()
      expect(executions).toEqual(['1', '2'])
    })
  })

  describe('race', () => {
    it('returns first successful request', async () => {
      const result = await Request.race([one, two]).read(context).run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual(1)
    })

    it('returns first failed request', async () => {
      const result = await Request.race([fail, two]).read(context).run()
      expect(Try.isFailure(result)).toBeTruthy()
    })
  })

  describe('joinAll', () => {
    it('returns successful requests', async () => {
      const result = await Request.joinAll(Request.lift([one, two]))
        .read(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual([1, 2])
    })

    it('fails if a single request fails', async () => {
      const result = await Request.joinAll(Request.lift([one, fail]))
        .read(context)
        .run()
      expect(Try.isFailure(result)).toBeTruthy()
    })
  })

  describe('fold', () => {
    it('flattens a list of requests into a list of values', async () => {
      const result = await Request.fold(List.of([1, 2, 3]).map(Request.lift))
        .read(context)
        .run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value.toArray()).toEqual([1, 2, 3])
      }
    })
  })

  describe('chain', () => {
    it('executes all in order', async () => {
      const executions: string[] = []
      const push = (name: string): Request<unknown, void> => Request.ofLazy(Lazy.of(() => executions.push(name))).toVoid()
      const result = await Request.chain(push('1'), push('2'), push('3')).read(context).run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(executions).toEqual(['1', '2', '3'])
    })

    it('fails if a single request fails', async () => {
      const executions: string[] = []
      const push = (name: string): Request<unknown, void> => Request.ofLazy(Lazy.of(() => executions.push(name))).toVoid()
      const result = await Request.chain(push('1'), fail, push('3')).read(context).run()
      expect(Try.isFailure(result)).toBeTruthy()
      expect(executions).toEqual(['1'])
    })
  })

  describe('chainN', () => {
    it('executes all in order', async () => {
      const executions: string[] = []
      const push = (name: string): Request<unknown, void> => Request.ofLazy(Lazy.of(() => executions.push(name))).toVoid()
      const result = await Request.chainN(push('1'), push('2'), push('3')).read(context).run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(executions).toEqual(['1', '2', '3'])
    })

    it('fails if a single request fails', async () => {
      const executions: string[] = []
      const push = (name: string): Request<unknown, void> => Request.ofLazy(Lazy.of(() => executions.push(name))).toVoid()
      const result = await Request.chainN(push('1'), fail, push('3')).read(context).run()
      expect(Try.isFailure(result)).toBeTruthy()
      expect(executions).toEqual(['1'])
    })
  })

  describe('flow', () => {
    it('passes each result into the next request', async () => {
      const pipeline = Request.flow(
        Request.lift(1),
        (i) => Request.lift('' + (i + 1)),
        (i) => Request.lift(Number.parseInt(i) * 2),
        (i) => Request.lift('' + (i + 1))
      )

      const result = await pipeline.read(context).run()

      expect(result.isSuccess()).toBeTruthy()
      expect(result.value).toEqual('5')
    })
  })

  describe('retry', () => {
    it('retries with exponential backoff', async () => {
      const delay = jest.spyOn(Async, 'delay')
      const ms = 1
      let times = 0
      const failsTwice = Request.ofNative(() => (++times < 3 ? Promise.reject('failure') : Promise.resolve(42)))
      const result = await failsTwice.retry(context, 3, ms).run()
      expect(result.isSuccess()).toBeTruthy()
      expect(result.value).toEqual(42)
      expect(delay).toHaveBeenCalledTimes(2)
      expect(delay).toHaveBeenCalledWith(ms)
      expect(delay).toHaveBeenCalledWith(2 * ms)
    })
  })
})
