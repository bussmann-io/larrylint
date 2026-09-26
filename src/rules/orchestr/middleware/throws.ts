import type { Identifier, Program } from 'estree'

import { dirname, relative } from 'pathe'
import { readMiddleware } from '../../../laioutr/orchestr'
import { defineRule } from '../../../lib/rule'
import { uncaughtThrow, walkBody } from '../../../utils/ast/functions'
import { resolveCallee } from '../../../utils/ast/module'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow throwing in `extendRequest()`',
    },
    schema: [],
    messages: {
      throws: 'A throw in extendRequest() breaks every page. Throw later instead, e.g. when the client is used.',
      throwsInCall: '{{name}}() can throw ({{location}}), and a throw in extendRequest() breaks every page. Catch it here.',
    },
  },

  applies: file => file.side === 'server',

  create: ({ context, report }) => ({
    CallExpression: (node) => {
      const middleware = readMiddleware(node)

      if (middleware?.method !== 'extendRequest') {
        return
      }

      walkBody(middleware.callback, (child, caught) => {
        if (caught) {
          return
        }

        if (child.type === 'ThrowStatement') {
          report({ node: child, messageId: 'throws' })

          return
        }

        const callee = child.type === 'CallExpression' ? resolveCallee(child, context.sourceCode.ast as Program, context.filename) : undefined
        const thrown = callee && uncaughtThrow(callee.node)

        if (callee && thrown && child.type === 'CallExpression') {
          const line = thrown.loc?.start.line
          const location = callee.file === context.filename ? `line ${line}` : `${relative(dirname(context.filename), callee.file)}:${line}`

          report({ node: child.callee, messageId: 'throwsInCall', data: { name: (child.callee as Identifier).name, location } })
        }
      })
    },
  }),
})
