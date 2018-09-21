import { World, Entity, Component, System, DenseStorage } from "../../src/ecs"
import { Vector } from "../../src/spatial"

describe("Single Component Systems", () => {
    let world: World
    let entity: Entity

    beforeEach(() => {
        world = new World()
        world.registerComponent("position", new DenseStorage<Vector>())
        entity = world.createEntity()
            .withComponent("position", new Vector(0, 1))
            .entity
    })

    it("iterates over all entities", async () => {
        const entities: Entity[] = []
        const positions: { [key: string]: Component }[] = []
        class SingleComponentSystem implements System {
            components(): string[] {
                return ["position"]
            }
            process(entity: Entity, components: { [key: string]: Component }) {
                entities.push(entity)
                positions.push(components)
            }
        }
        world.registerSystem("scs", new SingleComponentSystem())

        await world.tick()

        expect(entities).toEqual([entity])
    })
})
