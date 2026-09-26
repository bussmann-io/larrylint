import { readDefinition } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'
import { findProperty } from '../../../utils/ast/object'

export default defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require a studio.description on section and block definitions.',
    },
    schema: [],
    messages: {
      description: 'Studio shows studio.description in its section and block picker. Add one.',
    },
  },

  applies: file => file.side === 'app',

  create: ({ report }) => ({
    CallExpression: (node) => {
      const options = readDefinition(node)?.options

      if (!options) {
        return
      }

      const studio = findProperty(options, 'studio')
      const description = studio?.type === 'ObjectExpression' ? findProperty(studio, 'description') : undefined
      const empty = description?.type === 'Literal' && (typeof description.value !== 'string' || description.value.trim() === '')

      if (studio?.type === 'ObjectExpression' && (!description || empty)) {
        report({ node: node.callee, messageId: 'description' })
      }
      else if (!studio) {
        report({ node: node.callee, messageId: 'description' })
      }
    },
  }),
})
