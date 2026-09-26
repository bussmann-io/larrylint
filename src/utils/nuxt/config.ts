import type { Rule } from 'eslint'
import type { Node } from 'estree'

import { isFunction } from '../ast/functions'

/**
 * Checks whether an expression is the runtime config or its `.public`, e.g. `useRuntimeConfig().public`.
 *
 * @param node The expression.
 * @param variables Variables that hold the runtime config.
 *
 * @returns `true` for the runtime config or its public part.
 */
export function isRuntimeConfig(node: Node, variables: Set<string>): boolean {
  if (node.type === 'CallExpression') {
    return node.callee.type === 'Identifier' && node.callee.name === 'useRuntimeConfig'
  }

  if (node.type === 'Identifier') {
    return variables.has(node.name)
  }

  return node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier' && node.property.name === 'public' && isRuntimeConfig(node.object, variables)
}

/**
 * Finds the options parameter of a Nuxt module's `setup(options, nuxt)` around a node.
 *
 * @param node The node.
 *
 * @returns The parameter's name, or `undefined` outside `setup`.
 */
export function setupOptions(node: Rule.Node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    const [options] = isFunction(parent) ? parent.params : []
    const owner = parent.parent

    if (options?.type === 'Identifier' && owner?.type === 'Property' && owner.key.type === 'Identifier' && owner.key.name === 'setup') {
      return options.name
    }
  }

  return undefined
}
