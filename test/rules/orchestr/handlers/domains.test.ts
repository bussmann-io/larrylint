import rule from '../../../../src/rules/orchestr/handlers/domains'
import { runtime, tsTester } from '../../../utils'

tsTester.run('handler-domains', rule, {
  valid: [
    { filename: runtime('server/orchestr/brunch/Brunch.query.ts'), code: `export default defineHygraph.queryHandler(BrunchQuery, async () => ({ ids: [] }))` },
    { filename: runtime('server/orchestr/Brunch.query.test.ts'), code: `export const cases = []` },
  ],

  invalid: [
    {
      filename: runtime('server/orchestr/Brunch.query.ts'),
      code: `export default defineHygraph.queryHandler(BrunchQuery, async () => ({ ids: [] }))`,
      errors: [{ messageId: 'noDomain', data: { file: 'Brunch.query.ts' } }],
    },
  ],
})
