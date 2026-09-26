import type { CallExpression, Identifier, Node } from 'estree'

import { defineRule } from '../../../lib/rule'
import { isFunction } from '../../../utils/ast/functions'

type WithParent<T> = T & { parent?: WithParent<Node> }

/** Directives whose value is only checked for truthiness. */
const TEST_DIRECTIVES = new Set(['if', 'else-if', 'show'])

/**
 * Checks whether a value is only tested, e.g. in `if (x)`, `x ? a : b`, `x ?? y`, `!x` or `v-if="x"`.
 *
 * @param node The value.
 *
 * @returns `true` if the value is used as a condition or with a fallback.
 */
function isTested(node: WithParent<Node>): boolean {
  // Template nodes like VExpressionContainer aren't ESTree nodes, so the parent is typed loosely.
  const parent = node.parent as { type: string, test?: unknown, left?: unknown, operator?: string, parent?: { type: string, key?: { name?: { name?: string } } } } | undefined

  switch (parent?.type) {
    case 'IfStatement':
    case 'WhileStatement':
    case 'ConditionalExpression':
      return parent.test === node
    case 'LogicalExpression':
      return parent.left === node
    case 'UnaryExpression':
      return parent.operator === '!'
    case 'VExpressionContainer':
      return parent.parent?.type === 'VAttribute' && TEST_DIRECTIVES.has(parent.parent.key?.name?.name ?? '')
    default:
      return false
  }
}

/**
 * Finds the variable that holds a call's result: `const href = call` or `const href = computed(() => call)`.
 *
 * @param call The call.
 *
 * @returns The variable's name and whether it's a computed ref, or `undefined`.
 */
function findHolder(call: WithParent<CallExpression>) {
  let value: WithParent<Node> = call
  let parent = call.parent

  if (parent?.type === 'ReturnStatement') {
    let fn = parent.parent

    while (fn && !isFunction(fn)) {
      fn = fn.parent
    }

    parent = fn
    value = fn ?? value
  }
  else if (parent && isFunction(parent) && parent.body === call) {
    value = parent
  }

  const computed = value.parent?.type === 'CallExpression' && value.parent.callee.type === 'Identifier' && value.parent.callee.name === 'computed' ? value.parent : undefined
  const declarator = (computed ?? value).parent

  return declarator?.type === 'VariableDeclarator' && declarator.id.type === 'Identifier' ? { name: declarator.id.name, computed: computed !== undefined } : undefined
}

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow testing the result of linkResolver.resolve(), which is never empty.',
    },
    schema: [],
    messages: {
      tested: 'linkResolver.resolve() never returns an empty value: a link it can\'t resolve comes back as a \'#missing-required-params…\' string, so this check always passes. Use resolveOrThrow() in a try/catch to tell an unresolvable link apart.',
    },
  },

  applies: file => file.side === 'app',

  create: ({ report, visitTemplate }) => {
    const resolveNames = new Set<string>()
    const calls: WithParent<CallExpression>[] = []
    const scriptIdentifiers: WithParent<Identifier>[] = []
    const templateIdentifiers: WithParent<Identifier>[] = []

    visitTemplate({
      Identifier: (node: WithParent<Identifier>) => {
        templateIdentifiers.push(node)
      },
    })

    return {
      'VariableDeclarator': (node) => {
        if (node.id.type !== 'ObjectPattern' || node.init?.type !== 'Identifier' || node.init.name !== 'linkResolver') {
          return
        }

        for (const property of node.id.properties) {
          if (property.type === 'Property' && property.key.type === 'Identifier' && property.key.name === 'resolve' && property.value.type === 'Identifier') {
            resolveNames.add(property.value.name)
          }
        }
      },

      'CallExpression': (node) => {
        calls.push(node as WithParent<CallExpression>)
      },

      'Identifier': (node) => {
        scriptIdentifiers.push(node as WithParent<Identifier>)
      },

      'Program:exit': () => {
        const holders = new Map<string, boolean>()

        for (const call of calls) {
          const { callee } = call
          const linkResolver = callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier' && callee.property.name === 'resolve'
            && ((callee.object.type === 'Identifier' && callee.object.name === 'linkResolver') || (callee.object.type === 'MemberExpression' && callee.object.property.type === 'Identifier' && callee.object.property.name === 'linkResolver'))

          if (!linkResolver && !(callee.type === 'Identifier' && resolveNames.has(callee.name))) {
            continue
          }

          if (isTested(call)) {
            report({ node: call, messageId: 'tested' })
          }

          const holder = findHolder(call)

          if (holder) {
            holders.set(holder.name, holder.computed)
          }
        }

        const check = (identifier: WithParent<Identifier>, template: boolean) => {
          const computed = holders.get(identifier.name)
          const parent = identifier.parent

          if (computed === undefined || (parent?.type === 'MemberExpression' && parent.property === identifier && !parent.computed)) {
            return
          }

          // The script reads a computed ref through `.value`; the template unwraps it.
          const readsValue = parent?.type === 'MemberExpression' && parent.object === identifier && parent.property.type === 'Identifier' && parent.property.name === 'value'
          const value = computed && !template ? (readsValue ? parent : undefined) : identifier

          if (value && isTested(value)) {
            report({ node: value, messageId: 'tested' })
          }
        }

        scriptIdentifiers.forEach(identifier => check(identifier, false))
        templateIdentifiers.forEach(identifier => check(identifier, true))
      },
    }
  },
})
