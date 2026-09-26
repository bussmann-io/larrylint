import rule from '../../../../src/rules/orchestr/handlers/exports'
import { runtime, tsTester } from '../../../utils'

tsTester.run('handler-exports', rule, {
  valid: [
    { filename: runtime('server/orchestr/brunch/Brunch.query.ts'), code: `export default defineHygraph.queryHandler(BrunchQuery, async () => ({ ids: [] }))` },
    { filename: runtime('server/orchestr/brunch/Brunch.resolver.ts'), code: `const resolver = defineHygraph.componentResolver({})\nexport { resolver as default }` },
    { filename: runtime('server/orchestr/brunch/Brunch.link.ts'), code: `export async function fetchAllBrunches() {}\nexport type BrunchArgs = { slug: string }\nexport default defineHygraph.linkHandler({})` },
    { filename: runtime('server/orchestr/brunch/filters.ts'), code: `export const filters = {}` },
  ],

  invalid: [
    {
      filename: runtime('server/orchestr/brunch/Brunch.action.ts'),
      code: `const handler = defineHygraph.actionHandler({})`,
      errors: [{ messageId: 'missingDefault' }],
    },
    {
      filename: runtime('server/orchestr/brunch/Brunch.query.ts'),
      code: `export const brunchQuery = defineHygraph.queryHandler(BrunchQuery, async () => ({ ids: [] }))`,
      errors: [{ messageId: 'missingDefault' }],
    },
  ],
})
