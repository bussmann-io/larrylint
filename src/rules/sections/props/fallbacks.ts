import type { BinaryExpression, Expression, LogicalExpression, Node, PrivateIdentifier, Program } from 'estree'

import { readDefinition, readFields } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'
import { findPropsVariable } from '../../../utils/vue'

/** Field types definitionToProps types as Boolean, so an unset value arrives as `false`. */
const FALSE_WHEN_UNSET = new Set(['checkbox', 'select', 'radio', 'toggle_button'])

/** Field types Studio passes as `''` when unset. */
const EMPTY_WHEN_UNSET = new Set(['text', 'textarea'])

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow fallbacks for props that never arrive as undefined: unset picker fields arrive as false, unset text fields as \'\'.',
    },
    schema: [],
    messages: {
      checkbox: 'An unset checkbox arrives as false, not undefined, so this {{check}} never sees a missing value. Name the field so that unchecked is the default.',
      picker: 'An unset {{type}} field arrives as false, not undefined, so this {{check}} never sees a missing value. Use || for a fallback.',
      text: 'Studio passes \'\' for an unset {{type}} field, so ?? never falls back. Use ||.',
    },
  },

  applies: file => file.side === 'app' && file.path.endsWith('.vue'),

  create: ({ context, report, visitTemplate }) => {
    const types = new Map<string, string>()
    const propsVariable = findPropsVariable(context.sourceCode.ast as Program)
    const reads: { node: Node, prop: string, check: string }[] = []

    /**
     * Tells which prop an expression reads: `props.x` in the script, `x` or `props.x` in the template.
     *
     * @param node The expression.
     * @param template Whether the expression is in the template, where props are in scope by name.
     *
     * @returns The prop's name, or `undefined`.
     */
    const propOf = (node: Expression | PrivateIdentifier, template: boolean) => {
      if (template && node.type === 'Identifier') {
        return node.name
      }

      const props = node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier' && node.object.type === 'Identifier' ? node.object.name : undefined

      return props && (props === propsVariable || (template && props === '$props')) && node.type === 'MemberExpression' && node.property.type === 'Identifier' ? node.property.name : undefined
    }

    const collect = (template: boolean) => ({
      LogicalExpression: (node: LogicalExpression) => {
        const prop = node.operator === '??' ? propOf(node.left, template) : undefined

        if (prop) {
          reads.push({ node, prop, check: '??' })
        }
      },

      BinaryExpression: (node: BinaryExpression) => {
        if (node.operator !== '!==' && node.operator !== '===' && node.operator !== '!=' && node.operator !== '==') {
          return
        }

        for (const [side, other] of [[node.left, node.right], [node.right, node.left]] as const) {
          const prop = propOf(side, template)
          const value = other.type === 'Identifier' && other.name === 'undefined' ? 'undefined' : other.type === 'Literal' && other.value === null && !('regex' in other) ? 'null' : other.type === 'Literal' && other.value === false && node.operator === '!==' ? 'false' : undefined

          if (prop && value) {
            reads.push({ node, prop, check: `${node.operator} ${value}` })
          }
        }
      },
    })

    visitTemplate(collect(true))

    return {
      ...collect(false),

      'CallExpression': (node) => {
        const definition = readDefinition(node)

        for (const { name, type, as } of definition ? readFields(definition) : []) {
          if (name && type && !as) {
            types.set(name.value, type)
          }
        }
      },

      'Program:exit': () => {
        for (const { node, prop, check } of reads) {
          const type = types.get(prop)

          if (type === 'checkbox') {
            report({ node, messageId: 'checkbox', data: { check } })
          }
          else if (type && FALSE_WHEN_UNSET.has(type)) {
            report({ node, messageId: 'picker', data: { type, check } })
          }
          else if (type && EMPTY_WHEN_UNSET.has(type) && check === '??') {
            report({ node, messageId: 'text', data: { type } })
          }
        }
      },
    }
  },
})
