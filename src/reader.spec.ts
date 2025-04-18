import { beforeEach, describe, expect, it, vi } from 'vitest'
import { List, Option, Reader, ReaderT } from '.'
import { testMonad } from './monad.tests'

interface Context {
  env: { readonly [key: string]: string }
  errors: string[]
}

function readKey(key: string): Reader<Context, Option<string>> {
  return Reader.lift(c => Option.of(c.env[key]))
}
function unwrapKey(key: Option<string>): Reader<Context, string> {
  return Reader.lift(c => {
    if (Option.isNone(key)) {
      c.errors.push('could not find key')
    }
    return Option.recover(key, () => 'missing')
  })
}

describe('Reader', () => {
  testMonad(Reader.empty(), async (a, b) => expect(a.read({})).toEqual(b.read({})))

  let context: Context
  beforeEach(() => {
    context = {
      env: {
        env1: '1',
      },
      errors: [],
    }
  })

  describe('map', () => {
    it('maps a pure function onto a reader', () => {
      const pipeline = (key: string): Reader<Context, string> =>
        readKey(key).map(value => Option.recover(value, () => 'missing'))
      expect(pipeline('env1').read(context)).toEqual('1')
      expect(pipeline('env2').read(context)).toEqual('missing')
    })
  })

  describe('flatMap', () => {
    it('maps a pipeline step onto a reader', () => {
      const pipeline = (key: string): Reader<Context, string> => readKey(key).flatMap(unwrapKey)
      expect(pipeline('env1').read(context)).toEqual('1')
      expect(pipeline('env2').read(context)).toEqual('missing')
    })
  })

  describe('with', () => {
    it('makes side effects', () => {
      const fn = vi.fn()
      readKey('env2').with(fn).read(context)
      expect(fn).toHaveBeenCalledWith(Option.none(), context)
    })
  })

  describe('join', () => {
    it('flattens reader', () => {
      const pipeline = (key: string): Reader<Context, string> => Reader.join(readKey(key).map(unwrapKey))
      const result = pipeline('env2').read(context)
      expect(result).toEqual('missing')
      expect(context.errors).toHaveLength(1)
    })
  })

  describe('optionMap', () => {
    it('maps some', () => {
      expect(
        Reader.lift(() => 1)
          .optionMap(a => Option.some(Reader.lift(() => a)))
          .read(context),
      ).toEqual(Option.of(1))
    })
    it('maps none', () => {
      expect(
        Reader.lift(() => 1)
          .optionMap(Option.none)
          .read(context),
      ).toEqual(Option.none())
    })
  })

  describe('mapContext', () => {
    it('maps a pipeline step onto a reader', () => {
      expect(
        readKey('env2')
          .mapContext(() => ({ env: { env2: '2' }, errors: [] }))
          .read(null)
          .get(),
      ).toEqual('2')
    })
  })

  describe('just', () => {
    it('only returns value without context', () => {
      const result = Reader.just('env2').read(context)
      expect(result).toEqual('env2')
    })
  })

  describe('empty', () => {
    it('does nothing', () => {
      const result = Reader.empty().read(context)
      expect(result).toEqual(undefined)
    })
  })
})

describe('ReaderT', () => {
  testMonad(ReaderT.lift(0), async (a, b) => expect(a.value.read({})).toEqual(b.value.read({})))

  const list = new ReaderT(Reader.lift((context: string) => List.repeat(`1${context}`)))
  it('maps', () => {
    const c = list.map(s => Number.parseInt(s))
    expect((c.value.read('2') as List<number>).take(5).toArray()).toEqual([12, 12, 12, 12, 12])
  })

  it('flatmaps', () => {
    const c = list
      .flatMap(s => new ReaderT(Reader.lift((context: string) => List.of([s, context]))))
      .map(s => Number.parseInt(s))
    expect((c.value.read('2') as List<number>).take(5).toArray()).toEqual([12, 2, 12, 2, 12])
  })
})
