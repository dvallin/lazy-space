import { describe, expect, it } from 'vitest'
import { JsonPath } from '.'

const state = {
  book: [
    { category: 'reference', author: 'Nigel Rees', title: 'Sayings of the Century', price: 8.95 },
    { category: 'fiction', author: 'Evelyn Waugh', title: 'Sword of Honour', price: 12.99 },
    { category: 'fiction', author: 'Herman Melville', title: 'Moby Dick', isbn: '0-553-21311-3', price: 8.99 },
    {
      category: 'fiction',
      author: 'J. R. R. Tolkien',
      title: 'The Lord of the Rings',
      isbn: '0-395-19395-8',
      price: 22.99,
    },
  ],
  bicycle: {
    color: 'red',
    price: 19.95,
  },
  '[]': {
    strange: true,
  },
}

describe('JsonPath', () => {
  describe('identity', () => {
    it('returns object', () => {
      expect(JsonPath.identity().access(state).toArray()).toEqual([state])
    })
  })

  describe('take', () => {
    it('takes values', () => {
      expect(JsonPath.take('book').access(state).toArray()).toEqual([state.book])
    })
    it('takes nested values', () => {
      expect(JsonPath.take('bicycle').take('color').access(state).toArray()).toEqual([state.bicycle.color])
    })
  })

  describe('slice', () => {
    it('takes single values', () => {
      expect(JsonPath.take('book').slice(0, 1).access(state).toArray()).toEqual([state.book[0]])
    })
    it('takes multiple values', () => {
      expect(JsonPath.take('book').slice(0, 2).access(state).toArray()).toEqual([state.book[0], state.book[1]])
    })
    it('takes until end', () => {
      expect(JsonPath.take('book').slice(1, undefined).access(state).toArray()).toEqual([
        state.book[1],
        state.book[2],
        state.book[3],
      ])
    })
  })

  describe('all', () => {
    it('takes all of a level', () => {
      expect(JsonPath.identity().all().access(state).toArray()).toEqual([state.book, state.bicycle, state['[]']])
    })
    it('nests correctly', () => {
      expect(JsonPath.identity().all().take('color').access(state).toArray()).toEqual([state.bicycle.color])
    })
    it('works on arrays', () => {
      expect(JsonPath.identity().take('book').all().take('price').access(state).toArray()).toEqual([
        state.book[0].price,
        state.book[1].price,
        state.book[2].price,
        state.book[3].price,
      ])
    })
    it('filters missing values', () => {
      expect(JsonPath.identity().take('book').all().take('isbn').access(state).toArray()).toEqual([
        state.book[2].isbn,
        state.book[3].isbn,
      ])
    })
  })

  describe('from string', () => {
    it('parses empty as identity', () => {
      expect(JsonPath.fromString('').access(state).toArray()).toEqual([state])
    })
    it('parses root', () => {
      expect(JsonPath.fromString('$').access(state).toArray()).toEqual([state])
    })
    it('parses direct access', () => {
      expect(JsonPath.fromString('$.book').access(state).toArray()).toEqual([state.book])
    })
    it('parses nested access', () => {
      expect(JsonPath.fromString('$.bicycle.color').access(state).toArray()).toEqual([state.bicycle.color])
    })
    it('parses array access', () => {
      expect(JsonPath.fromString('$.book[0].price').access(state).toArray()).toEqual([state.book[0].price])
    })
    it('parses object index access', () => {
      expect(JsonPath.fromString('$[book][0][price]').access(state).toArray()).toEqual([state.book[0].price])
    })
    it('parses escaped index access', () => {
      expect(JsonPath.fromString(`$['book'][0]["price"]`).access(state).toArray()).toEqual([state.book[0].price])
    })
    it('escapes escaped index access', () => {
      expect(JsonPath.fromString(`$['[]']`).access(state).toArray()).toEqual([state['[]']])
    })
    it('parses all access', () => {
      expect(JsonPath.fromString('$[*].*.isbn').access(state).toArray()).toEqual([
        state.book[2].isbn,
        state.book[3].isbn,
      ])
    })
    it('parses shorthand all access', () => {
      expect(JsonPath.fromString('$[]..isbn').access(state).toArray()).toEqual([state.book[2].isbn, state.book[3].isbn])
    })
    it('parses multiple object access', () => {
      expect(JsonPath.fromString('$.book.[price,isbn]').access(state).toArray()).toEqual([
        state.book[0].price,
        state.book[1].price,
        state.book[2].price,
        state.book[2].isbn,
        state.book[3].price,
        state.book[3].isbn,
      ])
    })
    it('parses multiple index access', () => {
      expect(JsonPath.fromString('$.book[1,0,-1].price').access(state).toArray()).toEqual([
        state.book[1].price,
        state.book[0].price,
      ])
    })
    it('parses slice index access', () => {
      expect(JsonPath.fromString('$.book[0:1,:2,:].price').access(state).toArray()).toEqual([
        state.book[0].price,
        state.book[1].price,
        state.book[0].price,
        state.book[1].price,
        state.book[2].price,
        state.book[0].price,
        state.book[1].price,
        state.book[2].price,
        state.book[3].price,
      ])
    })
  })
})
