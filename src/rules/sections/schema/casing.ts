import { readDefinition, readFields } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'
import { camelCase } from '../../../utils/string'

const CAMEL_CASE = /^[a-z][a-zA-Z0-9]*$/

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require camelCase names for top-level schema fields, which become props.',
    },
    schema: [],
    messages: {
      casing: 'Name the field {{suggestion}}. It becomes a prop, and Vue only passes props by their camelCase name.',
    },
  },

  applies: file => file.side === 'app',

  create: ({ report }) => ({
    CallExpression: (node) => {
      const definition = readDefinition(node)

      for (const { name } of definition ? readFields(definition) : []) {
        if (name && !CAMEL_CASE.test(name.value)) {
          report({ node: name.node, messageId: 'casing', data: { suggestion: camelCase(name.value) } })
        }
      }
    },
  }),
})
