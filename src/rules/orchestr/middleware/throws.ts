import type { Identifier, Node, Program } from 'estree'
import type { FunctionNode } from '../../../utils/ast/functions'

import { dirname, relative } from 'pathe'
import { readMiddleware } from '../../../laioutr/orchestr'
import { defineRule } from '../../../lib/rule'
import { resolveCallee, walkBody } from '../../../utils/ast/functions'

/**
 * Finds the first `throw` a function doesn't catch itself.
 *
 * @param fn The function.
 *
 * @returns The throw statement, or `undefined`.
 */
function uncaughtThrow(fn: FunctionNode) {
  let found: Node | undefined

  walkBody(fn, (node, caught) => {
    if (!found && !caught && node.type === 'ThrowStatement') {
      found = node
    }
  })

  return found
}

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow throwing in extendRequest(), which runs before every query, so a throw takes down every page.',
    },
    schema: [],
    messages: {
      throws: 'extendRequest() runs before every query, so this throw takes down every page. Return a stand-in instead, e.g. a client that fails only when it\'s used.',
      throwsInCall: '{{name}}() can throw ({{location}}). extendRequest() runs before every query, so that takes down every page. Catch it here or return a stand-in.',
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
