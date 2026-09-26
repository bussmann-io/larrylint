import { readDefinition, readFields } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'

const RESERVED = new Set(['key', 'ref', 'ref_for', 'ref_key', 'class', 'style'])

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow schema field names that Vue or frontend-core already use',
    },
    schema: [],
    messages: {
      reserved: 'Vue uses \'{{name}}\' itself, so the component never gets this field. Rename it.',
      slots: 'frontend-core passes the blocks in the slots prop, so it overwrites this field. Rename it.',
    },
  },

  applies: file => file.side === 'app',

  create: ({ report }) => ({
    CallExpression: (node) => {
      const definition = readDefinition(node)

      for (const { name } of definition ? readFields(definition) : []) {
        if (name && RESERVED.has(name.value)) {
          report({ node: name.node, messageId: 'reserved', data: { name: name.value } })
        }
        else if (name?.value === 'slots' && definition?.definer === 'defineSection') {
          report({ node: name.node, messageId: 'slots' })
        }
      }
    },
  }),
})
