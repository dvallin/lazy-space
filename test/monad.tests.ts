import { Monad } from '../src'

export function testMonad<A extends Monad<unknown>>(monad: A, monadEquals: (m: A, n: A) => Promise<void>): void {
  const f: (n: string) => Monad<number> = (s) => m.lift(Number(s))
  const g: (n: number) => Monad<string> = (s) => m.lift(String(s))

  const m = monad.lift('2')

  describe('monad laws', () => {
    it('has left identity', () => equals(m.flatMap(f), f('2')))
    it('has right identity', () =>
      equals(
        m.flatMap((a) => m.lift(a)),
        m
      ))
    it('has associativity', () =>
      equals(
        m.flatMap(f).flatMap(g),
        m.flatMap((x) => f(x).flatMap(g))
      ))
  })

  describe('join', () => {
    it('joins', () => equals(monad.join(monad.lift(monad.lift('2'))), m))
  })

  describe('map', () => {
    it('maps', () => equals(monad.lift('2').map(Number).map(String), m))
  })

  async function equals<T>(left: Monad<T>, right: Monad<T>): Promise<void> {
    await monadEquals(left as A, right as A)
  }
}
