import { List } from '../list'
import { Either } from '../either'
import { Applicative } from '../applicative'

export interface FullTreeNode<T> {
  value: T
  children: List<FullTree<T>>
}

export interface FullTreeLeaf<T> {
  value: T
}

export type fullTree<T> = Either<FullTreeLeaf<T>, FullTreeNode<T>>

export class FullTree<T> implements Applicative<T> {
  public constructor(public readonly tree: fullTree<T>) {}

  public lift<U>(value: U): FullTree<U> {
    return FullTree.lift(value)
  }

  public map<U>(f: (a: T) => U): FullTree<U> {
    return FullTree.map(this, f)
  }

  public static lift<T>(value: T): FullTree<T> {
    return new FullTree(Either.left({ value }))
  }

  public traverse(): List<T> {
    return FullTree.traverse(this)
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

  public static traverse<U>(tree: FullTree<U>): List<U> {
    return tree.tree.unwrap(
      (leaf) => List.lift(leaf.value),
      (node) => List.lift(node.value).concat(() => node.children.flatMap((t) => t.traverse()))
    )
  }
}
