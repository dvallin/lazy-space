import { FullTree, List } from '../../src'

describe('FullTree', () => {
  const stringTree = FullTree.node(
    '1',
    List.of([FullTree.lift('11'), FullTree.node('12', List.empty()), FullTree.node('13', List.of([FullTree.lift('21')]))])
  )
  const numberTree = FullTree.node(
    1,
    List.of([FullTree.lift(11), FullTree.node(12, List.empty()), FullTree.node(13, List.of([FullTree.lift(21)]))])
  )

  it('traverses', () => {
    expect(numberTree.traverse().toArray()).toEqual([1, 11, 12, 13, 21])
  })

  it('maps', () => {
    const parsedStrings = stringTree.map(Number.parseInt).traverse().toArray()
    const numbers = numberTree.traverse().toArray()
    expect(parsedStrings).toEqual(numbers)
  })

  it('lifts', () => {
    expect(stringTree.lift(1).traverse().toArray()).toEqual([1])
  })
})
