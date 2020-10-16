import { List } from './list'
import { Either } from './either'
import { Monad } from './monad'
import { Option } from './option'

export interface TreeNode<L, N> {
  value: N
  children: List<Tree<L, N>>
}

export interface TreeLeaf<T> {
  value: T
}

export type ValueType = string | number | bigint | boolean | symbol

export type tree<L, N> = Either<TreeLeaf<L>, TreeNode<L, N>>

export class Tree<L, N = L> implements Monad<L> {
  public constructor(public readonly tree: tree<L, N>) {}

  public children(): List<Tree<L, N>> {
    return this.tree.unwrap(
      () => List.empty(),
      (n) => n.children
    )
  }

  public nodeValue(): Option<N> {
    return this.tree.unwrap(
      () => Option.none(),
      (n) => Option.some(n.value)
    )
  }

  public leafValue(): Option<L> {
    return this.tree.unwrap(
      (l) => Option.some(l.value),
      () => Option.none()
    )
  }

  public unwrap<S, T>(f: (l: TreeLeaf<L>) => S, g: (n: TreeNode<L, N>) => T): S | T {
    return this.tree.unwrap(f, g)
  }

  public append(tree: Tree<L, N>, mergeKey: Option<N> = Option.none()): Tree<L, N> {
    return this.unwrap(
      (l) => mergeKey.map((key) => Tree.node(key, List.of([Tree.lift(l.value), tree]))).getOrElse(this),
      (n) => Tree.node(n.value, n.children.append(tree))
    )
  }

  public lift<U>(value: U): Tree<U, N> {
    return Tree.lift(value)
  }

  public map<L2>(f: (a: L) => L2): Tree<L2, N> {
    return Tree.map(this, f)
  }

  public flatMap<U>(f: (a: L) => Tree<U, N>): Tree<U, N> {
    return Tree.flatMap(this, f)
  }

  public join<L, N>(v: Tree<Tree<L, N>, N>): Tree<L, N> {
    return Tree.join(v)
  }

  public bimap<L2, N2 = L2>(f: (a: L) => L2, g: (a: N) => N2): Tree<L2, N2> {
    return Tree.bimap(this, f, g)
  }

  public traverse(): List<L | N> {
    return Tree.traverse(this)
  }

  public leafs(): List<L> {
    return Tree.leafs(this)
  }

  public static node<L, N>(value: N, children: List<Tree<L, N>>): Tree<L, N> {
    return new Tree(Either.right({ children, value }))
  }

  public static map<L, L2, N = L>(value: Tree<L, N>, f: (a: L) => L2): Tree<L2, N> {
    return value.tree.unwrap(
      (leaf) => Tree.lift(f(leaf.value)),
      (node) =>
        Tree.node(
          node.value,
          node.children.map((t) => t.map(f))
        )
    )
  }

  public static flatMap<L, U, N = L>(value: Tree<L, N>, f: (a: L) => Tree<U, N>): Tree<U, N> {
    return value.tree.unwrap(
      (leaf) => f(leaf.value),
      (node) =>
        Tree.node(
          node.value,
          node.children.map((t) => t.flatMap(f))
        )
    )
  }

  public static join<L, N>(v: Tree<Tree<L, N>, N>): Tree<L, N> {
    return v.flatMap((t) => t)
  }

  public static bimap<L, L2, N = L, N2 = L2>(value: Tree<L, N>, f: (a: L) => L2, g: (a: N) => N2): Tree<L2, N2> {
    return value.tree.unwrap(
      (leaf) => Tree.lift(f(leaf.value)),
      (node) =>
        Tree.node(
          g(node.value),
          node.children.map((t) => t.bimap(f, g))
        )
    )
  }

  public static traverse<L, N = L>(tree: Tree<L, N>): List<L | N> {
    return tree.tree.unwrap(
      (leaf) => List.lift(leaf.value),
      (node) => List.lift<L | N>(node.value).concat(() => node.children.flatMap((t) => t.traverse()))
    )
  }

  public static leafs<L, N = L>(tree: Tree<L, N>): List<L> {
    return tree.tree.unwrap(
      (leaf) => List.lift(leaf.value),
      (node) => node.children.flatMap((t) => t.leafs())
    )
  }

  public static lift<L, N = L>(value: L): Tree<L, N> {
    return new Tree<L, N>(Either.left({ value }))
  }

  public static fromObject(o: object, key = '_'): Tree<ValueType, string> {
    const children = List.of(Object.entries(o))
      .map(([k, v]) => {
        if (typeof v === 'object') {
          return Tree.fromObject(v, k)
        } else if (
          typeof v === 'string' ||
          typeof v === 'number' ||
          typeof v === 'symbol' ||
          typeof v === 'boolean' ||
          typeof v === 'bigint'
        ) {
          return Tree.node(k, List.lift(Tree.lift(v)))
        }
        return undefined
      })
      .filterType((v): v is Tree<string> => v !== undefined)
    return Tree.node(key, children)
  }
}
