import { Stream, Async } from '../src'

describe('fromCursor', () => {
  it('closes the stream on finished processing', async () => {
    const close = jest.fn()
    let i = 0
    const next = jest.fn().mockImplementation(() => Async.lift(++i))
    const result = await Stream.fromCursor({ next, close }).take(5).collectToList().run()
    expect(result.isSuccess()).toBeTruthy()
    if (result.isSuccess()) {
      expect(result.value.toArray()).toEqual([1, 2, 3, 4, 5])
    }
    expect(next).toHaveBeenCalledTimes(5)
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('closes the stream on error', async () => {
    const close = jest.fn()
    const next = jest.fn().mockReturnValueOnce(Async.lift(1)).mockReturnValue(Async.reject())
    const result = await Stream.fromCursor({ next, close }).take(5).collectToList().run()
    expect(result.isSuccess()).toBeTruthy()
    expect(next).toHaveBeenCalledTimes(2)
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('closes the stream on end of stream', async () => {
    const close = jest.fn()
    let i = 0
    const next = jest.fn().mockImplementation(() => (i < 5 ? Async.lift(++i) : Async.reject()))
    const result = await Stream.fromCursor({ next, close }).collectToList().run()
    expect(result.isSuccess()).toBeTruthy()
    if (result.isSuccess()) {
      expect(result.value.toArray()).toEqual([1, 2, 3, 4, 5])
    }
    expect(next).toHaveBeenCalledTimes(6)
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('closes the stream after processing', async () => {
    let closed = false
    const close = jest.fn().mockImplementation(() => (closed = true))
    const next = jest.fn().mockImplementation(() => {
      expect(closed).toBeFalsy()
      return Async.lift(1)
    })

    const result = await Stream.fromCursor({ next, close }).take(5).collectToList().run()

    expect(result.isSuccess()).toBeTruthy()
    expect(next).toHaveBeenCalledTimes(5)
    expect(close).toHaveBeenCalledTimes(1)
  })
})
