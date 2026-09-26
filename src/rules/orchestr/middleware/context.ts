import type { Node, Program } from 'estree'
import type { FunctionNode } from '../../../utils/ast/functions'

import { readMiddleware } from '../../../laioutr/orchestr'
import { defineRule } from '../../../lib/rule'
import { resolveCallee, walkBody } from '../../../utils/ast/functions'
import { walk } from '../../../utils/ast/walk'

const COOKIE_READERS = new Set(['getCookie', 'parseCookies', 'useCookie'])

/** Context keys for sessions and identities, which authenticated calls need and which aren't page content. */
const SESSION_KEY = /token|session|identity|auth|jwt|login|credential/i

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow putting cookie values into the orchestr context, since cached query results don\'t vary by them. Sessions and identities are fine.',
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
     * Checks whether a value is cookie data: a cookie read, a variable holding one, or a call
     * to a function that returns one.
     *
     * @param value The value.
     * @param tainted Variables that hold cookie data.
     * @param inHelper Whether the value is inside a called function, where transformed cookie data still counts.
     *
     * @returns `true` if the value comes from a cookie.
     */
    const fromCookie = (value: Node, tainted: Set<string>, inHelper = false): boolean => {
      switch (value.type) {
        case 'Identifier':
          return tainted.has(value.name)
        case 'AwaitExpression':
          return fromCookie(value.argument, tainted, inHelper)
        case 'ChainExpression':
          return fromCookie(value.expression, tainted, inHelper)
        case 'MemberExpression':
          return fromCookie(value.object, tainted, inHelper)
        case 'LogicalExpression':
          return fromCookie(value.left, tainted, inHelper) || fromCookie(value.right, tainted, inHelper)
        case 'ConditionalExpression':
          return fromCookie(value.consequent, tainted, inHelper) || fromCookie(value.alternate, tainted, inHelper)
        case 'CallExpression': {
          if (value.callee.type === 'Identifier' && COOKIE_READERS.has(value.callee.name)) {
            return true
          }

          if (inHelper) {
            return value.arguments.some(argument => fromCookie(argument, tainted, true))
          }

          const callee = resolveCallee(value, program, context.filename)

          return callee !== undefined && returnsCookie(callee.node)
        }
        default:
          return false
      }
    }

    /**
     * Checks whether a function returns cookie data. Returned objects don't count, since they
     * usually bundle clients built from a session cookie.
     *
     * @param fn The function.
     *
     * @returns `true` if a return value comes from a cookie.
     */
    const returnsCookie = (fn: FunctionNode) => {
      const tainted = new Set<string>()
      let found = false

      walkBody(fn, (node) => {
        if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.init && fromCookie(node.init, tainted, true)) {
          tainted.add(node.id.name)
        }

        if (node.type === 'ReturnStatement' && node.argument && node.argument.type !== 'ObjectExpression') {
          found ||= fromCookie(node.argument, tainted, true)
        }
      })

      return found || (fn.body.type !== 'BlockStatement' && fn.body.type !== 'ObjectExpression' && fromCookie(fn.body, tainted, true))
    }

    return {
      CallExpression: (node) => {
        const middleware = readMiddleware(node)

        if (!middleware) {
          return
        }

        const tainted = new Set<string>()

        walkBody(middleware.callback, (child) => {
          if (child.type === 'VariableDeclarator' && child.id.type === 'Identifier' && child.init && fromCookie(child.init, tainted)) {
            tainted.add(child.id.name)
          }
        })

        walk(middleware.callback.body, (child: Node) => {
          if (child.type !== 'Property' || child.key.type !== 'Identifier' || child.key.name !== 'context' || child.value.type !== 'ObjectExpression') {
            return
          }

          for (const property of child.value.properties) {
            if (property.type === 'Property' && property.key.type === 'Identifier' && SESSION_KEY.test(property.key.name)) {
              continue
            }

            if (fromCookie(property.type === 'Property' ? property.value : property.argument, tainted)) {
              report({ node: property, messageId: 'cookie' })
            }
          }
        })
      },
    }
  },
})
