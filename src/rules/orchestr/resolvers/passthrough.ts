import { defineRule } from '../../../lib/rule'

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

      if (callee.type !== 'MemberExpression' || callee.computed || callee.property.type !== 'Identifier' || callee.property.name !== 'require') {
        return
      }

      const { object } = callee
      const name = object.type === 'Identifier' ? object.name : object.type === 'MemberExpression' && object.property.type === 'Identifier' ? object.property.name : ''

      if (name === 'passthrough') {
        report({ node: callee.property, messageId: 'require' })
      }
    },
  }),
})
