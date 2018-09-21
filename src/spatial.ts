import { Stream, just } from "@/lazy/stream"
import { lazy } from "@/lazy/lazy";

export class Vector {

    private readonly coordinates: number[]

    public constructor(...coords: number[]) {
        this.coordinates = coords
    }

    public key = lazy(() => this.coordinates.join())
}

export interface Filter {

    label: string
    name: string
    id: string
}

export interface Space<A> {
    get(pos: Vector): Stream<A>
    set(pos: Vector, objects: A[]): void

    add(pos: Vector, object: A): void
    remove(pos: Vector, object: A): void
}

export class DiscreteSpace<A> implements Space<A> {

    private readonly objects: Map<string, A[]> = new Map()

    get(pos: Vector): Stream<A> {
        const key = pos.key()
        const objects = this.objects.get(key) || []
        return just(objects)
    }

    set(pos: Vector, objects: A[]): void {
        const key = pos.key()
        this.objects.set(key, objects)
    }

    add(pos: Vector, object: A): void {
        const key = pos.key()
        const objects = this.objects.get(key) || []
        objects.push(object)
        this.objects.set(key, objects)
    }

    remove(pos: Vector, object: A): void {
        const key = pos.key()
        const objects = this.objects.get(key) || []
        this.objects.set(key, objects.filter(o => o !== object))
    }
}

export class SubSpace<A> implements Space<A> {

    public constructor(
        public readonly space: Space<A>,
        public readonly transform: (pos: Vector) => Vector
    ) { }

    get(pos: Vector): Stream<A> {
        return this.space.get(this.transform(pos))
    }

    set(pos: Vector, objects: A[]): void {
        return this.space.set(this.transform(pos), objects)
    }

    add(pos: Vector, object: A): void {
        return this.space.add(this.transform(pos), object)
    }

    remove(pos: Vector, object: A): void {
        return this.space.remove(this.transform(pos), object)
    }
}
