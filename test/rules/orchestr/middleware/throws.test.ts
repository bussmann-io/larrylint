import rule from '../../../../src/rules/orchestr/middleware/throws'
import { fixtureRuntime, runtime, tsTester } from '../../../utils'

const filename = fixtureRuntime('server/middleware/api.ts', 'orchestr')

function builder(body: string, imports = '') {
  return `${imports}\nexport const defineApi = defineOrchestr\n  .meta({ app: 'app' })\n  .extendRequest(async (args) => {\n${body}\n  })`
}

tsTester.run('initware-throws', rule, {
  valid: [
    { filename, code: builder(`    if (!key) {\n      return { context: { client: unconfiguredClient(() => { throw new Error('Not configured') }) } }\n    }\n    return { context: { client: createClient(key) } }`) },
    { filename, code: builder(`    try {\n      return { context: await getApiContext(args.event) }\n    }\n    catch {\n      return { context: {} }\n    }`, `import { getApiContext } from '../utils/context'`) },
    { filename, code: builder(`    return { context: { client: getSafeContext(args.event), later: lazyClient() } }`, `import { getSafeContext, lazyClient } from '../utils/context'`) },
    { filename, code: `export const defineApi = defineOrchestr.use(async (ctx, next) => {\n  if (!ctx.key) throw new Error('No key')\n  return next()\n})` },
    { filename: runtime('server/utils/fail.ts'), code: `export function fail() {\n  throw new Error('fail')\n}` },
  ],

  invalid: [
    {
      filename,
      code: builder(`    if (!key) {\n      throw createError({ message: 'API key missing' })\n    }\n    return { context: {} }`),
      errors: [{ messageId: 'throws', line: 6 }],
    },
    {
      filename,
      code: builder(`    const context = await getApiContext(args.event)\n    return { context }`, `import { getApiContext } from '../utils/context'`),
      errors: [{ messageId: 'throwsInCall', data: { name: 'getApiContext', location: '../utils/context.ts:5' } }],
    },
    {
      filename,
      code: `${builder(`    return { context: readConfig() }`)}\n\nfunction readConfig() {\n  throw new Error('No config')\n}`,
      errors: [{ messageId: 'throwsInCall', data: { name: 'readConfig', location: 'line 9' } }],
    },
  ],
})
