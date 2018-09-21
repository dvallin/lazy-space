export namespace Lazy {

    export function lazy<A>(p: () => A): () => A {
        let cache: A
        let processed = false
        return () => {
            if (!processed) {
                cache = p()
                processed = true
            }
            return cache
        }
    }
}
