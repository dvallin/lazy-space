import type { AdjacencyInformation, Graph, Path, PathQuery, VertexId } from '.'
import { List } from '../list'
import type { Option } from '../option'

export interface Visit {
  type: 'tree' | 'cycle'
  vertex: VertexId
  path: Path
}

export class GraphQueries<S, T> {
  public constructor(private readonly graph: Graph<S, T>) {}

  public path(path: Path): PathQuery<S, T> {
    const traversal = this.traversal(path)
    return {
      exists: () => traversal.all(a => a.isSome()),
      edges: () => List.flattenOptionals(traversal.map(t => t.flatMap(info => this.graph.getEdge(info.edge)))),
      vertices: () =>
        List.flattenOptionals(
          traversal
            .map(t => t.flatMap(info => this.graph.getVertex(info.to)))
            .prepend(path._head.flatMap(v => this.graph.getVertex(v.eval()))),
        ),
    }
  }

  public depthFirst(vertex: VertexId): List<Visit> {
    const visit: Visit = { type: 'tree', vertex, path: List.empty() }
    return List.lift(visit, () => this.dfs(visit, new Set()))
  }

  public breadthFirst(vertex: VertexId): List<Visit> {
    const visit: Visit = { type: 'tree', vertex, path: List.empty() }
    return List.lift(visit, () => this.bfs(visit, new Set()))
  }

  private dfs(visit: Visit, visited: Set<VertexId>): List<Visit> {
    const path = visit.path.append(visit.vertex)
    visited.add(visit.vertex)
    return this.graph.neighbours(visit.vertex).flatMap(vertex => {
      const type = this.updateVisited(visited, vertex)
      const currentVisit: Visit = { type, vertex, path }
      switch (type) {
        case 'cycle':
          return List.lift(currentVisit)
        case 'tree':
          return List.lift(currentVisit, () => this.dfs(currentVisit, visited))
      }
    })
  }

  private bfs(visit: Visit, visited: Set<VertexId>): List<Visit> {
    visited.add(visit.vertex)
    const path = visit.path.append(visit.vertex)
    const layer = this.graph
      .neighbours(visit.vertex)
      .map(vertex => ({ type: this.updateVisited(visited, vertex), vertex, path }), true)
    return layer.concat(() => layer.filter(v => v.type === 'tree').flatMap(current => this.bfs(current, visited)))
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
      .filter(b => b.length === 2)
      .map(([from, to]) => this.graph.getEdgeId(from, to).map(edge => ({ to, edge })))
  }
}
