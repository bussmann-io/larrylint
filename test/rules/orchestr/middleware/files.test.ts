import rule from '../../../../src/rules/orchestr/middleware/files'
import { runtime, tsTester } from '../../../utils'

tsTester.run('middleware-files', rule, {
  valid: [
    { filename: runtime('server/middleware/hygraph.ts'), code: `export const defineHygraph = defineOrchestr.use(async (ctx, next) => next())` },
    { filename: runtime('server/middleware/shopwareApi.ts'), code: `export const defineShop = defineBase.extendRequest(async () => ({ context: {} }))` },
    { filename: runtime('server/middleware/refreshToken.ts'), code: `export default defineEventHandler(event => refresh(event))` },
    { filename: runtime('server/utils/identity.ts'), code: `export async function resolveIdentity(event) {}` },
  ],

  invalid: [
    {
      filename: runtime('server/middleware/identity.ts'),
      code: `export async function resolveIdentity(event) {}`,
      errors: [{ messageId: 'helper' }],
    },
  ],
})
