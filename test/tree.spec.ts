import { Tree, List } from '../src'

describe('FullTree', () => {
  const stringTree: Tree<string> = Tree.node(
    '1',
    List.of([Tree.lift('11'), Tree.node('12', List.empty()), Tree.node('13', List.of([Tree.lift('21')]))])
  )
  const numberTree = Tree.node(1, List.of([Tree.lift(11), Tree.node(12, List.empty()), Tree.node(13, List.of([Tree.lift(21)]))]))

  it('traverses', () => {
    expect(numberTree.traverse().toArray()).toEqual([1, 11, 12, 13, 21])
  })

  it('bimap', () => {
    const parsedStrings = stringTree
      .bimap(
        (a) => Number.parseInt(a),
        (b) => Number.parseInt(b)
      )
      .traverse()
      .toArray()
    const numbers = numberTree.traverse().toArray()
    expect(parsedStrings).toEqual(numbers)
  })

  it('lifts', () => {
    expect(stringTree.lift(1).traverse().toArray()).toEqual([1])
  })

  it('builds from object', () => {
    const objectTree = Tree.fromObject({ a: { b: 1, c: [1, 2, 3] }, d: 'hello' })
    expect(
      objectTree
        .children()
        .map((c) => c.tree.value.value)
        .toArray()
    ).toEqual(['a', 'd'])
    expect(objectTree.traverse().toArray()).toEqual(['_', 'a', 'b', 1, 'c', '0', 1, '1', 2, '2', 3, 'd', 'hello'])
  })
})
