import { Option } from '../option'
import { List } from '../list'
import { Vertex, Edge, Graph, VertexId, EdgeId, AdjacencyInformation } from '.'

export interface AdjacencyList {
  neighbours: List<AdjacencyInformation>
}

export type AdjacencyVertex<T> = Vertex<T> & AdjacencyList
export type AdjacencyEdge<T> = Edge<T>

export class AdjacencyGraph<S, T> implements Graph<S, T> {
  constructor(public readonly vertices: Map<string, AdjacencyVertex<S>>, public readonly edges: Map<string, AdjacencyEdge<T>>) {}

  public get vertexCount(): number {
    return this.vertices.size
  }

  public get edgeCount(): number {
    return this.edges.size
  }

  public getVertex(id: VertexId): Option<AdjacencyVertex<S>> {
    return Option.of(this.vertices.get(id))
  }

  public getEdge(id: EdgeId): Option<AdjacencyEdge<T>> {
    return Option.of(this.edges.get(id))
  }

  public getEdgeId(from: VertexId, to: VertexId): Option<EdgeId> {
    return this.getVertex(from)
      .flatMap((v) => v.neighbours.find((neighbour) => neighbour.to === to))
      .map((a) => a.edge)
  }

  public neighbours(id: VertexId): List<VertexId> {
    return this.getVertex(id)
      .map((e) => e.neighbours.map((n) => n.to))
      .recover(() => List.empty())
  }
}
