import type { Rule } from 'eslint'
import type { ArrowFunctionExpression, CallExpression, FunctionExpression } from 'estree'

import { chainRoot } from '../../utils/ast/chain'
import { isFunction } from '../../utils/ast/functions'

export interface Middleware {
  /** `extendRequest` runs before every query; `use` wraps the handlers built with the builder. */
  method: 'extendRequest' | 'use'
  /** The callback function that implements the middleware. */
  callback: FunctionExpression | ArrowFunctionExpression
}

/**
 * Reads a builder's middleware: `extendRequest(fn)`, or `use(fn)` on a chain from a `define*` builder.
 *
 * @param call Any call expression.
 *
 * @returns The middleware, or `undefined` for other calls.
 */
export function readMiddleware(call: CallExpression): Middleware | undefined {
  const { callee } = call

  if (callee.type !== 'MemberExpression' || callee.computed || callee.property.type !== 'Identifier') {
    return undefined
  }

  const method = callee.property.name

  if (method !== 'extendRequest' && (method !== 'use' || !/^define[A-Z]/.test(chainRoot(callee.object)?.name ?? ''))) {
    return undefined
  }

  const [callback] = call.arguments

  return callback?.type === 'ArrowFunctionExpression' || callback?.type === 'FunctionExpression' ? { method, callback } : undefined
}

/**
 * Finds the orchestr middleware whose callback a node runs in.
 *
 * @param node The node.
 *
 * @returns The middleware, or `undefined` outside `extendRequest(fn)` and a builder's `use(fn)`.
 */
export function enclosingMiddleware(node: Rule.Node): Middleware | undefined {
  for (let parent = node.parent; parent; parent = parent.parent) {
    const middleware = isFunction(parent) && parent.parent?.type === 'CallExpression' ? readMiddleware(parent.parent) : undefined

    if (middleware?.callback === parent) {
      return middleware
    }
  }

  return undefined
}
