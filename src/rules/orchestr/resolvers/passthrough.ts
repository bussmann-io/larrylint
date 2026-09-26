import { defineRule } from '../../../lib/rule'
import { nameOf } from '../../../utils/ast/chain'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow passthrough.require() in component resolvers.',
    },
    schema: [],
    messages: {
      require: 'Other queries for this entity may not set this passthrough, and require() then fails the whole resolver. Use passthrough.get() and handle a missing value.',
    },
  },

  applies: file => file.handler === 'resolver',

  create: ({ report }) => ({
    CallExpression: (node) => {
      const { callee } = node

      if (callee.type === 'MemberExpression' && nameOf(callee) === 'require' && nameOf(callee.object) === 'passthrough') {
        report({ node: callee.property, messageId: 'require' })
      }
    },
  }),
})
