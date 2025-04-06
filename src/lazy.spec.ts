import { describe, expect, it, vi } from 'vitest'
import { Lazy, Option } from '.'
import { testMonad } from './monad.tests'

describe('lazy', () => {
  testMonad(Lazy.lift(''), async (a, b) => expect(a.eval()).toEqual(b.eval()))

  describe('with', () => {
    it('makes side effects', () => {
      const fn = vi.fn()
      const value = Lazy.lift('1').with(fn).eval()
      expect(fn).toHaveBeenCalledWith('1')
      expect(value).toEqual('1')
    })
  })

  describe('optionMap', () => {
    it('maps some', () => {
      expect(
        Lazy.lift(1)
          .optionMap(a => Option.some(Lazy.lift(a)))
          .eval(),
      ).toEqual(Option.of(1))
    })
    it('maps none', () => {
      expect(
        Lazy.lift(1)
          .optionMap(() => Option.none())
          .eval(),
      ).toEqual(Option.none())
    })
  })
})
