import type { Expression, LogicalExpression, PrivateIdentifier, Program } from 'estree'

import { fillValue, readDefinition, readFields } from '../../../lib/laioutr/definition'
import { defineRule } from '../../../lib/rule'
import { isNullish } from '../../../utils/ast/values'
import { findPropsVariable } from '../../../utils/vue/script'

const MESSAGES: Record<string, string> = {
  checkbox: 'checkbox',
  content_alignment: 'alignment',
  text: 'text',
  textarea: 'text',
  secret: 'text',
}

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow `??` fallbacks on fields that frontend-core always fills',
    },
    schema: [],
    messages: {
      picker: 'This fallback is never used: an unset {{type}} gets its first option, {{fill}}. To use {{fallback}}, make it the first option.',
      alignment: 'This fallback is never used: an unset content_alignment is {{fill}}. Remove the fallback.',
      checkbox: 'This fallback is never used: an unset checkbox is false. To make true the default, invert the field, e.g. hideIcon instead of showIcon.',
      text: 'An unset {{type}} field is \'\', so ?? never falls back. Use || instead.',
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

          const messageId = MESSAGES[field.type] ?? 'picker'
          const fill = typeof field.value === 'string' ? `'${field.value}'` : String(field.value)

          report({ node, messageId, data: { type: field.type, fill, fallback: context.sourceCode.getText(node.right) } })
        }
      },
    }
  },
})
