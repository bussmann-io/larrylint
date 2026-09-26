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
      description: 'Studio shows studio.description in its section picker, and AI agents read it through Laioutr\'s MCP server. Add one.',
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

      if (studio && studio.type !== 'ObjectExpression') {
        return
      }

      const description = studio && findProperty(studio, 'description')

      if (!description || (description.type === 'Literal' && String(description.value ?? '').trim() === '')) {
        report({ node: node.callee, messageId: 'description' })
      }
    },
  }),
})
