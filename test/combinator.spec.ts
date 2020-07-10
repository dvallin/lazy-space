import { List, lazy, Lazy, Option } from '../src'

describe('parser', () => {
  interface Section {
    first: number
    follow: number
  }
  interface Node {
    type: 'sequence' | 'plus' | 'or'
    children: List<Result>
  }
  type Terminal = Marker | Literal
  interface Marker {
    type: 'empty' | 'start' | 'end'
  }
  interface Literal {
    type: 'literal'
    value: string
  }
  type Result<T extends Node | Terminal = Node | Terminal> = Section & T

  type Recognizer<T extends Node | Terminal = Node | Terminal> = (data: string, index: number) => List<Result<T>>

  const buildNode: (type: Node['type'], children: List<Result>, index: number, follow: number) => List<Result<Node>> = (
    type,
    children,
    index,
    follow
  ) => List.lift({ type, children, first: index, follow })
  const buildMarker: (type: Marker['type'], index: number) => List<Result<Marker>> = (type, index) =>
    List.lift({ type, first: index, follow: index })
  const buildLiteral: (index: number, value: string) => List<Result<Literal>> = (index, value) =>
    List.lift({ type: 'literal', value, first: index, follow: index + value.length })
  const fail: () => List<Result> = List.empty

  const empty: Recognizer = (_data, index) => buildMarker('empty', index)
  const literal: (value: string) => Recognizer = (value) => (data, index) => {
    const v = data.substring(index, index + value.length)
    return v === value ? buildLiteral(index, v) : fail()
  }

  const or: (recognizers: List<Recognizer>) => Recognizer = (recognizers) => (data, index) =>
    recognizers.flatMap((recognizer) => recognizer(data, index))

  const plus: (recognizer: Recognizer) => Recognizer<Node> = (recognizer) => (data, index) => {
    const result = recognizer(data, index).flatMap((r) => buildNode('plus', List.lift(r), index, r.follow))
    return result.concat(() => result.flatMap((a) => plus(recognizer)(data, a.follow)))
  }
  const star: (recognizer: Recognizer) => Recognizer = (recognizer) => or(List.of([plus(recognizer), empty]))

  const sequence: (recognizers: List<Recognizer>) => Recognizer<Node> = (recognizers) =>
    recognizers
      .foldr(
        () => Option.none<Recognizer<Node>>(),
        (l, r) =>
          Option.some((data, index) =>
            l().unwrap(
              (left) => {
                const currentResult = r(data, index)
                return currentResult.flatMap((result) =>
                  left(data, result.follow).flatMap((r) =>
                    buildNode(
                      'sequence',
                      currentResult.concat(() => r.children),
                      index,
                      r.follow
                    )
                  )
                )
              },
              (_none) => {
                const currentResult = r(data, index)
                return currentResult.flatMap((r) => buildNode('sequence', currentResult, index, r.follow))
              }
            )
          )
      )
      .get()

  it('recognizes empty', () => {
    expect(empty('', 0).toArray()).toEqual([{ type: 'empty', first: 0, follow: 0 }])
  })

  it('recognizes literal', () => {
    const a = literal('a')
    const ab = literal('ab')
    expect(a('a', 0).toArray()).toEqual([{ type: 'literal', value: 'a', first: 0, follow: 1 }])
    expect(a('b', 0).toArray()).toEqual([])
    expect(ab('ab', 0).toArray()).toEqual([{ type: 'literal', value: 'ab', first: 0, follow: 2 }])
    expect(ab('a', 0).toArray()).toEqual([])
  })

  it('recognizes or', () => {
    const aOrB = or(List.of([literal('a'), literal('b')]))
    expect(aOrB('a', 0).toArray()).toEqual([{ type: 'literal', value: 'a', first: 0, follow: 1 }])
    expect(aOrB('b', 0).toArray()).toEqual([{ type: 'literal', value: 'b', first: 0, follow: 1 }])
    expect(aOrB('c', 0).toArray()).toEqual([])
  })

  it('recognizes literal sequences', () => {
    // S -> abc
    const literalSequence = sequence(List.of([literal('A'), literal('B'), literal('C')]))
    expect(simplify(literalSequence('ABC', 0))).toEqual([
      {
        type: 'sequence',
        children: [
          { type: 'literal', value: 'A' },
          { type: 'literal', value: 'B' },
          { type: 'literal', value: 'C' },
        ],
      },
    ])
    expect(simplify(literalSequence('DBC', 0))).toEqual([])
  })

  it('recognizes sequences with or', () => {
    const complexSequence = sequence(List.of([or(List.of([literal('const'), literal('var')])), literal(' '), literal('variable')]))
    expect(simplify(complexSequence('const variable', 0))).toEqual([
      {
        type: 'sequence',
        children: [
          { type: 'literal', value: 'const' },
          { type: 'literal', value: ' ' },
          { type: 'literal', value: 'variable' },
        ],
      },
    ])
    expect(simplify(complexSequence('var variable', 0))).toEqual([
      {
        type: 'sequence',
        children: [
          { type: 'literal', value: 'var' },
          { type: 'literal', value: ' ' },
          { type: 'literal', value: 'variable' },
        ],
      },
    ])
  })

  it('recognizes star', () => {
    const optionalWhitespaces = sequence(List.of([literal('const'), star(literal(' ')), literal('variable')]))
    expect(simplify(optionalWhitespaces('constvariable', 0))).toEqual([
      {
        type: 'sequence',
        children: [{ type: 'literal', value: 'const' }, { type: 'empty' }, { type: 'literal', value: 'variable' }],
      },
    ])
    // TODO: this is technically correct but not optimal
    expect(simplify(optionalWhitespaces('const   variable', 0))).toEqual([
      {
        type: 'sequence',
        children: [
          { type: 'literal', value: 'const' },
          {
            type: 'plus',
            children: [{ type: 'literal', value: ' ' }],
          },
          {
            type: 'plus',
            children: [{ type: 'literal', value: ' ' }],
          },
          {
            type: 'plus',
            children: [{ type: 'literal', value: ' ' }],
          },
          { type: 'empty' },
          { type: 'literal', value: 'variable' },
        ],
      },
    ])
  })

  it('recognizes recursive defintions', () => {
    // S -> aSa | a
    const a: lazy<Recognizer> = () => literal('a')
    const aSa: lazy<Recognizer> = () => sequence(lazyList(a, () => S, a))
    const S = or(lazyList(aSa, a))
    expect(simplify(S('aaa', 0))).toEqual([
      {
        type: 'sequence',
        children: [
          { type: 'literal', value: 'a' },
          { type: 'literal', value: 'a' },
          { type: 'literal', value: 'a' },
        ],
      },
      { type: 'literal', value: 'a' },
    ])
  })

  function lazyList<T>(...lazies: lazy<T>[]): List<T> {
    return List.ofLazies(lazies.map((a) => new Lazy(a)))
  }

  function simplify(results: List<Result>): object[] {
    return results
      .map((a) => ({
        type: a.type,
        value: a.type === 'literal' ? a.value : undefined,
        children: a.type === 'sequence' || a.type === 'or' || a.type === 'plus' ? simplify(a.children) : undefined,
      }))
      .toArray()
  }
})
