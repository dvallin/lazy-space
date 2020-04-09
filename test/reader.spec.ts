import { Reader, lift, pipe, join, just } from '../src/reader'
import { Option, isSome, of } from '../src/option'
import { recover } from '../src/either'

interface Context {
    env: { readonly [key: string]: string }
    errors: string[]
}

function readKey(key: string): Reader<Context, Option<string>> {
    return lift((c) => of(c.env[key]))
}
function unwrapKey(key: Option<string>): Reader<Context, string> {
    return lift((c) => {
        if (!isSome(key)) {
            c.errors.push('could not find key')
        }
        return recover(key, () => 'missing')
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
            const pipeline = (key: string): Reader<Context, string> => readKey(key).map((value) => recover(value, () => 'missing'))
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
            const pipeline = pipe(readKey, unwrapKey)
            const result = pipeline('env2').read(context)
            expect(result).toEqual('missing')
            expect(context.errors).toHaveLength(1)
        })
    })

    describe('join', () => {
        it('flattens reader', () => {
            const pipeline = (key: string): Reader<Context, string> => join(readKey(key).map(unwrapKey))
            const result = pipeline('env2').read(context)
            expect(result).toEqual('missing')
            expect(context.errors).toHaveLength(1)
        })
    })

    describe('just', () => {
        it('only returns value without context', () => {
            const result = just('env2').read(context)
            expect(result).toEqual('env2')
        })
    })
})
