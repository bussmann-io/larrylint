import { readDefinition, readFields } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'

const RESERVED = new Set(['key', 'ref', 'ref_for', 'ref_key', 'class', 'style'])

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow top-level schema field names that never reach the component\'s props.',
    },
    schema: [],
    messages: {
      reserved: '\'{{name}}\' never arrives as a prop: Vue handles key, ref, ref_for and ref_key itself, and merges class and style into the root element. Pick another name, e.g. variant for a style selector.',
      slots: 'frontend-core passes a section\'s blocks in its slots prop, so a field named slots is overwritten. Pick another name.',
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
