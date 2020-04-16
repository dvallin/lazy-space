import { GraphBuilder } from '../../src/graph/graph-builder'
import { List } from '../../src/'

describe('AdjacencyGraph', () => {
    const simpleDirectedGraph = new GraphBuilder<string, string>()
        .addVertex('A', 'vertex1')
        .addVertex('B', 'vertex2')
        .addVertex('C', 'vertex3')
        .addVertex('D', 'vertex4')
        .addEdge('A', 'B', 'edge1')
        .addEdge('B', 'C', 'edge2')
        .addEdge('B', 'A', 'edge3')
        .toAdjacencyGraph()

    describe('neighbours', () => {
        it('finds neighbours', () => {
            expect(simpleDirectedGraph.neighbours('A').toArray()).toEqual(['B'])
        })

        it('finds neighbours of isolated nodes', () => {
            expect(simpleDirectedGraph.neighbours('D').toArray()).toEqual([])
        })

        it('finds neighbours of isolated nodes', () => {
            expect(simpleDirectedGraph.neighbours('R').toArray()).toEqual([])
        })
    })

    describe('pathQuery', () => {
        describe('exists', () => {
            it('finds a path', () => {
                const path = simpleDirectedGraph.queryPath(List.of(['A', 'B', 'C']))
                expect(path.exists()).toBeTruthy()
            })

            it('detects if a path does not exist', () => {
                const path = simpleDirectedGraph.queryPath(List.of(['A', 'B', 'D']))
                expect(path.exists()).toBeFalsy()
            })

            it('detects if an infinite path does not exist', () => {
                const path = simpleDirectedGraph.queryPath(List.natural().map((i) => ['A', 'B', 'D'][i - 1]))
                expect(path.exists()).toBeFalsy()
            })
        })
        describe('vertices', () => {
            it('finds a path', () => {
                const path = simpleDirectedGraph.queryPath(List.of(['A', 'B', 'C']))
                expect(
                    path
                        .vertices()
                        .map((v) => v.value)
                        .toArray()
                ).toEqual(['vertex1', 'vertex2', 'vertex3'])
            })
        })
        describe('edges', () => {
            it('finds a path', () => {
                const path = simpleDirectedGraph.queryPath(List.of(['A', 'B', 'C']))
                expect(
                    path
                        .edges()
                        .map((e) => e.value)
                        .toArray()
                ).toEqual(['edge1', 'edge2'])
            })
        })
    })
})
