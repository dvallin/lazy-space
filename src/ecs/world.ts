import { Storage } from "@/ecs/storage"
import { System } from "@/ecs/system"
import { Component } from "@/ecs/component"
import { Option, of, None, Some } from "@/option"
import { EntityModifier, Entity } from "@/ecs/entity"
import { interval, Stream, iterator } from "@/lazy/stream"

export interface FetchedEntity {
    entity: Entity
    components: { [name: string]: Component }
}

export class World {

    components: Map<string, Storage<Component>> = new Map()
    systems: Map<string, System> = new Map()

    openEntities: Set<Entity> = new Set()
    lastEntity: Entity = -1

    registerComponent<A extends Component>(name: string, storage: Storage<A>): void {
        this.components.set(name, storage)
    }

    registerSystem(name: string, system: System): void {
        this.systems.set(name, system)
    }

    getStorage<A extends Component>(name: string): Option<Storage<A>> {
        return of(this.components.get(name) as Storage<A>)
    }

    allStorages(): Stream<Storage<Component>> {
        return iterator(this.components.values())
    }

    createEntity(): EntityModifier {
        let entity
        if (this.openEntities.size > 0) {
            entity = this.openEntities.values().next().value
            this.openEntities.delete(entity)
        } else {
            entity = ++this.lastEntity
        }
        return new EntityModifier(this, entity)
    }

    editEntity(entity: Entity): EntityModifier {
        return new EntityModifier(this, entity)
    }

    deleteEntity(entity: Entity): void {
        this.editEntity(entity).delete()
        this.openEntities.add(entity)
    }

    fetchEntity(entity: Entity, ...storages: string[]): Option<FetchedEntity> {
        let components: { [name: string]: Component } = {}
        for (const storage of storages) {
            const s = this.getStorage(storage).get(undefined)!
            const componentValue = s.get(entity).get(undefined)
            if (componentValue === undefined) {
                return new None()
            }
            components[storage] = componentValue
        }
        return new Some({ entity, components })
    }

    tick(): void {
        interval(0, this.lastEntity)
            .filter(e => !this.openEntities.has(e))
            .flatMap(e => {
                return iterator(this.systems.values()).map(system => {
                    this.fetchEntity(e, ...system.components())
                        .map((entity) => system.process(e, entity.components))
                })
            })
            .evaluate()
    }


}

