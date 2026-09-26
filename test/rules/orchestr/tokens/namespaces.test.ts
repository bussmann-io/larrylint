import rule from '../../../../src/rules/orchestr/tokens/namespaces'
import { runtime, tsTester } from '../../../utils'

const filename = runtime('shared/tokens/Category.ts')

tsTester.run('token-namespaces', rule, {
  valid: [
    { filename, code: `export const CategoryChildren = defineLinkToken('karls/category/children', {})` },
    { filename, code: `export const CategoryBase = defineEntityComponentToken('base', { entityType: 'Category' })` },
    { filename, code: `export const handler = defineQueryHandler('ecommerce/category/by-slug', async () => ({}))` },
  ],

  invalid: [
    {
      filename,
      code: `export const CategoryChildren = defineLinkToken('ecommerce/category/children', {})`,
      errors: [{ messageId: 'canonical', data: { namespace: 'ecommerce' } }],
    },
    {
      filename,
      code: `export const Subscribe = defineActionToken('newsletter/subscribe', {})`,
      errors: [{ messageId: 'canonical', data: { namespace: 'newsletter' } }],
    },
  ],
})
