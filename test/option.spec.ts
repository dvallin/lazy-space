import { Option } from '../src'

describe('Option', () => {
  describe('ofMap', () => {
    it('lifts and maps', () => {
      expect(Option.ofMap(Option.of('v'), (v) => v).value).toEqual('v')
      expect(Option.ofMap(Option.none(), (_v) => undefined).value).toEqual(undefined)
    })
  })
})
