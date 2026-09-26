import tsParser from '@typescript-eslint/parser'
import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import rule from '../../../../src/rules/orchestr/tokens/namespaces'
import { fixtureRuntime, runtime, tsTester } from '../../../utils'

const filename = fixtureRuntime('shared/tokens/Category.ts', 'orchestr')

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

describe('token-namespaces', () => {
  it('fails when canonical-types isn\'t installed', () => {
    const config: Linter.Config[] = [{
      files: ['**/*.ts'],
      languageOptions: { parser: tsParser },
      plugins: { larrylint: { rules: { 'token-namespaces': rule } } },
      rules: { 'larrylint/token-namespaces': 'error' },
    }]

    expect(() => new Linter({ cwd: '/app' }).verify(`export const Posts = defineQueryToken('karls/posts', {})`, config, runtime('shared/tokens/Posts.ts')))
      .toThrow(/can't find @laioutr-core\/canonical-types/)
  })
})
