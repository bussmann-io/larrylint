import { defineRule } from '../../../lib/rule'
import { findProperty } from '../../../utils/ast/object'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require actions to return a status instead of throwing errors with a status code.',
    },
    schema: [],
    messages: {
      status: 'Orchestr\'s action transport drops status codes, so the client only sees a failed action. Return a status in the action\'s output instead.',
    },
  },

  applies: file => file.handler === 'action',

  create: ({ report }) => ({
    ThrowStatement: (node) => {
      const error = node.argument

      if ((error.type === 'CallExpression' || error.type === 'NewExpression') && error.arguments.some(argument => argument.type === 'ObjectExpression' && (findProperty(argument, 'status') || findProperty(argument, 'statusCode')))) {
        report({ node, messageId: 'status' })
      }
    },
  }),
})
