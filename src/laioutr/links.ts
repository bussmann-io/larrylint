import type { CallExpression, VariableDeclarator } from 'estree'

import { nameOf } from '../utils/ast/chain'

const METHODS = new Set(['resolve', 'resolveOrThrow'])

/**
 * Reads the linkResolver methods a declaration destructures, e.g. `resolve` in `const { resolve: toHref } = linkResolver`.
 *
 * @param declarator The variable declarator.
 *
 * @returns The methods by their local name.
 */
export function destructuredResolvers(declarator: VariableDeclarator) {
  const methods = new Map<string, string>()

  if (declarator.id.type !== 'ObjectPattern' || !declarator.init || nameOf(declarator.init) !== 'linkResolver') {
    return methods
  }

  for (const property of declarator.id.properties) {
    const method = property.type === 'Property' ? nameOf(property.key) : undefined

    if (method && METHODS.has(method) && property.type === 'Property' && property.value.type === 'Identifier') {
      methods.set(property.value.name, method)
    }
  }

  return methods
}

/**
 * Tells which linkResolver method a call runs, e.g. `resolve` for `linkResolver.resolve(link)`.
 *
 * @param call The call.
 * @param destructured Methods destructured from linkResolver, by their local name.
 *
 * @returns The method's name, or `undefined` for other calls.
 */
export function linkResolverMethod(call: CallExpression, destructured: Map<string, string>) {
  const { callee } = call

  if (callee.type === 'Identifier') {
    return destructured.get(callee.name)
  }

  const method = callee.type === 'MemberExpression' ? nameOf(callee) : undefined

  return method && METHODS.has(method) && callee.type === 'MemberExpression' && nameOf(callee.object) === 'linkResolver' ? method : undefined
}
