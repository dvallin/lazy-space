import { describe, expect, it, vi } from 'vitest'
import { Async, Lazy, List, Option, Stream, range } from '..'

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

    it('closes on downstream errors', async () => {
      let i = 1
      const result = await Stream.ofNative(async function* () {
        for (; i < 5; i++) {
          yield Promise.resolve(i)
        }
      })
        .map(() => {
          throw new Error('error')
        })
        .collect()
        .run()
      expect(result.isFailure()).toBeTruthy()
      expect(i).toEqual(1)
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
      const close = vi.fn()
      const result = await Stream.range(0, 3).bracket(close).collect().run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value).toEqual([0, 1, 2, 3])
      }
      expect(close).toHaveBeenCalledTimes(1)
    })

    it('closes on upstream error', async () => {
      const close = vi.fn()
      const result = await Stream.ofNative(async function* () {
        yield
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

    it('closes on downstream error', async () => {
      const close = vi.fn()
      const result = await Stream.range(0, 3)
        .bracket(close)
        .map(() => {
          throw new Error('my message')
        })
        .collect()
        .run()
      expect(result.isFailure()).toBeTruthy()
      if (result.isFailure()) {
        expect(result.value.message).toEqual('my message')
      }
      expect(close).toHaveBeenCalledTimes(1)
    })

    it('closes to list', async () => {
      const close = vi.fn()
      const db = range(0, 3)
      const result = await Stream.of(
        Lazy.of(() => {
          expect(close).not.toHaveBeenCalled()
          return db.next()
        }),
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
        .map(i => i.toFixed())
        .collect()
        .run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value).toEqual(['0', '1', '2', '3'])
      }
    })

    it('works with undefined (void)', async () => {
      const map = vi.fn().mockResolvedValue(undefined)
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
      const fn = vi.fn()
      const value = await Stream.lift('1').with(fn).collect().run()
      expect(fn).toHaveBeenCalledWith('1')
      expect(value.value).toEqual(['1'])
    })
  })

  describe('flatMap', () => {
    it('chains streams', async () => {
      const result = await Stream.range(0, 2)
        .flatMap(i => Stream.range(0, 1).map(j => [i, j].join()))
        .collect()
        .run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value).toEqual(['0,0', '0,1', '1,0', '1,1', '2,0', '2,1'])
      }
    })

    it('closes all streams', async () => {
      const close = [vi.fn(), vi.fn(), vi.fn()]
      await Stream.range(0, 2)
        .flatMap(i => {
          if (i > 0) {
            expect(close[i - 1]).toHaveBeenCalledTimes(1)
          }
          return Stream.range(0, 1).bracket(close[i])
        })
        .collect()
        .run()
      close.forEach(c => expect(c).toHaveBeenCalledTimes(1))
    })

    it('works with empty streams', async () => {
      const map = vi.fn()
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

    it('propagates errors up', async () => {
      const close = vi.fn()
      const result = await Stream.range(0, 2)
        .bracket(close)
        .flatMap(() =>
          Stream.repeat(1).map(() => {
            throw new Error('error')
          }),
        )
        .collect()
        .run()
      expect(close).toHaveBeenCalledTimes(1)
      expect(result.isFailure()).toBeTruthy()
    })

    it('propagates errors into current stream', async () => {
      const onError = vi.fn()
      const result = await Stream.range(0, 2)
        .flatMap(() => Stream.lift(1).onError(onError))
        .map(() => {
          throw new Error('error')
        })
        .collect()
        .run()
      expect(onError).toHaveBeenCalledTimes(1)
      expect(result.isFailure()).toBeTruthy()
    })
  })

  describe('asyncMap', () => {
    it('maps', async () => {
      const result = await Stream.range(0, 2)
        .asyncMap(i => Async.resolve(i))
        .collect()
        .run()
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value).toEqual([0, 1, 2])
      }
    })

    it('works with undefined (void)', async () => {
      const map = vi.fn().mockResolvedValue(Async.resolve(undefined))
      const result = await Stream.range(0, 2).asyncMap(map).collect().run()
      expect(map).toHaveBeenCalledTimes(3)
      expect(result.isSuccess()).toBeTruthy()
      if (result.isSuccess()) {
        expect(result.value).toHaveLength(3)
      }
    })

    it('fails on rejects', async () => {
      const result = await Stream.range(0, 2)
        .asyncMap(i => (i === 1 ? Async.reject() : Async.resolve(i)))
        .collect()
        .run()
      expect(result.isFailure()).toBeTruthy()
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
        .filter(a => a % 2 === 0)
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
        .takeWhile(i => i <= 5)
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

    it('propagates errors to source streams (and some artificial coverage)', async () => {
      const natural = vi.fn()
      const lifted = vi.fn()
      const of = vi.fn()
      const fromList = vi.fn()
      const empty = vi.fn()
      const repeat = vi.fn()
      const result = await Stream.merge([
        Stream.natural().bracket(natural).take(4),
        Stream.lift(2).bracket(lifted),
        Stream.of(Lazy.lift(Async.lift(Option.some(3)))).bracket(of),
        Stream.fromList(List.lift(3)).bracket(fromList),
        Stream.empty().bracket(empty),
        Stream.repeat(4).bracket(repeat),
      ])
        .map(() => {
          throw new Error('message')
        })
        .collect()
        .run()
      expect(result.isFailure())
      expect(natural).toHaveBeenCalled()
      expect(lifted).toHaveBeenCalled()
      expect(of).toHaveBeenCalled()
      expect(fromList).toHaveBeenCalled()
      expect(empty).toHaveBeenCalled()
      expect(repeat).toHaveBeenCalled()
    })
  })

  describe('dropWhile', () => {
    it('drops while true', async () => {
      const result = await Stream.natural()
        .dropWhile(i => i <= 5)
        .take()
        .collect()
        .run()
      expect(result.isSuccess())
      expect(result.value).toEqual([6])
    })
  })

  describe('forEach', () => {
    it('iterates over each item and closes', async () => {
      const callback = vi.fn()
      const bracket = vi.fn()
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
