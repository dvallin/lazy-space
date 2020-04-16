import { GraphBuilder } from '../../src/graph/graph-builder'
import { List } from '../../src/'
import { Visit } from '../../src/graph'

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

    describe('pathQuery', () => {
        describe('exists', () => {
            it('finds a path', () => {
                const path = graph.path(List.of(['A', 'B', 'C']))
                expect(path.exists()).toBeTruthy()
            })

            it('detects if a path does not exist', () => {
                const path = graph.path(List.of(['A', 'B', 'D']))
                expect(path.exists()).toBeFalsy()
            })

            it('detects if an infinite path does not exist', () => {
                const path = graph.path(List.natural().map((i) => ['A', 'B', 'D'][i - 1]))
                expect(path.exists()).toBeFalsy()
            })
        })
        describe('vertices', () => {
            it('finds a path', () => {
                const path = graph.path(List.of(['A', 'B', 'C']))
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
                const path = graph.path(List.of(['A', 'B', 'C']))
                expect(
                    path
                        .edges()
                        .map((e) => e.value)
                        .toArray()
                ).toEqual(['edge1', 'edge2'])
            })
        })
    })

    describe('dfsQuery', () => {
        it('extracts tree', () => {
            const query = graph.depthFirst('A')
            expect(getTree(query)).toEqual(['A', 'B', 'C', 'D'])
        })

        it('extracts cycles', () => {
            const query = graph.depthFirst('A')
            expect(getCycles(query)).toEqual([['A', 'B', 'A']])
        })
    })

    describe('bfsQuery', () => {
        it('extracts tree', () => {
            const query = graph.breadthFirst('A')
            expect(getTree(query)).toEqual(['A', 'B', 'D', 'C'])
        })

        it('extracts cycles', () => {
            const query = graph.breadthFirst('A')
            expect(getCycles(query)).toEqual([['A', 'B', 'A']])
        })
    })

    function getTree(query: List<Visit>): string[] {
        return query
            .filter((v) => v.type === 'tree')
            .map((v) => v.vertex)
            .toArray()
    }

    function getCycles(query: List<Visit>): string[][] {
        return query
            .filter((v) => v.type === 'cycle')
            .map((v) => v.path.append(v.vertex).toArray())
            .toArray()
    }
})
