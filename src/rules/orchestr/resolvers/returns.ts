import { componentObjects } from '../../../laioutr/orchestr'
import { defineRule } from '../../../lib/rule'
import { canBeNullish } from '../../../utils/ast/values'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require component resolvers to resolve fields to empty values rather than undefined or null.',
    },
    schema: [],
    messages: {
      empty: 'Studio shows a literal "..." for a field that resolves to undefined or null. Resolve to an empty value instead, e.g. \'\'.',
    },
  },

  applies: file => file.handler === 'resolver',

  create: ({ report }) => ({
    CallExpression: (node) => {
      const [entity] = node.arguments

      if (node.callee.type !== 'Identifier' || node.callee.name !== '$entity' || entity?.type !== 'ObjectExpression') {
        return
      }

      for (const component of entity.properties) {
        if (component.type !== 'Property' || (component.key.type === 'Identifier' && component.key.name === 'id')) {
          continue
        }

        for (const object of componentObjects(component.value)) {
          for (const field of object.properties) {
            if (field.type === 'Property' && canBeNullish(field.value)) {
              report({ node: field.value, messageId: 'empty' })
            }
          }
        }
      }
    },
  }),
})
