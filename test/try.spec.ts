import { Try, TryT, List } from '../src'
import { testMonad } from './monad.tests'

const right = Try.right
const left = Try.left

describe('try', () => {
  testMonad(Try.lift(''), async (a, b) => expect(a.value).toEqual(b.value))

  describe('map', () => {
    it('maps left value', () => {
      expect(left('1').map(Number)).toEqual(left(1))
    })
    it('does not map right value', () => {
      expect(right(new Error()).map(Number)).toEqual(right(new Error()))
    })
  })

  describe('flatMap', () => {
    it('binds to the left value', () => {
      expect(left('1').flatMap((s) => left(Number(s)))).toEqual(left(1))
    })
    it('binds to the right value', () => {
      expect(left('1').flatMap((s) => right(new Error(s)))).toEqual(right(new Error('1')))
    })
    it('works on right value', () => {
      expect(right<number>(new Error('1')).flatMap((s) => left(Number(s)))).toEqual(right(new Error('1')))
    })
  })

  describe('join', () => {
    it('flattens lefts', () => {
      expect(Try.join(left(left('1')))).toEqual(left('1'))
    })
    it('does not flatten rights', () => {
      expect(Try.join(right(new Error()))).toEqual(right(new Error()))
    })
  })

  describe('unwrap', () => {
    it('passes left value', () => {
      expect(
        left<number>(1).unwrap(
          (l) => l + 1,
          (e) => e.message
        )
      ).toEqual(2)
    })
    it('passes right value', () => {
      expect(
        right<number>(new Error('message')).unwrap(
          (l) => l + 1,
          (e) => e.message
        )
      ).toEqual('message')
    })
  })

  describe('recover', () => {
    it('returns left', () => {
      expect(left(1).recover((r) => '' + r)).toEqual(1)
    })
    it('passes right into function', () => {
      expect(right(new Error('message')).recover((e) => e.message)).toEqual('message')
    })
  })

  describe('flatRecover', () => {
    it('returns left', () => {
      expect(left(1).flatRecover((e) => left(e.message))).toEqual(left(1))
    })
    it('passes left into function', () => {
      expect(right(new Error('message')).flatRecover((e) => left(e.message))).toEqual(left('message'))
    })
    it('passes right into function', () => {
      expect(right(new Error('message')).flatRecover(() => right(new Error('message2')))).toEqual(right(new Error('message2')))
    })
  })

  describe('get', () => {
    it('returns left', () => {
      expect(left(1).get()).toEqual(1)
    })
    it('returns right', () => {
      expect(right(new Error('message')).get()).toEqual(new Error('message'))
    })
  })

  describe('getOrElse', () => {
    it('returns left', () => {
      expect(left(1).getOrElse(2)).toEqual(1)
    })
    it('returns value', () => {
      expect(right(new Error('message')).getOrElse(2)).toEqual(2)
    })
  })

  describe('getOrThrow', () => {
    it('returns left', () => {
      expect(left(1).getOrThrow(new Error())).toEqual(1)
    })
    it('throws error', () => {
      expect(() => right(new Error('message')).getOrThrow(new Error())).toThrow()
    })
  })

  describe('or', () => {
    it('gets first left', () => {
      expect(left(1).or(left(2))).toEqual(left(1))
      expect(right(new Error('message')).or(left(2))).toEqual(left(2))
    })
    it('gets last right', () => {
      expect(right(new Error('message')).or(right(new Error('message2')))).toEqual(right(new Error('message2')))
    })
  })

  describe('and', () => {
    it('gets first right', () => {
      expect(right(new Error('message')).and(right(new Error('message2')))).toEqual(right(new Error('message')))
      expect(left(1).and(right(new Error('message')))).toEqual(right(new Error('message')))
    })
    it('gets last left', () => {
      expect(left(1).and(left(2))).toEqual(left(2))
    })
  })

  describe('ofMap', () => {
    it('lifts and maps', () => {
      expect(
        Try.of('v')
          .ofMap((v) => v)
          .isSuccess()
      ).toBeTruthy()
      expect(
        Try.of('v')
          .ofMap((_v) => new Error(''))
          .isFailure()
      ).toBeTruthy()
      expect(
        Try.failure(new Error(''))
          .ofMap((_v) => new Error(''))
          .isFailure()
      ).toBeTruthy()
    })
  })

  describe('equals', () => {
    it('returns true if equal', () => {
      expect(left(1).equals(left(1))).toBeTruthy()
      const e = new Error('message')
      expect(right(e).equals(right(e))).toBeTruthy()
    })
    it('returns false if not equal', () => {
      expect(left(1).equals(left(2))).toBeFalsy()
      expect(left(1).equals(right(new Error('message')))).toBeFalsy()
      expect(right(new Error('message')).equals(right(new Error('message')))).toBeFalsy()
      expect(right(new Error('message')).equals(left(1))).toBeFalsy()
    })
  })

  describe('filter', () => {
    it('filters', () => {
      expect(
        Try.of('v')
          .filter((v) => v === 'v')
          .isSuccess()
      ).toBeTruthy()
      expect(
        Try.of('u')
          .filter((v) => v === 'v')
          .isFailure()
      ).toBeTruthy()
      expect(
        Try.failure(new Error('error'))
          .filter((v) => v === 'v')
          .isFailure()
      ).toBeTruthy()
    })
  })

  describe('filterType', () => {
    it('filters with type conversion', () => {
      expect(
        Try.of<string | number>('v')
          .filterType((v): v is string => typeof v === 'string')
          .isSuccess()
      ).toBeTruthy()
      expect(
        Try.of<string | number>(1)
          .filterType((v): v is string => typeof v === 'string')
          .isFailure()
      ).toBeTruthy()
      expect(
        Try.of<string | number>(new Error('error'))
          .filterType((v): v is string => typeof v === 'string')
          .isFailure()
      ).toBeTruthy()
    })
  })
})

describe('TryT', () => {
  testMonad(TryT.lift(1), async (a, b) => expect(a.value).toEqual(b.value))

  const list = new TryT(List.of([right<number>(new Error('message')), left(2)]))
  it('maps', () => {
    const c = list.map((s) => s + 1)
    expect((c.value as List<Try<number>>).toArray()).toEqual([right(new Error('message')), left(3)])
  })

  it('flatmaps', () => {
    const c = list.flatMap((s) => new TryT(List.of([left(s + 1)])))
    expect((c.value as List<Try<number>>).toArray()).toEqual([right(new Error('message')), left(3)])
  })
})