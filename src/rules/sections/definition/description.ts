import { DEFINERS, readDefinition } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'
import { findProperty } from '../../../utils/ast/object'

export default defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require a `studio.description` on section and block definitions',
    },
    schema: [],
    messages: {
      description: 'Add a studio.description, so editors and AI agents know what this {{kind}} is for.',
    },
  },

  applies: file => file.side === 'app',

  create: ({ report }) => ({
    CallExpression: (node) => {
      const definition = readDefinition(node)

      if (!definition?.options) {
        return
      }

      const studio = findProperty(definition.options, 'studio')

      if (studio && studio.type !== 'ObjectExpression') {
        return
      }

      const description = studio && findProperty(studio, 'description')

      if (!description || (description.type === 'Literal' && String(description.value ?? '').trim() === '')) {
        report({ node: node.callee, messageId: 'description', data: { kind: DEFINERS[definition.definer].kind } })
      }
    },
  }),
})
