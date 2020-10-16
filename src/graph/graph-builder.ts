import { Vertex, Edge, AdjacencyInformation } from '.'
import { AdjacencyGraph, AdjacencyVertex } from './adjacency-graph'
import { List } from '../list'
import { Tree } from '../tree'

export type EdgeKeyGenerator = (from: string, to: string) => string
export const directed: EdgeKeyGenerator = (from, to) => `${from}->${to}`
export const undirected: EdgeKeyGenerator = (from, to) => (from.localeCompare(to) > 0 ? directed(to, from) : directed(from, to))

export class GraphBuilder<S = undefined, T = undefined> {
  private vertices: Map<string, Vertex<S>> = new Map()
  private edges: Map<string, Edge<T>> = new Map()
  private neighbours: Map<string, Set<string>> = new Map()

  constructor(private readonly directed: boolean = true) {}

  public addVertex(id: string, value?: S): GraphBuilder<S, T> {
    if (!this.vertices.has(id)) {
      this.setVertex(id, value)
    }
    return this
  }

  public setVertex(id: string, value?: S): GraphBuilder<S, T> {
    this.vertices.set(id, { value })
    return this
  }

  public static fromTree<T>(tree: Tree<T>, root = '_', directed = true): GraphBuilder<T, T> {
    return GraphBuilder.addTree(new GraphBuilder<T, T>(directed), root, tree)
  }

  private static addTree<T>(builder: GraphBuilder<T, T>, id: string, tree: Tree<T>): GraphBuilder<T, T> {
    return tree.tree.unwrap(
      (leaf) => builder.setVertex(id, leaf.value),
      (node) => {
        let index = 0
        builder.setVertex(id, node.value)
        node.children.forEach((child) => {
          const childId = id + '.' + index
          builder.addEdge(id, childId)
          GraphBuilder.addTree(builder, childId, child)
          index++
        })
        return builder
      }
    )
  }

  public addEdge(from: string, to: string, value?: T): GraphBuilder<S, T> {
    this.addVertex(from)
    this.addVertex(to)
    const key = this.edgeKey(from, to)
    if (!this.edges.has(key)) {
      this.edges.set(key, { from, to, value })
      this.addNeighbourInformation(from, to)
      if (!this.directed) {
        this.addNeighbourInformation(to, from)
      }
    }
    return this
  }

  public toAdjacencyGraph(): AdjacencyGraph<S, T> {
    const vertices: Map<string, AdjacencyVertex<S>> = new Map()
    this.vertices.forEach((vertex, key) => {
      const neighbours: AdjacencyInformation[] = []
      const n = this.neighbours.get(key) || new Set()
      n.forEach((to) => neighbours.push({ to, edge: this.edgeKey(key, to) }))
      vertices.set(key, {
        ...vertex,
        neighbours: List.of(neighbours),
      })
    })
    return new AdjacencyGraph(vertices, this.edges)
  }

  private addNeighbourInformation(from: string, to: string): void {
    const neighbours = this.neighbours.get(from) || new Set()
    neighbours.add(to)
    this.neighbours.set(from, neighbours)
  }

  private edgeKey(from: string, to: string): string {
    return this.directed ? directed(from, to) : undirected(from, to)
  }
}
