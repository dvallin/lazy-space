import { Option } from '../src'

describe('Option', () => {
  describe('ofMap', () => {
    it('lifts and maps', () => {
      expect(Option.ofMap(Option.of('v'), (v) => v).value).toEqual('v')
      expect(Option.ofMap(Option.none(), (_v) => undefined).value).toEqual(undefined)
    })
  })
  describe('filter', () => {
    it('lifts and maps', () => {
      expect(Option.filter(Option.of('v'), (v) => v === 'v').value).toEqual('v')
      expect(Option.filter(Option.of('u'), (v) => v === 'v').value).toEqual(undefined)
      expect(Option.filter(Option.none(), (v) => v === 'v').value).toEqual(undefined)
    })
  })
})
