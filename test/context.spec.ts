import { Reader, just, then, map, bind, join } from '../src/reader'
import { Option, isValid, of } from '../src/option'
import { recover } from '../src/either'

interface Context {
    env: { readonly [key: string]: string }
    errors: string[]
}

function readKey(key: string): Reader<Context, Option<string>> {
    return (c) => of(c.env[key])
}
function unwrapKey(key: Option<string>): Reader<Context, string> {
    return (c) => {
        if (!isValid(key)) {
            c.errors.push('could not find key')
        }
        return recover(key, () => 'missing')
    }
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

    describe('just', () => {
        it('is trivial', () => {
            const result = just(readKey('env1'))(context)
            expect(result).toEqual(readKey('env1')(context))
        })
    })

    describe('map', () => {
        it('maps a pure function onto a reader', () => {
            const pipeline = (key: string): Reader<Context, string> => map(readKey(key), (value) => recover(value, () => 'missing'))
            expect(pipeline('env1')(context)).toEqual('1')
            expect(pipeline('env2')(context)).toEqual('missing')
        })
    })

    describe('bind', () => {
        it('maps a pipeline step onto a reader', () => {
            const pipeline = (key: string): Reader<Context, string> => bind(readKey(key), unwrapKey)
            expect(pipeline('env1')(context)).toEqual('1')
            expect(pipeline('env2')(context)).toEqual('missing')
        })
    })

    describe('then', () => {
        it('concatenates pipeline steps', () => {
            const pipeline = then(readKey, unwrapKey)
            const result = pipeline('env2')(context)
            expect(result).toEqual('missing')
            expect(context.errors).toHaveLength(1)
        })
    })

    describe('join', () => {
        it('flattens reader', () => {
            const pipeline = (key: string): Reader<Context, string> => join(map(readKey(key), unwrapKey))
            const result = pipeline('env2')(context)
            expect(result).toEqual('missing')
            expect(context.errors).toHaveLength(1)
        })
    })
})
