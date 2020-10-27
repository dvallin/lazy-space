import { Dictionary } from '../src'

describe('Dictionary', () => {
  describe('append', () => {
    it('appends values', () => {
      expect(Dictionary.empty<number>().append('1', 1).append('2', 2).append('1', 3).get('1').toArray()).toEqual([1, 3])
    })
  })

  describe('get', () => {
    it('gets empty list on missing key', () => {
      expect(Dictionary.empty().get('1').isEmpty()).toBeTruthy()
    })
  })
})
