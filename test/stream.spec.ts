import { Async, Lazy, range, Stream } from '../src'

describe('Stream', () => {
  describe('empty', () => {
    it('is empty', async () => {
      const result = await Stream.empty().collect().run()
      expect(result.isSuccess())
      if (result.isSuccess()) {
        expect(result.value).toEqual([])
      }
    })
  })

  describe('lift', () => {
    it('emits a single element', async () => {
      const result = await Stream.empty().lift(1).collect().run()
      expect(result.isSuccess())
      if (result.isSuccess()) {
        expect(result.value).toEqual([1])
      }
    })
  })

  describe('bracket', () => {
    it('closes to array', async () => {
      const close = jest.fn()
      const result = await Stream.range(0, 3).bracket(close).collect().run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value).toEqual([0, 1, 2, 3])
      }
      expect(close).toHaveBeenCalledTimes(1)
    })

    it('closes on error', async () => {
      const close = jest.fn()
      const result = await Stream.of(Lazy.of(() => Async.reject(new Error('my message'))))
        .bracket(close)
        .collect()
        .run()
      expect(result.isFailure()).toBeTruthy()
      if (result.isFailure()) {
        expect(result.value.message).toEqual('my message')
      }
      expect(close).toHaveBeenCalledTimes(1)
    })

    it('closes to list', async () => {
      const close = jest.fn()
      const db = range(0, 3)
      const result = await Stream.of(
        Lazy.of(() => {
          expect(close).not.toHaveBeenCalled()
          return db.next()
        })
      )
        .bracket(close)
        .collectToList()
        .run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value.toArray()).toEqual([0, 1, 2, 3])
      }
      expect(close).toHaveBeenCalledTimes(1)
    })
  })

  describe('map', () => {
    it('maps to array', async () => {
      const result = await Stream.range(0, 3)
        .map((i) => i.toFixed())
        .collect()
        .run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value).toEqual(['0', '1', '2', '3'])
      }
    })
  })

  describe('flatMap', () => {
    it('chains streams', async () => {
      const result = await Stream.range(0, 2)
        .flatMap((i) => Stream.range(0, 1).map((j) => [i, j].join()))
        .collect()
        .run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value).toEqual(['0,0', '0,1', '1,0', '1,1', '2,0', '2,1'])
      }
    })

    it('closes all streams', async () => {
      const close = [jest.fn(), jest.fn(), jest.fn()]
      await Stream.range(0, 2)
        .flatMap((i) => {
          if (i > 0) {
            expect(close[i - 1]).toHaveBeenCalledTimes(1)
          }
          return Stream.range(0, 1).bracket(close[i])
        })
        .collect()
        .run()
      close.forEach((c) => expect(c).toHaveBeenCalledTimes(1))
    })
  })
})
