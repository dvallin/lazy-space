import { describe, expect, it } from 'vitest'
import { GraphBuilder } from '..'

describe('AdjacencyGraph', () => {
  const graph = new GraphBuilder<string, string>()
    .addVertex('A', 'vertex1')
    .addVertex('B', 'vertex2')
    .addVertex('C', 'vertex3')
    .addVertex('D', 'vertex4')
    .addEdge('A', 'B', 'edge1')
    .addEdge('A', 'D', 'edge1')
    .addEdge('B', 'C', 'edge2')
    .addEdge('B', 'A', 'edge3')
    .toAdjacencyGraph()

  describe('neighbours', () => {
    it('finds neighbours', () => {
      expect(graph.neighbours('A').toArray()).toEqual(['B', 'D'])
    })

    it('finds neighbours of isolated nodes', () => {
      expect(graph.neighbours('D').toArray()).toEqual([])
    })

    it('finds neighbours of missing nodes', () => {
      expect(graph.neighbours('R').toArray()).toEqual([])
    })
  })
})
