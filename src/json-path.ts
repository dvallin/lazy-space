import { Option } from './option'
import { List } from './list'

interface Key {
  key: string
  escaped: boolean
}

interface Keys {
  keys: Key[]
  length: number
}

export class JsonPath {
  public constructor(public readonly access: (o: any) => List<unknown>) {}

  public flatMap(other: JsonPath): JsonPath {
    return JsonPath.flatMap(this, other)
  }

  public concat(other: JsonPath): JsonPath {
    return JsonPath.concat(this, other)
  }

  public take(key: string): JsonPath {
    return this.flatMap(JsonPath.take(key))
  }

  public slice(from: number, to?: number): JsonPath {
    return this.flatMap(JsonPath.slice(from, to))
  }

  public all(): JsonPath {
    return this.flatMap(JsonPath.all())
  }

  public static identity(): JsonPath {
    return new JsonPath((o) => List.lift(o))
  }

  public static flatMap(left: JsonPath, right: JsonPath): JsonPath {
    return new JsonPath((o: Record<string, unknown>) => left.access(o).flatMap((inner) => right.access(inner)))
  }

  public static concat(left: JsonPath, right: JsonPath): JsonPath {
    return new JsonPath((o: Record<string, unknown>) => left.access(o).concat(() => right.access(o)))
  }

  public static take(key: string): JsonPath {
    return new JsonPath((o: Record<string, unknown>) =>
      Option.of(o[key])
        .map((v) => List.lift(v))
        .recover(() => List.empty())
    )
  }

  public static all(): JsonPath {
    return new JsonPath((o: Record<string, unknown>) => List.of(Object.values(o)))
  }

  public static slice(from: number, to?: number): JsonPath {
    return new JsonPath((o: Array<unknown>) => List.of(o.slice(from, to)))
  }

  public static fromString(path: string): JsonPath {
    const start = path[0]
    if (start === '$') {
      return JsonPath.identity().flatMap(JsonPath.fromString(path.substring(1)))
    } else if (start === '.' || start === '[') {
      const { keys, length } = JsonPath.extractKeys(path.substring(1))
      const next = JsonPath.fromString(path.substring(1 + length))
      const paths = keys.map((key) => JsonPath.fromKey(start, key))
      return paths.reduce((p, c) => p.concat(c)).flatMap(next)
    }
    return JsonPath.identity()
  }

  private static extractKeys(path: string): Keys {
    let length = 0
    let key = ''
    let escapeChar: string | undefined = undefined
    let escaped = false
    const keys: Key[] = []
    for (const k of path) {
      let partOfKey = true
      if (escapeChar) {
        if (k === escapeChar) {
          escapeChar = undefined
          escaped = true
          partOfKey = false
        }
        length++
      } else {
        if (k === "'" || k === '"') {
          escapeChar = k
          partOfKey = false
        }
        if (k === '.' || k === '[') {
          break
        }
        length++
        if (k === ']') {
          break
        }
        if (k === ',') {
          keys.push({ key, escaped })
          key = ''
          escaped = false
          partOfKey = false
        }
      }
      if (partOfKey) {
        key += k
      }
    }
    keys.push({ key, escaped })
    return { keys, length }
  }

  private static fromKey(start: string, k: Key): JsonPath {
    const { key, escaped } = k
    if (!escaped) {
      if (key === '' || key === '*') {
        return JsonPath.all()
      } else if (start === '[') {
        const slices = key.split(':')
        const [head, tail] = slices
        if (tail === undefined) {
          const from = Number.parseInt(head)
          if (Number.isNaN(from)) {
            return JsonPath.take(key)
          } else {
            return JsonPath.slice(from, from + 1)
          }
        } else {
          const from = Number.parseInt(head)
          const to = Number.parseInt(tail)
          const safeFrom = Number.isNaN(from) ? 0 : from
          const safeTo = Number.isNaN(to) ? undefined : to + 1
          return JsonPath.slice(safeFrom, safeTo)
        }
      }
    }
    return JsonPath.take(key)
  }
}
