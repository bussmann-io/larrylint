import type { Rule } from 'eslint'
import type { CallExpression } from 'estree'

import { defineRule } from '../../../lib/rule'

/** Wrappers that leave the promise as it is, e.g. `x?.mutateAsync()` or `x.mutateAsync()!`. */
const TRANSPARENT = new Set(['ChainExpression', 'TSNonNullExpression', 'TSAsExpression', 'TSSatisfiesExpression'])

const FUNCTIONS = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'])

/**
 * Checks whether a call is `mutateAsync()` of a mutation, e.g. from `useMutationAction()`.
 *
 * @param call The call expression.
 *
 * @returns `true` for `mutation.mutateAsync(...)` and a destructured `mutateAsync(...)`.
 */
function isMutateAsync(call: CallExpression) {
  const { callee } = call

  if (callee.type === 'Identifier') {
    return callee.name === 'mutateAsync'
  }

  return callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier' && callee.property.name === 'mutateAsync'
}

/**
 * Follows `.then()`, `.catch()` and `.finally()` from a promise to the end of its chain.
 *
 * @param promise The expression that creates the promise.
 *
 * @returns The outermost expression of the chain, and whether the chain handles a rejection.
 */
function followChain(promise: Rule.Node) {
  let end = promise

  for (;;) {
    let member = end.parent

    while (member && TRANSPARENT.has(member.type)) {
      end = member
      member = end.parent
    }

    const call = member?.parent

    if (member?.type !== 'MemberExpression' || member.object !== end || member.property.type !== 'Identifier' || call?.type !== 'CallExpression' || call.callee !== member) {
      return { end, handled: false }
    }

    const method = member.property.name

    if (method === 'catch' || (method === 'then' && call.arguments.length > 1)) {
      return { end: call, handled: true }
    }

    if (method !== 'then' && method !== 'finally') {
      return { end, handled: false }
    }

    end = call
  }
}

/**
 * Checks whether an expression runs in the `try` block of a try/catch within the same function.
 *
 * @param node The expression.
 *
 * @returns `true` if a `catch` sees what the expression throws.
 */
function isCaught(node: Rule.Node) {
  let child = node

  for (let parent = node.parent; parent; parent = parent.parent) {
    if (FUNCTIONS.has(parent.type)) {
      return false
    }

    if (parent.type === 'TryStatement' && parent.block === child && parent.handler) {
      return true
    }

    child = parent
  }

  return false
}

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
      if (!isMutateAsync(call)) {
        return
      }

      const { end, handled } = followChain(call as Rule.Node)
      const { parent } = end

      if (handled || !parent) {
        return
      }

      const awaited = parent.type === 'AwaitExpression'
      const dropped = parent.type === 'ExpressionStatement' || (parent.type === 'UnaryExpression' && parent.operator === 'void')

      // A try/catch only sees rejections it awaits; a dropped promise escapes it.
      if ((!awaited && !dropped) || (awaited && isCaught(parent))) {
        return
      }

      report({ node: call.callee.type === 'MemberExpression' ? call.callee.property : call.callee, messageId: 'unhandled' })
    }

    visitTemplate({ CallExpression: check })

    return { CallExpression: check }
  },
})
