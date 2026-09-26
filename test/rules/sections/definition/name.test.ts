import rule from '../../../../src/rules/sections/definition/name'
import { runtime, vueTester, withDefinition } from '../../../utils'

vueTester.run('component-name', rule, {
  valid: [
    { filename: runtime('app/sections/SectionHero.vue'), code: withDefinition(`defineSection({ component: 'SectionHero', schema: [] })`) },
    { filename: runtime('app/overrides/SectionProductDetail.vue'), code: withDefinition(`defineSection({ component: 'SectionProductDetail', schema: [] })`) },
    { filename: runtime('app/sections/SectionHero.vue'), code: withDefinition(`defineSection({ component: HERO, schema: [] })`) },
  ],

  invalid: [
    {
      filename: runtime('app/sections/SectionHero.vue'),
      code: withDefinition(`defineSection({ component: 'SectionBanner', schema: [] })`),
      errors: [{ messageId: 'componentName', data: { actual: 'SectionBanner', expected: 'SectionHero' } }],
    },
  ],
})
