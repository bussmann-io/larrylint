import { parse } from 'pathe'
import { readDefinition } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require the `component` of a section or block definition to match its file name.',
    },
    schema: [],
    messages: {
      componentName: 'component: \'{{actual}}\' must match the file name \'{{expected}}\'.',
    },
  },

  applies: file => file.side === 'app',

  create: ({ file, report }) => ({
    CallExpression: (node) => {
      const component = readDefinition(node)?.component
      const { name } = parse(file.path)

      if (component && component.value !== name) {
        report({ node: component.node, messageId: 'componentName', data: { actual: component.value, expected: name } })
      }
    },
  }),
})
