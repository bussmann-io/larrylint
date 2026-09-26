import { readAllFields, readDefinition } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'
import { findProperty } from '../../../utils/ast/object'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow `required` on schema fields, which Studio doesn\'t support.',
    },
    schema: [],
    messages: {
      required: 'Schema fields have no required option, so Studio ignores it. Give the field a default instead.',
    },
  },

  applies: file => file.side === 'app',

  create: ({ report }) => ({
    CallExpression: (node) => {
      const definition = readDefinition(node)

      for (const field of definition ? readAllFields(definition) : []) {
        const required = findProperty(field.node, 'required')

        if (required) {
          report({ node: required, messageId: 'required' })
        }
      }
    },
  }),
})
