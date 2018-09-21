import { World } from "../../src/ecs/world"
import { DenseStorage } from "../../src/ecs/storage"
import { Vector } from "../../src/spatial"
import { None } from "../../src/option";

describe("World", () => {

    let world: World
    beforeEach(() => {
        world = new World()
    })

    describe("entity", () => {

        it("creates entities", () => {
            expect(world.createEntity().entity).toEqual(0)
            expect(world.createEntity().entity).toEqual(1)
        })

        it("adds components", () => {
            world.registerComponent("position", new DenseStorage<Vector>())

            const e1 = world.createEntity().withComponent("position", new Vector(0, 1)).entity

            const entity = world.fetchEntity(e1, "position").get(undefined)
            const position = entity!.components["position"] as Vector
            expect(position.key()).toEqual("0,1")
        })

        it("removes components", () => {
            world.registerComponent("position", new DenseStorage<Vector>())

            const e1 = world.createEntity().withComponent("position", new Vector(0, 1)).entity
            world.editEntity(e1).removeComponent("position")

            expect(world.fetchEntity(e1, "position")).toEqual(new None())
        })

        it("deletes entities", () => {
            const e1 = world.createEntity().entity
            const e2 = world.createEntity().entity
            const e3 = world.createEntity().entity

            world.deleteEntity(1)

            const e4 = world.createEntity().entity

            expect(e1).toEqual(0)
            expect(e2).toEqual(1)
            expect(e3).toEqual(2)
            expect(e4).toEqual(e2)
        })

        it("removes components of deleted entities", () => {
            world.registerComponent("position", new DenseStorage<Vector>())

            const e1 = world.createEntity().withComponent("position", new Vector(0, 1)).entity
            world.deleteEntity(e1)

            expect(world.fetchEntity(e1, "position")).toEqual(new None())
        })
    })

    describe("component", () => {

        it("creates storage on component registration", () => {
            world.registerComponent("position", new DenseStorage<Vector>())

            const storage = world.getStorage("position").get(undefined)!
            expect(storage).toEqual(new DenseStorage())
        })
    })
})
