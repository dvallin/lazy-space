import { GraphBuilder } from '../../src'

describe('GraphBuilder', () => {
  let builder: GraphBuilder<void, void>
  describe('directed', () => {
    beforeEach(() => {
      builder = new GraphBuilder<void, void>()
    })

    it('builds adjacency graphs', () => {
      const graph = builder.addEdge('A', 'B').addEdge('B', 'C').toAdjacencyGraph()
      expect(graph.vertexCount).toEqual(3)
      expect(graph.edgeCount).toEqual(2)
      expect(graph.neighbours('A').toArray()).toEqual(['B'])
      expect(graph.neighbours('B').toArray()).toEqual(['C'])
      expect(graph.neighbours('C').toArray()).toEqual([])
    })
  })

  describe('undirected', () => {
    beforeEach(() => {
      builder = new GraphBuilder<void, void>(false)
    })

    it('builds adjacency graphs', () => {
      const graph = builder.addEdge('A', 'B').addEdge('B', 'C').toAdjacencyGraph()
      expect(graph.vertexCount).toEqual(3)
      expect(graph.edgeCount).toEqual(2)
      expect(graph.neighbours('A').toArray()).toEqual(['B'])
      expect(graph.neighbours('B').toArray()).toEqual(['A', 'C'])
      expect(graph.neighbours('C').toArray()).toEqual(['B'])
    })
  })
})
