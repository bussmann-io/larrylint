import rule from '../../../../src/rules/structure/config/keys'
import { fixtureRuntime, runtime, tsTester } from '../../../utils'

const filename = fixtureRuntime('server/utils/shopware.ts', 'components')

tsTester.run('config-keys', rule, {
  valid: [
    { filename, code: `const own = useRuntimeConfig()['fixture-components']\nconst shop = useRuntimeConfig()['@laioutr/app-shopware']` },
    { filename, code: `const config = useRuntimeConfig()\nconst shop = config['@laioutr/app-shopware']` },
    { filename: runtime('server/utils/shopware.ts'), code: `const shop = useRuntimeConfig()['@laioutr-app/shopware']` },
    { filename, code: `const map = { '@laioutr-app/shopware': 1 }['@laioutr-app/shopware']` },
  ],

  invalid: [
    { filename, code: `const shop = useRuntimeConfig()['@laioutr-app/shopware']`, errors: [{ messageId: 'key', data: { key: '@laioutr-app/shopware' } }] },
    { filename, code: `const config = useRuntimeConfig()\nconst keys = config.public['@laioutr-app/maps']`, errors: [{ messageId: 'key', data: { key: '@laioutr-app/maps' } }] },
  ],
})
