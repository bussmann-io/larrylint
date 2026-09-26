import rule from '../../../../src/rules/sections/schema/casing'
import { runtime, vueTester, withDefinition } from '../../../utils'

const filename = runtime('app/sections/SectionHero.vue')

function fields(list: string) {
  return withDefinition(`defineSection({ component: 'SectionHero', schema: [{ label: 'Content', fields: ${list} }] })`)
}

vueTester.run('field-name-case', rule, {
  valid: [
    { filename, code: fields(`[{ name: 'heading', type: 'text' }, { name: 'showCta', type: 'checkbox' }, { name: 'columns2', type: 'number' }]`) },
    { filename, code: fields(`[{ name: 'emptyTickets_openTicketDrawer', type: 'checkbox' }, { name: 'Heading', type: 'text' }]`) },
    { filename, code: fields(`[{ name: 'cta', type: 'object', schema: [{ fields: [{ name: 'link-target', type: 'text' }] }] }]`) },
  ],

  invalid: [
    {
      filename,
      code: fields(`[{ name: 'show-heading', type: 'checkbox' }, { name: '$variant', type: 'select' }]`),
      errors: [
        { messageId: 'hyphen', data: { name: 'show-heading', suggestion: 'showHeading' } },
        { messageId: 'dollar', data: { name: '$variant' } },
      ],
    },
  ],
})
