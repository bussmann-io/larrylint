import type { Node, ObjectExpression } from 'estree'

/**
 * Finds a property of an object literal by its key name.
 *
 * @param object The object literal.
 * @param key The key to look for.
 *
 * @returns The property's value, if the key is there.
 */
export function findProperty(object: ObjectExpression, key: string) {
  for (const entry of object.properties) {
    if (entry.type === 'Property' && !entry.computed && ((entry.key.type === 'Identifier' && entry.key.name === key) || (entry.key.type === 'Literal' && entry.key.value === key))) {
      return entry.value
    }
  }

  return undefined
}

/**
 * Finds a property of an object literal whose value is a string literal.
 *
 * @param object The object literal.
 * @param key The key to look for.
 *
 * @returns The string and its node, if the key is there with a string literal.
 */
export function findStringProperty(object: ObjectExpression, key: string) {
  const value = findProperty(object, key)

  return value?.type === 'Literal' && typeof value.value === 'string' ? { value: value.value, node: value } : undefined
}

/**
 * Lists the object literals of an array literal, skipping spreads and factory calls.
 *
 * @param node The array literal.
 *
 * @returns The object literal elements, empty if the node is no array literal.
 */
export function objectElements(node: Node | undefined) {
  if (node?.type !== 'ArrayExpression') {
    return []
  }

  return node.elements.filter((element): element is ObjectExpression => element?.type === 'ObjectExpression')
}
