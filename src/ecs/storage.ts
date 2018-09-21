import { Entity } from "@/ecs/entity"
import { Component } from "@/ecs/component"
import { Option, of } from "@/option"

export interface Storage<A extends Component> {

    set(id: Entity, component: A): Storage<A>
    remove(id: Entity): Storage<A>
    get(id: Entity): Option<A>
    has(id: Entity): boolean
}

export class SparseStorage<A extends Component> implements Storage<A> {

    private readonly data: Map<Entity, A> = new Map()

    set(id: Entity, component: A): Storage<A> {
        this.data.set(id, component)
        return this
    }

    remove(id: Entity): Storage<A> {
        this.data.delete(id)
        return this
    }

    get(id: Entity): Option<A> {
        return of(this.data.get(id))
    }

    has(id: Entity): boolean {
        return this.data.has(id)
    }
}

export class DenseStorage<A extends Component> implements Storage<A> {

    private readonly data: (A | undefined)[] = []

    set(id: Entity, component: A): Storage<A> {
        this.data[id] = component
        return this
    }

    remove(id: Entity): Storage<A> {
        this.data[id] = undefined
        return this
    }

    get(id: Entity): Option<A> {
        return of(this.data[id])
    }

    has(id: Entity): boolean {
        return this.data[id] !== undefined
    }
}
