import { Option } from '../option'
import { List } from '../List'
import { Vertex, Edge, Graph, VertexId, EdgeId, Path, PathQuery } from '.'

export interface AdjacencyInformation {
    to: string
    edge: string
}

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

    public traverse(from: VertexId, to: VertexId): Option<AdjacencyInformation> {
        return this.getVertex(from).flatMap((v) => v.neighbours.find((neighbour) => neighbour.to === to))
    }

    public neighbours(id: VertexId): List<VertexId> {
        return this.getVertex(id)
            .map((e) => e.neighbours.map((n) => n.to))
            .recover(() => List.empty())
    }

    public queryPath(path: Path): PathQuery<S, T> {
        const traversal = this.traversal(path)
        return {
            exists: () => traversal.all((a) => Option.isSome(a)),
            edges: () => List.flattenOptionals(traversal.map((t) => t.flatMap((info) => this.getEdge(info.edge)))),
            vertices: () =>
                List.flattenOptionals(
                    traversal.map((t) => t.flatMap((info) => this.getVertex(info.to))).prepend(path.head.flatMap((v) => this.getVertex(v)))
                ),
        }
    }

    private traversal(path: Path): List<Option<AdjacencyInformation>> {
        return path
            .batch(2, 1)
            .filter((b) => b.length === 2)
            .map(([from, to]) => this.traverse(from, to))
    }
}
