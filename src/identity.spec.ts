import { describe, expect, it, vi } from 'vitest'
import { Identity, Option } from '.'
import { testMonad } from './monad.tests'

describe('identity', () => {
  testMonad(Identity.lift(''), async (a, b) => expect(a.value).toEqual(b.value))

  describe('with', () => {
    it('makes side effects', () => {
      const fn = vi.fn()
      const value = Identity.lift('1').with(fn)
      expect(fn).toHaveBeenCalledWith('1')
      expect(value.value).toEqual('1')
    })
  })

  describe('optionMap', () => {
    it('maps some', () => {
      expect(Identity.lift(1).optionMap(a => Option.some(Identity.lift(a)))).toEqual(Identity.lift(Option.of(1)))
    })
    it('maps none', () => {
      expect(Identity.lift(1).optionMap(() => Option.none())).toEqual(Identity.lift(Option.none()))
    })
  })
})
