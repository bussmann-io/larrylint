import rule from '../../../../src/rules/sections/schema/reserved'
import { runtime, vueTester } from '../../../utils'

const filename = runtime('app/sections/SectionHero.vue')

function section(fields: string) {
  return `<script lang="ts">
export const definition = defineSection({
  component: 'SectionHero',
  slots: [{ name: 'default' }],
  schema: [{ label: 'Content', fields: ${fields} }],
})
</script>
`
}

vueTester.run('reserved-field-names', rule, {
  valid: [
    { filename, code: section(`[{ type: 'toggle_button', name: 'variant' }, { type: 'text', name: 'headingStyle' }, { type: 'text', name: 'is' }, { type: 'text', name: 'slot' }, { type: 'text', name: 'refFor' }]`) },
    { filename: runtime('app/blocks/BlockTabs.vue'), code: `<script lang="ts">\nexport const definition = defineBlock({ component: 'BlockTabs', schema: [{ label: 'Content', fields: [{ type: 'text', name: 'slots' }] }] })\n</script>\n` },
    { filename, code: section(`[{ type: 'object', name: 'item', fields: [{ type: 'text', name: 'key' }] }]`) },
    { filename, code: section(`[...sharedFields, buttonField({ name: 'style' })]`) },
  ],

  invalid: [
    {
      filename,
      code: section(`[{ type: 'select', name: 'style' }, { type: 'text', name: 'key' }, { type: 'text', 'name': 'ref_for' }, { type: 'text', name: 'slots' }]`),
      errors: [
        { messageId: 'reserved', data: { name: 'style' } },
        { messageId: 'reserved', data: { name: 'key' } },
        { messageId: 'reserved', data: { name: 'ref_for' } },
        { messageId: 'slots' },
      ],
    },
  ],
})
