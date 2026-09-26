import type { Rule } from 'eslint'
import type { Expression, Identifier, Node, Super } from 'estree'

const WRAPPERS = new Set(['ChainExpression', 'TSNonNullExpression', 'TSAsExpression', 'TSSatisfiesExpression'])

/**
 * Reads the name an expression ends with, e.g. `push` for `router.push`.
 *
 * @param node The expression.
 *
 * @returns The name, or `undefined` for computed members and other expressions.
 */
export function nameOf(node: Node): string | undefined {
  if (node.type === 'Identifier') {
    return node.name
  }

  return node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier' ? node.property.name : undefined
}

/**
 * Finds the identifier a chain starts from, e.g. `defineOrchestr` in `defineOrchestr.meta({}).use(fn)`.
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
 * Lists the methods called along a chain, outermost first, e.g. `nullable`, `string` for `z.string().nullable()`.
 *
 * @param node The chain.
 *
 * @returns The method names.
 */
export function chainMethods(node: Node | undefined) {
  const methods: string[] = []
  let current = node

  while (current?.type === 'CallExpression' && current.callee.type === 'MemberExpression' && current.callee.property.type === 'Identifier') {
    methods.push(current.callee.property.name)
    current = current.callee.object
  }

  return methods
}

/**
 * Lists the names along a member chain, e.g. `nuxt`, `options` for `nuxt.options`.
 *
 * @param node The member expression.
 *
 * @returns The names, with `*` for computed parts.
 */
export function memberPath(node: Node): string[] {
  if (node.type === 'Identifier') {
    return [node.name]
  }

  if (node.type !== 'MemberExpression') {
    return []
  }

  const property = !node.computed && node.property.type === 'Identifier' ? node.property.name : '*'

  return [...memberPath(node.object), property]
}

/**
 * Unwraps optional chaining and TypeScript assertions, e.g. `a?.b()` or `a!` to the expression inside.
 *
 * @param node The expression.
 *
 * @returns The wrapped expression.
 */
export function unwrap(node: Node): Node {
  let current = node

  while (WRAPPERS.has(current.type)) {
    current = (current as { expression: Node }).expression
  }

  return current
}

/**
 * Follows a promise through `.then()`, `.catch()` and `.finally()` to the end of its chain.
 *
 * @param promise The expression that creates the promise.
 *
 * @returns The outermost expression of the chain, and whether the chain handles a rejection.
 */
export function followPromise(promise: Rule.Node) {
  let end = promise

  for (;;) {
    let member = end.parent

    while (member && WRAPPERS.has(member.type)) {
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
