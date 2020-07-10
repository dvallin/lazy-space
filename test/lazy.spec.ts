import { Lazy } from '../src'
import { testMonad } from './monad.tests'

describe('lazy', () => {
  testMonad(Lazy.lift(''), async (a, b) => expect(a.eval()).toEqual(b.eval()))
})
