import { Option, List, OptionT } from '../src'
import { testMonad } from './monad.tests'

const right = Option.right
const left = Option.left

describe('Option', () => {
  testMonad(Option.lift(''), async (a, b) => expect(a.value).toEqual(b.value))

  describe('map', () => {
    it('maps left value', () => {
      expect(left('1').map(Number)).toEqual(left(1))
    })
    it('does not map right value', () => {
      expect(right().map(Number)).toEqual(right())
    })
  })

  describe('flatMap', () => {
    it('binds to the left value', () => {
      expect(left('1').flatMap((s) => left(Number(s)))).toEqual(left(1))
    })
    it('works on right value', () => {
      expect(right<number>().flatMap((s) => left(Number(s)))).toEqual(right())
    })
  })

  describe('join', () => {
    it('flattens lefts', () => {
      expect(Option.join(left(left('1')))).toEqual(left('1'))
    })
    it('does not flatten rights', () => {
      expect(Option.join(right())).toEqual(right())
    })
  })

  describe('unwrap', () => {
    it('passes left value', () => {
      expect(
        left(1).unwrap(
          (l) => l + 1,
          () => 3
        )
      ).toEqual(2)
    })
    it('passes right value', () => {
      expect(
        right<number>().unwrap(
          (l) => l + 1,
          () => 3
        )
      ).toEqual(3)
    })
  })

  describe('recover', () => {
    it('returns left', () => {
      expect(left(1).recover(() => 'error')).toEqual(1)
    })
    it('passes right into function', () => {
      expect(right().recover(() => 'error')).toEqual('error')
    })
  })

  describe('flatRecover', () => {
    it('returns left', () => {
      expect(left(1).flatRecover(() => left('error'))).toEqual(left(1))
    })
    it('passes left into function', () => {
      expect(right().flatRecover(() => left('error'))).toEqual(left('error'))
    })
    it('passes right into function', () => {
      expect(right().flatRecover(() => right())).toEqual(right())
    })
  })

  describe('get', () => {
    it('returns left', () => {
      expect(left(1).get()).toEqual(1)
    })
    it('returns right', () => {
      expect(right().get()).toEqual(undefined)
    })
  })

  describe('getOrElse', () => {
    it('returns left', () => {
      expect(left(1).getOrElse(2)).toEqual(1)
    })
    it('returns value', () => {
      expect(right().getOrElse(2)).toEqual(2)
    })
  })

  describe('getOrThrow', () => {
    it('returns left', () => {
      expect(left(1).getOrThrow(new Error())).toEqual(1)
    })
    it('throws error', () => {
      expect(() => right().getOrThrow(new Error())).toThrow()
    })
  })

  describe('or', () => {
    it('gets first left', () => {
      expect(left(1).or(left(2))).toEqual(left(1))
      expect(right().or(left(2))).toEqual(left(2))
    })
  })

  describe('and', () => {
    it('gets first right', () => {
      expect(right().and(right())).toEqual(right())
      expect(left(1).and(right())).toEqual(right())
    })
    it('gets last left', () => {
      expect(left(1).and(left(2))).toEqual(left(2))
    })
  })

  describe('equals', () => {
    it('returns true if equal', () => {
      expect(left(1).equals(left(1))).toBeTruthy()
      expect(right().equals(right())).toBeTruthy()
    })
    it('returns false if not equal', () => {
      expect(left(1).equals(left(2))).toBeFalsy()
      expect(left(1).equals(right())).toBeFalsy()
      expect(right().equals(left(1))).toBeFalsy()
    })
  })

  describe('ofMap', () => {
    it('lifts and maps', () => {
      expect(Option.ofMap(Option.of('v'), (v) => v).value).toEqual('v')
      expect(Option.ofMap(Option.none(), (_v) => undefined).value).toEqual(undefined)
    })
  })
  describe('filter', () => {
    it('lifts and maps', () => {
      expect(Option.filter(Option.of('v'), (v) => v === 'v').value).toEqual('v')
      expect(Option.filter(Option.of('u'), (v) => v === 'v').value).toEqual(undefined)
      expect(Option.filter(Option.none(), (v) => v === 'v').value).toEqual(undefined)
    })
  })
})

describe('OptionT', () => {
  testMonad(OptionT.lift(1), async (a, b) => expect(a.value).toEqual(b.value))

  const list = new OptionT(List.of([right<number>(), left(2)]))
  it('maps', () => {
    const c = list.map((s) => s + 1)
    expect((c.value as List<Option<number>>).toArray()).toEqual([right(), left(3)])
  })

  it('flatmaps', () => {
    const c = list.flatMap((s) => new OptionT(List.of([left(s + 1)])))
    expect((c.value as List<Option<number>>).toArray()).toEqual([right(), left(3)])
  })
})
