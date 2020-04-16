import { Option } from '../option'
import { List } from '../List'
import { Vertex, Edge, Graph, VertexId, EdgeId, Path, PathQuery, Visit } from '.'

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

    public path(path: Path): PathQuery<S, T> {
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

    public depthFirst(vertex: VertexId): List<Visit> {
        const visit: Visit = { type: 'tree', vertex, path: List.empty() }
        return new List(Option.some(visit), () => this.dfs(visit, new Set()))
    }

    public breadthFirst(vertex: VertexId): List<Visit> {
        const visit: Visit = { type: 'tree', vertex, path: List.empty() }
        return new List(Option.some(visit), () => this.bfs(visit, new Set()))
    }

    private dfs(visit: Visit, visited: Set<VertexId>): List<Visit> {
        const path = visit.path.append(visit.vertex)
        visited.add(visit.vertex)
        return this.getVertex(visit.vertex)
            .get()
            .neighbours.flatMap((a) => {
                const type = this.updateVisited(visited, a.to)
                const currentVisit: Visit = { type, vertex: a.to, path }
                switch (type) {
                    case 'cycle':
                        return List.lift(currentVisit)
                    case 'tree':
                        return new List(Option.some(currentVisit), () => this.dfs(currentVisit, visited))
                }
            })
    }

    private bfs(visit: Visit, visited: Set<VertexId>): List<Visit> {
        visited.add(visit.vertex)
        const path = visit.path.append(visit.vertex)
        const layer: List<Visit> = this.getVertex(visit.vertex)
            .get()
            .neighbours.map((a) => ({ type: this.updateVisited(visited, a.to), vertex: a.to, path }))
        return layer.concat(() => layer.filter((v) => v.type === 'tree').flatMap((current) => this.bfs(current, visited)))
    }

    private updateVisited(visited: Set<VertexId>, vertex: VertexId): 'tree' | 'cycle' {
        if (!visited.has(vertex)) {
            visited.add(vertex)
            return 'tree'
        }
        return 'cycle'
    }

    private traversal(path: Path): List<Option<AdjacencyInformation>> {
        return path
            .batch(2, 1)
            .filter((b) => b.length === 2)
            .map(([from, to]) => this.traverse(from, to))
    }
}
