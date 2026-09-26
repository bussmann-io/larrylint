import rule from '../../../src/rules/orchestr/files'
import { runtime, tsTester } from '../../utils'

tsTester.run('orchestr-files', rule, {
  valid: [
    { filename: runtime('server/orchestr/brunch/Brunch.query.ts'), code: `export default defineHygraph.queryHandler(BrunchQuery, async () => ({ ids: [] }))` },
    { filename: runtime('server/orchestr/plugins/zodFix.ts'), code: `export const fix = () => {}\nexport default fix` },
    { filename: runtime('server/orchestr/brunch/Brunch.query.test.ts'), code: `export const cases = []` },
    { filename: runtime('server/utils/brunch/fetch.ts'), code: `export async function fetchAllBrunches() {}` },
    { filename: runtime('server/orchestr/blog/byBlogSlug.templates.ts'), code: `export default defineShopify.templateProvider(BlogTemplate, async () => [])` },
  ],

  invalid: [
    {
      filename: runtime('server/orchestr/brunch/filters.ts'),
      code: `export const filters = {}`,
      errors: [{ messageId: 'notAHandler' }],
    },
  ],
})
