import { Identity } from '../src'
import { testMonad } from './monad.tests'

describe('identity', () => {
  testMonad(Identity.lift(''), async (a, b) => expect(a.value).toEqual(b.value))
})
