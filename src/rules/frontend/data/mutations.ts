import type { Rule } from 'eslint'
import type { CallExpression } from 'estree'

import { defineRule } from '../../../lib/rule'
import { followPromise, nameOf } from '../../../utils/ast/chain'
import { isCaught } from '../../../utils/ast/functions'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require error handling for awaited or dropped `mutateAsync()` calls',
    },
    schema: [],
    messages: {
      unhandled: 'If this mutation fails, an error replaces the whole section or block. Catch it with try/catch or .catch().',
      dropped: 'Nothing catches errors of this mutation. Add .catch(), or await it in a try/catch.',
    },
  },

  applies: file => file.side === 'app',

  create: ({ report, visitTemplate }) => {
    const check = (call: CallExpression, template: boolean) => {
      if (nameOf(call.callee) !== 'mutateAsync') {
        return
      }

      const { end, handled } = followPromise(call as Rule.Node)
      const { parent } = end

      if (handled || !parent) {
        return
      }

      const awaited = parent.type === 'AwaitExpression'
      const dropped = parent.type === 'ExpressionStatement' || (parent.type === 'UnaryExpression' && parent.operator === 'void')

      if ((!awaited && !dropped) || (awaited && isCaught(parent))) {
        return
      }

      report({ node: call.callee.type === 'MemberExpression' ? call.callee.property : call.callee, messageId: dropped && !template ? 'dropped' : 'unhandled' })
    }

    visitTemplate({ CallExpression: (node: CallExpression) => check(node, true) })

    return { CallExpression: node => check(node, false) }
  },
})
