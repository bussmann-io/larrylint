import { readDefinition, readFields } from '../../../lib/laioutr/definition'
import { defineRule } from '../../../lib/rule'
import { camelCase } from '../../../utils/string'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow schema field names that Vue renames or rejects',
    },
    schema: [],
    messages: {
      hyphen: 'Vue renames \'{{name}}\' to \'{{suggestion}}\', so the component never gets this field. Name it \'{{suggestion}}\'.',
      dollar: 'Vue doesn\'t allow props that start with $, so the component never gets this field. Rename it.',
    },
  },

  applies: file => file.side === 'app',

  create: ({ report }) => ({
    CallExpression: (node) => {
      const definition = readDefinition(node)

      for (const { name } of definition ? readFields(definition) : []) {
        if (name?.value.startsWith('$')) {
          report({ node: name.node, messageId: 'dollar', data: { name: name.value } })
        }
        else if (name?.value.includes('-')) {
          report({ node: name.node, messageId: 'hyphen', data: { name: name.value, suggestion: camelCase(name.value) } })
        }
      }
    },
  }),
})
