import rule from '../../../../src/rules/orchestr/resolvers/passthrough'
import { runtime, tsTester } from '../../../utils'

const filename = runtime('server/orchestr/brunch/OpeningHours.resolver.ts')

tsTester.run('resolver-passthrough', rule, {
  valid: [
    { filename, code: `export default defineHygraphResolver({ resolve: async ({ passthrough }) => passthrough.get(SitePassthrough) })` },
    { filename: runtime('server/orchestr/brunch/Brunch.query.ts'), code: `export default defineHygraphQuery(BrunchQuery, async ({ passthrough }) => passthrough.require(SitePassthrough))` },
  ],

  invalid: [
    {
      filename,
      code: `export default defineHygraphResolver({ resolve: async ({ passthrough }) => passthrough.require(SitePassthrough) })`,
      errors: [{ messageId: 'require' }],
    },
    {
      filename,
      code: `export default defineHygraphResolver({ resolve: async (args) => args.passthrough.require(SitePassthrough) })`,
      errors: [{ messageId: 'require' }],
    },
  ],
})
