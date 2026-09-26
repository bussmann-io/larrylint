import type { Rule } from 'eslint'
import type { ArrowFunctionExpression, FunctionDeclaration, FunctionExpression, Node } from 'estree'

import { children } from './walk'

export type FunctionNode = FunctionDeclaration | FunctionExpression | ArrowFunctionExpression

/**
 * Checks whether a node is a function.
 *
 * @param node The node.
 *
 * @returns `true` for function declarations, function expressions and arrow functions.
 */
export function isFunction(node: Node): node is FunctionNode {
  return node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression'
}

/**
 * Visits the nodes a function runs itself, skipping nested functions.
 *
 * @param fn The function.
 * @param enter Called with each node, and whether a try/catch in the function catches what the node throws.
 */
export function walkBody(fn: FunctionNode, enter: (node: Node, caught: boolean) => void) {
  const visit = (node: Node, caught: boolean) => {
    enter(node, caught)

    if (isFunction(node)) {
      return
    }

    if (node.type === 'TryStatement') {
      visit(node.block, caught || Boolean(node.handler))

      if (node.handler) {
        visit(node.handler, caught)
      }

      if (node.finalizer) {
        visit(node.finalizer, caught)
      }

      return
    }

    for (const child of children(node)) {
      visit(child, caught)
    }
  }

  if (fn.body.type === 'BlockStatement') {
    for (const child of children(fn.body)) {
      visit(child, false)
    }
  }
  else {
    visit(fn.body, false)
  }
}

/**
 * Finds the first `throw` a function doesn't catch itself.
 *
 * @param fn The function.
 *
 * @returns The throw statement, or `undefined`.
 */
export function uncaughtThrow(fn: FunctionNode) {
  let found: Node | undefined

  walkBody(fn, (node, caught) => {
    if (!found && !caught && node.type === 'ThrowStatement') {
      found = node
    }
  })

  return found
}

/**
 * Checks whether a try/catch in the same function catches what a node throws.
 *
 * @param node The node.
 *
 * @returns `true` inside the `try` block of a try/catch.
 */
export function isCaught(node: Rule.Node) {
  let child = node

  for (let parent = node.parent; parent; parent = parent.parent) {
    if (isFunction(parent)) {
      return false
    }

    if (parent.type === 'TryStatement' && parent.block === child && parent.handler) {
      return true
    }

    child = parent
  }

  return false
}
