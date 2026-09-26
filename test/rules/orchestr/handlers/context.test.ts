import rule from '../../../../src/rules/orchestr/handlers/context'
import { runtime, tsTester } from '../../../utils'

const filename = runtime('server/orchestr/shop/Breadcrumb.query.ts')

tsTester.run('handler-context', rule, {
  valid: [
    { filename, code: `export default defineShopQuery(BreadcrumbQuery, async ({ context, event }) => context.shopware.fetch(event.path))` },
    { filename: runtime('server/middleware/shopwareApi.ts'), code: `export const defineShop = defineOrchestr.extendRequest(async () => ({ context: { config: useRuntimeConfig().shop } }))` },
  ],

  invalid: [
    {
      filename,
      code: `export default defineShopQuery(BreadcrumbQuery, async () => {\n  const { endpoint } = useRuntimeConfig().shop\n  return fetchBreadcrumb(endpoint, useEvent())\n})`,
      errors: [{ messageId: 'runtimeConfig' }, { messageId: 'event' }],
    },
  ],
})
