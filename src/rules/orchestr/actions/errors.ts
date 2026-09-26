import type { Expression } from 'estree'

import { defineRule } from '../../../lib/rule'
import { findProperty } from '../../../utils/ast/object'

/**
 * Reads the status code an error is created with, e.g. `createError({ status: 404 })`.
 *
 * @param error The thrown expression.
 *
 * @returns The status, or `undefined` if there's no literal one.
 */
function thrownStatus(error: Expression) {
  if (error.type !== 'CallExpression' && error.type !== 'NewExpression') {
    return undefined
  }

  for (const argument of error.arguments) {
    const status = argument.type === 'ObjectExpression' ? findProperty(argument, 'status') ?? findProperty(argument, 'statusCode') : undefined

    if (status?.type === 'Literal' && typeof status.value === 'number') {
      return status.value
    }
  }

  return undefined
}

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require actions to return client errors as a status instead of throwing them.',
    },
    schema: [],
    messages: {
      status: 'The client never sees this {{status}}: orchestr\'s action transport drops status codes, so it arrives as a failed action. Return it as a status in the action\'s output instead.',
    },
  },

  applies: file => file.handler === 'action',

  create: ({ report }) => ({
    ThrowStatement: (node) => {
      const status = thrownStatus(node.argument)

      if (status !== undefined && status >= 400 && status < 500) {
        report({ node, messageId: 'status', data: { status: String(status) } })
      }
    },
  }),
})
