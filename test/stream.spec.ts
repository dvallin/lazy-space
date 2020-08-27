import { Stream, Async, Option } from '../src'

describe('fromCursor', () => {
  describe('collectToList', () => {
    it('closes the stream on finished processing', async () => {
      const close = jest.fn()
      let i = 0
      const next = jest.fn().mockImplementation(() => Async.lift(Option.some(++i)))
      const result = await Stream.fromCursor({ next, close }).take(5).collectToList().run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value.toArray()).toEqual([1, 2, 3, 4, 5])
      }
      expect(next).toHaveBeenCalledTimes(5)
      expect(close).toHaveBeenCalledTimes(1)
    })

    it('closes the stream on error', async () => {
      const close = jest.fn()
      const next = jest.fn().mockReturnValueOnce(Async.lift(1)).mockReturnValue(Async.reject())
      const result = await Stream.fromCursor({ next, close }).take(5).collectToList().run()
      expect(result.isSuccess()).toBeFalsy()
      expect(next).toHaveBeenCalledTimes(1)
      expect(close).toHaveBeenCalledTimes(1)
    })

    it('closes the stream on end of stream', async () => {
      const close = jest.fn()
      let i = 0
      const next = jest.fn().mockImplementation(() => Async.lift(Option.some(++i).filter((n) => n <= 5)))
      const result = await Stream.fromCursor({ next, close }).collectToList().run()
      expect(result.isSuccess()).toBeTruthy()

      if (result.isSuccess()) {
        expect(result.value.toArray()).toEqual([1, 2, 3, 4, 5])
      }
      expect(next).toHaveBeenCalledTimes(6)
      expect(close).toHaveBeenCalledTimes(1)
    })

    it('closes the stream after processing', async () => {
      let closed = false
      const close = jest.fn().mockImplementation(() => (closed = true))
      const next = jest.fn().mockImplementation(() => {
        expect(closed).toBeFalsy()
        return Async.lift(Option.some(1))
      })

      const result = await Stream.fromCursor({ next, close }).take(5).collectToList().run()

      expect(result.isSuccess()).toBeTruthy()
      expect(next).toHaveBeenCalledTimes(5)
      expect(close).toHaveBeenCalledTimes(1)
    })
  })

  function repeat<T>(n: T, close = jest.fn()): Stream<T> {
    return Stream.fromCursor({
      next: () => {
        expect(close).not.toHaveBeenCalled()
        return Async.lift(Option.some(n))
      },
      close,
    })
  }

  function natural(start = 1, close = jest.fn()): Stream<number> {
    let i = start
    return Stream.fromCursor({
      next: () => {
        expect(close).not.toHaveBeenCalled()
        return Async.lift(Option.some(i++))
      },
      close,
    })
  }

  describe('take', () => {
    it('works on empty streams', async () => {
      const result = await Stream.empty().take(2).collectToList().run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value.toArray()).toEqual([])
      }
    })

    it('works on infinite streams', async () => {
      const result = await natural().take(2).collectToList().run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value.toArray()).toEqual([1, 2])
      }
    })
  })

  describe('drop', () => {
    it('works on empty streams', async () => {
      const result = await Stream.empty().drop(2).collectToList().run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value.toArray()).toEqual([])
      }
    })

    it('works on infinite streams', async () => {
      const result = await natural().drop(2).take(2).collectToList().run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value.toArray()).toEqual([3, 4])
      }
    })
  })

  describe('map', () => {
    it('works on empty streams', async () => {
      const result = await Stream.empty<number>()
        .map((i) => i.toString())
        .collectToList()
        .run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value.toArray()).toEqual([])
      }
    })

    it('works on infinite streams', async () => {
      const result = await natural()
        .map((i) => i.toString())
        .take(2)
        .collectToList()
        .run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value.toArray()).toEqual(['1', '2'])
      }
    })
  })

  describe('concat', () => {
    it('concats two streams', async () => {
      const result = await repeat(1)
        .take(2)
        .concat(() => repeat(2))
        .take(5)
        .collectToList()
        .run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value.toArray()).toEqual([1, 1, 2, 2, 2])
      }
    })

    it('closes both streams', async () => {
      const left = jest.fn()
      const right = jest.fn()
      const result = await repeat(1, left)
        .take(2)
        .concat(() => repeat(2, right))
        .take(5)
        .collectToList()
        .run()
      expect(result.isSuccess()).toBeTruthy()
      expect(left).toHaveBeenCalledTimes(1)
      expect(right).toHaveBeenCalledTimes(1)
    })
  })

  describe('flatMap', () => {
    it('flatmaps streams', async () => {
      const result = await natural(1)
        .flatMap((i) => repeat(i).take(i))
        .take(7)
        .collectToList()
        .run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value.toArray()).toEqual([1, 2, 2, 3, 3, 3, 4])
      }
    })

    it('closes all flatmapped streams', async () => {
      const outer = jest.fn()
      const inner: jest.Mock[] = []
      await natural(1, outer)
        .flatMap((i) => {
          const close = jest.fn()
          inner.push(close)
          return repeat(i, close).take(i)
        })
        .take(7)
        .collectToList()
        .run()
      expect(outer).toHaveBeenCalledTimes(1)
      expect(inner).toHaveLength(4)
      inner.forEach((close) => expect(close).toHaveBeenCalledTimes(1))
    })
  })
})
