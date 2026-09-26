import { readDefinition, readFields } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'

/** Names Vue consumes before they reach a component's props, see laioutr's forbidden-field-names reference. */
const RESERVED = new Set(['style', 'class', 'key', 'ref', 'is', 'slot', 'refFor', 'refKey'])

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow top-level schema field names that Vue swallows before they reach the component\'s props.',
    },
    schema: [],
    messages: {
      reserved: 'Vue consumes \'{{name}}\' before it reaches the component, so this field never arrives as a prop. Pick another name, e.g. variant for a style selector.',
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
      }
    },
  }),
})
