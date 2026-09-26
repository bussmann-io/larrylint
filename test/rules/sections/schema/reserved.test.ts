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
    { filename, code: section(`[{ type: 'toggle_button', name: 'variant' }, { type: 'text', name: 'headingStyle' }]`) },
    { filename, code: section(`[{ type: 'object', name: 'item', fields: [{ type: 'text', name: 'key' }] }]`) },
    { filename, code: section(`[...sharedFields, buttonField({ name: 'style' })]`) },
  ],

  invalid: [
    {
      filename,
      code: section(`[{ type: 'select', name: 'style' }, { type: 'text', name: 'key' }, { type: 'text', 'name': 'refFor' }]`),
      errors: [
        { messageId: 'reserved', data: { name: 'style' } },
        { messageId: 'reserved', data: { name: 'key' } },
        { messageId: 'reserved', data: { name: 'refFor' } },
      ],
    },
  ],
})
