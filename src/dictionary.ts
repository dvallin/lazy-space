import { Lazy } from './lazy'
import { List } from './list'
import { Option } from './option'

export class Dictionary<T, S extends string = string> {
  public constructor(readonly state: Lazy<{ [key in S]: List<T> }>) {}

  public append(key: S, value: T): Dictionary<T, S> {
    return Dictionary.append(this, key, value)
  }

  public get(key: S): List<T> {
    return Dictionary.get(this, key)
  }

  public static empty<T, S extends string = string>(): Dictionary<T, S> {
    return new Dictionary(Lazy.lift({} as { [key in S]: List<T> }))
  }

  public static append<T, S extends string>(dict: Dictionary<T, S>, key: S, value: T): Dictionary<T, S> {
    return new Dictionary(
      dict.state.map(s => {
        const newState = { ...s }
        const list = newState[key]
        if (list !== undefined) {
          newState[key] = list.append(value)
        } else {
          newState[key] = List.lift(value)
        }
        return newState
      }),
    )
  }

  public static get<T, S extends string>(dict: Dictionary<T, S>, key: S): List<T> {
    return Option.of(dict.state.eval()[key] as List<T>).getOrElse(List.empty())
  }
}
