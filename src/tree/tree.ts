import { Monad } from '../monad'
import { List } from '../list'
import { Either } from '../either'

export interface Node<T> {
  children: List<Tree<T>>
}

export interface Leaf<T> {
  value: T
}

export type tree<T> = Either<Leaf<T>, Node<T>>

export class Tree<T> implements Monad<T> {
  public constructor(public readonly tree: tree<T>) {}

  public lift<U>(value: U): Tree<U> {
    return Tree.lift(value)
  }

  public map<U>(f: (a: T) => U): Tree<U> {
    return Tree.map(this, f)
  }

  public flatMap<U>(f: (a: T) => Tree<U>): Tree<U> {
    return Tree.flatMap(this, f)
  }

  public join<U>(v: Tree<Tree<U>>): Tree<U> {
    return Tree.join(v)
  }

  public static lift<T>(value: T): Tree<T> {
    return new Tree(Either.left({ value }))
  }

  public static node<T>(children: List<Tree<T>>): Tree<T> {
    return new Tree(Either.right({ children }))
  }

  public static map<T, U>(value: Tree<T>, f: (a: T) => U): Tree<U> {
    return value.tree.unwrap(
      (leaf) => Tree.lift(f(leaf.value)),
      (node) => Tree.node(node.children.map((t) => t.map(f)))
    )
  }

  public static flatMap<T, U>(value: Tree<T>, f: (a: T) => Tree<U>): Tree<U> {
    return value.tree.unwrap(
      (leaf) => f(leaf.value),
      (node) => Tree.node(node.children.map((t) => t.flatMap(f)))
    )
  }

  public static join<U>(v: Tree<Tree<U>>): Tree<U> {
    return v.flatMap((t) => t)
  }
}
