import type { Rule } from 'eslint'
import type { Identifier, Literal, Node, Program } from 'estree'
import type { AST } from 'vue-eslint-parser'

import { readDefinition, readFields } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'
import { findPropsVariable, isDefineProps } from '../../../utils/vue'

/**
 * Checks whether an identifier is only a name, e.g. `props` in `x.props` or `{ props: x }`.
 *
 * @param node The identifier.
 *
 * @returns `true` if it doesn't refer to a variable.
 */
function isName(node: Identifier & { parent: Node }) {
  const { parent } = node

  return (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) || (parent.type === 'Property' && parent.key === node && !parent.computed && !parent.shorthand)
}

/**
 * Tells which prop a use of the props object reads.
 *
 * @param node The props identifier.
 *
 * @returns The prop names read, or `undefined` if the whole object escapes, e.g. `v-bind="props"`.
 */
function readProps(node: Identifier & { parent: Node }): string[] | undefined {
  const { parent } = node

  if (parent.type === 'MemberExpression' && parent.object === node) {
    if (!parent.computed && parent.property.type === 'Identifier') {
      return [parent.property.name]
    }

    return parent.property.type === 'Literal' && typeof parent.property.value === 'string' ? [parent.property.value] : undefined
  }

  if (parent.type === 'VariableDeclarator' && parent.init === node && parent.id.type === 'ObjectPattern') {
    const names = parent.id.properties.map(property => property.type === 'Property' && property.key.type === 'Identifier' && !property.computed ? property.key.name : undefined)

    return names.every(name => name !== undefined) ? names : undefined
  }

  return undefined
}

export default defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow schema fields the section or block never reads.',
    },
    schema: [],
    messages: {
      unused: 'Studio shows \'{{name}}\' to editors, but the component never reads it. Use the field or remove it.',
    },
  },

  applies: file => file.side === 'app' && file.path.endsWith('.vue'),

  create: ({ context, report, visitTemplate }) => {
    const fields = new Map<string, Literal>()
    const used = new Set<string>()
    const propsVariable = findPropsVariable(context.sourceCode.ast as Program)
    let hasProps = false
    let escapes = false

    const useProps = (node: Identifier & { parent: Node }) => {
      const names = readProps(node)

      if (names) {
        names.forEach(name => used.add(name))
      }
      else {
        escapes = true
      }
    }

    visitTemplate({
      VExpressionContainer: (node: AST.VExpressionContainer) => {
        for (const { id } of node.references) {
          used.add(id.name)
        }
      },

      Identifier: (node: Identifier & { parent: Node }) => {
        if ((node.name === '$props' || node.name === propsVariable) && !isName(node)) {
          useProps(node)
        }
      },
    })

    return {
      'CallExpression': (node) => {
        hasProps ||= isDefineProps(node)

        const definition = readDefinition(node)

        for (const { name, as } of definition ? readFields(definition) : []) {
          // Style and visibility decorators are applied by frontend-core, not read by the component.
          if (name && !as) {
            fields.set(name.value, name.node)
          }
        }
      },

      'Identifier': (node: Identifier & Rule.NodeParentExtension) => {
        const declaration = node.parent.type === 'VariableDeclarator' && node.parent.id === node

        if (node.name === propsVariable && !declaration && !isName(node)) {
          useProps(node)
        }
      },

      'Program:exit': () => {
        if (!hasProps || escapes) {
          return
        }

        for (const [name, node] of fields) {
          if (!used.has(name)) {
            report({ node, messageId: 'unused', data: { name } })
          }
        }
      },
    }
  },
})
