import { List } from '../list'
import { Option } from '../option'

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

export interface Graph<S, T> {
    vertexCount: number
    edgeCount: number

    getVertex(id: VertexId): Option<Vertex<S>>
    getEdge(id: EdgeId): Option<Edge<T>>

    neighbours(vertex: VertexId): List<VertexId>

    queryPath(path: Path): PathQuery<S, T>
}
