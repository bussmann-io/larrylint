import type { Expression, Node, ObjectExpression, Pattern } from 'estree'

import { defineRule } from '../../../lib/rule'
import { isFunction, walkBody } from '../../../utils/ast/functions'

/**
 * Checks whether a value is empty for sure: `undefined`, `null`, or a fallback or branch that is.
 *
 * @param value The value.
 *
 * @returns `true` if the value can be `undefined` or `null`.
 */
function canBeEmpty(value: Expression | Pattern): boolean {
  if ((value.type === 'Identifier' && value.name === 'undefined') || (value.type === 'Literal' && value.value === null && !('regex' in value))) {
    return true
  }

  if (value.type === 'LogicalExpression' && value.operator === '??') {
    return canBeEmpty(value.right)
  }

  if (value.type === 'ConditionalExpression') {
    return canBeEmpty(value.consequent) || canBeEmpty(value.alternate)
  }

  return false
}

/**
 * Lists the objects a component resolves to, e.g. `{ ... }` in `base: () => ({ ... })`.
 *
 * @param value The component's value in `$entity({ ... })`.
 *
 * @returns The object literals it returns.
 */
function componentObjects(value: Node): ObjectExpression[] {
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

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require component resolvers to resolve fields to empty values rather than undefined or null.',
    },
    schema: [],
    messages: {
      empty: 'Studio shows a literal "..." for a field that resolves to undefined or null. Resolve to an empty value instead, e.g. \'\'.',
    },
  },

  applies: file => file.handler === 'resolver',

  create: ({ report }) => ({
    CallExpression: (node) => {
      const [entity] = node.arguments

      if (node.callee.type !== 'Identifier' || node.callee.name !== '$entity' || entity?.type !== 'ObjectExpression') {
        return
      }

      for (const component of entity.properties) {
        if (component.type !== 'Property' || (component.key.type === 'Identifier' && component.key.name === 'id')) {
          continue
        }

        for (const object of componentObjects(component.value)) {
          for (const field of object.properties) {
            if (field.type === 'Property' && canBeEmpty(field.value)) {
              report({ node: field.value, messageId: 'empty' })
            }
          }
        }
      }
    },
  }),
})
