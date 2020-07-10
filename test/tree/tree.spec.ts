import { Tree } from '../../src'
import { testMonad } from '../monad.tests'

describe('Tree', () => {
  testMonad(Tree.lift(1), (m, n) => m)
})
