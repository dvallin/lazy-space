import { List, Option, Lazy } from '../src'
import { testMonad } from './monad.tests'

const { of, take, natural, join, repeat, drop } = List

describe('List', () => {
  testMonad(List.empty(), async (a, b) => expect(a.toArray()).toEqual(b.toArray()))

  describe('map', () => {
    it('works on infinite lists', () => {
      const nx2 = natural().map((v) => v * 2)
      expect(List.toArray(take(nx2, 3))).toEqual([2, 4, 6])
    })

    it('can take very long lists', () => {
      const nx2 = List.map(natural(), (v) => v * 2)
      expect(List.toArray(take(nx2, 6000))).toHaveLength(6000)
    })

    it('is lazy', () => {
      const visited: string[] = []
      const all: string[] = ['1', '2', '3']
      List.of(all).map((a) => visited.push(a))
      expect(visited).toEqual([])
    })

    it('has index', () => {
      const nx2 = natural().map((_, i) => i)
      expect(List.toArray(take(nx2, 3))).toEqual([0, 1, 2])
    })
  })

  describe('with', () => {
    it('makes side effects', () => {
      const fn = jest.fn()
      const value = List.lift('1').with(fn).toArray()
      expect(fn).toHaveBeenCalledWith('1', 0)
      expect(value).toEqual(['1'])
    })
  })

  describe('flatmap', () => {
    it('works on finite lists', () => {
      const list = of([3, 3]).flatMap((s) => of([2 * s, 2 * s]))
      expect(List.toArray(list)).toEqual([6, 6, 6, 6])
    })

    it('works on infinite lists', () => {
      const nxn = natural().flatMap((x) => natural().map((y) => ({ x, y })))
      expect(List.toArray(take(nxn, 3))).toEqual([
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 1, y: 3 },
      ])
    })

    it('has index', () => {
      const nx2 = natural().flatMap((_, i) => List.lift(i))
      expect(List.toArray(take(nx2, 3))).toEqual([0, 1, 2])
    })
  })

  describe('optionMap', () => {
    it('maps none', () => {
      const list = of([3, 3]).optionMap(() => Option.none())
      expect(List.toArray(list)).toEqual([Option.none(), Option.none()])
    })

    it('works on infinite lists', () => {
      const nxn = natural().optionMap((x) => (x % 2 === 1 ? Option.none() : Option.of(natural().map((y) => ({ x, y })))))
      expect(List.toArray(take(nxn, 3))).toEqual([Option.none(), Option.of({ x: 2, y: 1 }), Option.of({ x: 2, y: 2 })])
    })
  })

  describe('ofNative', () => {
    it('works on finite lists', () => {
      const firstTen = List.ofNative(function* () {
        for (let i = 1; i <= 10; i++) {
          yield i
        }
      })
      expect(firstTen.toArray()).toEqual(natural().take(10).toArray())
    })

    it('works on finite lists', () => {
      const allNumber = List.ofNative(function* () {
        let i = 1
        while (true) {
          yield i++
        }
      })
      expect(allNumber.take(10).toArray()).toEqual(natural().take(10).toArray())
    })
  })

  describe('join', () => {
    it('flattens lists', () => {
      const listOfLists: List<List<number>> = of([of([2, 2]), of([2, 2])])
      const list = join(listOfLists)

      // then
      expect(List.toArray(take(list, 5))).toEqual([2, 2, 2, 2])
    })

    it('works on infinite lists', () => {
      const doubles = join(natural().map((n) => of([n, n])))

      // then
      expect(List.toArray(take(doubles, 5))).toEqual([1, 1, 2, 2, 3])
    })

    it('can join very long lists', () => {
      // when
      const doubles = join(natural().map((n) => of([n, n])))

      // then
      expect(List.toArray(take(doubles, 6000))).toHaveLength(6000)
    })
  })

  describe('head', () => {
    it('takes first', () => {
      expect(natural().head()).toEqual(Option.some(1))
    })

    it('takes first twice', () => {
      const n = natural()
      expect(n.head()).toEqual(Option.some(1))
      expect(n.tail().head()).toEqual(Option.some(2))
    })

    it('is invalid on empty lists', () => {
      expect(List.empty().head()).toEqual(Option.none())
    })

    it('works on undefines', () => {
      expect(repeat(undefined).head().isSome()).toBeTruthy()
    })
  })

  describe('tail', () => {
    it('takes tail', () => {
      expect(natural().tail().head()).toEqual(Option.some(2))
    })
  })

  describe('forEach', () => {
    it('consumes all elements', () => {
      const visited: string[] = []
      const all: string[] = ['1', '2', '3']
      List.of(all).forEach((a) => visited.push(a))
      expect(visited).toEqual(all)
    })
  })

  describe('takeWhile', () => {
    it('takes on infinite lists', () => {
      expect(List.toArray(natural().takeWhile((n) => n < 2))).toEqual([1])
    })

    it('takes full lists', () => {
      expect(List.toArray(of([1, 2, 3]).takeWhile((n) => n < 100))).toEqual([1, 2, 3])
    })
  })

  describe('dropWhile', () => {
    it('drops', () => {
      expect(
        List.toArray(
          natural()
            .dropWhile((n) => n < 2)
            .take()
        )
      ).toEqual([2])
    })

    it('drops full lists', () => {
      expect(List.toArray(of([1, 2, 3]).dropWhile((n) => n < 100))).toEqual([])
    })

    it('drops finite lists', () => {
      expect(List.toArray(of([1, 2, 3]).dropWhile((n) => n < 2))).toEqual([2, 3])
    })
  })

  describe('take', () => {
    it('takes', () => {
      expect(List.toArray(natural().take(1))).toEqual([1])
      expect(List.toArray(take(natural()))).toEqual([1])
    })

    it('takes empty', () => {
      expect(List.head(List.empty().take())).toEqual(Option.none())
    })

    it('can take very long lists', () => {
      const nxn = natural().flatMap((x) => natural().map((y) => ({ x, y })))
      expect(List.toArray(take(nxn, 6000))).toHaveLength(6000)
    })

    testLazyOperation((l) => l.take(3))
  })

  describe('at', () => {
    it('gets at index', () => {
      expect(natural().at(1)).toEqual(Option.of(2))
      expect(List.at(natural())).toEqual(Option.of(1))
    })

    it('gets from empty', () => {
      expect(List.empty().at()).toEqual(Option.none())
    })
  })

  describe('drop', () => {
    it('drops', () => {
      expect(List.toArray(natural().drop().take(1))).toEqual([2])
      expect(List.toArray(drop(natural()).take(1))).toEqual([2])
    })

    it('drops empty', () => {
      expect(List.head(List.empty().drop())).toEqual(Option.none())
    })

    testLazyOperation((l) => l.drop(3))
  })

  describe('fold', () => {
    it('reduces', () => {
      expect(
        repeat(1)
          .take(5)
          .fold(3, (l, r) => l + r)
      ).toEqual(8)
    })

    it('reduces very long lists', () => {
      expect(
        repeat(1)
          .take(6000)
          .fold(3, (l, r) => l + r)
      ).toEqual(6003)
    })
  })

  describe('scan', () => {
    it('calculates running sum', () => {
      expect(
        natural()
          .scan(0, (a, b) => a + b)
          .take(5)
          .toArray()
      ).toEqual([1, 3, 6, 10, 15])
    })

    it('works on empty lists', () => {
      expect(
        List.empty<number>()
          .scan(0, (a, b) => a + b)
          .toArray()
      ).toEqual([])
    })
  })

  describe('all', () => {
    it('is true if all are true', () => {
      expect(
        natural()
          .take(5)
          .all((v) => v < 6)
      ).toBeTruthy()
    })

    it('works on undefines', () => {
      expect(
        repeat(undefined)
          .take(5)
          .all((v) => v === undefined)
      ).toBeTruthy()
    })

    it('is false if at least one is false', () => {
      expect(natural().all((v) => v < 6)).toBeFalsy()
    })
  })

  describe('some', () => {
    it('is true if at least one is true', () => {
      expect(natural().some((v) => v > 4)).toBeTruthy()
    })

    it('works on undefines', () => {
      expect(repeat(undefined).some((v) => v === undefined)).toBeTruthy()
    })

    it('is false if none is true', () => {
      expect(
        natural()
          .take(5)
          .some((v) => v > 5)
      ).toBeFalsy()
    })
  })

  describe('find', () => {
    it('finds', () => {
      expect(natural().find((v) => v === 6000)).toEqual(Option.some(6000))
    })

    it('works on undefines', () => {
      expect(repeat(undefined).find((v) => v === undefined)).toEqual(Option.some(undefined))
    })

    it('returns invalid if cannot find element', () => {
      expect(
        natural()
          .take(5)
          .find((v) => v === 6)
      ).toEqual(Option.none())
    })
  })

  describe('filter', () => {
    it('filters', () => {
      expect(
        natural()
          .filter((v) => v % 2 === 0)
          .take(3)
          .toArray()
      ).toEqual([2, 4, 6])
    })

    it('works on undefines', () => {
      expect(
        repeat(undefined)
          .filter((v) => v === undefined)
          .take(2)
          .toArray()
      ).toEqual([undefined, undefined])
    })

    it('filters to empty list (on finite lists)', () => {
      expect(
        natural()
          .take(5)
          .filter((v) => v === 6)
          .size()
      ).toEqual(0)
    })
  })

  describe('filterType', () => {
    it('filters', () => {
      expect(
        natural()
          .map((i) => (i % 2 === 0 ? i : 'this is not an even number'))
          .filterType((v): v is number => typeof v === 'number')
          .take(3)
          .toArray()
      ).toEqual([2, 4, 6])
    })
  })
  describe('distinct', () => {
    it('works on infinite lists', () => {
      expect(
        natural()
          .flatMap((i) => repeat(i).take(i))
          .distinct()
          .take(5)
          .toArray()
      ).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('concat', () => {
    it('concats whole lists', () => {
      expect(
        of([1, 2])
          .concat(() => List.natural(3))
          .take(4)
          .toArray()
      ).toEqual([1, 2, 3, 4])
    })
  })

  describe('intersperse', () => {
    it('alternates between item and list', () => {
      expect(
        List.repeat('v')
          .intersperse(() => ',')
          .take(4)
          .toArray()
      ).toEqual(['v', ',', 'v', ','])
    })

    it('does not append the last item', () => {
      expect(
        List.of(['a', 'b', 'c'])
          .intersperse(() => ',')
          .toArray()
      ).toEqual(['a', ',', 'b', ',', 'c'])
    })
  })

  describe('append', () => {
    it('appends single values', () => {
      expect(List.lift(1).append(2).append(3).toArray()).toEqual([1, 2, 3])
    })
  })

  describe('batch', () => {
    it('batches lists according to given window', () => {
      expect(List.batch(of([1, 2, 3, 4, 5]), 1).toArray()).toEqual([[1], [2], [3], [4], [5]])
      expect(of([1, 2, 3, 4, 5]).batch(2).toArray()).toEqual([[1, 2], [3, 4], [5]])
      expect(of([1, 2, 3, 4, 5]).batch(2, 1).toArray()).toEqual([[1, 2], [2, 3], [3, 4], [4, 5], [5]])
      expect(of([1, 2, 3, 4, 5]).batch(3, 4).toArray()).toEqual([[1, 2, 3], [5]])
    })
  })

  describe('prepend', () => {
    it('prepends single values', () => {
      expect(List.lift(1).prepend(2).prepend(3).toArray()).toEqual([3, 2, 1])
    })
  })

  describe('size', () => {
    it('takes size', () => {
      expect(of([1, 1]).size()).toEqual(2)
    })
  })

  describe('flattenOptionals', () => {
    it('flattens', () => {
      expect(List.flattenOptionals(of([Option.none(), Option.some(1), Option.none(), Option.some(2)])).toArray()).toEqual([1, 2])
    })
  })

  describe('isEmpty', () => {
    it('true on empty', () => {
      expect(of([]).isEmpty()).toBeTruthy()
    })
    it('false on finite', () => {
      expect(of([1, 1]).isEmpty()).toBeFalsy()
    })
    it('false on infinite', () => {
      expect(repeat(1).isEmpty()).toBeFalsy()
    })
  })

  describe('reverses', () => {
    it('takes size', () => {
      expect(List.toArray(of([1, 2, 3]).reverse())).toEqual([3, 2, 1])
    })
  })

  describe('product', () => {
    it('works with empty lists', () => {
      expect(
        List.product(List.empty())
          .map((l) => l.toArray())
          .toArray()
      ).toEqual([[]])
    })

    it('works on two lists', () => {
      expect(
        List.product(List.of([List.of([1, 2, 3]), List.of([1, 2])]))
          .map((l) => l.toArray())
          .toArray()
      ).toEqual([
        [1, 1],
        [1, 2],
        [2, 1],
        [2, 2],
        [3, 1],
        [3, 2],
      ])
    })

    it('works on many lists', () => {
      expect(
        List.product(List.of([List.of([1, 2]), List.of([1, 2]), List.of([1, 2])]))
          .map((l) => l.toArray())
          .toArray()
      ).toEqual([
        [1, 1, 1],
        [1, 1, 2],
        [1, 2, 1],
        [1, 2, 2],
        [2, 1, 1],
        [2, 1, 2],
        [2, 2, 1],
        [2, 2, 2],
      ])
    })

    it('works on fininite lists of infinite lists', () => {
      expect(
        List.product(List.of([List.of([1, 2]), List.natural(), List.of([1, 2])]))
          .take(5)
          .map((l) => l.toArray())
          .toArray()
      ).toEqual([
        [1, 1, 1],
        [1, 1, 2],
        [1, 2, 1],
        [1, 2, 2],
        [1, 3, 1],
      ])
    })
  })

  describe('toSet', () => {
    it('collects to Set', () => {
      expect(of([1, 1, 2]).toSet().size).toEqual(2)
    })
  })
})

function testLazyOperation(op: (l: List<boolean>) => void): void {
  it('is lazy', () => {
    let lazy = true
    op(
      new List(
        Option.some(
          new Lazy(() => {
            lazy = false
            return lazy
          })
        ),
        () => List.empty()
      )
    )
    expect(lazy).toBeTruthy()
  })
}
