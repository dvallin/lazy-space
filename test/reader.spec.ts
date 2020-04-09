import { Reader, Option } from '../src'

interface Context {
    env: { readonly [key: string]: string }
    errors: string[]
}

function readKey(key: string): Reader<Context, Option<string>> {
    return Reader.lift((c) => Option.of(c.env[key]))
}
function unwrapKey(key: Option<string>): Reader<Context, string> {
    return Reader.lift((c) => {
        if (!Option.isSome(key)) {
            c.errors.push('could not find key')
        }
        return Option.recover(key, () => 'missing')
    })
}

describe('Reader', () => {
    let context: Context
    beforeEach(() => {
        context = {
            env: {
                env1: '1',
            },
            errors: [],
        }
    })

    describe('map', () => {
        it('maps a pure function onto a reader', () => {
            const pipeline = (key: string): Reader<Context, string> => readKey(key).map((value) => Option.recover(value, () => 'missing'))
            expect(pipeline('env1').read(context)).toEqual('1')
            expect(pipeline('env2').read(context)).toEqual('missing')
        })
    })

    describe('flatMap', () => {
        it('maps a pipeline step onto a reader', () => {
            const pipeline = (key: string): Reader<Context, string> => readKey(key).flatMap(unwrapKey)
            expect(pipeline('env1').read(context)).toEqual('1')
            expect(pipeline('env2').read(context)).toEqual('missing')
        })
    })

    describe('pipe', () => {
        it('concatenates pipeline steps', () => {
            const pipeline = Reader.pipe(readKey, unwrapKey)
            const result = pipeline('env2').read(context)
            expect(result).toEqual('missing')
            expect(context.errors).toHaveLength(1)
        })
    })

    describe('join', () => {
        it('flattens reader', () => {
            const pipeline = (key: string): Reader<Context, string> => Reader.join(readKey(key).map(unwrapKey))
            const result = pipeline('env2').read(context)
            expect(result).toEqual('missing')
            expect(context.errors).toHaveLength(1)
        })
    })

    describe('just', () => {
        it('only returns value without context', () => {
            const result = Reader.just('env2').read(context)
            expect(result).toEqual('env2')
        })
    })
})
