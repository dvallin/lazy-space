import { Lazy, Option } from '.'
import { List } from './list'
import { Tree, ValueType } from './tree'

export class Dictionary<T> {
  public constructor(readonly state: Lazy<Option<Tree<T, string>>>) {}

  public set(key: string, value: T): Dictionary<T> {
    return Dictionary.set(this, key, value)
  }

  public insert(key: string, value: Dictionary<T>): Dictionary<T> {
    return Dictionary.insert(this, key, value)
  }

  public keys(): List<string> {
    return Dictionary.keys(this)
  }

  public values(): List<T> {
    return Dictionary.values(this)
  }

  public value(): Option<T> {
    return Dictionary.value(this)
  }

  public at(key: string): Dictionary<T> {
    return Dictionary.at(this, key)
  }

  static fromTree<T>(tree: Tree<T, string>): Dictionary<T> {
    return new Dictionary(Lazy.lift(Option.some(tree)))
  }

  public static set<T>(dict: Dictionary<T>, key: string, value: T): Dictionary<T> {
    const node = Tree.node(key, List.lift(Tree.lift(value)))
    return new Dictionary(
      dict.state.map((s) =>
        Option.some(
          s.unwrap(
            (tree) => tree.append(node),
            () => Tree.node('', List.lift(node))
          )
        )
      )
    )
  }

  public static insert<T>(dict: Dictionary<T>, key: string, other: Dictionary<T>): Dictionary<T> {
    return other.state.eval().unwrap(
      (node) => {
        const n = Tree.node(key, node.children())
        return new Dictionary(
          dict.state.map((s) =>
            Option.some(
              s.unwrap(
                (tree) => tree.append(n),
                () => n
              )
            )
          )
        )
      },
      () => dict
    )
  }

  public static at<T>(dict: Dictionary<T>, key: string): Dictionary<T> {
    return dict.state
      .eval()
      .flatMap((tree) =>
        tree.children().find((c) =>
          c
            .nodeValue()
            .map((k) => k === key)
            .getOrElse(false)
        )
      )
      .unwrap(
        (t) => Dictionary.fromTree(t),
        () => Dictionary.empty()
      )
  }

  public static keys<T>(dict: Dictionary<T>): List<string> {
    return dict.state
      .eval()
      .map((t) => t.children().map((c) => c.nodeValue()))
      .map(List.flattenOptionals)
      .getOrElse(List.empty())
  }

  public static values<T>(dict: Dictionary<T>): List<T> {
    return dict.state
      .eval()
      .map((t) => t.children().map((c) => c.leafValue()))
      .map(List.flattenOptionals)
      .getOrElse(List.empty())
  }

  public static value<T>(dict: Dictionary<T>): Option<T> {
    return dict.values().head()
  }

  public static empty<T>(): Dictionary<T> {
    return new Dictionary(Lazy.lift(Option.none()))
  }

  public static fromObject(o: object): Dictionary<ValueType> {
    return new Dictionary(Lazy.of(() => Option.of(Tree.fromObject(o, '_'))))
  }
}
