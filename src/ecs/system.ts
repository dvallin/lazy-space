import { Entity } from "@/ecs/entity"
import { Component } from "@/ecs/component"

export interface System {
    components(): string[]
    process(entity: Entity, components: { [name: string]: Component }): void
}


