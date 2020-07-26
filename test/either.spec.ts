import { Either, EitherT, List } from '../src'
import { testMonad } from './monad.tests'

const right = Either.right
const left = Either.left

describe('either', () => {
  testMonad(Either.lift(''), async (a, b) => expect(a.value).toEqual(b.value))

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
      expect(right<number, string>('1').flatMap((s) => left(Number(s)))).toEqual(right('1'))
    })
  })

  describe('join', () => {
    it('flattens lefts', () => {
      expect(Either.join(left(left('1')))).toEqual(left('1'))
    })
    it('does not flatten rights', () => {
      expect(Either.join(right(left('1')))).toEqual(right(left('1')))
    })
  })

  describe('unwrap', () => {
    it('passes left value', () => {
      expect(
        left<number, number>(1).unwrap(
          (l) => l + 1,
          (r) => r + 2
        )
      ).toEqual(2)
    })
    it('passes right value', () => {
      expect(
        right<number, number>(1).unwrap(
          (l) => l + 1,
          (r) => r + 2
        )
      ).toEqual(3)
    })
  })

  describe('recover', () => {
    it('returns left', () => {
      expect(left(1).recover((r) => '' + r)).toEqual(1)
    })
    it('passes right into function', () => {
      expect(right(1).recover((r) => '' + r)).toEqual('1')
    })
  })

  describe('get', () => {
    it('returns left', () => {
      expect(left(1).get()).toEqual(1)
    })
    it('throws right', () => {
      expect(() => right('error').get()).toThrow('error')
    })
  })

  describe('getOrElse', () => {
    it('returns left', () => {
      expect(left(1).getOrElse(2)).toEqual(1)
    })
    it('returns value', () => {
      expect(right('error').getOrElse(2)).toEqual(2)
    })
  })

  describe('or', () => {
    it('gets first left', () => {
      expect(left(1).or(left(2))).toEqual(left(1))
      expect(right(1).or(left(2))).toEqual(left(2))
    })
    it('gets last right', () => {
      expect(right(1).or(right(2))).toEqual(right(2))
    })
  })

  describe('and', () => {
    it('gets first right', () => {
      expect(right(1).and(right(2))).toEqual(right(1))
      expect(left(1).and(right(2))).toEqual(right(2))
    })
    it('gets last left', () => {
      expect(left(1).and(left(2))).toEqual(left(2))
    })
  })

  describe('equals', () => {
    it('returns true if equal', () => {
      expect(left(1).equals(left(1))).toBeTruthy()
      expect(right(1).equals(right(1))).toBeTruthy()
    })
    it('returns false if not equal', () => {
      expect(left(1).equals(left(2))).toBeFalsy()
      expect(left(1).equals(right(1))).toBeFalsy()
      expect(right(1).equals(right(2))).toBeFalsy()
      expect(right(1).equals(left(1))).toBeFalsy()
    })
  })
})

describe('EitherT', () => {
  testMonad(EitherT.lift(1), async (a, b) => expect(a.value).toEqual(b.value))

  const list = new EitherT(List.of([right<number, string>('1'), left<number, string>(2)]))
  it('maps', () => {
    const c = list.map((s) => s + 1)
    expect((c.value as List<Either<number, string>>).toArray()).toEqual([right('1'), left(3)])
  })

  it('flatmaps', () => {
    const c = list.flatMap((s) => new EitherT(List.of([left(s + 1)])))
    expect((c.value as List<Either<number, string>>).toArray()).toEqual([right('1'), left(3)])
  })
})
