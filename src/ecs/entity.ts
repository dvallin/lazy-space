import { World } from "./world"
import { Component } from "./component"

import { evaluate } from "../lazy"

export type Entity = number

export class EntityModifier {

    public constructor(
        private readonly world: World,
        public readonly entity: Entity
    ) { }

    withComponent<A extends Component>(name: string, component: A): EntityModifier {
        this.world.getStorage<A>(name).map(s => s.set(this.entity, component))
        return this
    }

    removeComponent<A extends Component>(name: string): EntityModifier {
        this.world.getStorage<A>(name)
            .filter(s => s !== undefined)
            .map(s => s.remove(this.entity))
        return this
    }

    delete(): void {
        evaluate(this.world.allStorages().map(s => s.remove(this.entity)))
    }
}
