import { SparseStorage, DenseStorage, Storage } from "../../src/ecs/storage"
import { Some, None } from "../../src/option"

describe("SparseStorage", () => {

    storageTest(() => new SparseStorage<{ id: number }>())
})

describe("DenseStorage", () => {

    storageTest(() => new DenseStorage<{ id: number }>())
})


function storageTest(createStorage: () => Storage<{ id: number }>) {

    let storage: Storage<{ id: number }>
    beforeEach(() => {
        storage = createStorage()
    })

    it("gets none if not found", () => {
        expect(storage.get(0)).toEqual(new None())
    })

    it("sets values and gets it", () => {
        storage.set(0, { id: 1 })
        expect(storage.get(0)).toEqual(new Some({ id: 1 }))
    })

    it("removes values", () => {
        storage.set(0, { id: 1 })
        storage.remove(0)
        expect(storage.get(0)).toEqual(new None())
    })

    it("checks for values existance", () => {
        expect(storage.has(0)).toBeFalsy()
        storage.set(0, { id: 1 })
        expect(storage.has(0)).toBeTruthy()
    })

    it("overrides values", () => {
        storage.set(1, { id: 1 })
        storage.set(2, { id: 2 })
        storage.set(1, { id: 3 })
        expect(storage.get(1)).toEqual(new Some({ id: 3 }))
        expect(storage.get(2)).toEqual(new Some({ id: 2 }))
    })
}
