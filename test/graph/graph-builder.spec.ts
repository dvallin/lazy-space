import { GraphBuilder, FullTree, List, Option, Tree } from '../../src'

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
    const tree = FullTree.node(
      '1',
      List.of([FullTree.lift('11'), FullTree.node('12', List.empty()), FullTree.node('13', List.of([FullTree.lift('21')]))])
    )

    it('builds directed graph', () => {
      const graph = GraphBuilder.fromFullTree(tree).toAdjacencyGraph()
      expect(graph.vertexCount).toEqual(5)
      expect(graph.edgeCount).toEqual(4)
      expect(graph.neighbours('r').toArray()).toEqual(['r.0', 'r.1', 'r.2'])
      expect(graph.neighbours('r.0').toArray()).toEqual([])
      expect(graph.neighbours('r.1').toArray()).toEqual([])
      expect(graph.neighbours('r.2').toArray()).toEqual(['r.2.0'])
      expect(graph.getVertex('r.0').map((v) => v.value)).toEqual(Option.some('11'))
      expect(graph.getVertex('r.1').map((v) => v.value)).toEqual(Option.some('12'))
    })

    it('builds undirected graph', () => {
      const graph = GraphBuilder.fromFullTree(tree, false).toAdjacencyGraph()
      expect(graph.vertexCount).toEqual(5)
      expect(graph.edgeCount).toEqual(4)
      expect(graph.neighbours('r').toArray()).toEqual(['r.0', 'r.1', 'r.2'])
      expect(graph.neighbours('r.0').toArray()).toEqual(['r'])
      expect(graph.neighbours('r.1').toArray()).toEqual(['r'])
      expect(graph.neighbours('r.2').toArray()).toEqual(['r', 'r.2.0'])
      expect(graph.getVertex('r.0').map((v) => v.value)).toEqual(Option.some('11'))
      expect(graph.getVertex('r.1').map((v) => v.value)).toEqual(Option.some('12'))
    })
  })

  describe('from tree', () => {
    const tree: Tree<string> = Tree.node(List.of([Tree.lift('11'), Tree.node(List.empty()), Tree.node(List.of([Tree.lift('21')]))]))

    it('builds directed graph', () => {
      const graph = GraphBuilder.fromTree(tree).toAdjacencyGraph()
      expect(graph.vertexCount).toEqual(5)
      expect(graph.edgeCount).toEqual(4)
      expect(graph.neighbours('r').toArray()).toEqual(['r.0', 'r.1', 'r.2'])
      expect(graph.neighbours('r.0').toArray()).toEqual([])
      expect(graph.neighbours('r.1').toArray()).toEqual([])
      expect(graph.neighbours('r.2').toArray()).toEqual(['r.2.0'])
      expect(Option.ofMap(graph.getVertex('r.0'), (v) => v.value)).toEqual(Option.some('11'))
      expect(Option.ofMap(graph.getVertex('r.1'), (v) => v.value)).toEqual(Option.none())
    })

    it('builds undirected graph', () => {
      const graph = GraphBuilder.fromTree(tree, false).toAdjacencyGraph()
      expect(graph.vertexCount).toEqual(5)
      expect(graph.edgeCount).toEqual(4)
      expect(graph.neighbours('r').toArray()).toEqual(['r.0', 'r.1', 'r.2'])
      expect(graph.neighbours('r.0').toArray()).toEqual(['r'])
      expect(graph.neighbours('r.1').toArray()).toEqual(['r'])
      expect(graph.neighbours('r.2').toArray()).toEqual(['r', 'r.2.0'])
      expect(Option.ofMap(graph.getVertex('r.0'), (v) => v.value)).toEqual(Option.some('11'))
      expect(Option.ofMap(graph.getVertex('r.1'), (v) => v.value)).toEqual(Option.none())
    })
  })
})
