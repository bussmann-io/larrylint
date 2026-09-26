import rule from '../../../../src/rules/orchestr/middleware/context'
import { fixtureRuntime, tsTester } from '../../../utils'

const filename = fixtureRuntime('server/middleware/hygraph.ts', 'orchestr')

function builder(body: string, imports = '') {
  return `${imports}\nexport const defineHygraph = defineOrchestr.use(async (ctx, next) => {\n${body}\n})`
}

tsTester.run('context-cookies', rule, {
  valid: [
    { filename, code: builder(`  return next({ context: { hygraph: createClient(ctx.clientEnv) } })`) },
    { filename, code: builder(`  const shopwareContextToken = getCookie(ctx.event, 'sw-context-token')\n  return next({ context: { shopwareContextToken } })`) },
    { filename, code: builder(`  const identity = await resolveIdentity(ctx.event)\n  return next({ context: { identity, client: createClient(getCookie(ctx.event, 'app-id')) } })`) },
    { filename, code: builder(`  const api = await getClientContext(ctx.event)\n  return next({ context: { client: api.client, shopId: api.shopId } })`, `import { getClientContext } from '../utils/context'`) },
  ],

  invalid: [
    {
      filename,
      code: builder(`  const selectedStandortSlug = readLocation(ctx.event)\n  return next({ context: { hygraph, selectedStandortSlug } })`, `import { readLocation } from '../utils/context'`),
      errors: [{ messageId: 'cookie' }],
    },
    {
      filename,
      code: builder(`  const standortSlug = readSelectedSlug(ctx.event)\n  return next({ context: { standortSlug } })`, `import { readSelectedSlug } from '../utils/context'`),
      errors: [{ messageId: 'cookie' }],
    },
    {
      filename,
      code: `export const defineHygraph = defineOrchestr.extendRequest(async (args) => ({\n  context: { location: getCookie(args.event, 'location') },\n}))`,
      errors: [{ messageId: 'cookie' }],
    },
  ],
})
