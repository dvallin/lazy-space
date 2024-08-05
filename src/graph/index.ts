import type { List } from '../list'
import type { Option } from '../option'

export type VertexId = string
export type EdgeId = string
export interface Vertex<T> {
  value?: T
}
export interface Edge<T> {
  from: VertexId
  to: VertexId
  value?: T
}

export type Path = List<VertexId>

export interface PathQuery<S, T> {
  exists(): boolean
  vertices(): List<Vertex<S>>
  edges(): List<Edge<T>>
}

export interface AdjacencyInformation {
  to: string
  edge: string
}

export interface Graph<S, T> {
  vertexCount: number
  edgeCount: number

  getVertex(id: VertexId): Option<Vertex<S>>
  getEdge(id: EdgeId): Option<Edge<T>>
  getEdgeId(from: VertexId, to: VertexId): Option<EdgeId>

  neighbours(vertex: VertexId): List<VertexId>
}

export * from './graph-builder'
export * from './graph-queries'
export * from './adjacency-graph'
