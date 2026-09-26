import type { Expression, Identifier, Node, Program, SpreadElement } from 'estree'
import type { FunctionNode } from '../../../utils/ast/functions'

import { readMiddleware } from '../../../laioutr/orchestr'
import { defineRule } from '../../../lib/rule'
import { isFunction, resolveCallee, walkBody } from '../../../utils/ast/functions'
import { walk } from '../../../utils/ast/walk'

const COOKIE_READERS = new Set(['getCookie', 'parseCookies', 'useCookie'])

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow putting cookie values into the orchestr context, since cached query results don\'t vary by them.',
    },
    schema: [],
    messages: {
      cookie: 'Query results are cached without this cookie in their key, so one visitor\'s value ends up in another visitor\'s results. Pass it to the query as input instead.',
    },
  },

  applies: file => file.side === 'server',

  create: ({ context, report }) => {
    const program = context.sourceCode.ast as Program

    /**
     * Checks whether a function reads a cookie itself.
     *
     * @param fn The function.
     *
     * @returns `true` if it calls a cookie reader.
     */
    const readsCookie = (fn: FunctionNode) => {
      let found = false

      walkBody(fn, (node) => {
        found ||= node.type === 'CallExpression' && node.callee.type === 'Identifier' && COOKIE_READERS.has(node.callee.name)
      })

      return found
    }

    /**
     * Checks whether an expression reads a cookie, directly or through a function it calls.
     *
     * @param expression The expression.
     *
     * @returns `true` if its value comes from a cookie.
     */
    const fromCookie = (expression: Expression | SpreadElement) => {
      let found = false

      walk(expression, (node) => {
        if (found || isFunction(node)) {
          return false
        }

        if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
          const callee = COOKIE_READERS.has(node.callee.name) ? undefined : resolveCallee(node, program, context.filename)

          found = COOKIE_READERS.has(node.callee.name) || (callee !== undefined && readsCookie(callee.node))
        }
      })

      return found
    }

    return {
      CallExpression: (node) => {
        const middleware = readMiddleware(node)

        if (!middleware) {
          return
        }

        const tainted = new Set<string>()

        walkBody(middleware.callback, (child) => {
          if (child.type === 'VariableDeclarator' && child.id.type === 'Identifier' && child.init && fromCookie(child.init)) {
            tainted.add(child.id.name)
          }
        })

        walk(middleware.callback.body, (child: Node) => {
          if (child.type !== 'Property' || child.key.type !== 'Identifier' || child.key.name !== 'context' || child.value.type !== 'ObjectExpression') {
            return
          }

          for (const property of child.value.properties) {
            const value = property.type === 'Property' ? property.value as Expression : property

            if ((value.type === 'Identifier' && tainted.has((value as Identifier).name)) || fromCookie(value)) {
              report({ node: property, messageId: 'cookie' })
            }
          }
        })
      },
    }
  },
})
