import type { Expression, LogicalExpression, PrivateIdentifier, Program } from 'estree'

import { fillValue, readDefinition, readFields } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'
import { isNullish } from '../../../utils/ast/values'
import { findPropsVariable } from '../../../utils/vue/script'

const TEXTS = new Set(['text', 'textarea', 'secret'])

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow ?? fallbacks that never apply, because frontend-core fills unset fields: pickers with their first option, checkboxes with false and text with \'\'.',
    },
    schema: [],
    messages: {
      picker: 'frontend-core fills an unset {{type}} field with its first option, {{fill}}, so this fallback never applies. Make {{fallback}} the first option if it should be the default.',
      checkbox: 'frontend-core fills an unset checkbox with false, so this fallback never applies. Name the field so that unchecked is the default.',
      text: 'frontend-core fills an unset {{type}} field with \'\', so ?? never falls back. Use || if an empty field should fall back.',
    },
  },

  applies: file => file.side === 'app' && file.path.endsWith('.vue'),

  create: ({ context, report, visitTemplate }) => {
    const program = context.sourceCode.ast as Program
    const propsVariable = findPropsVariable(program)
    const fills = new Map<string, { type: string, value: unknown }>()
    const fallbacks: { node: LogicalExpression, prop: string }[] = []

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

        if (prop && !isNullish(node.right)) {
          fallbacks.push({ node, prop })
        }
      },
    })

    visitTemplate(collect(true))

    return {
      ...collect(false),

      'CallExpression': (node) => {
        const definition = readDefinition(node)

        for (const field of definition ? readFields(definition) : []) {
          const fill = field.name && field.type && !field.as ? fillValue(field, program, context.filename) : undefined

          if (fill) {
            fills.set(field.name!.value, { type: field.type!, value: fill.value })
          }
        }
      },

      'Program:exit': () => {
        for (const { node, prop } of fallbacks) {
          const field = fills.get(prop)

          if (!field || (node.right.type === 'Literal' && node.right.value === field.value)) {
            continue
          }

          const messageId = field.type === 'checkbox' ? 'checkbox' : TEXTS.has(field.type) ? 'text' : 'picker'
          const fill = typeof field.value === 'string' ? `'${field.value}'` : String(field.value)

          report({ node, messageId, data: { type: field.type, fill, fallback: context.sourceCode.getText(node.right) } })
        }
      },
    }
  },
})
