import type { Rule } from 'eslint'
import type { ArrowFunctionExpression, CallExpression, FunctionExpression, Literal, Node, ObjectExpression } from 'estree'

import { chainRoot } from '../utils/ast/chain'
import { isFunction, walkBody } from '../utils/ast/functions'
import { findStringProperty } from '../utils/ast/object'

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

/**
 * Checks whether a node runs inside an orchestr middleware callback.
 *
 * @param node The node.
 *
 * @returns `true` inside `extendRequest(fn)` or a builder's `use(fn)`.
 */
export function inMiddleware(node: Rule.Node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (isFunction(parent) && parent.parent?.type === 'CallExpression' && readMiddleware(parent.parent)?.callback === parent) {
      return true
    }
  }

  return false
}

/**
 * Lists the objects a component resolver returns, e.g. `{ ... }` in `base: () => ({ ... })`.
 *
 * @param value The component's value in `$entity({ ... })`.
 *
 * @returns The object literals it returns.
 */
export function componentObjects(value: Node): ObjectExpression[] {
  if (value.type === 'ObjectExpression') {
    return [value]
  }

  if (!isFunction(value)) {
    return []
  }

  if (value.body.type === 'ObjectExpression') {
    return [value.body]
  }

  const objects: ObjectExpression[] = []

  walkBody(value, (node) => {
    if (node.type === 'ReturnStatement' && node.argument?.type === 'ObjectExpression') {
      objects.push(node.argument)
    }
  })

  return objects
}
