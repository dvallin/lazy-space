import { GraphBuilder, Tree, List, Option } from '../../src'

describe('GraphBuilder', () => {
  let builder: GraphBuilder<void, void>
  describe('directed', () => {
    beforeEach(() => {
      builder = new GraphBuilder<void, void>()
    })

    it('builds adjacency graphs', () => {
      const graph = builder.addEdge('A', 'B').addEdge('B', 'C').addEdge('B', 'C').toAdjacencyGraph()
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

  describe('from full tree', () => {
    const tree = Tree.node('1', List.of([Tree.lift('11'), Tree.node('12', List.empty()), Tree.node('13', List.of([Tree.lift('21')]))]))

    it('builds directed graph', () => {
      const graph = GraphBuilder.fromTree(tree).toAdjacencyGraph()
      expect(graph.vertexCount).toEqual(5)
      expect(graph.edgeCount).toEqual(4)
      expect(graph.neighbours('_').toArray()).toEqual(['_.0', '_.1', '_.2'])
      expect(graph.neighbours('_.0').toArray()).toEqual([])
      expect(graph.neighbours('_.1').toArray()).toEqual([])
      expect(graph.neighbours('_.2').toArray()).toEqual(['_.2.0'])
      expect(graph.getVertex('_.0').map((v) => v.value)).toEqual(Option.some('11'))
      expect(graph.getVertex('_.1').map((v) => v.value)).toEqual(Option.some('12'))
    })

    it('builds undirected graph', () => {
      const graph = GraphBuilder.fromTree(tree, '_', false).toAdjacencyGraph()
      expect(graph.vertexCount).toEqual(5)
      expect(graph.edgeCount).toEqual(4)
      expect(graph.neighbours('_').toArray()).toEqual(['_.0', '_.1', '_.2'])
      expect(graph.neighbours('_.0').toArray()).toEqual(['_'])
      expect(graph.neighbours('_.1').toArray()).toEqual(['_'])
      expect(graph.neighbours('_.2').toArray()).toEqual(['_', '_.2.0'])
      expect(graph.getVertex('_.0').map((v) => v.value)).toEqual(Option.some('11'))
      expect(graph.getVertex('_.1').map((v) => v.value)).toEqual(Option.some('12'))
    })
  })
})
