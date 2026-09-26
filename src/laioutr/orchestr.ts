import type { ArrowFunctionExpression, CallExpression, Expression, FunctionExpression, Identifier, Literal, Super } from 'estree'

import { findStringProperty } from '../utils/ast/object'

export interface Middleware {
  /** `extendRequest` runs before every query; `use` wraps the handlers built with the builder. */
  method: 'extendRequest' | 'use'
  callback: FunctionExpression | ArrowFunctionExpression
}

/**
 * Finds the identifier a call chain starts from, e.g. `defineOrchestr` in `defineOrchestr.meta({}).use(fn)`.
 *
 * @param node Any link of the chain.
 *
 * @returns The identifier, or `undefined` if the chain starts elsewhere.
 */
export function chainRoot(node: Expression | Super): Identifier | undefined {
  let current = node

  for (;;) {
    if (current.type === 'CallExpression') {
      current = current.callee
    }
    else if (current.type === 'MemberExpression') {
      current = current.object
    }
    else {
      return current.type === 'Identifier' ? current : undefined
    }
  }
}

/**
 * Reads a middleware on an orchestr builder, e.g. `defineOrchestr.extendRequest(async (args) => ...)`.
 * `.use()` only counts on chains that start from a builder, since the name is common.
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
 * Reads the `app` of a builder's `.meta({ app })` call.
 *
 * @param call Any call expression.
 *
 * @returns The app name and its node, or `undefined` for other calls.
 */
export function readMetaApp(call: CallExpression): { value: string, node: Literal } | undefined {
  const { callee } = call
  const [options] = call.arguments

  if (callee.type !== 'MemberExpression' || callee.property.type !== 'Identifier' || callee.property.name !== 'meta' || chainRoot(callee.object)?.name !== 'defineOrchestr' || options?.type !== 'ObjectExpression') {
    return undefined
  }

  return findStringProperty(options, 'app')
}
