import { Async, Try, Request, Lazy } from '../src'
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
        .read(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual(2)
    })
    it('does not map failed requests', async () => {
      const result = await fail
        .map((a) => a + 1)
        .read(context)
        .run()
      expect(Try.isFailure(result)).toBeTruthy()
    })
  })

  describe('recover', () => {
    it('does nothing on successful request', async () => {
      const result = await one
        .recover(() => 2)
        .read(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual(1)
    })
    it('recovers failed requests', async () => {
      const result = await fail
        .recover(() => 2)
        .read(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual(2)
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
        .read(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual(1)
    })
    it('recovers and flattens failed requests', async () => {
      const result = await fail
        .flatRecover(() => Request.lift(2))
        .read(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(result.value).toEqual(2)
    })
  })

  describe('runFlatmap', () => {
    it('flatmaps successful requests', async () => {
      const result = await one
        .runFlatmap((result) => Request.lift(result))
        .read(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(Try.join(result).value).toEqual(1)
    })
    it('successfully flatmaps failed requests', async () => {
      const result = await fail
        .runFlatmap((result) => Request.lift(result))
        .read(context)
        .run()
      expect(Try.isSuccess(result)).toBeTruthy()
      expect(Try.join(result).value).toEqual(new Error('failure'))
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
})
