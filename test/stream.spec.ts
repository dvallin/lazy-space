import { Async, Lazy, List, range, Stream } from '../src'

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

  describe('ofNative', () => {
    it('fully streams the generator', async () => {
      const result = await Stream.ofNative(async function* () {
        for (let i = 1; i < 5; i++) {
          yield Promise.resolve(i)
        }
      })
        .collect()
        .run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value).toEqual([1, 2, 3, 4])
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
      const result = await Stream.ofNative(async function* () {
        throw new Error('my message')
      })
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

    it('works with undefined (void)', async () => {
      const map = jest.fn().mockResolvedValue(undefined)
      const result = await Stream.range(0, 2).map(map).collect().run()
      expect(map).toHaveBeenCalledTimes(3)
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value).toHaveLength(3)
      }
    })
  })

  describe('with', () => {
    it('makes side effects', async () => {
      const fn = jest.fn()
      const value = await Stream.lift('1').with(fn).collect().run()
      expect(fn).toHaveBeenCalledWith('1')
      expect(value.value).toEqual(['1'])
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

    it('works with empty streams', async () => {
      const map = jest.fn()
      const result = await Stream.range(0, 2)
        .flatMap(() => {
          map()
          return Stream.empty()
        })
        .collect()
        .run()
      expect(map).toHaveBeenCalledTimes(3)
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value).toHaveLength(0)
      }
    })
  })

  describe('asyncMap', () => {
    it('maps', async () => {
      const result = await Stream.range(0, 2)
        .asyncMap((i) => Async.resolve(i))
        .collect()
        .run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value).toEqual([0, 1, 2])
      }
    })

    it('works with undefined (void)', async () => {
      const map = jest.fn().mockResolvedValue(Async.resolve(undefined))
      const result = await Stream.range(0, 2).asyncMap(map).collect().run()
      expect(map).toHaveBeenCalledTimes(3)
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value).toHaveLength(3)
      }
    })

    it('breaks on rejects', async () => {
      const result = await Stream.range(0, 2)
        .asyncMap((i) => (i === 1 ? Async.reject() : Async.resolve(i)))
        .collect()
        .run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value).toEqual([0])
      }
    })
  })

  describe('filter', () => {
    it('filter type', async () => {
      const result = await Stream.fromList(List.of(['a', 1, 'b', 2, '2']))
        .filterType((a): a is string => typeof a === 'string')
        .collect()
        .run()
      expect(result.isSuccess())
      expect(result.value).toEqual(['a', 'b', '2'])
    })
  })

  describe('filter', () => {
    it('filters stream', async () => {
      const result = await Stream.range(0, 2)
        .filter((a) => a % 2 === 0)
        .collect()
        .run()
      expect(result.isSuccess())
      expect(result.value).toEqual([0, 2])
    })
  })

  describe('scan', () => {
    it('aggregates stream', async () => {
      const result = await Stream.range(0, 2)
        .scan(0, (l, r) => l + r)
        .collect()
        .run()
      expect(result.isSuccess())
      expect(result.value).toEqual([0, 1, 3])
    })
  })

  describe('take', () => {
    it('takes n items', async () => {
      const result = await Stream.natural().take(5).collect().run()
      expect(result.isSuccess())
      expect(result.value).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('takeWhile', () => {
    it('takes while true', async () => {
      const result = await Stream.natural()
        .takeWhile((i) => i <= 5)
        .collect()
        .run()
      expect(result.isSuccess())
      expect(result.value).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('drop', () => {
    it('drops items and creates artificial coverage', async () => {
      const result = await Stream.take(Stream.natural().drop(4).drop()).collect().run()
      expect(result.isSuccess())
      expect(result.value).toEqual([6])
    })
  })

  describe('merge', () => {
    it('merges two streams', async () => {
      const result = await Stream.merge([Stream.natural().take(4), Stream.natural().take(2)])
        .collect()
        .run()
      expect(result.isSuccess())
      expect(result.value).toEqual([1, 2, 3, 4, 1, 2])
    })
  })

  describe('dropWhile', () => {
    it('drops while true', async () => {
      const result = await Stream.natural()
        .dropWhile((i) => i <= 5)
        .take()
        .collect()
        .run()
      expect(result.isSuccess())
      expect(result.value).toEqual([6])
    })
  })

  describe('forEach', () => {
    it('iterates over each item and closes', async () => {
      const callback = jest.fn()
      const bracket = jest.fn()
      const result = await Stream.repeat(2).take(5).bracket(bracket).forEach(callback).run()
      expect(result.isSuccess())
      expect(callback).toHaveBeenCalledTimes(5)
      expect(bracket).toHaveBeenCalledTimes(1)
    })
  })

  describe('join', () => {
    it('flattens streams and creates artificial coverage', async () => {
      const result = await Stream.drop(Stream.repeat(1).join(Stream.repeat(1).map(() => Stream.repeat(2))))
        .take()
        .collect()
        .run()
      expect(result.isSuccess())
      expect(result.value).toEqual([2])
    })
  })
})
