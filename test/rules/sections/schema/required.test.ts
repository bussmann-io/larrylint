import rule from '../../../../src/rules/sections/schema/required'
import { runtime, vueTester, withDefinition } from '../../../utils'

const filename = runtime('app/sections/SectionHero.vue')

function fields(list: string) {
  return withDefinition(`defineSection({ component: 'SectionHero', schema: [{ label: 'Content', fields: ${list} }] })`)
}

vueTester.run('required-fields', rule, {
  valid: [
    { filename, code: fields(`[{ name: 'heading', type: 'text', default: 'Welcome' }]`) },
  ],

  invalid: [
    { filename, code: fields(`[{ name: 'heading', type: 'text', required: true }]`), errors: [{ messageId: 'required' }] },
    { filename, code: fields(`[{ name: 'cta', type: 'object', schema: [{ fields: [{ name: 'label', type: 'text', required: true }] }] }]`), errors: [{ messageId: 'required' }] },
  ],
})
