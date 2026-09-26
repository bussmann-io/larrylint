import { readDefinition, readFields } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'
import { camelCase } from '../../../utils/string'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow top-level schema field names that Vue renames or rejects as props.',
    },
    schema: [],
    messages: {
      hyphen: 'Vue camelizes \'{{name}}\' to {{suggestion}}, so the prop never arrives under the field\'s name. Name the field {{suggestion}}.',
      dollar: 'Vue rejects prop names that start with $, so \'{{name}}\' never arrives as a prop. Pick another name.',
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
