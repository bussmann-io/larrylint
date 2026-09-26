import rule from '../../../../src/rules/sections/definition/prefix'
import { runtime, vueTester, withDefinition } from '../../../utils'

vueTester.run('definition-prefix', rule, {
  valid: [
    { filename: runtime('app/sections/SectionHero.vue'), code: withDefinition(`defineSection({ component: 'SectionHero', schema: [] })`) },
    { filename: runtime('app/blocks/account/BlockProfile.vue'), code: withDefinition(`defineBlock({ component: 'BlockProfile', schema: [] })`) },
    { filename: runtime('app/overrides/ProductDetail.vue'), code: withDefinition(`defineSection({ component: 'ProductDetail', schema: [] })`) },
  ],

  invalid: [
    {
      filename: runtime('app/sections/ContactFormSection.vue'),
      code: withDefinition(`defineSection({ component: 'ContactFormSection', schema: [] })`),
      errors: [{ messageId: 'prefix', data: { kind: 'section', prefix: 'Section', suggestion: 'SectionContactForm' } }],
    },
    {
      filename: runtime('app/blocks/BrunchCard.vue'),
      code: withDefinition(`defineBlock({ component: 'BrunchCard', schema: [] })`),
      errors: [{ messageId: 'prefix', data: { kind: 'block', prefix: 'Block', suggestion: 'BlockBrunchCard' } }],
    },
  ],
})
