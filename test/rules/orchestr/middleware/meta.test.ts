import rule from '../../../../src/rules/orchestr/middleware/meta'
import { fixtureRuntime, runtime, tsTester } from '../../../utils'

const filename = fixtureRuntime('server/middleware/api.ts')

tsTester.run('orchestr-meta', rule, {
  valid: [
    { filename, code: `export const defineApi = defineOrchestr.meta({ app: 'fixture-app' }).extendRequest(async () => ({ context: {} }))` },
    { filename, code: `export const view = router.meta({ app: 'other' })` },
    { filename: runtime('server/middleware/api.ts'), code: `export const defineApi = defineOrchestr.meta({ app: 'anything' })` },
  ],

  invalid: [
    {
      filename,
      code: `export const defineApi = defineOrchestr\n  .meta({ app: '@laioutr-demo/laioutr-karls' })\n  .extendRequest(async () => ({ context: {} }))`,
      errors: [{ messageId: 'app', data: { actual: '@laioutr-demo/laioutr-karls', expected: 'fixture-app' } }],
    },
  ],
})
