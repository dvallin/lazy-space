import { List } from '../list'
import { Either } from '../either'
import { Applicative } from '../applicative'

export interface Node<T> {
  value: T
  children: List<FullTree<T>>
}

export interface Leaf<T> {
  value: T
}

export type tree<T> = Either<Leaf<T>, Node<T>>

export class FullTree<T> implements Applicative<T> {
  public constructor(public readonly tree: tree<T>) {}

  public lift<U>(value: U): FullTree<U> {
    return FullTree.lift(value)
  }

  public map<U>(f: (a: T) => U): FullTree<U> {
    return FullTree.map(this, f)
  }

  public static lift<T>(value: T): FullTree<T> {
    return new FullTree(Either.left({ value }))
  }

  public static node<T>(value: T, children: List<FullTree<T>>): FullTree<T> {
    return new FullTree(Either.right({ children, value }))
  }

  public static map<T, U>(value: FullTree<T>, f: (a: T) => U): FullTree<U> {
    return value.tree.unwrap(
      (leaf) => FullTree.lift(f(leaf.value)),
      (node) =>
        FullTree.node(
          f(node.value),
          node.children.map((t) => t.map(f))
        )
    )
  }
}
