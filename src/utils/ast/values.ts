import type { Expression, Identifier, Node, Pattern } from 'estree'

const TEST_DIRECTIVES = new Set(['if', 'else-if', 'show'])

/**
 * Checks whether an identifier refers to a variable, unlike the property names in `a.x` or `{ x: 1 }`.
 *
 * @param node The identifier.
 *
 * @returns `false` for property names.
 */
export function isReference(node: Identifier & { parent?: Node | null }) {
  const { parent } = node

  if (parent?.type === 'MemberExpression') {
    return parent.property !== node || parent.computed
  }

  return parent?.type !== 'Property' || parent.key !== node || parent.computed || parent.shorthand
}

/**
 * Checks whether a value can be `undefined` or `null`, also through `??` or a branch.
 *
 * @param value The value.
 *
 * @returns `true` for e.g. `undefined`, `x ?? null` or `a ? b : undefined`.
 */
export function canBeNullish(value: Expression | Pattern): boolean {
  if ((value.type === 'Identifier' && value.name === 'undefined') || (value.type === 'Literal' && value.value === null && !('regex' in value))) {
    return true
  }

  if (value.type === 'LogicalExpression' && value.operator === '??') {
    return canBeNullish(value.right)
  }

  if (value.type === 'ConditionalExpression') {
    return canBeNullish(value.consequent) || canBeNullish(value.alternate)
  }

  return false
}

/**
 * Checks whether a value is only tested, e.g. in `if (x)`, `x ? a : b`, `x ?? y`, `!x` or `v-if="x"`.
 *
 * @param node The value.
 *
 * @returns `true` if the value is used as a condition or with a fallback.
 */
export function isTested(node: Node & { parent?: unknown }): boolean {
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
