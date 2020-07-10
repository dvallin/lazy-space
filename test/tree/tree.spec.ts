import { Tree, List } from '../../src'
import { testMonad } from '../monad.tests'

describe('Tree', () => {
  testMonad(Tree.lift(1), async (m, n) => {
    expect(m.tree.value).toEqual(n.tree.value)
  })

  const stringTree: Tree<string> = Tree.node(
    List.of([Tree.lift('11'), Tree.node(List.empty()), Tree.node(List.of([Tree.lift('21'), Tree.lift('22')]))])
  )
  const numberTree: Tree<number> = Tree.node(
    List.of([Tree.lift(11), Tree.node(List.empty()), Tree.node(List.of([Tree.lift(21), Tree.lift(22)]))])
  )

  it('traverses', () => {
    expect(numberTree.traverse().toArray()).toEqual([11, 21, 22])
  })

  it('maps', () => {
    const parsedStrings = stringTree.map(Number.parseInt).traverse().toArray()
    const numbers = numberTree.traverse().toArray()
    expect(parsedStrings).toEqual(numbers)
  })

  it('flatmaps', () => {
    const parsedStrings = stringTree
      .flatMap((label) => (label.endsWith('1') ? Tree.node(List.of([Tree.lift(label + '1'), Tree.lift(label + '2')])) : Tree.lift(label)))
      .traverse()
      .toArray()
    expect(parsedStrings).toEqual(['111', '112', '211', '212', '22'])
  })
})
