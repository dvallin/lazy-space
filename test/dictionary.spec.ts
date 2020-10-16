import { Dictionary } from '../src'

describe('Dictionary', () => {
  it('builds from object', () => {
    const dict = Dictionary.fromObject({ a: { b: 1, c: [1, 2, 3] }, d: 'hello' })
    expect(dict.keys().toArray()).toEqual(['a', 'd'])
    expect(dict.at('a').keys().toArray()).toEqual(['b', 'c'])
    expect(dict.at('a').at('c').keys().toArray()).toEqual(['0', '1', '2'])
    expect(dict.at('d').value().value).toEqual('hello')
  })

  it('sets', () => {
    const dict = Dictionary.empty().set('a', 1).set('b', 2)
    expect(dict.keys().toArray()).toEqual(['a', 'b'])
    expect(dict.at('a').value().value).toEqual(1)
    expect(dict.at('b').value().value).toEqual(2)
  })

  it('sets and inserts', () => {
    const dict = Dictionary.empty().set('a', 1).insert('b', Dictionary.empty().set('c', 2))
    expect(dict.keys().toArray()).toEqual(['a', 'b'])
    expect(dict.at('a').value().value).toEqual(1)
    expect(dict.at('b').keys().toArray()).toEqual(['c'])
    expect(dict.at('b').at('c').value().value).toEqual(2)
  })
})
