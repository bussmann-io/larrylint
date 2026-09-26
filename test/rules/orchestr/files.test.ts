import { files } from '../../../src/rules/orchestr/files'
import { runtime, tsTester } from '../../utils'

tsTester.run('orchestr-files', files, {
  valid: [
    { filename: runtime('server/orchestr/brunch/Brunch.query.ts'), code: `export default defineHygraph.queryHandler(BrunchQuery, async () => ({ ids: [] }))` },
    { filename: runtime('server/orchestr/brunch/Brunch.resolver.ts'), code: `const resolver = defineHygraph.componentResolver({})\nexport { resolver as default }` },
    { filename: runtime('server/orchestr/plugins/zodFix.ts'), code: `export const fix = () => {}\nexport default fix` },
    { filename: runtime('server/orchestr/brunch/Brunch.query.test.ts'), code: `export const cases = []` },
    { filename: runtime('server/utils/brunch/fetch.ts'), code: `export async function fetchAllBrunches() {}` },
  ],

  invalid: [
    {
      filename: runtime('server/orchestr/Brunch.query.ts'),
      code: `export default defineHygraph.queryHandler(BrunchQuery, async () => ({ ids: [] }))`,
      errors: [{ messageId: 'noDomain', data: { file: 'Brunch.query.ts' } }],
    },
    {
      filename: runtime('server/orchestr/brunch/Brunch.query.ts'),
      code: `export async function fetchAllBrunches() {}\nexport type BrunchArgs = { slug: string }\nexport default defineHygraph.queryHandler(BrunchQuery, fetchAllBrunches)`,
      errors: [{ messageId: 'namedExport' }, { messageId: 'namedExport' }],
    },
    {
      filename: runtime('server/orchestr/brunch/Brunch.link.ts'),
      code: `export * from './shared'\nexport default defineHygraph.linkHandler({})`,
      errors: [{ messageId: 'namedExport' }],
    },
    {
      filename: runtime('server/orchestr/brunch/Brunch.action.ts'),
      code: `const handler = defineHygraph.actionHandler({})`,
      errors: [{ messageId: 'missingDefault' }],
    },
    {
      filename: runtime('server/orchestr/brunch/filters.ts'),
      code: `export const filters = {}`,
      errors: [{ messageId: 'notAHandler' }],
    },
  ],
})
