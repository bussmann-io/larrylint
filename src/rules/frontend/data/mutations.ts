import type { Rule } from 'eslint'
import type { CallExpression } from 'estree'

import { defineRule } from '../../../lib/rule'
import { followPromise, nameOf } from '../../../utils/ast/chain'
import { isCaught } from '../../../utils/ast/functions'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require error handling where a mutateAsync() promise is awaited or dropped, since a rejected mutation takes down its whole section or block.',
    },
    schema: [],
    messages: {
      unhandled: 'If this mutation fails, frontend-core replaces the whole section or block with its "Retry" state. Catch the error here with try/catch or .catch().',
    },
  },

  applies: file => file.side === 'app',

  create: ({ report, visitTemplate }) => {
    const check = (call: CallExpression) => {
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

      report({ node: call.callee.type === 'MemberExpression' ? call.callee.property : call.callee, messageId: 'unhandled' })
    }

    visitTemplate({ CallExpression: check })

    return { CallExpression: check }
  },
})
