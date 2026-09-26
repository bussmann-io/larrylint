import { defineRule } from '../../../lib/rule'
import { findProperty } from '../../../utils/ast/object'
import { isNullable, objectShape } from '../../../utils/zod'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow nullable top-level fields in entity component tokens, which Studio can\'t bind.',
    },
    schema: [],
    messages: {
      nullable: 'Studio can\'t bind a nullable field. Resolve it to an empty value instead, e.g. \'\' or [].',
    },
  },

  applies: file => file.side === 'app' || file.side === 'server' || file.side === 'shared',

  create: ({ report }) => ({
    CallExpression: (node) => {
      const options = node.arguments[1]

      if (node.callee.type !== 'Identifier' || node.callee.name !== 'defineEntityComponentToken' || options?.type !== 'ObjectExpression') {
        return
      }

      for (const field of objectShape(findProperty(options, 'schema'))?.properties ?? []) {
        if (field.type === 'Property' && isNullable(field.value)) {
          report({ node: field, messageId: 'nullable' })
        }
      }
    },
  }),
})
