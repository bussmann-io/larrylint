import type { Rule } from 'eslint'
import type { CallExpression } from 'estree'

import { readMiddleware } from '../../laioutr/orchestr'
import { defineRule } from '../../lib/rule'
import { isFunction } from '../../utils/ast/functions'

const COOKIE_SETTERS = new Set(['setCookie', 'deleteCookie'])
const REDIRECTS = new Set(['sendRedirect', 'navigateTo'])
const HEADER_SETTERS = new Set(['setHeader', 'setHeaders', 'appendHeader', 'setResponseHeader', 'setResponseHeaders', 'appendResponseHeader'])

/**
 * Tells what a call does to the response that a cached page would replay to every visitor.
 *
 * @param call The call.
 *
 * @returns `cookie` or `redirect`, or `undefined` for anything else.
 */
function responseEffect(call: CallExpression) {
  const { callee } = call
  const name = callee.type === 'Identifier' ? callee.name : callee.type === 'MemberExpression' && callee.property.type === 'Identifier' ? callee.property.name : ''

  if (COOKIE_SETTERS.has(name)) {
    return 'cookie'
  }

  if (REDIRECTS.has(name)) {
    return 'redirect'
  }

  const header = HEADER_SETTERS.has(name) ? call.arguments.find(argument => argument.type === 'Literal' && typeof argument.value === 'string') : undefined
  const value = header?.type === 'Literal' ? String(header.value).toLowerCase() : undefined

  return value === 'set-cookie' ? 'cookie' : value === 'location' ? 'redirect' : undefined
}

/**
 * Checks whether a node runs inside an orchestr middleware callback.
 *
 * @param node The node.
 *
 * @returns `true` inside `extendRequest(fn)` or a builder's `use(fn)`.
 */
function inMiddleware(node: Rule.Node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (isFunction(parent) && parent.parent?.type === 'CallExpression' && readMiddleware(parent.parent)?.callback === parent) {
      return true
    }
  }

  return false
}

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Set-Cookie and redirects from orchestr handlers and middleware, which cached pages replay to every visitor.',
    },
    schema: [],
    messages: {
      cookie: 'ISR caches this response for every visitor, Set-Cookie included, so one visitor\'s cookie reaches the next. Set cookies from an API route or a Nitro middleware that skips cached pages.',
      redirect: 'ISR caches this redirect for every visitor. Redirect from an API route or on the client instead.',
    },
  },

  applies: file => file.side === 'server',

  create: ({ file, report }) => ({
    CallExpression: (node) => {
      const effect = responseEffect(node)

      if (effect && (file.kind === 'handler' || inMiddleware(node as Rule.Node))) {
        report({ node, messageId: effect })
      }
    },
  }),
})
