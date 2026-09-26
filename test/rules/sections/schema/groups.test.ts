import rule from '../../../../src/rules/sections/schema/groups'
import { runtime, vueTester, withDefinition } from '../../../utils'

const filename = runtime('app/sections/SectionHero.vue')

function groups(...labels: string[]) {
  return withDefinition(`defineSection({ component: 'SectionHero', schema: [${labels.map(label => `{ label: '${label}', fields: [] }`).join(', ')}] })`)
}

vueTester.run('schema-groups', rule, {
  valid: [
    { filename, code: groups('Content', 'Design', 'Rules') },
    { filename, code: groups('Content', 'Rules') },
    { filename, code: groups('Design') },
    { filename, code: withDefinition(`defineSection({ component: 'SectionHero', schema: [{ fields: [] }] })`) },
  ],

  invalid: [
    { filename, code: groups('Data', 'Content', 'Design'), errors: [{ messageId: 'panel' }] },
    { filename, code: groups('Design', 'Content'), errors: [{ messageId: 'order', data: { label: 'Content', previous: 'Design' } }] },
  ],
})
