import { Tree, List, Option, Either } from '../src'
import { testMonad } from './monad.tests'

describe('FullTree', () => {
  const stringTree: Tree<string> = Tree.node(
    '1',
    List.of([Tree.lift('11'), Tree.node('12', List.empty()), Tree.node('13', List.of([Tree.lift('21')]))])
  )
  const numberTree = Tree.node(1, List.of([Tree.lift(11), Tree.node(12, List.empty()), Tree.node(13, List.of([Tree.lift(21)]))]))

  testMonad(stringTree, async (a, b) => expect(a.traverse().toArray()).toEqual(b.traverse().toArray()))

  it('maps only leafs', () => {
    expect(
      stringTree
        .map((s) => Number.parseInt(s))
        .traverse()
        .map((r) => r.value)
        .toArray()
    ).toEqual(['1', 11, '12', '13', 21])
  })

  describe('with', () => {
    it('makes side effects', async () => {
      const fn = jest.fn()
      const value = Tree.lift('1').with(fn)
      expect(fn).toHaveBeenCalledWith('1')
      expect(value.traverse().toArray()).toEqual([Either.left('1')])
    })
  })

  it('flatmaps only leafs', () => {
    expect(
      stringTree
        .flatMap((s) => Tree.node(`mapped${s}`, List.lift(Tree.lift(Number.parseInt(s)))))
        .traverse()
        .map((r) => r.value)
        .toArray()
    ).toEqual(['1', 'mapped11', 11, '12', '13', 'mapped21', 21])
  })

  it('optionMaps only leafs', () => {
    expect(
      stringTree
        .optionMap(() => Option.none())
        .traverse()
        .map((r) => r.value)
        .toArray()
    ).toEqual(['1', Option.none(), '12', '13', Option.none()])
    expect(
      stringTree
        .optionMap((s) => Option.of(Tree.lift(s)))
        .traverse()
        .map((r) => r.value)
        .toArray()
    ).toEqual(['1', Option.of('11'), '12', '13', Option.of('21')])
  })

  it('traverses', () => {
    expect(
      numberTree
        .traverse()
        .map((r) => r.value)
        .toArray()
    ).toEqual([1, 11, 12, 13, 21])
  })

  it('selects leafs', () => {
    expect(numberTree.leafs().toArray()).toEqual([11, 21])
  })

  it('gets node values', () => {
    expect(numberTree.nodeValue()).toEqual(Option.some(1))
    expect(Tree.lift(11).nodeValue().isNone()).toBeTruthy()
  })

  it('gets leaf values', () => {
    expect(numberTree.leafValue().isNone()).toBeTruthy()
    expect(Tree.lift(11).leafValue()).toEqual(Option.some(11))
  })

  it('selects children', () => {
    expect(numberTree.children().size()).toEqual(3)
    expect(Tree.lift(11).children().toArray()).toEqual([])
  })

  it('indexes children', () => {
    expect(
      numberTree
        .at(2)
        .flatMap((t) => t.at(0))
        .flatMap((t) => t.leafValue())
    ).toEqual(Option.some(21))
    expect(numberTree.at().flatMap((t) => t.at(0))).toEqual(Option.none())
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

  it('appends', () => {
    expect(
      Tree.lift<number, string>(1)
        .append(Tree.lift(2), Option.some('root'))
        .traverse()
        .map((r) => r.value)
        .toArray()
    ).toEqual(['root', 1, 2])
    expect(
      Tree.node('root', List.lift(Tree.lift(1)))
        .append(Tree.lift(2))
        .traverse()
        .map((r) => r.value)
        .toArray()
    ).toEqual(['root', 1, 2])
  })

  it('lifts', () => {
    expect(
      stringTree
        .lift(1)
        .traverse()
        .map((r) => r.value)
        .toArray()
    ).toEqual([1])
  })

  it('builds from object', () => {
    const big = BigInt('0x1fffffffffffff').valueOf()
    const sym = Symbol('foo')
    const objectTree = Tree.fromObject({
      a: { b: 1, c: [1, 2, 3] },
      d: 'hello',
      e: { i: big, j: sym, k: true, l: undefined },
    })
    expect(
      objectTree
        .traverse()
        .map((r) => r.value)
        .toArray()
    ).toEqual(['_', 'a', 'b', 1, 'c', '0', 1, '1', 2, '2', 3, 'd', 'hello', 'e', 'i', big, 'j', sym, 'k', true])
  })
})
